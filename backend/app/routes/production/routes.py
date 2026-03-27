# backend/production/routes.py
import os
from datetime import datetime, date
from flask import Blueprint, request, jsonify, current_app
from app.models import db, MasterData, CarModel, DailyWorkStatus, User, Demand, DailyProductionLog
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.middleware.auth_middleware import role_required
from app.utils.audit_logger import log_audit
from werkzeug.utils import secure_filename
from sqlalchemy import func, exists

production_bp = Blueprint('production', __name__)

def get_merged_log_data(log_entry):
    """
    Merges historical log_data with current Master Data (BOM) to ensure
    all components (e.g. 388 rows) are visible, even if the log only captured a subset.
    """
    from app.services.db_service import MasterDataDBService
    from app.models import CarModel, Demand
    
    # 1. Fetch current Master Data BOM for this model
    car_model_id = log_entry.car_model_id
    search_name = log_entry.model_name
    
    # Prioritise the official CarModel name if we have an ID
    if car_model_id:
        from app.models import CarModel
        cm = CarModel.query.get(car_model_id)
        if cm:
            search_name = cm.name
            
    # Also find car_model_id from name if missing (vital for legacy logs)
    if not car_model_id and search_name:
        from app.models import CarModel
        cm = CarModel.query.filter(CarModel.name.ilike(search_name)).first()
        if cm:
            car_model_id = cm.id
            search_name = cm.name

    service = MasterDataDBService()
    # Fetch BOM using the official name derived from the ID for 100% accuracy
    bom = service.get_by_model(search_name) if search_name else []

    
    # 2. Fetch Demand/Quantity to calculate targets if not in log
    demand = None
    if car_model_id:
        from app.models import Demand
        demand = Demand.query.filter_by(model_id=car_model_id).order_by(Demand.id.desc()).first()
    
    quantity = demand.quantity if demand else 0
    
    # 3. Format BOM into the structure the frontend expects
    merged_data = []
    log_rows = log_entry.log_data if isinstance(log_entry.log_data, list) else []
    
    # Index by SAP Part Number or Part Number for better matching (Case-Insensitive)
    log_by_sap = {}
    log_by_part = {}
    for r in log_rows:
        if not isinstance(r, dict): continue
        sap = str(r.get('SAP PART NUMBER') or r.get('SAP PART #') or r.get('sap_part_number') or '').strip().upper()
        if sap: log_by_sap[sap] = r
        part = str(r.get('PART NUMBER') or r.get('part_number') or '').strip().upper()
        if part: log_by_part[part] = r

    for idx, item in enumerate(bom):
        # Base data from Master Data
        common = item.get('common', {})
        prod = item.get('production_data', {})
        mat = item.get('material_data', {})
        
        sap = str(common.get('sap_part_number', '')).strip().upper()
        part = str(common.get('part_number', '')).strip().upper()
        
        # Calculate expected target (Usage * Quantity)
        # Check multiple usage keys: 'usage', 'USAGE', 'Usage', 'USG'
        raw_usage = prod.get('usage') or prod.get('Usage') or prod.get('USAGE') or prod.get('USG') or '1'
        try:
            usage = float(str(raw_usage).replace(',', '').strip() or '1')
        except:
            usage = 1.0
            
        # Initialize Target Qty from Demand quantity * Usage, but keep as string for consistency
        default_target = str(int(usage * quantity)) if quantity > 0 else "0"
        
        row = {
            "id": 10000 + idx,
            "PART NUMBER": common.get('part_number', ''),
            "SAP PART NUMBER": common.get('sap_part_number', ''),
            "PART DESCRIPTION": common.get('description', ''),
            "SALEABLE NO": common.get('saleable_no', ''),
            "ASSEMBLY NUMBER": common.get('assembly_number', ''),
            "Target Qty": default_target,
            "Today Produced": "0",
            "Remain Qty": default_target,
            "Production Status": "PENDING",
            "row_status": None,
            "rejection_reason": None
        }
        
        # Add all other prod/mat headers
        row.update(prod)
        row.update(mat)
        
        # 4. OVERWRITE with data from log if match found
        match = None
        if sap in log_by_sap: match = log_by_sap[sap]
        elif part in log_by_part: match = log_by_part[part]
        
        if match:
            # ---- Restore DEO-entered fields from the saved log ----
            # NOTE: PER DAY, TOTAL SCHEDULE QTY, Coverage Days are COMPUTED
            # from the demand — they must NOT be restored from old log data
            deo_fields = [
                "SAP Stock", "Opening Stock", "Todays Stock",
                "Target Qty", "Today Produced", "Remain Qty",
                "Balance Qty", "Production Status", "Defect Count",
                "Failure Reason", "Remarks",
                "row_status", "rejection_reason", "supervisor_reviewed"
            ]
            for field in deo_fields:
                if field in match and match[field] is not None:
                    row[field] = match[field]
            
            # Always recalculate Remain Qty from Target - Produced
            try:
                t = float(str(row.get("Target Qty", "0")).replace(',', '').strip() or '0')
                p = float(str(row.get("Today Produced", "0")).replace(',', '').strip() or '0')
                row["Remain Qty"] = str(int(max(0, t - p)))
            except Exception as e:
                print(f"Error recalculating remain: {e}")
                log_remain = match.get("Remain Qty") or match.get("Balance Qty")
                if log_remain is not None:
                    row["Remain Qty"] = str(log_remain)

            # Keep log's ID if consistent
            if "id" in match: row["id"] = match["id"]
            
            # Mark that we matched this row so we can identify ad-hoc rows later
            match["_matched"] = True
            
        merged_data.append(row)
    
    # 5. [DEPRECATED] We no longer append unmatched log rows to ensure 100% sync with Admin BOM.
    # If a part isn't in Master Data, it shouldn't be in the production table.
    
    return merged_data


