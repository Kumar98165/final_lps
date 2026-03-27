from app_factory import create_app
from models import db, User, MasterData, AuditLog, ProductionLine, CarModel, DailyWorkStatus, Demand, DailyProductionLog, Issue
import traceback
app = create_app()
with app.app_context():
    for model in [User, MasterData, AuditLog, ProductionLine, CarModel, DailyWorkStatus, Demand, DailyProductionLog, Issue]:
        try:
            model.query.limit(1).all()
        except Exception as e:
            print(f"Error querying {model.__name__}: {str(e)[:150]}")
            db.session.rollback()
