from flask import request
from flask_jwt_extended import get_jwt_identity
from app.models import User, AuditLog
from app.extensions import db
import datetime

def log_audit(action, user_id=None, username=None):
    """
    Utility function to log an action to the audit_logs table.
    If user_id/username aren't provided, it tries to get them from the current JWT identity.
    """
    try:
        if not username:
            try:
                username = get_jwt_identity()
            except Exception:
                username = "SYSTEM"
        
        if not user_id and username and username != "SYSTEM":
            user = User.query.filter_by(username=username).first()
            if user:
                user_id = user.id

        audit = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            ip_address=request.remote_addr if request else "127.0.0.1"
        )
        db.session.add(audit)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Audit log failed: {e}")
        db.session.rollback()
        return False