# --- Car Models ---
@production_bp.route('/car-models', methods=['GET'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Manager', 'Admin'])
def get_car_models():
    # Use a subquery or grouping to return ONLY unique model names
    # This prevents duplicates in dropdowns when models are cloned for new demands
    from sqlalchemy import func
    
    # Subquery to get the latest ID for each unique model name
    latest_ids = db.session.query(func.max(CarModel.id)).group_by(CarModel.name).all()
    latest_ids = [id_tuple[0] for id_tuple in latest_ids]
    
    models = CarModel.query.filter(CarModel.id.in_(latest_ids)).order_by(CarModel.name.asc()).all()
    return jsonify([m.to_dict() for m in models])

@production_bp.route('/car-models', methods=['POST'])
@jwt_required()
@role_required(['Manager', 'Admin'])
def create_car_model():
    data = request.json
    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Name is required"}), 400
    
    new_model = CarModel(
        name=data['name'],
        model_code=data.get('model_code'),
        type=data.get('type')
    )
    db.session.add(new_model)
    db.session.commit()
    log_audit("CREATE_MODEL")
    return jsonify({"success": True, "message": "Car Model created", "data": new_model.to_dict()}), 201

@production_bp.route('/car-models/<int:model_id>/ready', methods=['PATCH'])
@jwt_required()
@role_required(['Manager', 'Admin'])
def mark_model_ready(model_id):
    model = CarModel.query.get(model_id)
    if not model:
        return jsonify({"success": False, "message": "Car Model not found"}), 404
    
    model.status = 'READY'
    db.session.commit()
    log_audit("MARK_MODEL_READY", f"Model {model.name} marked ready for assignment")
    return jsonify({"success": True, "message": f"Model {model.name} is now ready for assignment", "data": model.to_dict()})

# --- Demands ---
@production_bp.route('/demands', methods=['GET'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Manager', 'Admin'])
def get_demands():
    manager_filter = request.args.get('manager')
    if manager_filter:
        demands = Demand.query.filter(Demand.manager.ilike(manager_filter)).order_by(Demand.id.desc()).all()
    else:
        demands = Demand.query.order_by(Demand.id.desc()).all()
    return jsonify([d.to_dict() for d in demands])

@production_bp.route('/demands/<int:id>', methods=['GET'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Manager', 'Admin'])
def get_single_demand(id):
    demand = Demand.query.get(id)
    if not demand:
        return jsonify({"success": False, "message": "Demand not found"}), 404
    return jsonify(demand.to_dict())
@production_bp.route('/demands', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Manager', 'Admin'])
def create_demand():
    data = request.json
    model_name = data.get('model_name') or data.get('model_id')
    if not data or not model_name or not data.get('quantity'):
        return jsonify({"success": False, "message": "Model and Quantity are required"}), 400
    
    # Generate unique formatted_id if not provided
    from sqlalchemy import func
    max_id = db.session.query(func.max(Demand.id)).scalar() or 0
    next_id = max_id + 1
    formatted_id = data.get('formatted_id', f"DEM-{next_id:03d}")
    
    # Ensure unique formatted_id
    while Demand.query.filter_by(formatted_id=formatted_id).first():
        next_id += 1
        formatted_id = f"DEM-{next_id:03d}"

    # ALWAYS create a fresh, unassigned CarModel clone for each new demand
    # This ensures every demand gets its own independent assignment lifecycle
    import time as time_module
    model_name_str = str(model_name).upper().strip()
    new_model = CarModel(
        name=model_name_str,
        model_code=f"{model_name_str[:3]}-{str(int(time_module.time()))[-4:]}",
        type='Standard',
        status='PENDING'
    )
    db.session.add(new_model)
    db.session.flush()  # Get the new ID

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
        status=data.get('status', 'PENDING')
    )
    db.session.add(new_demand)
    db.session.commit()
    log_audit("CREATE_DEMAND")
    return jsonify({"success": True, "message": "Demand created", "data": new_demand.to_dict()}), 201

@production_bp.route('/demands/<int:id>', methods=['PUT', 'PATCH'])
@jwt_required()
@role_required(['Supervisor', 'Manager', 'Admin'])
def update_demand(id):
    demand = Demand.query.get(id)
    if not demand:
        return jsonify({"success": False, "message": "Demand not found"}), 404
    
    data = request.json or {}
    if 'quantity' in data: demand.quantity = data['quantity']
    if 'status' in data: demand.status = data['status']
    if 'line' in data: demand.line = data['line']
    if 'manager' in data: demand.manager = data['manager']
    if 'customer' in data: demand.customer = data['customer']
    if 'start_date' in data: demand.start_date = data['start_date']
    if 'end_date' in data: demand.end_date = data['end_date']
    if 'model_name' in data: demand.model_name = data['model_name']
    
    if data.get('supervisor_id') and demand.model_id:
        car_model = CarModel.query.get(demand.model_id)
        if car_model:
            car_model.supervisor_id = data.get('supervisor_id')

    db.session.commit()
    log_audit("UPDATE_DEMAND")
    return jsonify({"success": True, "message": "Demand updated", "data": demand.to_dict()})

@production_bp.route('/demands/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['Manager', 'Admin'])
def delete_demand(id):
    from app.models import DailyProductionLog, DailyWorkStatus, CarModel
    demand = Demand.query.get(id)
    if not demand:
        return jsonify({"success": False, "message": "Demand not found"}), 404
    
    model_id = demand.model_id
    
    # 1. Delete ONLY associated DailyProductionLog entries for THIS demand
    DailyProductionLog.query.filter_by(demand_id=id).delete()
    
    # 2. Delete the Demand itself
    db.session.delete(demand)
    db.session.flush()
    
    # 3. Delete the uniquely-cloned CarModel for this demand
    # This removes the model from DEO/Supervisor's view instantly
    if model_id:
        model = CarModel.query.get(model_id)
        if model:
            db.session.delete(model)
    
    db.session.commit()
    log_audit("DELETE_DEMAND", f"Demand and its associated CarModel ({model_id}) deleted")
    
    return jsonify({"success": True, "message": "Demand and all associated data deleted successfully"})


@production_bp.route('/assigned-work', methods=['GET'])
@jwt_required()
def get_assigned_work():
    from app.models import CarModel, Demand, User, DailyProductionLog
    from datetime import date
    from sqlalchemy import exists
    
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    today = date.today()
    
    if user.role == 'DEO':
        # DEO sees all models they are assigned to
        models = CarModel.query.filter(CarModel.assigned_deo_id == user.id).all()
    elif user.role == 'Supervisor':
        # Supervisor sees all models they are assigned to
        models = CarModel.query.filter(CarModel.supervisor_id == user.id).all()
    else:
        # Others (Admin/Manager) see all models
        models = CarModel.query.all()
        
    data = []
    for m in models:
        m_dict = m.to_dict()
        
        # Fetch today's production stats from DailyWorkStatus
        stats = DailyWorkStatus.query.filter_by(car_model_id=m.id, date=today).first()
        m_dict['planned_qty'] = stats.planned_qty if stats else 0
        m_dict['actual_qty'] = stats.actual_qty if stats else 0

        # Fetch active demand for this model
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
            m_dict['deo_email'] = f"{m.deo.username.lower()}@gmail.com" if m.deo else None
            m_dict['demand_id'] = active_demand.id
            m_dict['start_date'] = active_demand.start_date
            m_dict['end_date'] = active_demand.end_date

        # Authoritative check for today's submission
        query = DailyProductionLog.query.filter(
            DailyProductionLog.car_model_id == m.id,
            DailyProductionLog.deo_id == (user.id if user.role == 'DEO' else m.assigned_deo_id),
            DailyProductionLog.status.in_(['PENDING', 'SUBMITTED', 'VERIFIED']),
            DailyProductionLog.created_at >= today
        )
        
        if active_demand:
            query = query.filter(DailyProductionLog.demand_id == active_demand.id)
            
        submitted = query.first()
        m_dict['is_submitted_today'] = submitted is not None
        
        # Add verification date for completed models
        if m.status in ['COMPLETED', 'VERIFIED']:
            latest_log = DailyProductionLog.query.filter_by(car_model_id=m.id).order_by(DailyProductionLog.id.desc()).first()
            if latest_log:
                m_dict['verified_at'] = latest_log.date.isoformat() if latest_log.date else None
                m_dict['supervisor_comment'] = latest_log.supervisor_comment

        data.append(m_dict)


    return jsonify({
        "success": True,
        "role": user.role,
        "data": data
    })

@production_bp.route('/assigned-work/<int:fake_id>', methods=['PUT'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Manager', 'Admin'])
def update_assigned_work_cell(fake_id):
    """
    Live-sync endpoint for individual cell edits.
    Uses fake_id (10000 + index) to identify the BOM row.
    """
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    data = request.json or {}
    
    car_model_id = data.get('car_model_id')
    demand_id = data.get('demand_id')
    
    if not car_model_id:
        return jsonify({"success": False, "message": "car_model_id is required for sync"}), 400
        
    # 1. Identify valid row index
    row_index = fake_id - 10000
    if row_index < 0:
        return jsonify({"success": False, "message": "Invalid sync ID"}), 400
        
    # 2. Find or Create today's DailyProductionLog
    from datetime import datetime, time
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    
    log = DailyProductionLog.query.filter(
        DailyProductionLog.car_model_id == car_model_id,
        DailyProductionLog.deo_id == user.id,
        DailyProductionLog.created_at >= today_start
    )
    if demand_id:
        log = log.filter(DailyProductionLog.demand_id == demand_id)
        
    log = log.order_by(DailyProductionLog.created_at.desc()).first()
    
    if not log:
        # Create initial log from BOM
        from app.services.db_service import MasterDataDBService
        cm = CarModel.query.get(car_model_id)
        if not cm:
            return jsonify({"success": False, "message": "Car Model not found"}), 404
            
        service = MasterDataDBService()
        bom = service.get_by_model(cm.name)
        
        # Initial empty log structure
        log_data = []
        for idx, item in enumerate(bom):
            common = item.get('common', {})
            row = {
                "id": 10000 + idx,
                "PART NUMBER": common.get('part_number', ''),
                "SAP PART NUMBER": common.get('sap_part_number', ''),
                "PART DESCRIPTION": common.get('description', ''),
                "Target Qty": "0",
                "Today Produced": "0",
                "Remain Qty": "0",
                "SAP Stock": "0",
                "Opening Stock": "0",
                "Todays Stock": "0",
                "Production Status": "PENDING"
            }
            log_data.append(row)
            
        log = DailyProductionLog(
            car_model_id=car_model_id,
            demand_id=demand_id,
            deo_id=user.id,
            model_name=cm.name,
            log_data=log_data,
            status='DRAFT'
        )
        db.session.add(log)
        db.session.flush() # Get log id
    
    # 3. Update the specific cell
    log_data = list(log.log_data)
    if row_index < len(log_data):
        # Update fields passed in data (excluding car_model_id/demand_id)
        for key, val in data.items():
            if key not in ['car_model_id', 'demand_id']:
                log_data[row_index][key] = val
        
        # Trigger JSON update
        from sqlalchemy.orm.attributes import flag_modified
        log.log_data = log_data
        flag_modified(log, "log_data")
        db.session.commit()
        return jsonify({"success": True, "message": "Cell synced successfully"})
    else:
        return jsonify({"success": False, "message": "Row index out of bounds"}), 400

@production_bp.route('/assigned-work/<int:id>/assign', methods=['PUT'])
@jwt_required()
@role_required(['Supervisor', 'Manager', 'Admin'])
def assign_deo_to_work(id):
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    model = CarModel.query.get(id)
    
    if not model:
        return jsonify({"success": False, "message": "Model not found"}), 404
        
    # Check if this supervisor is actually assigned to this model (unless Admin)
    if user.role in ['Supervisor', 'Manager'] and model.supervisor_id != user.id:
        return jsonify({"success": False, "message": "You are not authorized to assign DEOs to this model"}), 403
        
    data = request.json
    if 'assigned_deo_id' in data:
        model.assigned_deo_id = data.get('assigned_deo_id')
        model.deo_accepted = False # reset acceptance status
        
    db.session.commit()
    log_audit("SUPERVISOR_ASSIGNED_DEO")
    return jsonify({"success": True, "message": "DEO Assigned successfully", "data": model.to_dict()})

@production_bp.route('/assigned-work/accept/<int:id>', methods=['POST'])
@jwt_required()
@role_required(['DEO'])
def accept_assignment(id):
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    model = CarModel.query.get(id)
    if not model:
        return jsonify({"success": False, "message": "Model not found"}), 404
    if model.assigned_deo_id != user.id:
        return jsonify({"success": False, "message": "Not assigned to you"}), 403
    
    model.deo_accepted = True
    model.status = 'IN_PROGRESS'
    db.session.commit()
    log_audit("ACCEPT_ASSIGNMENT")
    return jsonify({"success": True, "message": "Assignment accepted"})

@production_bp.route('/daily-status', methods=['GET'])
@jwt_required()
def get_daily_status():
    from datetime import date
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    today = date.today()
    
    from sqlalchemy import exists
    # Get status for today for models associated with user that still have demands
    base_query = DailyWorkStatus.query.filter(
        DailyWorkStatus.date == today,
        exists().where(Demand.model_id == DailyWorkStatus.car_model_id)
    )
    
    if user.role == 'DEO':
        statuses = base_query.filter_by(deo_id=user.id).all()
    elif user.role == 'Supervisor':
        statuses = base_query.filter_by(supervisor_id=user.id).all()
    else:
        statuses = base_query.all()
        
    return jsonify({
        "success": True, 
        "data": [s.to_dict() for s in statuses]
    })

@production_bp.route('/daily-status/mark-done', methods=['POST'])
@jwt_required()
@role_required(['DEO'])
def mark_work_done():
    from datetime import date
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    data = request.json
    model_id = data.get('car_model_id')
    
    if not model_id:
        return jsonify({"success": False, "message": "Model ID required"}), 400
        
    today = date.today()
    status_entry = DailyWorkStatus.query.filter_by(date=today, car_model_id=model_id, deo_id=user.id).first()
    
    if not status_entry:
        status_entry = DailyWorkStatus(
            date=today,
            car_model_id=model_id,
            deo_id=user.id,
            status='DONE'
        )
        db.session.add(status_entry)
    else:
        status_entry.status = 'DONE'
        
    db.session.commit()
    log_audit("MARK_DAILY_DONE")
    return jsonify({"success": True, "message": "Work marked as done", "data": status_entry.to_dict()})

@production_bp.route('/daily-status/verify', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Admin'])
def verify_work():
    from datetime import datetime, date
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    data = request.json
    status_id = data.get('status_id')
    
    if not status_id:
        return jsonify({"success": False, "message": "Status ID required"}), 400
        
    status_entry = DailyWorkStatus.query.get(status_id)
    if not status_entry:
        return jsonify({"success": False, "message": "Status entry not found"}), 404
        
    status_entry.status = 'VERIFIED'
    status_entry.supervisor_id = user.id
    status_entry.verified_at = datetime.utcnow()
    
    db.session.commit()
    log_audit("VERIFY_DAILY_WORK")
    return jsonify({"success": True, "message": "Work verified", "data": status_entry.to_dict()})

@production_bp.route('/daily-logs', methods=['POST'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Manager', 'Admin'])
def submit_daily_log():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    data = request.json
    
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400
        
    model_name = data.get('model_name')
    car_model_id = data.get('car_model_id')
    demand_id = data.get('demand_id')
    log_data = data.get('log_data')
    
    if not model_name or not log_data:
        return jsonify({"success": False, "message": "Model name and Log data required"}), 400
    
    # Ensure model_name matches official CarModel name for consistency if ID is present
    if car_model_id:
        from app.models import CarModel
        cm = CarModel.query.get(car_model_id)
        if cm:
            model_name = cm.name
    
    # print(f"DEBUG: submit_daily_log received data: model={model_name}, car_model_id={car_model_id}, demand_id={demand_id}, is_final={data.get('is_final')}")

    
    # Check if a log for this specific demand/deo already exists
    # We prioritse demand_id for unique matching
    from datetime import datetime
    
    # If Supervisor is saving, they should be able to specify which DEO log they are editing
    target_deo_id = data.get('deo_id') or user.id
    
    query = DailyProductionLog.query.filter(DailyProductionLog.deo_id == target_deo_id)
    if demand_id:
        query = query.filter(DailyProductionLog.demand_id == demand_id)
    else:
        # Fallback to model/date for legacy support
        from datetime import time
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        query = query.filter(DailyProductionLog.model_name == model_name, DailyProductionLog.created_at >= today_start)

    existing_log = query.order_by(DailyProductionLog.created_at.desc()).first()
    
    is_final = data.get('is_final', False)
    log_status = 'SUBMITTED' if is_final else 'DRAFT'

    
    if existing_log:
        # Ensure car_model_id is updated if missing
        if car_model_id and not existing_log.car_model_id:
            existing_log.car_model_id = car_model_id
        
        merged_data = []
        if existing_log.log_data:
            existing_rows = {str(r.get('id', idx)): r for idx, r in enumerate(existing_log.log_data)}
        else:
            existing_rows = {}
            
        for idx, new_row in enumerate(log_data):
            row_id = str(new_row.get('id', idx))
            if row_id in existing_rows:
                old_row = existing_rows[row_id]
                # Protect VERIFIED rows unless DEO actively changed target quantities / produced output
                if old_row.get('row_status') == 'VERIFIED':
                    old_prod = str(old_row.get('Today Produced', '')).strip() or "0"
                    new_prod = str(new_row.get('Today Produced', '')).strip() or "0"
                    old_row_status = str(old_row.get('Production Status', '')).strip()
                    new_row_status = str(new_row.get('Production Status', '')).strip()
                    
                    if old_prod != new_prod or old_row_status != new_row_status:
                         # DEO actively modified it, mark as SUBMITTED for re-review
                         new_row['row_status'] = 'SUBMITTED'
                         merged_data.append(new_row)
                    else:
                         # Keep old VERIFIED row intact
                         merged_data.append(old_row)
                else:
                    # Row exists but is NOT verified (e.g. SUBMITTED or PENDING)
                    # Just take the new data from the frontend
                    merged_data.append(new_row)
            else:
                # Completely new row (not in existing_log.log_data)
                merged_data.append(new_row)
        
        existing_log.log_data = merged_data
        # Only upgrade status to SUBMITTED, never downgrade
        if log_status == 'SUBMITTED' or existing_log.status == 'DRAFT':
            existing_log.status = log_status

        # Flag modified for SQLAlchemy JSON
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(existing_log, "log_data")
        
        existing_log.created_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"success": True, "message": "Daily log updated successfully", "data": existing_log.to_dict()})

        
    # NEW LOG: Ensure all rows start with a clean status to prevent carry-over from previous days
    cleaned_log_data = []
    for r in log_data:
        if isinstance(r, dict):
            new_r = r.copy()
            new_r['row_status'] = None
            new_r['rejection_reason'] = None
            new_r['supervisor_reviewed'] = False
            cleaned_log_data.append(new_r)
        else:
            cleaned_log_data.append(r)

    new_log = DailyProductionLog(
        car_model_id=car_model_id,
        demand_id=demand_id,
        deo_id=target_deo_id,
        model_name=model_name,
        log_data=cleaned_log_data,
        status=log_status
    )
    db.session.add(new_log)
    db.session.commit()

    log_audit("SUBMIT_DAILY_LOG")
    return jsonify({"success": True, "message": "Daily log submitted for verification", "data": new_log.to_dict()}), 201

@production_bp.route('/daily-logs', methods=['GET'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Manager', 'Admin'])
def get_user_submissions():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    # DEO should see their own history regardless of demand existence (for audit/state sync)
    submissions = DailyProductionLog.query.filter_by(deo_id=user.id).order_by(DailyProductionLog.created_at.desc()).all()
    
    data = []
    for s in submissions:
        d = s.to_dict()
        
        # Merge with Master Data to ensure all components are visible (e.g. 388 rows)
        merged_log_entries = get_merged_log_data(s)
        d['log_data'] = merged_log_entries
        
        # Calculate total requirements from the merged data
        try:
            d['formatted_id'] = 'DEM-001' # Fallback
            if s.car_model_id:
                # Get vehicle target from associated demand
                demand = Demand.query.filter_by(model_id=s.car_model_id).order_by(Demand.id.desc()).first()
                if demand:
                    d['target_vehicles'] = demand.quantity
                    d['formatted_id'] = demand.formatted_id or f"DEM-{demand.id:03d}"
            
            d['total_requirements'] = sum(float(str(r.get('Target Qty', 0)).replace(',', '')) for r in merged_log_entries if isinstance(r, dict))
            d['total_unique_parts'] = len(merged_log_entries)
        except Exception as e:
            print(f"Error calculating user log totals: {e}")
            d['target_vehicles'] = 0
            d['total_requirements'] = 0
            d['total_unique_parts'] = len(merged_log_entries)
            
        data.append(d)


    return jsonify({
        "success": True,
        "data": data
    })

@production_bp.route('/supervisor/submissions', methods=['GET'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def get_supervisor_submissions():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
        
    # Use a subquery to find models that HAVE a demand
    demand_model_ids = [d.model_id for d in Demand.query.all()]
    query = DailyProductionLog.query.filter(
        DailyProductionLog.status.in_(['SUBMITTED', 'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED']),
        DailyProductionLog.car_model_id.in_(demand_model_ids)
    )
    
    if user.role == 'Supervisor':
        # ONLY show logs for models assigned to THIS supervisor
        assigned_model_ids = [m.id for m in CarModel.query.filter_by(supervisor_id=user.id).all()]
        query = query.filter(DailyProductionLog.car_model_id.in_(assigned_model_ids))
    
    submissions = query.order_by(DailyProductionLog.created_at.desc()).all()
    
    data = []
    for s in submissions:
        d = s.to_dict()
        
        # Merge with Master Data to ensure all components are visible (e.g. 388 rows)
        merged_log_entries = get_merged_log_data(s)
        
        # Calculate total requirements from the merged data
        try:
            d['formatted_id'] = 'DEM-001' # Fallback
            if s.demand_id:
                demand = Demand.query.get(s.demand_id)
            elif s.car_model_id:
                # Fallback for legacy logs
                demand = Demand.query.filter_by(model_id=s.car_model_id).order_by(Demand.id.desc()).first()
            else:
                demand = None

            if demand:
                d['target_vehicles'] = demand.quantity
                d['formatted_id'] = demand.formatted_id or f"DEM-{demand.id:03d}"
                
                # ---- Compute PER DAY and Coverage Days from the demand ----
                req_qty = demand.quantity or 0
                working_days = 0
                if demand.start_date and demand.end_date:
                    from datetime import datetime, timedelta
                    try:
                        start = datetime.strptime(demand.start_date, '%Y-%m-%d')
                        end = datetime.strptime(demand.end_date, '%Y-%m-%d')
                        current = start
                        while current <= end:
                            if current.weekday() != 6:  # Sunday = 6
                                working_days += 1
                            current += timedelta(days=1)
                    except Exception as e:
                        print(f"Error calculating working days: {e}")
                
                if working_days == 0:
                    working_days = 25
                
                per_day = round(req_qty / working_days, 2) if req_qty > 0 else 0
                
                for row in merged_log_entries:
                    if isinstance(row, dict):
                        row['PER DAY'] = str(per_day)
                        row['TOTAL SCHEDULE QTY'] = str(req_qty)
                        todays_stock = 0
                        try:
                            todays_stock = float(str(row.get('Todays Stock', '0')).replace(',', '').strip() or '0')
                        except:
                            pass
                        row['Coverage Days'] = str(round(todays_stock / per_day, 1)) if per_day > 0 else '0.0'
            else:
                # Last resort fallback to CarModel if demand not found
                model = CarModel.query.get(s.car_model_id) if s.car_model_id else None
                d['target_vehicles'] = model.target_vehicles if model else 0

            d['log_data'] = merged_log_entries
            d['total_requirements'] = sum(float(str(r.get('Target Qty', 0)).replace(',', '')) for r in merged_log_entries if isinstance(r, dict))
            d['total_unique_parts'] = len(merged_log_entries)
        except Exception as e:
            print(f"Error calculating supervisor log totals: {e}")
            d['log_data'] = merged_log_entries
            d['target_vehicles'] = 0
            d['total_requirements'] = 0
            d['total_unique_parts'] = len(merged_log_entries)
            
        data.append(d)

    return jsonify({
        "success": True,
        "data": data
    })

@production_bp.route('/daily-logs/verify', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def verify_daily_log():
    data = request.json
    log_id = data.get('log_id')
    status = data.get('status') # APPROVED or REJECTED
    comment = data.get('comment', '')
    
    if not log_id or not status:
        return jsonify({"success": False, "message": "Log ID and Status required"}), 400
        
    log_entry = DailyProductionLog.query.get(log_id)
    if not log_entry:
        return jsonify({"success": False, "message": "Log entry not found"}), 404
        
    log_entry.status = status
    log_entry.supervisor_comment = comment
    
    # If APPROVED, mark all individual rows as VERIFIED as well
    if status == 'APPROVED' and log_entry.log_data:
        log_data = list(log_entry.log_data)
        for row in log_data:
            if isinstance(row, dict):
                row['row_status'] = 'VERIFIED'
                row['supervisor_reviewed'] = True
        log_entry.log_data = log_data
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(log_entry, "log_data")

    db.session.commit()
    log_audit(f"VERIFY_LOG_{status}")
    return jsonify({"success": True, "message": f"Log {status.lower()} successfully"})

@production_bp.route('/daily-logs/verify-row', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def verify_daily_log_row():
    data = request.json
    log_id = data.get('log_id')
    row_index = data.get('row_index')
    status = data.get('status') # VERIFIED or REJECTED
    reason = data.get('reason', '')
    
    if log_id is None or row_index is None or not status:
        return jsonify({"success": False, "message": "Log ID, Row Index, and Status required"}), 400
        
    log_entry = DailyProductionLog.query.get(log_id)
    if not log_entry:
        return jsonify({"success": False, "message": "Log entry not found"}), 404
        
    try:
        row_index = int(row_index)
        log_data = list(log_entry.log_data)
        sap_part_number = data.get('sap_part_number')
        
        target_row = None
        # 1. Try to find by SAP Part Number for robust matching across merged/unmerged views
        if sap_part_number:
            sap_clean = str(sap_part_number).strip().upper()
            for r in log_data:
                r_sap = str(r.get('SAP PART NUMBER') or r.get('SAP PART #') or r.get('sap_part_number') or '').strip().upper()
                if r_sap == sap_clean:
                    target_row = r
                    break
        
        # 2. Fallback to index if SAP match fails
        if not target_row and 0 <= row_index < len(log_data):
            target_row = log_data[row_index]
            
        if target_row:
            target_row['row_status'] = status
            target_row['rejection_reason'] = reason if status == 'REJECTED' else ''
            # Mark as reviewed so future auto-corrections from DEO can be auto-verified
            target_row['supervisor_reviewed'] = True
            
            # Re-assign to trigger SQLAlchemy JSON update
            from sqlalchemy.orm.attributes import flag_modified
            log_entry.log_data = log_data
            flag_modified(log_entry, "log_data")
            db.session.commit()
            return jsonify({"success": True, "message": f"Row '{sap_part_number or row_index + 1}' {status.lower()}"})
        else:
            return jsonify({"success": False, "message": "Row not found by SAP Number or Index"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@production_bp.route('/daily-logs/deo-update-row', methods=['POST'])
@jwt_required()
@role_required(['DEO'])
def deo_update_daily_log_row():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    data = request.json
    
    log_id = data.get('log_id')
    row_index = data.get('row_index')
    updated_row_data = data.get('updated_row_data')
    
    if log_id is None or row_index is None or not updated_row_data:
        return jsonify({"success": False, "message": "Log ID, Row Index, and Updated Data required"}), 400
        
    log_entry = DailyProductionLog.query.get(log_id)
    if not log_entry:
        return jsonify({"success": False, "message": "Log entry not found"}), 404
        
    if log_entry.deo_id != user.id:
        return jsonify({"success": False, "message": "Not authorized to update this log"}), 403
        
    try:
        row_index = int(row_index)
        log_data = list(log_entry.log_data)
        sap_part_number = updated_row_data.get('SAP PART NUMBER') or updated_row_data.get('SAP PART #') or updated_row_data.get('sap_part_number')
        
        target_row = None
        # 1. Try to find by SAP Part Number
        if sap_part_number:
            sap_clean = str(sap_part_number).strip().upper()
            for r in log_data:
                r_sap = str(r.get('SAP PART NUMBER') or r.get('SAP PART #') or r.get('sap_part_number') or '').strip().upper()
                if r_sap == sap_clean:
                    target_row = r
                    break
                    
        # 2. Fallback to index
        if not target_row and 0 <= row_index < len(log_data):
            target_row = log_data[row_index]
            
        if target_row:
            # Update data
            target_row.update(updated_row_data)
            
            # Auto-verification logic
            produced_key = next((k for k in target_row.keys() if 'PRODUCED' in k.upper()), None)
            target_key = next((k for k in target_row.keys() if 'TARGET' in k.upper()), None)
            
            if produced_key and target_key:
                try:
                    produced = int(target_row[produced_key] or 0)
                    target = int(target_row[target_key] or 0)
                    
                    is_completed = produced >= target and target > 0
                    was_reviewed = target_row.get('supervisor_reviewed') == True
                    
                    if is_completed:
                        if was_reviewed:
                            target_row['row_status'] = 'VERIFIED'
                        else:
                            target_row['row_status'] = 'PENDING' # Needs first manual review
                        
                        target_row['rejection_reason'] = ''
                        remain_key = next((k for k in target_row.keys() if 'REMAIN' in k.upper()), None)
                        if remain_key:
                            target_row[remain_key] = str(max(0, target - produced))
                    else:
                        # Not completed, set to IN PROGRESS or PENDING
                        target_row['row_status'] = 'IN PROGRESS' if produced > 0 else 'PENDING'
                except ValueError:
                    pass
            
            # Re-assign for SQLAlchemy JSON update
            from sqlalchemy.orm.attributes import flag_modified
            log_entry.log_data = log_data
            flag_modified(log_entry, "log_data")
            db.session.commit()
            return jsonify({"success": True, "message": "Row updated successfully"})
        else:
            return jsonify({"success": False, "message": "Row not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@production_bp.route('/finalize-assignment/<int:id>', methods=['POST'])
@jwt_required()
@role_required(['DEO', 'Supervisor', 'Admin', 'Manager'])
def finalize_assignment(id):
    """
    Finalizes an assignment by:
    1. Setting CarModel status to 'READY'
    2. Setting the latest Demand status to 'COMPLETED'
    3. Setting today's DailyProductionLog status to 'VERIFIED'
    """
    model = CarModel.query.get(id)
    if not model:
        return jsonify({"success": False, "message": "Model not found"}), 404
    
    # 1. Update CarModel status
    model.status = 'COMPLETED'
    
    # 2. Update latest Demand status
    demand = Demand.query.filter_by(model_id=id).order_by(Demand.id.desc()).first()
    if demand:
        demand.status = 'COMPLETED'
    
    # 3. Update the latest non-finalized Production Log status
    logs = DailyProductionLog.query.filter(
        DailyProductionLog.car_model_id == id,
        DailyProductionLog.status.in_(['PENDING', 'SUBMITTED', 'DRAFT', 'REJECTED'])
    ).all()
    
    for log in logs:
        log.status = 'VERIFIED'
    
    db.session.commit()
    log_audit("FINALIZE_ASSIGNMENT")
    return jsonify({"success": True, "message": "Assignment finalized successfully", "status": "READY"})
