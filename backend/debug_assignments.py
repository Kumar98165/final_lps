from wsgi import app
from models import db, CarModel, User

with app.app_context():
    deos = User.query.filter_by(role='DEO').all()
    print('DEOs:')
    for d in deos: print(d.id, d.name, d.username)
    print('Models assigned to any DEO:')
    for m in CarModel.query.filter(CarModel.assigned_deo_id != None).all():
        print(f'{m.id} | {m.name} | Deo: {m.assigned_deo_id} | SV: {m.supervisor_id}')
