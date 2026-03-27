from wsgi import app
from models import MasterData, CarModel, db
from sqlalchemy import func

def verify():
    with app.app_context():
        # Unique models in MasterData
        m_models = db.session.query(MasterData.model).distinct().all()
        m_list = sorted([m[0] for m in m_models if m[0]])
        
        # Unique names in CarModel
        c_models = db.session.query(CarModel.name).distinct().all()
        c_list = sorted([m[0] for m in c_models if m[0]])
        
        print(f"--- VERIFICATION RESULTS ---")
        print(f"Unique Models in MasterData: {len(m_list)}")
        print(f"Unique Names in CarModel:   {len(c_list)}")
        
        missing = [m for m in m_list if m.upper() not in [c.upper() for c in c_list]]
        if missing:
            print(f"MISSING MODELS ({len(missing)}): {missing}")
        else:
            print("SUCCESS: All MasterData models have a corresponding CarModel record.")

if __name__ == "__main__":
    verify()
