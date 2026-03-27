# backend/app_factory.py
"""Application factory for the LPS backend.
Keeps the Flask app creation, configuration, blueprint registration and
database seeding in one place.  The ``wsgi.py`` file will import the two
functions and contain only the minimal ``if __name__ == '__main__'`` block
so that the entry point looks clean and professional.
"""
import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token
from models import db, MasterData, User, CarModel, Demand, AuditLog, ProductionLine, DailyWorkStatus
from services import MasterDataDBService, IdentityDBService
from email_service import send_email
from fetch_emails import fetch_unread_emails, delete_email
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

# ---------------------------------------------------------------------
# Blueprint imports (admin & manager routes live in their own packages)
# ---------------------------------------------------------------------
from admin.routes import admin_bp
from admin.audit_routes import audit_bp
from manager.routes import manager_bp
from production.routes import production_bp

load_dotenv()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # CORS – allow everything for dev, tighten in prod
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # DB & JWT configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{os.getenv('DB_USER', 'postgres')}:"
        f"{os.getenv('DB_PASSWORD', '98165mkm')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/"
        f"{os.getenv('DB_NAME', 'lps_db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # -----------------------------------------------------------------
    # HIGH-PERFORMANCE DATABASE POOLING FOR 5000+ CONCURRENT USERS
    # -----------------------------------------------------------------
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_size": 100,         # Minimum persistent connections
        "max_overflow": 500,      # Additional temporary connections allowed
        "pool_timeout": 30,       # Max wait time for a connection 
        "pool_recycle": 1800      # Reconnect after 30 mins to avoid stale sessions
    }
    
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY", "c0952ea4fa34d504723dc418f2d153ebf63c3a713200833209b11cff13bd1f1c"
    )
    from datetime import timedelta
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

    # Initialise extensions
    db.init_app(app)
    JWTManager(app)

    # Register blueprints – all routes are now modular
    app.register_blueprint(admin_bp, url_prefix="/api")
    app.register_blueprint(audit_bp, url_prefix="/api")
    app.register_blueprint(manager_bp, url_prefix="/api")
    app.register_blueprint(production_bp, url_prefix="/api/production")

    # -----------------------------------------------------------------
    # User Activity Tracking Middleware
    # -----------------------------------------------------------------
    @app.before_request
    def update_last_activity():
        """Update last_activity timestamp for the current user."""
        try:
            from flask_jwt_extended import verify_jwt_in_request
            # Check if this is an API request and if it has a valid JWT
            if request.path.startswith('/api/') and not request.path.endswith('/auth/login'):
                verify_jwt_in_request(optional=True)
                username = get_jwt_identity()
                if username:
                    user = User.query.filter_by(username=username).first()
                    if user:
                        user.last_activity = datetime.now()
                        db.session.commit()
        except Exception:
            # Avoid breaking requests if JWT is missing or invalid
            pass

    # -----------------------------------------------------------------
    # Authentication endpoint (login)
    # -----------------------------------------------------------------
    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.json or {}
        username = data.get("username", "").strip()
        password = data.get("password", "")

        if not username or not password:
            return jsonify({"success": False, "message": "Missing credentials"}), 400

        # Case-insensitive username lookup
        user = User.query.filter(User.username.ilike(username)).first()

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 401

        # Verify hashed password
        if not user.check_password(password):
            return jsonify({"success": False, "message": "Invalid password"}), 401

        # Generate JWT token
        token = create_access_token(identity=user.username)

        # Create Login Audit Log
        try:
            # Update user's last activity
            user.last_activity = datetime.now()
            
            audit = AuditLog(
                user_id=user.id,
                username=user.username,
                action='LOGIN',
                ip_address=request.remote_addr
            )
            db.session.add(audit)
            db.session.commit()
        except Exception as e:
            print(f"Error logging audit: {e}")
            db.session.rollback()

        return jsonify({
            "success": True,
            "data": {
                "access_token": token,
                "user": user.to_dict()
            },
            "message": "Login successful"
        })

    # -----------------------------------------------------------------
    # Password Reset flow (Forgot Password)
    # -----------------------------------------------------------------
    @app.route("/api/auth/forgot-password", methods=["POST"])
    def forgot_password():
        data = request.json or {}
        username = data.get("username", "").strip()
        
        if not username:
            return jsonify({"success": False, "message": "Username is required"}), 400
            
        user = User.query.filter(User.username.ilike(username)).first()
        if not user:
            # For security, don't reveal if user exists or not
            return jsonify({"success": True, "message": "If this account exists, a reset link/code has been sent."})
            
        import secrets
        from datetime import datetime, timedelta
        
        # Generate a 6-digit OTP for simplicity or a token
        token = secrets.token_hex(16)
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        
        # Send email (mock subject/body for now)
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        subject = "LPS System - Password Reset Request"
        body = f"Hello {user.name},\n\nYou requested a password reset. Use the link below to reset your password:\n{reset_link}\n\nThis link will expire in 1 hour."
        
        success, msg = send_email("98165mkm@gmail.com", subject, body) # Using user's email would be better but using default for now
        
        return jsonify({"success": True, "message": "If this account exists, a reset link has been sent."})

    @app.route("/api/auth/reset-password", methods=["POST"])
    def reset_password():
        data = request.json or {}
        token = data.get("token")
        new_password = data.get("password")
        
        if not token or not new_password:
            return jsonify({"success": False, "message": "Token and password are required"}), 400
            
        from datetime import datetime
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or user.reset_token_expiry < datetime.utcnow():
            return jsonify({"success": False, "message": "Invalid or expired token"}), 400
            
        user.password = new_password
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        return jsonify({"success": True, "message": "Password updated successfully"})

    # -----------------------------------------------------------------
    # Order Email Integration endpoints
    # -----------------------------------------------------------------
    @app.route('/api/orders/send-email', methods=['POST'])
    @jwt_required()
    def send_order_email():
        payload = request.json or {}
        # Support both 'to' (frontend) and 'email' (legacy/other)
        to_email = payload.get('to') or payload.get('email')
        subject = payload.get('subject')
        body = payload.get('body')
        
        if not to_email or not subject or not body:
            return jsonify({"success": False, "message": "Missing required email fields (to/email, subject, body)"}), 400
            
        success, message = send_email(to_email, subject, body)
        if success:
            return jsonify({"success": True, "message": "Email sent completed"})
        else:
            return jsonify({"success": False, "message": message}), 500

    @app.route('/api/orders/fetch-emails', methods=['GET'])
    @jwt_required()
    def get_incoming_emails():
        result = fetch_unread_emails()
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    @app.route('/api/orders/emails/<string:email_id>', methods=['DELETE'])
    @jwt_required()
    def delete_order_email(email_id):
        result = delete_email(email_id)
        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    @app.route('/api/orders/bulk-delete', methods=['POST'])
    @jwt_required()
    def bulk_delete_order_emails():
        payload = request.json or {}
        email_ids = payload.get('email_ids', [])
        if not email_ids:
            return jsonify({"success": False, "message": "No email IDs provided"}), 400
        
        results = []
        for eid in email_ids:
            results.append(delete_email(eid))
        
        # Check if at least one was successful or all
        any_success = any(r.get('success') for r in results)
        if any_success:
            return jsonify({"success": True, "message": f"Successfully processed {len(email_ids)} emails"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to delete selected emails"}), 500

    # Simple health endpoint
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "running", "engine": "WSGI Production Mode"})

    @app.route("/api/debug/db", methods=["GET"])
    def debug_db():
        return jsonify({
            "database_uri": app.config["SQLALCHEMY_DATABASE_URI"],
            "port": os.getenv("FLASK_PORT", "5000")
        })

    # Add global activity tracker
    @app.before_request
    def update_last_activity():
        try:
            # Check if this is an authenticated request
            from flask_jwt_extended import decode_token
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                identity = decode_token(token).get("sub")
                if identity:
                    user = User.query.filter_by(username=identity).first()
                    if user:
                        user.last_activity = datetime.now()
                        db.session.commit()
        except:
            pass # Silent fail for guest/invalid token requests

    return app


