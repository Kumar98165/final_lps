import os
import sys
import logging
import traceback
from datetime import datetime
from dotenv import load_dotenv

# We use SQLAlchemy core strictly for executing raw migration queries
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError

# Configure professional-level logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("DB_MIGRATIONS")

# -----------------------------------------------------------------------------------------
# MIGRATION REGISTRY
# -----------------------------------------------------------------------------------------
# This dictionary holds all database patches.
# To deploy a new change, add the next sequential version integer here.
# Use raw PostgreSQL commands or generic SQL depending on your dialect.
# -----------------------------------------------------------------------------------------
MIGRATIONS = {
    1: {
        "description": "Initialize schema migrations tracking table",
        "up": [
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                description VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ],
        "down": [
            "DROP TABLE IF EXISTS schema_migrations;"
        ]
    },
    2: {
        "description": "Ensure CarModel has new assignment tracking columns (Safe Execute)",
        "up": [
            # PostgreSQL DO block ensures safe ALTER execution without crashing if columns exist
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='car_models' AND column_name='supervisor_id'
                ) THEN
                    ALTER TABLE car_models ADD COLUMN supervisor_id INTEGER REFERENCES \"users\"(id);
                    ALTER TABLE car_models ADD COLUMN assigned_deo_id INTEGER REFERENCES \"users\"(id);
                END IF;
            END $$;
            """
        ],
        "down": [
            "ALTER TABLE car_models DROP COLUMN IF EXISTS supervisor_id;",
            "ALTER TABLE car_models DROP COLUMN IF EXISTS assigned_deo_id;"
        ]
    },
    3: {
        "description": "Promote Saleable NO and Assembly Number to primary columns in master_data",
        "up": [
            "ALTER TABLE master_data ADD COLUMN IF NOT EXISTS saleable_no VARCHAR(255);",
            "ALTER TABLE master_data ADD COLUMN IF NOT EXISTS assembly_number VARCHAR(255);"
        ],
        "down": [
            "ALTER TABLE master_data DROP COLUMN IF EXISTS saleable_no;",
            "ALTER TABLE master_data DROP COLUMN IF EXISTS assembly_number;"
        ]
    }
    # Add new versions below... Example:
    # 3: {
    #     "description": "Add priority flags to demand",
    #     "up": ["ALTER TABLE demand ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Normal';"]
    # }
}

class MigrationEngine:
    """
    Industry-standard custom migration engine. 
    It tracks applied versions, executes patches atomically, and provides rollback capabilities.
    """
    def __init__(self):
        load_dotenv()
        self.db_uri = (
            f"postgresql://{os.getenv('DB_USER', 'postgres')}:"
            f"{os.getenv('DB_PASSWORD', '98165mkm')}@"
            f"{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/"
            f"{os.getenv('DB_NAME', 'lps_db')}"
        )
        try:
            self.engine = create_engine(self.db_uri, pool_pre_ping=True)
            logger.info("Database engine initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize database connection: {e}")
            sys.exit(1)

    def _get_applied_versions(self, connection):
        """Fetch a list of already applied migration versions."""
        inspector = inspect(self.engine)
        if not inspector.has_table("schema_migrations"):
            return []
        
        result = connection.execute(text("SELECT version FROM schema_migrations ORDER BY version ASC"))
        return [row[0] for row in result.fetchall()]

    def run_migrations(self, target_version=None):
        """Execute pending 'UP' migrations sequentially, each in its own atomic transaction."""
        logger.info("Starting schema migration sequence (UP)...")
        
        # 1. Get applied versions first
        with self.engine.connect() as conn:
            applied = self._get_applied_versions(conn)
        
        # 2. Identify pending migrations
        pending = sorted([v for v in MIGRATIONS.keys() if v not in applied])
        
        if target_version is not None:
            pending = [v for v in pending if v <= target_version]

        if not pending:
            logger.info("Database schema is fully up-to-date. No pending migrations.")
            return

        logger.info(f"Found {len(pending)} pending migrations: {pending}")

        for version in pending:
            migration = MIGRATIONS[version]
            logger.info(f"Executing Vol. {version}: {migration['description']}")
            
            # Use engine.begin() to ensure an atomic transaction for this migration step
            try:
                with self.engine.begin() as conn:
                    # Execute all SQL commands in the "up" sequence
                    for sql_cmd in migration["up"]:
                        if sql_cmd.strip():
                            conn.execute(text(sql_cmd))
                    
                    # Record the successful execution
                    conn.execute(
                        text("INSERT INTO schema_migrations (version, description) VALUES (:v, :d)"),
                        {"v": version, "d": migration["description"]}
                    )
                logger.info(f"Migration Vol. {version} applied successfully.")
            except SQLAlchemyError as e:
                logger.error(f"Migration Vol. {version} FAILED critically. Setup halted.")
                logger.error(traceback.format_exc())
                sys.exit(1)

        logger.info("All pending migrations have been processed completely.")

    def rollback(self, steps=1):
        """Revert the last N migrations by executing their 'DOWN' logic."""
        logger.info(f"Starting rollback sequence for last {steps} step(s) (DOWN)...")
        
        # 1. Get applied versions
        with self.engine.connect() as conn:
            applied = self._get_applied_versions(conn)
        
        if not applied:
            logger.info("No migrations are currently applied. Nothing to rollback.")
            return
            
        # 2. Identify migrations to revert
        to_rollback = sorted(applied, reverse=True)[:steps]
        
        for version in to_rollback:
            migration = MIGRATIONS.get(version)
            if not migration:
                logger.warning(f"Could not find definitions for Vol. {version}. Halting rollback.")
                break
                
            logger.info(f"Reverting Vol. {version}: {migration['description']}")
            
            try:
                with self.engine.begin() as conn:
                    for sql_cmd in migration.get("down", []):
                        if sql_cmd.strip():
                            conn.execute(text(sql_cmd))
                    
                    # Remove the record of the migration
                    conn.execute(
                        text("DELETE FROM schema_migrations WHERE version = :v"),
                        {"v": version}
                    )
                logger.info(f"Rollback Vol. {version} reverted successfully.")
            except SQLAlchemyError as e:
                logger.error(f"Rollback Vol. {version} FAILED critically. Sequence halted.")
                logger.error(traceback.format_exc())
                sys.exit(1)

if __name__ == "__main__":
    engine = MigrationEngine()
    
    # Simple CLI argument parsing
    if len(sys.argv) > 1 and sys.argv[1].lower() == "rollback":
        steps = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        engine.rollback(steps)
    else:
        # Default behavior: run all pending
        engine.run_migrations()
