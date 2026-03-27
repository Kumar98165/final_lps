from wsgi import app
from models import Demand, CarModel

def check_demand():
    with app.app_context():
        d = Demand.query.get(11)
        if not d:
            print("Demand 11 not found")
            return
        
        m = CarModel.query.get(d.model_id)
        print(f"Demand 11 -> Model: {m.name} (ID: {m.id})")
        print(f"Identification Headers: {m.identification_headers}")
        print(f"Production Headers: {m.production_headers}")
        print(f"Material Headers: {m.material_headers}")

if __name__ == "__main__":
    check_demand()
