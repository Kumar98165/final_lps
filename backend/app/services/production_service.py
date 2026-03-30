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
            "Today Produced": "0",
            "Remain Qty": default_target,
            "Production Status": "PENDING",
            "row_status": None,
            "rejection_reason": None,
            "supervisor_reviewed": False
        }
        
        row.update(prod)
        row.update(mat)
        
        # 4. OVERWRITE with data from log
        match = None
        if sap in log_by_sap: match = log_by_sap[sap]
        elif part in log_by_part: match = log_by_part[part]
        
        if match:
            deo_fields = [
                "SAP Stock", "Opening Stock", "Todays Stock",
                "Target Qty", "Today Produced", "Remain Qty",
                "Balance Qty", "Production Status", "Defect Count",
                "Failure Reason", "Remarks", "PER DAY", "Per Day",
                "row_status", "rejection_reason", "supervisor_reviewed"
            ]
            for field in deo_fields:
                if field in match and match[field] is not None:
                    # Don't overwrite with 0 if we have a valid default target
                    val = str(match[field])
                    if field in ["PER DAY", "Per Day", "Target Qty"] and (val == "0" or not val) and row.get(field) != "0":
                        continue
                    row[field] = match[field]
            
            # Recalculate Remain Qty & Coverage Days
            try:
                # Prioritize PER DAY for coverage as it often contains part-specific usage rates
                t_val = row.get("PER DAY") or row.get("Per Day") or row.get("Target Qty", "0")
                t = float(str(t_val).replace(',', '').strip() or '0')
                p = float(str(row.get("Today Produced", "0")).replace(',', '').strip() or '0')
                s = float(str(row.get("Todays Stock", "0")).replace(',', '').strip() or '0')
                
                row["Remain Qty"] = str(int(max(0, t - p)))
                
                # Live Calculate Coverage Days in decimal format (130.0 etc)
                if t > 0:
                    row["Coverage Days"] = "{:.1f}".format(s / t)
                else:
                    row["Coverage Days"] = "0.0"
            except:
                pass

            if "id" in match: row["id"] = match["id"]
            
        merged_data.append(row)
    
    return merged_data

def sync_log_to_work_status(log):
    """
    Summarizes log_data and updates the DailyWorkStatus table for dashboard tracking.
    """
    total_actual = 0
    total_planned = 0
    
    log_data = list(log.log_data)
    for row in log_data:
        if isinstance(row, dict):
            try:
                produced = float(str(row.get('Today Produced', 0)).replace(',', '').strip() or 0)
                target = float(str(row.get('Target Qty', 0)).replace(',', '').strip() or 0)
                total_actual += produced
                total_planned += target
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
