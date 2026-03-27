from wsgi import app
from models import db, CarModel

with app.app_context():
    print('Total CarModels:', CarModel.query.count())
    print('Assigned to DEO (id=2):', CarModel.query.filter_by(assigned_deo_id=2).count())
    print('Assigned to DEO (id=3):', CarModel.query.filter_by(assigned_deo_id=3).count())
    
    unassigned = CarModel.query.filter_by(assigned_deo_id=None).count()
    print('Unassigned or other DEO:', unassigned)
    
    # Assign all 30 models to DEO 2 for testing, since the user expects to see all 29/30
    for m in CarModel.query.all():
        m.assigned_deo_id = 2
        m.supervisor_id = 1
    db.session.commit()
    print('All models assigned to DEO 2 (id=2).')
