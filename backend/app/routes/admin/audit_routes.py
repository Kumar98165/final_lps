from flask import Blueprint, jsonify, request
from app.models import db, User, AuditLog
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta

audit_bp = Blueprint('audit', __name__)
@audit_bp.route('/audit/stats', methods=['GET'])
@jwt_required()
def get_audit_stats():
    """Get role-wise active user statistics."""
    try:
        # Define 'active' as any activity within the last 10 minutes
        threshold = datetime.now() - timedelta(minutes=10)
        
        roles_query = db.session.query(User.role).distinct().all()
        roles = [r[0] for r in roles_query if r[0]]
        
        stats = []
        for role in roles:
            total = User.query.filter_by(role=role).count()
            active = User.query.filter(User.role == role, User.last_activity >= threshold).count()
            stats.append({
                "role": role,
                "total": total,
                "active": active,
                "inactive": total - active
            })
            
        return jsonify({
            "success": True,
            "data": stats
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@audit_bp.route('/audit/list', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Get recent audit log entries with pagination."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        pagination = AuditLog.query.order_by(AuditLog.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        threshold = datetime.now() - timedelta(minutes=10)
        logs = []
        for log in pagination.items:
            data = log.to_dict()
            is_active = False
            if log.user and log.user.last_activity:
                is_active = log.user.last_activity >= threshold
            data['userStatus'] = 'ACTIVE' if is_active else 'DEACTIVE'
            logs.append(data)
        
        return jsonify({
            "success": True,
            "data": {
                "logs": logs,
                "total": pagination.total,
                "pages": pagination.pages,
                "current_page": pagination.page
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
