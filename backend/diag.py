from app import create_app
from app.models import db, User, CarModel, DailyProductionLog, ProductionLine

app = create_app()
with app.app_context():
    print("=== USERS ===")
    for u in User.query.all():
        print(f"  ID:{u.id} user:{u.username} role:{u.role} shop:{u.shop}")

    print("\n=== PRODUCTION LINES ===")
    for l in ProductionLine.query.all():
        print(f"  ID:{l.id} name:{l.name}")

    print("\n=== CAR MODELS ===")
    for m in CarModel.query.all():
        print(f"  ID:{m.id} name:{m.name} supervisor_id:{m.supervisor_id} line_id:{m.production_line_id}")

    print("\n=== DAILY LOGS ===")
    for l in DailyProductionLog.query.all():
        print(f"  ID:{l.id} status:{l.status} model_id:{l.car_model_id} name:{l.model_name} deo_id:{l.deo_id} date:{l.date}")

    print("\nDONE")
