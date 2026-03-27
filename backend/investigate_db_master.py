import os
import json
from app_factory import create_app
from models import db, MasterData

sap_to_find = 'PMAM0101EAF02880-I'

app = create_app()
with app.app_context():
    print(f"Searching database for SAP: {sap_to_find}")
    items = MasterData.query.filter_by(sap_part_number=sap_to_find).all()
    
    if not items:
        print("  Not found in database.")
    else:
        for item in items:
            print(f"  ID: {item.id}")
            print(f"  Model: {item.model}")
            print(f"  Part Number: {item.part_number}")
            print(f"  Description: {item.description}")
            print(f"  Production Data: {item.production_data}")
            print(f"  Material Data: {item.material_data}")
            print("-" * 20)
