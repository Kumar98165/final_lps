# admin/routes.py – Blueprint for admin‑only endpoints (user management)
"""Admin routes handle CRUD operations for user accounts.
These endpoints are protected with JWT and are intended for users with the
"Admin" role. The blueprint is registered in ``wsgi.py`` under the ``/api``
prefix.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, ProductionLine, CarModel, Demand, db, DailyWorkStatus, DailyProductionLog
from app.services.db_service import IdentityDBService
from app.middleware.auth_middleware import role_required
from app.utils.audit_logger import log_audit
import time as time_module

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
    # Show all registered car models
    models = CarModel.query.order_by(CarModel.name.asc()).all()
    return jsonify({
        "success": True,
        "data": [m.to_dict() for m in models]
    })

@admin_bp.route('/assignments/<int:model_id>', methods=['PUT', 'PATCH'])
@jwt_required()
@role_required(['Admin', 'Supervisor'])
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

# ---------------------------------------------------------------------------
# Master Data & Models (from Production BP)
# ---------------------------------------------------------------------------
@admin_bp.route('/models', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Supervisor', 'Manager', 'DEO'])
def get_models():
    # Return unique model names
    from sqlalchemy import func
    latest_ids = db.session.query(func.max(CarModel.id)).group_by(CarModel.name).all()
    latest_ids = [id_tuple[0] for id_tuple in latest_ids]
    models = CarModel.query.filter(CarModel.id.in_(latest_ids)).order_by(CarModel.name.asc()).all()
    return jsonify({"success": True, "data": [m.to_dict() for m in models]})

@admin_bp.route('/models', methods=['POST'])
@jwt_required()
@role_required(['Admin', 'Manager'])
def create_model_master():
    data = request.json
    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Name is required"}), 400
    
    new_model = CarModel(
        name=data['name'],
        model_code=data.get('model_code'),
        type=data.get('type', 'Standard')
    )
    db.session.add(new_model)
    db.session.commit()
    log_audit("CREATE_MODEL_MASTER")
    return jsonify({"success": True, "message": "Model created", "data": new_model.to_dict()}), 201

# ---------------------------------------------------------------------------
# Demands / Orders (from Production BP)
# ---------------------------------------------------------------------------
@admin_bp.route('/demands', methods=['GET'])
@jwt_required()
@role_required(['Admin', 'Supervisor', 'Manager', 'DEO'])
def get_demands():
    manager_filter = request.args.get('manager')
    query = Demand.query
    if manager_filter:
        query = query.filter(Demand.manager.ilike(manager_filter))
    demands = query.order_by(Demand.id.desc()).all()
    return jsonify({"success": True, "data": [d.to_dict() for d in demands]})

@admin_bp.route('/demands', methods=['POST'])
@jwt_required()
@role_required(['Admin', 'Supervisor', 'Manager'])
def create_demand():
    data = request.json
    model_name = data.get('model_name') or data.get('model_id')
    if not data or not model_name or not data.get('quantity'):
        return jsonify({"success": False, "message": "Model and Quantity are required"}), 400
    
    # Generate unique DEM-ID
    from sqlalchemy import func
    max_id = db.session.query(func.max(Demand.id)).scalar() or 0
    formatted_id = data.get('formatted_id', f"DEM-{(max_id + 1):03d}")
    
    # Clone model for independent assignment lifecycle
    model_name_str = str(model_name).upper().strip()
    new_model = CarModel(
        name=model_name_str,
        model_code=f"{model_name_str[:3]}-{str(int(time_module.time()))[-4:]}",
        type='Standard',
        status='PENDING'
    )
    db.session.add(new_model)
    db.session.flush()

    new_demand = Demand(
        formatted_id=formatted_id,
        model_id=new_model.id,
        model_name=model_name_str,
        quantity=data['quantity'],
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        line=data.get('line'),
        manager=data.get('manager'),
        customer=data.get('customer'),
        status='PENDING'
    )
    db.session.add(new_demand)
    db.session.commit()
    log_audit("CREATE_DEMAND_ADMIN")
    return jsonify({"success": True, "message": "Demand created", "data": new_demand.to_dict()}), 201

@admin_bp.route('/demands/<int:id>', methods=['GET', 'PUT', 'PATCH'])
@jwt_required()
@role_required(['Admin', 'Supervisor', 'Manager'])
def handle_demand_by_id(id):
    demand = Demand.query.get(id)
    if not demand:
        return jsonify({"success": False, "message": "Demand not found"}), 404
    
    if request.method == 'GET':
        return jsonify({"success": True, "data": demand.to_dict()})
    
    data = request.json or {}
    if 'quantity' in data: demand.quantity = data['quantity']
    if 'status' in data: demand.status = data['status']
    if 'line' in data: demand.line = data['line']
    if 'manager' in data: demand.manager = data['manager']
    if 'customer' in data: demand.customer = data['customer']
    if 'start_date' in data: demand.start_date = data['start_date']
    if 'end_date' in data: demand.end_date = data['end_date']
    
    db.session.commit()
    log_audit("UPDATE_DEMAND_ADMIN")
    return jsonify({"success": True, "message": "Demand updated", "data": demand.to_dict()})

@admin_bp.route('/demands/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['Admin'])
def delete_demand(id):
    demand = Demand.query.get(id)
    if not demand:
        return jsonify({"success": False, "message": "Demand not found"}), 404
    
    model_id = demand.model_id
    # Cleanup associated logs, work status, and unique model clone
    DailyProductionLog.query.filter_by(demand_id=id).delete()
    
    if model_id:
        # Prevent foreign key constraint errors by cleaning up daily status records
        DailyWorkStatus.query.filter_by(car_model_id=model_id).delete()
        
    db.session.delete(demand)
    
    if model_id:
        model = CarModel.query.get(model_id)
        if model: 
            db.session.delete(model)
    
    db.session.commit()
    log_audit("DELETE_DEMAND_ADMIN")
    return jsonify({"success": True, "message": "Demand deleted successfully"})

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
    from app.models import DailyWorkStatus, DailyProductionLog, CarModel, ProductionLine
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
        oee = "100.0%"

    # 5. General Stats
    stats = {
        "active_lines": ProductionLine.query.filter_by(is_active=True).count(),
        "pending_reviews": DailyProductionLog.query.filter_by(status='PENDING').count(),
        "total_models": CarModel.query.count(),
        "active_deos": User.query.filter_by(role='DEO', is_active=True).count()
    }
        
    return jsonify({
        "success": True,
        "oee": oee,
        "production_units": str(total_actual),
        "stats": stats
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
