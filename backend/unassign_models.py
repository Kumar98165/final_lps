from wsgi import app
from models import db, CarModel

with app.app_context():
    for m in CarModel.query.all():
        m.assigned_deo_id = None
        m.supervisor_id = None
        m.deo_accepted = False
        m.status = 'PENDING'
    db.session.commit()
    print('All models have been unassigned.')
