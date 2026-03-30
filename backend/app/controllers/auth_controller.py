import secrets
import hashlib
import logging
from datetime import datetime, timedelta
from flask import jsonify, request
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models import User, AuditLog
from app.services.email_service import send_email

logger = logging.getLogger(__name__)


def login_controller():
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "message": "Missing credentials"}), 400

    user = User.query.filter(User.username.ilike(username)).first()

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 401

    if not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid password"}), 401

    token = create_access_token(identity=user.username)

    try:
        user.last_activity = datetime.utcnow()

        audit = AuditLog(
            user_id=user.id,
            username=user.username,
            action='LOGIN',
            ip_address=request.remote_addr
        )

        db.session.add(audit)
        db.session.commit()

    except Exception:
        logger.error("Error logging audit", exc_info=True)
        db.session.rollback()

    return jsonify({
        "success": True,
        "data": {
            "access_token": token,
            "user": user.to_dict()
        },
        "message": "Login successful"
    })


def forgot_password_controller():
    data = request.json or {}
    username = data.get("username", "").strip()

    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400

    user = User.query.filter(User.username.ilike(username)).first()

    if not user:
        return jsonify({
            "success": True,
            "message": "If this account exists, a reset link/code has been sent."
        })

    token = secrets.token_hex(16)
    hashed_token = hashlib.sha256(token.encode()).hexdigest()

    user.reset_token = hashed_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)

    db.session.commit()

    reset_link = f"http://localhost:5173/reset-password?token={token}"

    subject = "LPS System - Password Reset Request"
    body = (
        f"Hello {user.name},\n\n"
        f"You requested a password reset. Use the link below to reset your password:\n"
        f"{reset_link}\n\n"
        f"This link will expire in 1 hour."
    )

    send_email("98165mkm@gmail.com", subject, body)

    return jsonify({
        "success": True,
        "message": "If this account exists, a reset link has been sent."
    })


def reset_password_controller():
    data = request.json or {}

    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return jsonify({
            "success": False,
            "message": "Token and password are required"
        }), 400

    hashed_token = hashlib.sha256(token.encode()).hexdigest()

    user = User.query.filter_by(reset_token=hashed_token).first()

    if not user or user.reset_token_expiry < datetime.utcnow():
        return jsonify({
            "success": False,
            "message": "Invalid or expired token"
        }), 400

    # assuming you already have hashing inside model
    if hasattr(user, "set_password"):
        user.set_password(new_password)
    else:
        user.password = new_password

    user.reset_token = None
    user.reset_token_expiry = None

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password updated successfully"
    })