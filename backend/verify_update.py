from wsgi import app
from models import MasterData, db

def verify():
    with app.app_context():
        total = MasterData.query.count()
        print(f"Total MasterData items in DB: {total}")
        
        # Sample check
        sample_sap = 'PMAM0102AAW00690-I'
        item = MasterData.query.filter_by(sap_part_number=sample_sap).first()
        if item:
            print(f"Sample SAP {sample_sap}:")
            print(f"  Description: {item.description}")
            print(f"  Material Data: {item.material_data}")
        else:
            print(f"Sample SAP {sample_sap} NOT FOUND")

if __name__ == "__main__":
    verify()