def seed_database(target_app):
    """Create tables and seed default data if missing.
    This function is called both in development (when running directly) and
    when the app is imported by a WSGI server.
    """
    with target_app.app_context():
        db.create_all()

        # Seed default Production Lines
        if ProductionLine.query.count() == 0:
            print("Seeding default production lines...")
            default_lines = [
                {"name": "LINE 01", "description": "Primary assembly line for standard SUV models."},
                {"name": "LINE 02", "description": "Secondary line for high-precision components."}
            ]
            for l_data in default_lines:
                db.session.add(ProductionLine(**l_data))
            db.session.commit()

        # Re-enable Master data seeding from JSON
        master_service = MasterDataDBService()
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        master_json = os.path.join(data_dir, "xuv_master_data.json")
        
        if MasterData.query.count() == 0 and os.path.exists(master_json):
            print(f"Seeding Master Data from {master_json}...")
            try:
                with open(master_json, 'r') as f:
                    master_service.seed_from_json(json.load(f))
                print("Master Data seeded successfully.")
            except Exception as e:
                print(f"Error seeding Master Data: {e}")

        # Seed default users – passwords are hashed automatically by the model
        default_users = [
            {"username": "admin", "name": "Admin User", "password": "admin", "role": "Admin"},
            {"username": "manager", "name": "Manoj Singh", "password": "manager", "role": "Manager"},
            {"username": "supervisor", "name": "Supervisor User", "password": "supervisor", "role": "Supervisor"},
            {"username": "deo", "name": "manoj", "password": "deo", "role": "DEO"},
        ]

        for u_data in default_users:
            if not User.query.filter_by(username=u_data["username"]).first():
                print(f"Seeding missing default user: {u_data['username']}")
                db.session.add(User(**u_data))

        # Seed Car Models with default headers
        if CarModel.query.count() == 0:
            print("Seeding missing default Car Models with schemas...")
            
            # Shared default headers
            id_heads = ["SR NO", "PART NUMBER", "SAP PART NUMBER", "PART DESCRIPTION", "SALEABLE NO", "ASSEMBLY NUMBER"]
            prod_heads = ["Strokes/Part", "320T", "200T", "160T", "110T", "80T", "63T", "Total Strokes Req", "M/C", "Part Wt.", "Per Day Req"]
            mat_heads = ["RM Thk mm", "Sheet Width", "Sheet Length", "No of comp per sheet", "RM SIZE", "RM Grade", "Act RM Sizes"]

            car_models = [
                {"name": "XUV", "model_code": "XUV-003", "type": "SUV", "identification_headers": id_heads, "production_headers": prod_heads, "material_headers": mat_heads},
            ]
            for m_data in car_models:
                db.session.add(CarModel(**m_data))
        
        # Seed initial Audit Log if empty
        if AuditLog.query.count() == 0:
            print("Seeding initial Audit Log entries...")
            try:
                # Add a system start log
                system_log = AuditLog(
                    username="SYSTEM",
                    action="STARTUP",
                    ip_address="127.0.0.1"
                )
                db.session.add(system_log)
                
                # Add a seed log for each existing user
                for user in User.query.all():
                    seed_log = AuditLog(
                        user_id=user.id,
                        username=user.username,
                        action="INITIALIZED",
                        ip_address="127.0.0.1"
                    )
                    db.session.add(seed_log)
                
                db.session.commit()
                print("Audit logs seeded successfully.")
            except Exception as e:
                print(f"Error seeding Audit Logs: {e}")
                db.session.rollback()
            db.session.commit() # Commit to get IDs for demands

        # Seed Demands
        if Demand.query.count() == 0:
            print("Seeding missing default Demands...")
            models = {m.name: m.id for m in CarModel.query.all()}
            demands = [
                {
                    "formatted_id": "DEM-002",
                    "model_id": models.get("XUV"),
                    "model_name": "XUV",
                    "quantity": 1500,
                    "start_date": "2025-02-01",
                    "end_date": "2025-02-28",
                    "status": "IN_PROGRESS",
                    "line": "Z101",
                    "manager": "Rajesh Sharma",
                    "customer": "Export Division"
                }
            ]
            for d_data in demands:
                if d_data.get("model_id"):
                    db.session.add(Demand(**d_data))

        db.session.commit()
