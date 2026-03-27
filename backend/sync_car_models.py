import time
from wsgi import app
from models import db, MasterData, CarModel

def sync_car_models():
    with app.app_context():
        # 1. Get all unique models from MasterData
        master_models = db.session.query(MasterData.model).distinct().all()
        master_models = [m[0] for m in master_models if m[0]]
        
        # 2. Get existing models in CarModel
        existing_models = db.session.query(CarModel.name).distinct().all()
        existing_models = set(m[0].upper() for m in existing_models if m[0])
        
        new_count = 0
        for m_name in master_models:
            print(f"Checking model: '{m_name}'")
            if m_name.strip().upper() not in existing_models:
                # Create a new CarModel record
                unique_suffix = str(int(time.time() * 100))[-4:]
                model_code = f"{m_name[:3].upper()}-{unique_suffix}"
                
                # Check if this code exists (unlikely but safe)
                counter = 1
                while CarModel.query.filter_by(model_code=model_code).first():
                    model_code = f"{m_name[:3].upper()}-{unique_suffix}-{counter}"
                    counter += 1
                
                new_model = CarModel(
                    name=m_name.strip(),
                    model_code=model_code,
                    status='READY',
                    type='SUV', # Default
                    identification_headers=['PART NUMBER', 'SAP PART NUMBER', 'PART DESCRIPTION'],
                    production_headers=['Target Qty', 'Today Produced', 'Remain Qty', 'Production Status'],
                    material_headers=['RM Grade', 'RM Thk mm', 'RM SIZE']
                )
                db.session.add(new_model)
                new_count += 1
                print(f"Created CarModel: {m_name} (Code: {model_code})")
                
                # Update existing_models to avoid double-processing if MasterData has dups (it shouldn't due to distinct query)
                existing_models.add(m_name.strip().upper())
        
        db.session.commit()
        print(f"--- SUCCESS ---")
        print(f"New CarModels created: {new_count}")
        print(f"Total Unique Models in CarModel: {CarModel.query.count()}")

if __name__ == "__main__":
    sync_car_models()
