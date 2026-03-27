from wsgi import app
from models import db, CarModel_ as CarModel, Demand
import time

# Note: models.py has 'CarModel' but check_db_debug used 'CarModel'
# Let's check the actual name in backend/models.py
from models import CarModel

with app.app_context():
    # 1. Find an existing model
    old_model = CarModel.query.first()
    if old_model:
        print(f"Original Model: {old_model.name}, Status: {old_model.status}")
        
        # 2. Simulate cloning logic from routes.py
        new_model = CarModel(
            name=old_model.name,
            model_code=f"TEST-{int(time.time())}",
            status='READY' # As updated in my fix
        )
        db.session.add(new_model)
        db.session.flush()
        print(f"Cloned Model (New Demand): {new_model.name}, Status: {new_model.status}")
        
        # 3. Simulate acceptance
        new_model.deo_accepted = True
        new_model.status = 'IN_PROGRESS' # As updated in my fix
        print(f"Accepted Model: {new_model.name}, Status: {new_model.status}")
        
        db.session.rollback() # Don't actually change DB
    else:
        print("No models found to test.")
