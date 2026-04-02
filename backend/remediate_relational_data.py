import os
import sys
from sqlalchemy import text

# Add the current directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import MasterData, ProductionData, MaterialData
from app.services.db_service import MasterDataDBService

def remediate():
    app = create_app('dev')
    with app.app_context():
        print("[REMEDIATION] Starting deep relational cleanup and ID alignment...")
        
        # 1. Update Schema for new columns (Manually for Postgres)
        print("[REMEDIATION] Adding missing columns to production_data and material_data...")
        p_cols = [
            'rm_size', 'stock', 'total_disp', 'target_qty', 
            'today_produced', 'remain_qty', 'sn_no', 'row_status'
        ]
        for col in p_cols:
            try:
                db.session.execute(text(f"ALTER TABLE production_data ADD COLUMN IF NOT EXISTS {col} VARCHAR(100);"))
            except Exception as e: print(f"  - Warning adding {col}: {e}")
            
        m_cols = ['per_day', 'total_scheduled_qty']
        for col in m_cols:
            try:
                db.session.execute(text(f"ALTER TABLE material_data ADD COLUMN IF NOT EXISTS {col} VARCHAR(100);"))
            except Exception as e: print(f"  - Warning adding {col}: {e}")
        
        db.session.commit()
        
        # 2. Extract all existing relational data to memory
        print("[REMEDIATION] Fetching existing relational data...")
        existing_prod = {p.master_data_id: p.to_dict() for p in ProductionData.query.all()}
        existing_mat = {m.master_data_id: m.to_dict() for m in MaterialData.query.all()}
        
        # 3. Clear the tables safely
        print("[REMEDIATION] Clearing existing relational tables to reset sequences...")
        db.session.execute(text("TRUNCATE TABLE production_data RESTART IDENTITY CASCADE;"))
        db.session.execute(text("TRUNCATE TABLE material_data RESTART IDENTITY CASCADE;"))
        db.session.commit()
        
        # 4. Re-create records for ALL MasterData entries in order
        master_items = MasterData.query.order_by(MasterData.id.asc()).all()
        total = len(master_items)
        print(f"[REMEDIATION] Re-creating {total} sequential records...")
        
        service = MasterDataDBService()
        
        for item in master_items:
            # Create NEW records
            p_rec = ProductionData(master_data_id=item.id)
            m_rec = MaterialData(master_data_id=item.id)
            
            # Fill Production Data from memory store if it existed
            if item.id in existing_prod:
                upd = existing_prod[item.id]
                # Map columns (manual map here to be safe and clean)
                p_rec.total_value = upd.get('Total value')
                p_rec.model_specific = upd.get('Model1')
                p_rec.coverage = upd.get('Coverage')
                p_rec.total_production = upd.get('Total Production')
                p_rec.total_dispatch = upd.get('Total Dispatch')
                p_rec.rm_size = upd.get('RM SIZE')
                p_rec.stock = upd.get('STOCK')
                p_rec.total_disp = upd.get('Total disp')
                p_rec.target_qty = upd.get('Target Qty')
                p_rec.today_produced = upd.get('Today Produced')
                p_rec.remain_qty = upd.get('Remain Qty')
                p_rec.sn_no = upd.get('SN NO') or upd.get('SR NO')
                p_rec.row_status = upd.get('row_status')
            
            # Fill Material Data from memory store if it existed
            if item.id in existing_mat:
                upd = existing_mat[item.id]
                m_rec.rm_thk_mm = upd.get('RM Thk mm')
                m_rec.sheet_width = upd.get('Sheet Width')
                m_rec.sheet_length = upd.get('Sheet Length')
                m_rec.no_of_comp_per_sheet = upd.get('No of comp per sheet')
                m_rec.rm_size = upd.get('RM SIZE')
                m_rec.rm_grade = upd.get('RM Grade')
                m_rec.act_rm_sizes = upd.get('Act RM Sizes')
                m_rec.revised = upd.get('Revised')
                m_rec.validity = upd.get('VALIDITY')
                m_rec.per_day = upd.get('PER DAY')
                m_rec.total_scheduled_qty = upd.get('TOTAL SCHEDULE QTY')
            
            db.session.add(p_rec)
            db.session.add(m_rec)
            
            if item.id % 50 == 0:
                print(f"[REMEDIATION] Progress: {item.id}/{total}")
        
        db.session.commit()
        print("[SUCCESS] Relational remediation complete!")
        print(f"  - Re-aligned {total} records sequentially.")
        print(f"  - All dynamic data moved to structured columns.")

if __name__ == "__main__":
    remediate()
