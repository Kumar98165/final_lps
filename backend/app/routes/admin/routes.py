# admin/routes.py – Blueprint for admin‑only endpoints (user management)
"""Admin routes handle CRUD operations for user accounts.
These endpoints are protected with JWT and are intended for users with the
"Admin" role. The blueprint is registered in ``wsgi.py`` under the ``/api``
prefix.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import User, ProductionLine, CarModel, Demand, db
from app.services.db_service import IdentityDBService
from app.middleware.auth_middleware import role_required
from app.utils.audit_logger import log_audit

admin_bp = Blueprint('admin', __name__)

# ... (paginate_query, get_admin_summary, get_users, create_user, update_user, delete_user remain same)

@admin_bp.route('/identity/staff', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Manager', 'Supervisor'])
def get_staff():
    role = request.args.get('role')
    query = User.query
    if role:
        query = query.filter(User.role.ilike(role))
    else:
        query = query.filter(User.role.in_(['Supervisor', 'DEO']))
    
    staff = query.order_by(User.name.asc()).all()
    return jsonify({
        "success": True,
        "data": [s.to_dict() for s in staff]
    })

# ---------------------------------------------------------------------------
# Production Line Endpoints
# ---------------------------------------------------------------------------
@admin_bp.route('/lines', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Manager'])
def get_lines():
    lines = ProductionLine.query.all()
    return jsonify({
        "success": True,
        "data": [line.to_dict() for line in lines]
    })

@admin_bp.route('/lines', methods=['POST'])
@jwt_required()
@role_required(['Admin'])
def create_line():
    data = request.json
    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Line name is required"}), 400
    
    new_line = ProductionLine(
        name=data['name'],
        description=data.get('description', ''),
        is_active=data.get('isActive', True)
    )
    db.session.add(new_line)
    db.session.commit()
    log_audit("CREATE_LINE")
    return jsonify({"success": True, "message": "Production line created", "data": new_line.to_dict()}), 201

@admin_bp.route('/lines/<int:line_id>', methods=['PUT'])
@jwt_required()
@role_required(['Admin'])
def update_line(line_id):
    line = ProductionLine.query.get(line_id)
    if not line:
        return jsonify({"success": False, "message": "Line not found"}), 404
    
    data = request.json
    if 'name' in data: line.name = data['name']
    if 'description' in data: line.description = data['description']
    if 'isActive' in data: line.is_active = data['isActive']
    
    db.session.commit()
    log_audit("UPDATE_LINE")
    return jsonify({"success": True, "message": "Line updated", "data": line.to_dict()})

@admin_bp.route('/lines/<int:line_id>', methods=['DELETE'])
@jwt_required()
@role_required(['Admin'])
def delete_line(line_id):
    line = ProductionLine.query.get(line_id)
    if not line:
        return jsonify({"success": False, "message": "Line not found"}), 404
    
    db.session.delete(line)
    db.session.commit()
    log_audit("DELETE_LINE")
    return jsonify({"success": True, "message": "Line deleted"})

# ---------------------------------------------------------------------------
@admin_bp.route('/assignments', methods=['GET'])
@jwt_required()
@role_required(['Admin'])
def get_assignments():
    # Show models that have at least one demand
    models = CarModel.query.filter(
        CarModel.demands_list.any()
    ).order_by(CarModel.name.asc()).all()
    return jsonify({
        "success": True,
        "data": [m.to_dict() for m in models]
    })

@admin_bp.route('/assignments/<int:model_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@role_required(['Admin'])
def update_assignment(model_id):
    model = CarModel.query.get(model_id)
    if not model:
        return jsonify({"success": False, "message": "Car Model not found"}), 404
    
    data = request.json
    if 'line_id' in data: model.production_line_id = data.get('line_id')
    if 'supervisor_id' in data: model.supervisor_id = data.get('supervisor_id')
    if 'assigned_deo_id' in data: model.assigned_deo_id = data.get('assigned_deo_id')
    if 'name' in data: model.name = data['name']
    if 'model_code' in data: model.model_code = data['model_code']
    if 'type' in data: model.type = data['type']
    
    db.session.commit()
    log_audit("UPDATE_ASSIGNMENT")
    return jsonify({"success": True, "message": f"Assignments updated for {model.name}", "data": model.to_dict()})

# Helper for pagination (reuse from routes if needed)
def paginate_query(query, default_limit=50, max_limit=200):
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', default_limit))
        limit = min(limit, max_limit)
    except ValueError:
        return jsonify({"success": False, "message": "Invalid pagination parameters"}), 400
    items = query.offset((page - 1) * limit).limit(limit).all()
    total = query.count()
    return items, total, page, limit

@admin_bp.route('/summary', methods=['GET'])
@jwt_required()
@role_required(['Admin'])
def get_admin_summary():
    from app.models import DailyWorkStatus
    from sqlalchemy import func
    import datetime
    
    # Get today's production data from unified DailyWorkStatus
    today = datetime.date.today()
    work_entries = DailyWorkStatus.query.filter(DailyWorkStatus.date == today).all()
    
    total_actual = sum(p.actual_qty for p in work_entries)
    total_planned = sum(p.planned_qty for p in work_entries)
    
    # Calculate OEE (actual/planned ratio)
    oee = "0.0%"
    if total_planned > 0:
        oee_val = (total_actual / total_planned) * 100
        oee = f"{oee_val:.1f}%"
    elif total_actual > 0:
        oee = "100.0%" # Edge case where it's 100% if no planning but work done? 
        
    return jsonify({
        "oee": oee,
        "node_efficiency": "98.2%", # Mocked for now
        "production_units": str(total_actual) if total_actual > 0 else '0',
        "security_status": "Verified"
    })


@admin_bp.route('/identity/users', methods=['GET'])
@jwt_required()
@role_required(['Admin'])
def get_users():
    query = User.query.order_by(User.id.desc())
    users, total, page, limit = paginate_query(query)
    data = [u.to_dict() for u in users]
    return jsonify({
        "success": True,
        "data": data,
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
        },
    })

@admin_bp.route('/identity/users', methods=['POST'])
@jwt_required()
@role_required(['Admin'])
def create_user():
    data = request.json
    if not data or not data.get('username'):
        return jsonify({"success": False, "message": "Username is required"}), 400
    existing = User.query.filter_by(username=data['username']).first()
    if existing:
        return jsonify({"success": False, "message": "Username already exists"}), 400
    new_user = User(
        username=data['username'],
        name=data.get('name', data['username']),
        password=data.get('password'),  # setter hashes automatically
        role=data.get('role'),
        shop=data.get('shop'),
        is_active=data.get('isActive', True),
    )
    db.session.add(new_user)
    db.session.commit()
    log_audit("CREATE_USER")
    return jsonify({"success": True, "message": "User created successfully", "user": new_user.to_dict()}), 201

@admin_bp.route('/identity/users/<string:username>', methods=['PUT', 'PATCH'])
@jwt_required()
@role_required(['Admin'])
def update_user(username):
    updates = request.json or {}
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # Apply updates directly so the password setter (hashing) works
    if 'name' in updates:
        user.name = updates['name']
    if 'role' in updates:
        user.role = updates['role']
    if 'shop' in updates:
        user.shop = updates['shop']
    if 'isActive' in updates:
        user.is_active = updates['isActive']
    if 'password' in updates and updates['password']:
        user.password = updates['password']  # triggers the @password.setter → hashes it

    db.session.commit()
    log_audit("UPDATE_USER")
    return jsonify({"success": True, "message": f"User {username} updated", "user": user.to_dict()})

@admin_bp.route('/identity/users/<string:username>', methods=['DELETE'])
@jwt_required()
@role_required(['Admin'])
def delete_user(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    log_audit("DELETE_USER")
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True, "message": f"User {username} deleted"})
