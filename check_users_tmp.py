
from app_factory import create_app
from models import User

app = create_app()
with app.app_context():
    users = User.query.limit(5).all()
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Name: {u.name}, Role: {u.role}")
