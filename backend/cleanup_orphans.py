from wsgi import app
from models import db, CarModel

with app.app_context():
    # Find and delete ALL CarModel records that have NO linked demands
    # These are orphaned records from old debugging/testing
    orphans = [m for m in CarModel.query.all() if len(m.demands_list) == 0]
    print(f'Found {len(orphans)} orphaned CarModels to delete:')
    for m in orphans:
        print(f'  Deleting: id={m.id} | name={m.name} | deo={m.assigned_deo_id}')
        db.session.delete(m)
    db.session.commit()
    print('Done. Remaining CarModels:')
    for m in CarModel.query.all():
        print(f'  id={m.id} | {m.name} | Deo: {m.assigned_deo_id}')
