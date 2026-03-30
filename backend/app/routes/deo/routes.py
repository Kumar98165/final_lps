# backend/app/routes/deo/routes.py
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from app.models import db, User, CarModel, Demand, DailyProductionLog, DailyWorkStatus
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.middleware.auth_middleware import role_required
from app.utils.audit_logger import log_audit
from app.services.production_service import get_merged_log_data, sync_log_to_work_status
from sqlalchemy.orm.attributes import flag_modified

deo_bp = Blueprint('deo', __name__)

@deo_bp.route('/assigned-work', methods=['GET'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Admin', 'Manager'])
def get_assigned_work():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    today = date.today()
    
    # If user is a DEO, show only their assignments. 
    # Otherwise (Admin/Manager/Supervisor), show all models for oversight.
    if user.role == 'DEO':
        models = CarModel.query.filter(CarModel.assigned_deo_id == user.id).all()
    else:
        models = CarModel.query.all()
    
    data = []
    for m in models:
        m_dict = m.to_dict()
        
        # Today's stats
        stats = DailyWorkStatus.query.filter_by(car_model_id=m.id, date=today).first()
        m_dict['planned_qty'] = stats.planned_qty if stats else 0
        m_dict['actual_qty'] = stats.actual_qty if stats else 0

        # Active demand
        active_demand = Demand.query.filter_by(model_id=m.id).filter(Demand.status != 'COMPLETED').order_by(Demand.id.desc()).first()
        if not active_demand:
            active_demand = Demand.query.filter_by(model_id=m.id).order_by(Demand.id.desc()).first()
            
        if active_demand:
            m_dict['target_quantity'] = active_demand.quantity
            m_dict['customer_name'] = active_demand.customer
            m_dict['manager_name'] = active_demand.manager
            m_dict['manager_email'] = f"{active_demand.manager.lower().replace(' ', '.')}@gmail.com" if active_demand.manager else None
            m_dict['customer_email'] = f"{active_demand.customer.lower().replace(' ', '.')}@gmail.com" if active_demand.customer else None
            m_dict['supervisor_email'] = f"{m.supervisor.username.lower()}@gmail.com" if m.supervisor else None
            m_dict['deo_email'] = f"{user.username.lower()}@gmail.com"
            m_dict['demand_id'] = active_demand.id
            m_dict['start_date'] = active_demand.start_date
            m_dict['end_date'] = active_demand.end_date

        # Submission check
        submission = DailyProductionLog.query.filter(
            DailyProductionLog.car_model_id == m.id,
            DailyProductionLog.deo_id == user.id,
            DailyProductionLog.status.in_(['PENDING', 'SUBMITTED', 'VERIFIED']),
            DailyProductionLog.date >= today
        ).first()
        
        m_dict['is_submitted_today'] = submission is not None
        data.append(m_dict)

    return jsonify({"success": True, "data": data})

@deo_bp.route('/sync/<int:fake_id>', methods=['PUT'])
@jwt_required()
@role_required(['DEO'])
def live_sync_cell(fake_id):
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    data = request.json or {}
    
    car_model_id = data.get('car_model_id')
    demand_id = data.get('demand_id')
    row_index = fake_id - 10000
    
    if not car_model_id or row_index < 0:
        return jsonify({"success": False, "message": "Invalid sync parameters"}), 400
        
    today = date.today()
    log = DailyProductionLog.query.filter_by(
        car_model_id=car_model_id,
        deo_id=user.id,
        date=today
    ).order_by(DailyProductionLog.id.desc()).first()
    
    if not log:
        # Auto-create draft log if missing (Live Sync safety)
        cm = CarModel.query.get(car_model_id)
        if not cm: return jsonify({"success": False, "message": "Model not found"}), 404
        
        from app.services.db_service import MasterDataDBService
        bom = MasterDataDBService().get_by_model(cm.name)
        log_data = [{"id": 10000 + i, "PART NUMBER": b.get('common', {}).get('part_number', ''), "Today Produced": "0"} for i, b in enumerate(bom)]
        
        log = DailyProductionLog(car_model_id=car_model_id, demand_id=demand_id, deo_id=user.id, model_name=cm.name, log_data=log_data, status='DRAFT')
        db.session.add(log)
        db.session.commit()

    log_data = list(log.log_data)
    if row_index < len(log_data):
        for key, val in data.items():
            if key not in ['car_model_id', 'demand_id']:
                log_data[row_index][key] = val
        
        log.log_data = log_data
        flag_modified(log, "log_data")
        db.session.commit()
        
        # Optional: Sync to summary for real-time dashboard
        sync_log_to_work_status(log)
        return jsonify({"success": True})
    
    return jsonify({"success": False, "message": "Row out of bounds"}), 400

@deo_bp.route('/submit', methods=['POST'])
@jwt_required()
@role_required(['DEO'])
def submit_log():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    data = request.json or {}
    
    model_id = data.get('car_model_id')
    demand_id = data.get('demand_id')
    log_data = data.get('log_data')
    is_final = data.get('is_final', False)

    if not model_id or not log_data:
        return jsonify({"success": False, "message": "Missing submission data"}), 400

    today = date.today()
    log = DailyProductionLog.query.filter_by(car_model_id=model_id, deo_id=user.id, date=today).first()

    if log:
        log.log_data = log_data
        log.status = 'SUBMITTED' if is_final else 'DRAFT'
        flag_modified(log, "log_data")
    else:
        cm = CarModel.query.get(model_id)
        log = DailyProductionLog(
            car_model_id=model_id,
            demand_id=demand_id,
            deo_id=user.id,
            model_name=cm.name if cm else "Unknown",
            log_data=log_data,
            status='SUBMITTED' if is_final else 'DRAFT'
        )
        db.session.add(log)

    db.session.commit()
    # Update summary table for Admin Dashboard immediately
    sync_log_to_work_status(log)
    
    log_audit("DEO_SUBMIT_LOG" if is_final else "DEO_SAVE_DRAFT")
    return jsonify({"success": True, "message": "Submission successful", "data": log.to_dict()})

@deo_bp.route('/history', methods=['GET'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Admin', 'Manager'])
def get_history():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    
    logs = DailyProductionLog.query.filter_by(deo_id=user.id).order_by(DailyProductionLog.date.desc()).all()
    data = []
    for log in logs:
        d = log.to_dict()
        d['log_data'] = get_merged_log_data(log)
        data.append(d)
        
    return jsonify({"success": True, "data": data})

@deo_bp.route('/accept-assignment/<int:id>', methods=['POST'])
@jwt_required()
@role_required(['DEO'])
def accept_assignment(id):
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    model = CarModel.query.get(id)
    
    if not model or model.assigned_deo_id != user.id:
        return jsonify({"success": False, "message": "Assignment not found"}), 404
        
    model.deo_accepted = True
    model.status = 'IN_PROGRESS'
    db.session.commit()
    log_audit("DEO_ACCEPT_ASSIGNMENT")
    return jsonify({"success": True, "message": "Assignment accepted"})

@deo_bp.route('/daily-status', methods=['GET'])
@jwt_required()
@role_required(['DEO'])
def get_daily_status():
    """Simple health/status check for DEO dashboard."""
    return jsonify({"success": True, "status": "active", "date": str(date.today())})

@deo_bp.route('/update-history-row', methods=['POST'])
@jwt_required()
@role_required(['DEO'])
def deo_update_row():
    """Allows DEO to correct a row in a submitted/rejected log."""
    data = request.json or {}
    log_id = data.get('log_id')
    row_index = data.get('row_index')
    updated_data = data.get('updated_row_data', {})
    
    if log_id is None or row_index is None:
        return jsonify({"success": False, "message": "Log ID and row index required"}), 400
        
    log = DailyProductionLog.query.get(log_id)
    if not log:
        return jsonify({"success": False, "message": "Log not found"}), 404
        
    log_data = list(log.log_data)
    if row_index < len(log_data):
        log_data[row_index].update(updated_data)
        log.log_data = log_data
        flag_modified(log, "log_data")
        db.session.commit()
        
        # If it was rejected, maybe we keep it rejected until supervisor re-reviews
        # but we sync the stats
        sync_log_to_work_status(log)
        return jsonify({"success": True})
        
    return jsonify({"success": False, "message": "Row index out of bounds"}), 400
