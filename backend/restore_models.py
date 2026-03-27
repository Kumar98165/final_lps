from wsgi import app
from models import db, CarModel, MasterData

with app.app_context():
    # 1. Get all unique models from master data
    master_models = set([m[0] for m in MasterData.query.with_entities(MasterData.model).distinct().all()])
    # 2. Get currently existing car models
    existing_models = set([m.name for m in CarModel.query.all()])
    # 3. Find missing ones
    missing = master_models - existing_models
    print(f'Found {len(missing)} missing models: {missing}')
    
    # 4. Re-add missing models
    added = 0
    for name in missing:
        # Give it a generic model_code
        m = CarModel(name=name, model_code=f'RES-{name[:5].upper()}-{added}', type='Standard', status='PENDING')
        # Assign to line 1, supervisor 1, deo 2 for now, or leave null to let manager assign
        m.production_line_id = 1
        m.supervisor_id = 1
        m.assigned_deo_id = 2
        m.deo_accepted = True
        db.session.add(m)
        added += 1
    db.session.commit()
    print(f'Successfully restored {added} models.')
    print('Total models now:', CarModel.query.count())
