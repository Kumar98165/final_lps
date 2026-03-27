from wsgi import app
from models import db, MasterData, CarModel, Demand

with app.app_context():
    print("--- Checking 'W616' Specifically ---")
    w616_models = CarModel.query.filter(CarModel.name.ilike('%W616%')).all()
    for m in w616_models:
        print(f"CarModel ID: {m.id}, Name: {m.name}, Code: {m.model_code}, Status: {m.status}, Accepted: {m.deo_accepted}")
    
    w616_md = MasterData.query.filter(MasterData.model.ilike('%W616%')).count()
    print(f"MasterData entries for 'W616': {w616_md}")

    print("\n--- All Car Models ---")
    for m in CarModel.query.all():
        print(f"ID: {m.id}, Name: {m.name}, Status: {m.status}")

    print("\n--- All Unique Models in Master Data ---")
    models = db.session.query(MasterData.model).distinct().all()
    for m in models:
        print(f"MasterData Model: {m[0]}")
