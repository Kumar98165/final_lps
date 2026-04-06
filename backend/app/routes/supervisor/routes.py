# backend/app/routes/supervisor/routes.py
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from app.models import db, User, CarModel, Demand, DailyProductionLog, DailyWorkStatus, ProductionLine
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.middleware.auth_middleware import role_required
from app.utils.audit_logger import log_audit
from app.services.production_service import get_merged_log_data, sync_log_to_work_status
from sqlalchemy.orm.attributes import flag_modified

supervisor_bp = Blueprint('supervisor', __name__)

@supervisor_bp.route('/submissions', methods=['GET'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def get_submissions():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    
    # Build model ID list based on role and assignment
    if user.role == 'Admin':
        # Admins see everything
        assigned_model_ids = [m.id for m in CarModel.query.all()]
    else:
        # Supervisors and Managers: start with directly assigned models
        assigned_model_ids = [m.id for m in CarModel.query.filter_by(supervisor_id=user.id).all()]
        
        # Also include models from their assigned shop/line
        if user.shop and user.shop.strip():
            line = ProductionLine.query.filter(ProductionLine.name.ilike(f"%{user.shop}%")).first()
            if line:
                line_model_ids = [m.id for m in CarModel.query.filter_by(production_line_id=line.id).all()]
                assigned_model_ids = list(set(assigned_model_ids + line_model_ids))
        
        # FALLBACK: If still no models found (supervisor not yet linked to any model),
        # show all logs to avoid missing any DEO submissions
        if not assigned_model_ids:
            assigned_model_ids = [m.id for m in CarModel.query.all()]
    
    # Query logs for the resolved model list with all relevant statuses
    if assigned_model_ids:
        submissions = DailyProductionLog.query.filter(
            DailyProductionLog.car_model_id.in_(assigned_model_ids),
            DailyProductionLog.status.in_(['SUBMITTED', 'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'])
        ).order_by(DailyProductionLog.date.desc()).all()
    else:
        # No models exist at all — return empty
        submissions = []
    
    data = []
    for s in submissions:
        d = s.to_dict()
        d['log_data'] = get_merged_log_data(s)
        
        # Additional summary for the supervisor view
        d['total_unique_parts'] = len(d['log_data'])
        demand = Demand.query.get(s.demand_id) if s.demand_id else None
        d['target_vehicles'] = demand.quantity if demand else 0
        d['formatted_id'] = demand.formatted_id if demand else f"DEM-{s.demand_id:03d}" if s.demand_id else "DEM-000"
        
        if demand:
            d['manager_name'] = demand.manager
            d['customer_name'] = demand.customer
            d['manager_email'] = f"{demand.manager.lower().replace(' ', '.')}@gmail.com" if demand.manager else None
            d['customer_email'] = f"{demand.customer.lower().replace(' ', '.')}@gmail.com" if demand.customer else None
            d['supervisor_email'] = f"{user.username.lower()}@gmail.com"
            d['deo_email'] = f"{s.deo.username.lower()}@gmail.com" if s.deo else None
        
        data.append(d)
        
    return jsonify({"success": True, "data": data})

@supervisor_bp.route('/verify', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def verify_log():
    data = request.json or {}
    log_id = data.get('log_id')
    status = data.get('status') # APPROVED or REJECTED
    comment = data.get('comment', '')
    
    if not log_id or not status:
        return jsonify({"success": False, "message": "Log ID and Status required"}), 400
        
    log = DailyProductionLog.query.get(log_id)
    if not log:
        return jsonify({"success": False, "message": "Log entry not found"}), 404
        
    log.status = status
    log.supervisor_comment = comment
    
    # If approved, mark all individual rows as verified
    if status == 'APPROVED':
        for entry in log.entries:
            entry.status = 'VERIFIED'
            entry.supervisor_reviewed = True
        
        # Synchronize statuses for Admin/DEO views
        # 1. Update CarModel status (DEO Ready tab & Admin Assignment)
        if log.car_model_id:
            model = CarModel.query.get(log.car_model_id)
            if model:
                model.status = 'COMPLETED'
        
        # 2. Update Demand status (Admin Demand Management)
        if log.demand_id:
            demand = Demand.query.get(log.demand_id)
            if demand:
                demand.status = 'COMPLETED'

    db.session.commit()
    # Update summary table for Admin Dashboard immediately
    sync_log_to_work_status(log)
    
    log_audit(f"SUPERVISOR_VERIFY_{status}", f"Log {log_id} verified by {get_jwt_identity()}")
    return jsonify({"success": True, "message": f"Log {status.lower()} successfully"})

@supervisor_bp.route('/verify-row', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def verify_row():
    data = request.json or {}
    log_id = data.get('log_id')
    row_index = data.get('row_index')
    status = data.get('status') # VERIFIED or REJECTED
    reason = data.get('reason', '')
    
    if log_id is None or row_index is None or not status:
        return jsonify({"success": False, "message": "Log ID, row index, and status required"}), 400
        
    log = DailyProductionLog.query.get(log_id)
    if not log:
        return jsonify({"success": False, "message": "Log not found"}), 404
        
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
            entry.status = status
            entry.rejection_reason = reason if status == 'REJECTED' else None
            entry.supervisor_reviewed = True
            db.session.commit()
            return jsonify({"success": True})
    
    return jsonify({"success": False, "message": "Row index out of bounds"}), 400

@supervisor_bp.route('/assign-deo', methods=['PUT'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def assign_deo():
    data = request.json or {}
    model_id = data.get('model_id')
    deo_id = data.get('deo_id')
    
    if not model_id or not deo_id:
        return jsonify({"success": False, "message": "Model and DEO IDs required"}), 400
        
    model = CarModel.query.get(model_id)
    if not model:
        return jsonify({"success": False, "message": "Model not found"}), 404
        
    model.assigned_deo_id = deo_id
    model.deo_accepted = False
    db.session.commit()
    log_audit("SUPERVISOR_ASSIGNED_DEO", f"DEO {deo_id} assigned to model {model_id}")
    return jsonify({"success": True, "message": "DEO assigned successfully"})

@supervisor_bp.route('/finalize-assignment/<int:model_id>', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def finalize_assignment(model_id):
    """Marks a car model's assignment as VERIFIED/COMPLETED for the current demand."""
    model = CarModel.query.get(model_id)
    if not model:
        return jsonify({"success": False, "message": "Model not found"}), 404
    
    # 1. Mark the CarModel as COMPLETED (visible in Admin Assignments & DEO Ready tab)
    model.status = 'COMPLETED'
    
    # 2. Mark the most recent production log as APPROVED
    #    Look for any active log — SUBMITTED is the main state after DEO submits
    log = DailyProductionLog.query.filter_by(
        car_model_id=model_id
    ).filter(
        DailyProductionLog.status.in_(['SUBMITTED', 'PENDING', 'DRAFT', 'IN_PROGRESS'])
    ).order_by(DailyProductionLog.date.desc(), DailyProductionLog.id.desc()).first()
    
    # If no pending log found, try the most recently created log for today or overall
    if not log:
        log = DailyProductionLog.query.filter_by(
            car_model_id=model_id
        ).order_by(DailyProductionLog.date.desc(), DailyProductionLog.id.desc()).first()
    
    if log:
        log.status = 'APPROVED'
        # Mark all rows as verified
        for entry in log.entries:
            entry.status = 'VERIFIED'
            entry.supervisor_reviewed = True
        
        # 3. Mark the linked Demand as COMPLETED (visible in Admin Demand Management)
        if log.demand_id:
            demand = Demand.query.get(log.demand_id)
            if demand:
                demand.status = 'COMPLETED'
        
        # 4. Sync to DailyWorkStatus to update dashboard counts and high-level status
        # NOTE: sync_log_to_work_status does its own commit, so we commit main changes first
    
    db.session.commit()
    
    # Now sync the work status records (happens after main commit)
    if log:
        sync_log_to_work_status(log)
    
    log_audit("SUPERVISOR_FINALIZE_ASSIGNMENT", f"Model {model_id} finalized")
    return jsonify({"success": True, "message": "Assignment finalized successfully"})

@supervisor_bp.route('/update-log', methods=['POST'])
@jwt_required()
@role_required(['Supervisor', 'Admin', 'Manager'])
def update_log():
    """Allows supervisor to save a fully corrected version of a DEO's log before approving."""
    data = request.json or {}
    log_id = data.get('log_id')
    log_data = data.get('log_data')
    
    if not log_id or not log_data:
        # Check if we have identifiers for fallback log locating
        model_id = data.get('car_model_id')
        deo_id = data.get('deo_id')
        if model_id and deo_id:
            log = DailyProductionLog.query.filter_by(car_model_id=model_id, deo_id=deo_id, date=date.today()).first()
        else:
            return jsonify({"success": False, "message": "Log ID or Model/DEO pair required"}), 400
    else:
        log = DailyProductionLog.query.get(log_id)
        
    if not log:
        return jsonify({"success": False, "message": "Log not found"}), 404
        
    from app.models.models import DEOProductionEntry
    for row in log_data:
        sap = str(row.get('SAP PART NUMBER', '')).strip().upper()
        if not sap: continue
        
        # Robust case-insensitive lookup
        entry = DEOProductionEntry.query.filter(
            DEOProductionEntry.log_id == log.id,
            db.func.upper(db.func.trim(DEOProductionEntry.sap_part_number)) == sap
        ).first()
        
        if not entry:
            entry = DEOProductionEntry(log_id=log.id, sap_part_number=sap, date=log.date, car_model_id=log.car_model_id)
            db.session.add(entry)
            
        entry.sap_stock = row.get('SAP Stock', 0)
        entry.opening_stock = row.get('Opening Stock', 0)
        entry.todays_stock = row.get('Todays Stock', 0)
        entry.status = row.get('Production Status') or 'PENDING'
        entry.per_day = row.get('PER DAY') or row.get('Per Day') or 0
        if entry.per_day > 0: entry.coverage_days = round(float(entry.todays_stock) / float(entry.per_day), 1)

    db.session.commit()
    
    sync_log_to_work_status(log)
    return jsonify({"success": True, "message": "Log updated successfully"})
