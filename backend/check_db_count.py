from wsgi import app
from models import MasterData

def check_db():
    with app.app_context():
        count = MasterData.query.count()
        print(f"Total rows in MasterData table: {count}")
        
        # Check some samples
        samples = MasterData.query.limit(5).all()
        for s in samples:
            print(f"ID: {s.id}, Model: {s.model}, SAP: {s.sap_part_number}")

if __name__ == "__main__":
    check_db()
