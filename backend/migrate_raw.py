import psycopg2
import json
from datetime import datetime

# DB Config
DB_NAME = "lps_raj"
# I recall these from .env earlier
DB_USER = "postgres"
DB_PASS = "98165mkm"
DB_HOST = "localhost"
DB_PORT = "5432"

def parse_float(val):
    if val is None or val == "": return 0.0
    try:
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0

def migrate():
    try:
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
        cur = conn.cursor()
        
        # 1. Create table if missing (safety - mirroring the models.py definition)
        print("Creating table deo_production_entries if it doesn't exist...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS deo_production_entries (
                id SERIAL PRIMARY KEY,
                log_id INTEGER REFERENCES daily_production_logs(id) ON DELETE CASCADE,
                sn_no INTEGER,
                sap_part_number VARCHAR(255),
                part_number VARCHAR(255),
                part_description TEXT,
                per_day FLOAT DEFAULT 0.0,
                sap_stock FLOAT DEFAULT 0.0,
                opening_stock FLOAT DEFAULT 0.0,
                todays_stock FLOAT DEFAULT 0.0,
                coverage_days FLOAT DEFAULT 0.0,
                status VARCHAR(20) DEFAULT 'PENDING',
                row_status VARCHAR(100),
                supervisor_reviewed BOOLEAN DEFAULT FALSE,
                rejection_reason TEXT,
                deo_reply TEXT,
                date DATE,
                car_model_id INTEGER
            )
        """)
        
        # 2. Get all logs
        cur.execute("SELECT id, log_data, date, car_model_id FROM daily_production_logs")
        logs = cur.fetchall()
        
        print(f"Found {len(logs)} production logs. Starting row-by-row migration...")
        total_rows_inserted = 0
        for log_id, log_data_json, log_date, car_model_id in logs:
            if not log_data_json or not isinstance(log_data_json, list):
                continue
            
            # Check if this log has already been migrated to entries
            cur.execute("SELECT COUNT(*) FROM deo_production_entries WHERE log_id = %s", (log_id,))
            if cur.fetchone()[0] > 0:
                # print(f"  Log {log_id}: Already migrated. Skipping.")
                continue
            
            for row in log_data_json:
                # Clean up numeric strings
                per_day = parse_float(row.get('PER DAY') or row.get('Per Day') or row.get('Target Qty'))
                
                cur.execute("""
                    INSERT INTO deo_production_entries (
                        log_id, sn_no, sap_part_number, part_number, part_description,
                        per_day, sap_stock, opening_stock, todays_stock, coverage_days,
                        status, row_status, supervisor_reviewed, rejection_reason,
                        date, car_model_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    log_id,
                    int(row.get('SN NO', 0)) if str(row.get('SN NO', '')).isdigit() else None,
                    row.get('SAP PART NUMBER'),
                    row.get('PART NUMBER'),
                    row.get('PART DESCRIPTION'),
                    per_day,
                    parse_float(row.get('SAP Stock')),
                    parse_float(row.get('Opening Stock')),
                    parse_float(row.get('Todays Stock')),
                    parse_float(row.get('Coverage Days')),
                    row.get('Production Status') or 'PENDING',
                    row.get('row_status'),
                    row.get('supervisor_reviewed', False),
                    row.get('rejection_reason'),
                    log_date,
                    car_model_id
                ))
                total_rows_inserted += 1
            
            # print(f"  Log {log_id}: Migrated {len(log_data_json)} rows.")
                
        conn.commit()
        cur.close()
        conn.close()
        print(f"\nSUCCESS: Migrated {total_rows_inserted} individual production entries into separate columns.")
        print("The database is now fully relational and separate from JSON logs.")
    except Exception as e:
        print(f"MIGRATION ERROR: {e}")

if __name__ == "__main__":
    migrate()
