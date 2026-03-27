import traceback
from app_factory import create_app, seed_database
app = create_app()
try:
    seed_database(app)
except Exception as e:
    with open('error_log.txt', 'w') as f:
        f.write(traceback.format_exc())
