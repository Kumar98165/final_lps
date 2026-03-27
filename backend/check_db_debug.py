from wsgi import app
from models import db, MasterData, CarModel, Demand

with app.app_context():
    print("--- Car Models ---")
    models = CarModel.query.all()
    for m in models:
        print(f"ID: {m.id}, Name: {m.name}, Status: {m.status}, Accepted: {m.deo_accepted}")
    
    print("\n--- Demands ---")
    demands = Demand.query.all()
    for d in demands:
        print(f"ID: {d.id}, Model Name: {d.model_name}, Status: {d.status}")
        
    print("\n--- Master Data Count per Model ---")
    from sqlalchemy import func
    counts = db.session.query(MasterData.model, func.count(MasterData.id)).group_by(MasterData.model).all()
    for model, count in counts:
        print(f"Model: {model}, Count: {count}")
