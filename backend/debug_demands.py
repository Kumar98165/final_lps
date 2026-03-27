from wsgi import app
from models import db, CarModel, Demand

with app.app_context():
    demands = Demand.query.all()
    print('All Demands:')
    for d in demands:
        print(f'Demand {d.id} | Model ID: {d.model_id}')
        
    print('\nAll CarModels:')
    for m in CarModel.query.all():
        if m.assigned_deo_id or m.demands_list:
            print(f'CarModel {m.id} | {m.name} | Deo: {m.assigned_deo_id} | Num Demands: {len(m.demands_list)}')
