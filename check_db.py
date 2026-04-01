import os
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.models import CarModel, Demand

app = create_app()
with app.app_context():
    print("--- Demands ---")
    demands = Demand.query.all()
    for d in demands:
        print(f"Demand ID: {d.id}, Formatted ID: {d.formatted_id}, Model Name: {d.model_name}, Model ID: {d.model_id}")
    
    print("\n--- Car Models ---")
    models = CarModel.query.all()
    for m in models:
        print(f"Model ID: {m.id}, Name: {m.name}, Model Code: {m.model_code}")
    
    print("\n--- Summary ---")
    print(f"Total Demands: {len(demands)}")
    print(f"Total Models: {len(models)}")
