from app_factory import create_app
from models import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    for table_name in ['car_models', 'demands']:
        r = db.session.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'"))
        cols = [row[0] for row in r]
        print(f"Columns for {table_name}: {cols}")
