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

def parse_float(val):
    if val is None or val == "": return 0.0
    try:
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0

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

@deo_bp.route('/sync/<int:row_id>', methods=['PUT'])
@jwt_required()
@role_required(['DEO'])
def live_sync_cell(row_id):
    """
    Syncs a single row's data to the database.
    Supports two modes (determined by presence of 'real_entry_id' in body):
    - real_entry_id present: direct DEOProductionEntry primary-key lookup
    - real_entry_id absent:  legacy fake-index mode (row_index = row_id - 10000)
    """
    print(f"\n[SYNC DEBUG] Incoming sync for Row ID: {row_id}")
    username = get_jwt_identity()

    user = User.query.filter_by(username=username).first()
    data = request.json or {}

    car_model_id = data.get('car_model_id')
    demand_id = data.get('demand_id')
    real_entry_id = data.get('real_entry_id')  # Set by frontend when it has the real DB id

    if not car_model_id:
        return jsonify({"success": False, "message": "car_model_id required"}), 400

    from app.models.models import DEOProductionEntry

    mapping = {
        "SAP Stock": "sap_stock", "Opening Stock": "opening_stock",
        "Todays Stock": "todays_stock", "Production Status": "status",
        "row_status": "row_status", "rejection_reason": "rejection_reason", "deo_reply": "deo_reply"
    }

    today = date.today()

    def _apply_and_save(entry):
        for key, val in data.items():
            col = mapping.get(key)
            if col:
                if col in ["sap_stock", "opening_stock", "todays_stock"]:
                    setattr(entry, col, parse_float(val))
                else:
                    setattr(entry, col, val)
        if entry.per_day and entry.per_day > 0:
            entry.coverage_days = round(float(entry.todays_stock or 0) / entry.per_day, 1)
        db.session.commit()
        log = DailyProductionLog.query.get(entry.log_id)
        if log:
            sync_log_to_work_status(log)
        return jsonify({"success": True})

    # ─── Mode A: direct DB entry id ─────────────────────────────────────────
    if real_entry_id:
        entry = DEOProductionEntry.query.get(int(real_entry_id))
        if not entry:
            return jsonify({"success": False, "message": "Entry not found"}), 404
        return _apply_and_save(entry)

    # ─── Mode B: legacy fake-index mode (row_id = 10000 + idx) ──────────────
    row_index = row_id - 10000
    if row_index < 0:
        return jsonify({"success": False, "message": "Invalid row_id"}), 400

    log = DailyProductionLog.query.filter_by(
        car_model_id=car_model_id,
        deo_id=user.id,
        date=today
    ).order_by(DailyProductionLog.id.desc()).first()

    if not log:
        # Auto-create log and entries if missing
        cm = CarModel.query.get(car_model_id)
        if not cm:
            return jsonify({"success": False, "message": "Model not found"}), 404

        from app.services.db_service import MasterDataDBService
        bom = MasterDataDBService().get_by_model(cm.name)
        log = DailyProductionLog(
            car_model_id=car_model_id, demand_id=demand_id,
            deo_id=user.id, model_name=cm.name, status='DRAFT'
        )
        db.session.add(log)
        db.session.flush()

        for i, b in enumerate(bom):
            entry = DEOProductionEntry(
                log_id=log.id, sn_no=i + 1,
                sap_part_number=b.get('common', {}).get('sap_part_number'),
                part_number=b.get('common', {}).get('part_number'),
                part_description=b.get('common', {}).get('description'),
                per_day=parse_float(b.get('production_data', {}).get('Target Qty')),
                date=today, car_model_id=car_model_id
            )
            db.session.add(entry)
        db.session.commit()

    from app.services.production_service import get_merged_log_data
    merged = get_merged_log_data(log)

    if 0 <= row_index < len(merged):
        sap_part = str(merged[row_index].get('SAP PART NUMBER', '')).strip().upper()
        entry = DEOProductionEntry.query.filter(
            DEOProductionEntry.log_id == log.id,
            db.func.upper(db.func.trim(DEOProductionEntry.sap_part_number)) == sap_part
        ).first()

        # If no entry exists yet for this SAP part, create one now
        if not entry:
            entry = DEOProductionEntry(
                log_id=log.id, sn_no=row_index + 1,
                sap_part_number=merged[row_index].get('SAP PART NUMBER', ''),
                part_number=merged[row_index].get('PART NUMBER', ''),
                part_description=merged[row_index].get('PART DESCRIPTION', ''),
                per_day=parse_float(merged[row_index].get('PER DAY', 0)),
                date=today, car_model_id=car_model_id
            )
            db.session.add(entry)
            db.session.flush()

        for key, val in data.items():
            col = mapping.get(key)
            if col:
                if col in ["sap_stock", "opening_stock", "todays_stock"]:
                    setattr(entry, col, parse_float(val))
                else:
                    setattr(entry, col, val)

        if entry.per_day and entry.per_day > 0:
            entry.coverage_days = round(float(entry.todays_stock or 0) / entry.per_day, 1)

        db.session.commit()
        sync_log_to_work_status(log)
        return jsonify({"success": True})

    return jsonify({"success": False, "message": "Entry not found"}), 400

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

    from app.models.models import DEOProductionEntry
    if not log:
        cm = CarModel.query.get(model_id)
        log = DailyProductionLog(car_model_id=model_id, demand_id=demand_id, deo_id=user.id, model_name=cm.name if cm else "Unknown", status='SUBMITTED' if is_final else 'DRAFT')
        db.session.add(log)
        db.session.flush()

    log.status = 'SUBMITTED' if is_final else 'DRAFT'
    for row in log_data:
        sap = str(row.get('SAP PART NUMBER', '')).strip().upper()
        if not sap: continue
        
        # Robust case-insensitive lookup
        entry = DEOProductionEntry.query.filter(
            DEOProductionEntry.log_id == log.id,
            db.func.upper(db.func.trim(DEOProductionEntry.sap_part_number)) == sap
        ).first()
        
        if not entry:
            entry = DEOProductionEntry(log_id=log.id, sap_part_number=sap, date=today, car_model_id=model_id)
            db.session.add(entry)
            
        entry.sap_stock = parse_float(row.get('SAP Stock'))
        entry.opening_stock = parse_float(row.get('Opening Stock'))
        entry.todays_stock = parse_float(row.get('Todays Stock'))
        entry.status = row.get('Production Status') or 'PENDING'
        entry.per_day = parse_float(row.get('PER DAY') or row.get('Per Day'))
        if entry.per_day > 0: entry.coverage_days = round(entry.todays_stock / entry.per_day, 1)

    db.session.commit()
    from app.services.production_service import sync_log_to_work_status
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
    if not log: return jsonify({"success": False, "message": "Log not found"}), 404
        
    from app.services.production_service import get_merged_log_data
    merged = get_merged_log_data(log)
    
    if 0 <= row_index < len(merged):
        sap_part = str(merged[row_index].get('SAP PART NUMBER', '')).strip().upper()
        from app.models.models import DEOProductionEntry
        # Robust case-insensitive lookup
        entry = DEOProductionEntry.query.filter(
            DEOProductionEntry.log_id == log.id,
            db.func.upper(db.func.trim(DEOProductionEntry.sap_part_number)) == sap_part
        ).first()
        
        if entry:
            mapping = {
                "SAP Stock": "sap_stock", "Opening Stock": "opening_stock", 
                "Todays Stock": "todays_stock", "Production Status": "status",
                "row_status": "row_status", "rejection_reason": "rejection_reason", "deo_reply": "deo_reply"
            }
            for key, val in updated_data.items():
                col = mapping.get(key)
                if col:
                    if col in ["sap_stock", "opening_stock", "todays_stock"]:
                        setattr(entry, col, parse_float(val))
                    else:
                        setattr(entry, col, val)
            
            if entry.per_day > 0:
                entry.coverage_days = round(entry.todays_stock / entry.per_day, 1)

            db.session.commit()
            from app.services.production_service import sync_log_to_work_status
            sync_log_to_work_status(log)
            return jsonify({"success": True})
        
    return jsonify({"success": False, "message": "Row index out of bounds"}), 400
