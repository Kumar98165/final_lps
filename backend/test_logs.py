from app_factory import create_app
from models import db, DailyProductionLog
import traceback
app = create_app()
with app.app_context():
    try:
        DailyProductionLog.query.all()
    except Exception as e:
        with open('error_log2.txt', 'w') as f:
            f.write(traceback.format_exc())
