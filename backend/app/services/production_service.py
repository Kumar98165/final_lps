# backend/app/services/production_service.py
from datetime import datetime
from app.models import db, MasterData, CarModel, Demand, DailyProductionLog, DailyWorkStatus
from app.services.db_service import MasterDataDBService

def get_merged_log_data(log_entry):
    """
    Merges historical log_data with current Master Data (BOM) to ensure
    all components (e.g. 388 rows) are visible, even if the log only captured a subset.
    """
    # 1. Fetch current Master Data BOM for this model
    car_model_id = log_entry.car_model_id
    search_name = log_entry.model_name
    
    # Prioritise the official CarModel name if we have an ID
    if car_model_id:
        cm = CarModel.query.get(car_model_id)
        if cm:
            search_name = cm.name
            
    # Also find car_model_id from name if missing (vital for legacy logs)
    if not car_model_id and search_name:
        cm = CarModel.query.filter(CarModel.name.ilike(search_name)).first()
        if cm:
            car_model_id = cm.id
            search_name = cm.name

    service = MasterDataDBService()
    bom = service.get_by_model(search_name) if search_name else []

    # 2. Fetch Demand/Quantity to calculate targets if not in log
    demand = None
    if car_model_id:
        demand = Demand.query.filter_by(model_id=car_model_id).order_by(Demand.id.desc()).first()
    
    quantity = demand.quantity if demand else 0
    
    # 3. Format BOM into the structure the frontend expects
    merged_data = []
    
    # Index by SAP Part Number or Part Number for better matching (Case-Insensitive)
    log_by_sap = {}
    log_by_part = {}
    for entry in log_entry.entries:
        sap = str(entry.sap_part_number or '').strip().upper()
        if sap: log_by_sap[sap] = entry
        part = str(entry.part_number or '').strip().upper()
        if part: log_by_part[part] = entry

    for idx, item in enumerate(bom):
        common = item.get('common', {})
        prod = item.get('production_data', {})
        mat = item.get('material_data', {})
        
        sap = str(common.get('sap_part_number', '')).strip().upper()
        part = str(common.get('part_number', '')).strip().upper()
        
        # Usage calculation
        raw_usage = prod.get('usage') or prod.get('Usage') or prod.get('USAGE') or prod.get('USG') or '1'
        try:
            usage = float(str(raw_usage).replace(',', '').strip() or '1')
        except:
            usage = 1.0
            
        default_target = str(round(usage * quantity, 2)) if quantity > 0 else "0"
        
        row = {
            "id": 10000 + idx,
            "PART NUMBER": common.get('part_number', ''),
            "SAP PART NUMBER": common.get('sap_part_number', ''),
            "PART DESCRIPTION": common.get('description', ''),
            "SALEABLE NO": common.get('saleable_no', ''),
            "ASSEMBLY NUMBER": common.get('assembly_number', ''),
            "Target Qty": default_target,
            "PER DAY": default_target,
            "Per Day": default_target,
            "SAP Stock": "0",
            "Opening Stock": "0",
            "Todays Stock": "0",
            "Remain Qty": default_target,
            "Production Status": "PENDING",
            "row_status": None,
            "rejection_reason": None,
            "deo_reply": None,
            "supervisor_reviewed": False
        }
        
        row.update(prod)
        row.update(mat)
        
        # 4. OVERWRITE with data from database entry
        match = None
        if sap in log_by_sap: match = log_by_sap[sap]
        elif part in log_by_part: match = log_by_part[part]
        
        if match:
            # Map object attributes back to the frontend dictionary format
            # Use non-destructive mapping for numeric fields (don't overwrite with 0 if BOM has data)
            match_data = {
                "SAP Stock": str(match.sap_stock),
                "Opening Stock": str(match.opening_stock),
                "Todays Stock": str(match.todays_stock),
                "Production Status": match.status,
                "row_status": match.row_status,
                "rejection_reason": match.rejection_reason,
                "deo_reply": match.deo_reply,
                "supervisor_reviewed": match.supervisor_reviewed,
                "id": match.id
            }
            
            # Only overwrite Target/Per Day if the DB value is > 0
            if match.per_day and match.per_day > 0:
                match_data["PER DAY"] = str(match.per_day)
                match_data["Per Day"] = str(match.per_day)
            
            row.update(match_data)
            
            if match.coverage_days:
                row["Coverage Days"] = str(match.coverage_days)
            
            # Live Calculate Coverage Days if not stored or if stock changed
            try:
                t = float(str(row.get("PER DAY", "0")).replace(',', '').strip() or '0')
                s = float(str(row.get("Todays Stock", "0")).replace(',', '').strip() or '0')
                if t > 0:
                    row["Coverage Days"] = "{:.1f}".format(s / t)
            except:
                pass

            # Keep the fake index id for URL routing; store real DB id separately
            # so the frontend can pass it as real_entry_id in the sync body
            row["id"] = 10000 + idx          # restore fake index
            row["_real_id"] = match.id       # real DB primary key
            
        merged_data.append(row)
    
    return merged_data


def sync_log_to_work_status(log):
    """
    Summarizes log_data and updates the DailyWorkStatus table for dashboard tracking.
    """
    total_actual = 0
    total_planned = 0
    
    for entry in log.entries:
        try:
            # Since Today Produced is removed, we measure actual as 1 per 'COMPLETE' status?
            # Or maybe the user just wants the planned qty tracked for now.
            target = float(entry.per_day or 0)
            total_planned += target
            if entry.status == 'COMPLETE' or entry.status == 'APPROVED':
                total_actual += target # Or some other metric
        except:
            pass
                
    work_status = DailyWorkStatus.query.filter_by(
        date=log.date,
        car_model_id=log.car_model_id,
        deo_id=log.deo_id
    ).first()

    if not work_status:
        work_status = DailyWorkStatus(
            date=log.date,
            car_model_id=log.car_model_id,
            deo_id=log.deo_id,
            status='PENDING'
        )
        db.session.add(work_status)

    work_status.actual_qty = int(total_actual)
    work_status.planned_qty = int(total_planned)
    
    # Update high-level status if finalized
    if log.status == 'SUBMITTED':
        work_status.status = 'DONE'
    elif log.status == 'APPROVED':
        work_status.status = 'VERIFIED'
        
    db.session.commit()
    return work_status
