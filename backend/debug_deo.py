from wsgi import app
from models import User, CarModel, Demand, db

def debug():
    with app.app_context():
        user = User.query.filter_by(username='deo').first()
        if not user:
            print("User 'deo' not found")
            return
        
        print(f"User: {user.username} (ID: {user.id})")
        
        # Check assigned models
        models = CarModel.query.filter_by(assigned_deo_id=user.id).all()
        print(f"Assigned Models: {len(models)}")
        for m in models:
            # Check for demand
            demands = Demand.query.filter_by(model_id=m.id).all()
            print(f"  Model: {m.name} (ID: {m.id}) | Status: {m.status} | Accepted: {m.deo_accepted} | Demands: {len(demands)}")
            for d in demands:
                print(f"    Demand: {d.formatted_id} | Status: {d.status}")

if __name__ == "__main__":
    debug()
