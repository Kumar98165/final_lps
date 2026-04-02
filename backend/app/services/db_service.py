from app.models import db, MasterData, User, ProductionData, MaterialData

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

    def get_by_model(self, model_name):
        search_name = str(model_name).strip()
        items = self.model_class.query.filter(
            MasterData.model.ilike(search_name)
        ).order_by(MasterData.id.asc()).all()
        
        results = [item.to_dict() for item in items]
        return results

    def load_all(self):
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
            upd = updates['production_data']
            if not item.production_rel:
                item.production_rel = ProductionData(master_data=item)
                db.session.add(item.production_rel)
            
            # Map known columns
            if 'Total value' in upd: item.production_rel.total_value = upd['Total value']
            if 'Model1' in upd: item.production_rel.model_specific = upd['Model1']
            if 'Coverage' in upd: item.production_rel.coverage = upd['Coverage']
            if 'Total Production' in upd: item.production_rel.total_production = upd['Total Production']
            if 'Total Dispatch' in upd: item.production_rel.total_dispatch = upd['Total Dispatch']
            
            # Additional mapped columns
            if 'RM SIZE' in upd: item.production_rel.rm_size = upd['RM SIZE']
            if 'STOCK' in upd: item.production_rel.stock = upd['STOCK']
            if 'Total disp' in upd: item.production_rel.total_disp = upd['Total disp']
            if 'Target Qty' in upd: item.production_rel.target_qty = upd['Target Qty']
            if 'Today Produced' in upd: item.production_rel.today_produced = upd['Today Produced']
            if 'Remain Qty' in upd: item.production_rel.remain_qty = upd['Remain Qty']
            if 'SN NO' in upd or 'SR NO' in upd: item.production_rel.sn_no = upd.get('SN NO') or upd.get('SR NO')
            if 'row_status' in upd: item.production_rel.row_status = upd['row_status']
            
            # Handle overflow
            known = [
                'Total value', 'Model1', 'Coverage', 'Total Production', 'Total Dispatch',
                'RM SIZE', 'STOCK', 'Total disp', 'Target Qty', 'Today Produced', 
                'Remain Qty', 'SN NO', 'SR NO', 'row_status'
            ]
            others = {k: v for k, v in upd.items() if k not in known}
            if others:
                current = dict(item.production_rel.additional_fields or {})
                current.update(others)
                item.production_rel.additional_fields = current
            
        if 'material_data' in updates:
            upd = updates['material_data']
            if not item.material_rel:
                item.material_rel = MaterialData(master_data=item)
                db.session.add(item.material_rel)
                
            # Map known columns
            mapping = {
                'RM Thk mm': 'rm_thk_mm',
                'Sheet Width': 'sheet_width',
                'Sheet Length': 'sheet_length',
                'No of comp per sheet': 'no_of_comp_per_sheet',
                'RM SIZE': 'rm_size',
                'RM Grade': 'rm_grade',
                'Act RM Sizes': 'act_rm_sizes',
                'Revised': 'revised',
                'VALIDITY': 'validity',
                'PER DAY': 'per_day',
                'TOTAL SCHEDULE QTY': 'total_scheduled_qty'
            }
            
            for json_key, attr in mapping.items():
                if json_key in upd:
                    setattr(item.material_rel, attr, upd[json_key])
            
            # Handle overflow
            others = {k: v for k, v in upd.items() if k not in mapping}
            if others:
                current = dict(item.material_rel.additional_fields or {})
                current.update(others)
                item.material_rel.additional_fields = current

    def update_item(self, identity_key, identity_value, updates):
        item = self.get_by_identity(identity_key, identity_value)
        if not item:
            common = updates.get('common', {})
            new_item = MasterData(
                sap_part_number=identity_value,
                model=common.get('model'),
                part_number=common.get('part_number'),
                description=common.get('description'),
                saleable_no=common.get('saleable_no'),
                assembly_number=common.get('assembly_number')
            )
            # Use apply_updates to distribute into relational tables
            self.apply_updates(new_item, updates)
            db.session.add(new_item)
        else:
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
                    assembly_number=common.get('assembly_number')
                )
                self.apply_updates(new_item, entry)
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
