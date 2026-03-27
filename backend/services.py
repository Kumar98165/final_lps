from models import db, MasterData, User

class BaseDBService:
    def __init__(self, model_class):
        self.model_class = model_class

    def load_all(self, order_by=None):
        query = self.model_class.query
        if order_by:
            query = query.order_by(order_by)
        items = query.all()
        return [item.to_dict() for item in items]

    def get_by_identity(self, identity_key, identity_value):
        filters = {identity_key: identity_value}
        return self.model_class.query.filter_by(**filters).first()

    def update_item(self, identity_key, identity_value, updates):
        item = self.get_by_identity(identity_key, identity_value)
        if not item:
            return False
        
        self.apply_updates(item, updates)
        db.session.commit()
        return True

    def apply_updates(self, item, updates):
        raise NotImplementedError

class MasterDataDBService(BaseDBService):
    def __init__(self):
        super().__init__(MasterData)

    # Legacy hardcoded Excel caching removed in favor of Database schema.

    def get_by_model(self, model_name):
        search_name = str(model_name).strip()
        items = self.model_class.query.filter(
            MasterData.model.ilike(search_name)
        ).order_by(MasterData.id.asc()).all()
        
        results = [item.to_dict() for item in items]
        
        # Return pure database results, no Excel merging overrides that break data format.
        
        return results

    def load_all(self):
        # Professional sorting: Model first, then Part Number
        items = self.model_class.query.order_by(
            MasterData.model.asc(),
            MasterData.id.asc()
        ).all()
        return [item.to_dict() for item in items]

    def apply_updates(self, item, updates):
        if 'common' in updates:
            common = updates['common']
            if 'model' in common: item.model = common['model']
            if 'part_number' in common: item.part_number = common['part_number']
            if 'sap_part_number' in common: item.sap_part_number = common['sap_part_number']
            if 'description' in common: item.description = common['description']
            if 'saleable_no' in common: item.saleable_no = common['saleable_no']
            if 'assembly_number' in common: item.assembly_number = common['assembly_number']
        
        if 'production_data' in updates:
            current = dict(item.production_data or {})
            current.update(updates['production_data'])
            item.production_data = current
            
        if 'material_data' in updates:
            current = dict(item.material_data or {})
            current.update(updates['material_data'])
            item.material_data = current

    def update_item(self, identity_key, identity_value, updates):
        item = self.get_by_identity(identity_key, identity_value)
        if not item:
            # Creation mode (Upsert)
            common = updates.get('common', {})
            new_item = MasterData(
                sap_part_number=identity_value,
                model=common.get('model'),
                part_number=common.get('part_number'),
                description=common.get('description'),
                saleable_no=common.get('saleable_no'),
                assembly_number=common.get('assembly_number'),
                production_data=updates.get('production_data', {}),
                material_data=updates.get('material_data', {})
            )
            db.session.add(new_item)
        else:
            # Standard Update mode
            self.apply_updates(item, updates)
        
        db.session.commit()
        return True

    def seed_from_json(self, json_data):
        for entry in json_data:
            common = entry.get('common', {})
            existing = self.get_by_identity('sap_part_number', common.get('sap_part_number'))
            if not existing:
                new_item = MasterData(
                    model=common.get('model'),
                    part_number=common.get('part_number'),
                    sap_part_number=common.get('sap_part_number'),
                    description=common.get('description'),
                    saleable_no=common.get('saleable_no'),
                    assembly_number=common.get('assembly_number'),
                    production_data=entry.get('production_data', {}),
                    material_data=entry.get('material_data', {})
                )
                db.session.add(new_item)
        db.session.commit()

class IdentityDBService(BaseDBService):
    def __init__(self):
        super().__init__(User)

    def apply_updates(self, item, updates):
        if 'username' in updates: item.username = updates['username']
        if 'name' in updates: item.name = updates['name']
        if 'role' in updates: item.role = updates['role']
        if 'shop' in updates: item.shop = updates['shop']
        if 'isActive' in updates: item.is_active = updates['isActive']
        if 'password' in updates: item.password = updates['password']

    def seed_from_json(self, json_data):
        for entry in json_data:
            existing = self.get_by_identity('username', entry.get('username'))
            if not existing:
                new_user = User(
                    username=entry.get('username'),
                    name=entry.get('name'),
                    password=entry.get('password'),
                    role=entry.get('role'),
                    shop=entry.get('shop'),
                    is_active=entry.get('isActive', True)
                )
                db.session.add(new_user)
        db.session.commit()
