from wsgi import app
from models import db, CarModel

with app.app_context():
    # Print exactly what the admin would see in the assignment page
    models = CarModel.query.filter(CarModel.demands_list.any()).all()
    print('Models visible to Admin in Assignment Page:')
    for m in models:
        print(f'{m.id} | {m.name} | Deo: {m.assigned_deo_id}')
