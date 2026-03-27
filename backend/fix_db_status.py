from wsgi import app
from models import CarModel, db

def fix_status():
    with app.app_context():
        # Update any models that are accepted but still in PENDING status
        updated = CarModel.query.filter_by(deo_accepted=True, status='PENDING').update({"status": "IN_PROGRESS"})
        
        # Also ensure any model with status READY can be accepted
        # (Already handled by logic, but ensuring PENDING models are at least READY if not accepted)
        updated_ready = CarModel.query.filter_by(deo_accepted=False, status='PENDING').update({"status": "READY"})
        
        db.session.commit()
        print(f"Fixed {updated} accepted models to IN_PROGRESS.")
        print(f"Fixed {updated_ready} unaccepted models to READY.")

if __name__ == "__main__":
    fix_status()
