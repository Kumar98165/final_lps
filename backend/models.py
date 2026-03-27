from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class MasterData(db.Model):
    __tablename__ = 'master_data'
    
    id = db.Column(db.Integer, primary_key=True)
    model = db.Column(db.String(100), index=True)
    part_number = db.Column(db.String(255))
    sap_part_number = db.Column(db.String(255), index=True)
    description = db.Column(db.Text)
    saleable_no = db.Column(db.String(255))
    assembly_number = db.Column(db.String(255))
    
    # Store dynamic fields as JSON
    production_data = db.Column(db.JSON)
    material_data = db.Column(db.JSON)
    
    # Flag for parts added manually/ad-hoc on the shop floor
    is_ad_hoc = db.Column(db.Boolean, default=False)

    __table_args__ = (
        db.UniqueConstraint('model', 'sap_part_number', name='_model_sap_uc'),
    )

    def to_dict(self):
        return {
            "common": {
                "id": self.id,
                "model": self.model,
                "part_number": self.part_number,
                "sap_part_number": self.sap_part_number,
                "description": self.description,
                "saleable_no": self.saleable_no,
                "assembly_number": self.assembly_number,
                "is_ad_hoc": self.is_ad_hoc
            },
            "production_data": self.production_data or {},
            "material_data": self.material_data or {}
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, index=True)
    name = db.Column(db.String(255))
    # Store a hashed password instead of plain text
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(50))
    shop = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    last_activity = db.Column(db.DateTime, nullable=True)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    # ---------------------------------------------------------------------
    # Password handling helpers (write‑only property & verification method)
    # ---------------------------------------------------------------------
    @property
    def password(self):
        raise AttributeError("Password is write‑only; use set via the property setter.")

    @password.setter
    def password(self, raw_password: str):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash or "", raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "role": self.role,
            "shop": self.shop,
            "isActive": self.is_active,
            "lastActivity": self.last_activity.isoformat() if self.last_activity else None
            # NOTE: password_hash is deliberately omitted for security
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    username = db.Column(db.String(100)) # Snapshot for easy reading
    action = db.Column(db.String(100)) # e.g., 'LOGIN', 'UPDATE_BOM', 'DELETE_EMAIL'
    ip_address = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=db.func.now())

    user = db.relationship('User', backref='logs')

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "username": self.username,
            "action": self.action,
            "ipAddress": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

class ProductionLine(db.Model):
    __tablename__ = 'production_lines'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "isActive": self.is_active
        }

class CarModel(db.Model):
    __tablename__ = 'car_models'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    model_code = db.Column(db.String(50), unique=True, index=True)
    type = db.Column(db.String(50)) # SUV, Sedan, etc.

    # Assignments
    production_line_id = db.Column(db.Integer, db.ForeignKey('production_lines.id'), nullable=True)
    supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    assigned_deo_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    deo_accepted = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='PENDING') # PENDING, IN_PROGRESS, READY, COMPLETED

    identification_headers = db.Column(db.JSON)
    production_headers = db.Column(db.JSON)
    material_headers = db.Column(db.JSON)

    # Relationships
    line = db.relationship('ProductionLine', backref='models')
    supervisor = db.relationship('User', foreign_keys=[supervisor_id], backref='supervised_models')
    deo = db.relationship('User', foreign_keys=[assigned_deo_id], backref='assigned_models')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "model_code": self.model_code,
            "type": self.type,
            "line_id": self.production_line_id,
            "line_name": self.line.name if self.line else None,
            "supervisor_id": self.supervisor_id,
            "supervisor_name": self.supervisor.name if self.supervisor else None,
            "assigned_deo_id": self.assigned_deo_id,
            "deo_accepted": self.deo_accepted,
            "assigned_deo_name": self.deo.name if self.deo else None,
            "status": self.status,
            "identification_headers": self.identification_headers,
            "production_headers": self.production_headers,
            "material_headers": self.material_headers
        }

class DailyWorkStatus(db.Model):
    __tablename__ = 'daily_work_status'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=db.func.current_date())
    car_model_id = db.Column(db.Integer, db.ForeignKey('car_models.id'), nullable=False)
    deo_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # KPIs from DailyProduction
    shift = db.Column(db.String(20)) # e.g. Shift A, Shift B
    planned_qty = db.Column(db.Integer, default=0)
    actual_qty = db.Column(db.Integer, default=0)
    
    status = db.Column(db.String(20), default='PENDING') # PENDING, DONE, VERIFIED
    supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "car_model_id": self.car_model_id,
            "deo_id": self.deo_id,
            "shift": self.shift,
            "planned_qty": self.planned_qty,
            "actual_qty": self.actual_qty,
            "status": self.status,
            "supervisor_id": self.supervisor_id,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None
        }

class Demand(db.Model):
    __tablename__ = 'demands'
    
    id = db.Column(db.Integer, primary_key=True)
    formatted_id = db.Column(db.String(50), unique=True)
    model_id = db.Column(db.Integer, db.ForeignKey('car_models.id'))
    model_name = db.Column(db.String(100))
    quantity = db.Column(db.Integer)
    start_date = db.Column(db.String(20)) # Storing as string YYYY-MM-DD
    end_date = db.Column(db.String(20))
    status = db.Column(db.String(20), default='PENDING') # PENDING, IN_PROGRESS, COMPLETED
    line = db.Column(db.String(50))
    manager = db.Column(db.String(100))
    customer = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=db.func.now())

    # Relationship to get live model data
    model = db.relationship('CarModel', backref='demands_list')

    def to_dict(self):
        return {
            "id": self.id,
            "formatted_id": self.formatted_id,
            "model_id": self.model_id,
            "model_name": self.model.name if self.model else self.model_name,
            "quantity": self.quantity,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status,
            "line": self.line or (self.model.line.name if (self.model and self.model.line) else None),
            "manager": self.manager,
            "assigned_deo_name": self.model.deo.name if (self.model and self.model.deo) else None,
            "deo_email": (self.model.deo.username + "@gmail.com") if (self.model and self.model.deo) else None,
            "supervisor_name": self.model.supervisor.name if (self.model and self.model.supervisor) else None,
            "supervisor_email": (self.model.supervisor.username + "@gmail.com") if (self.model and self.model.supervisor) else None,
            "customer": self.customer,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

class DailyProductionLog(db.Model):
    __tablename__ = 'daily_production_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=db.func.current_date())
    deo_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    car_model_id = db.Column(db.Integer, db.ForeignKey('car_models.id'), nullable=True) # Linked ID
    demand_id = db.Column(db.Integer, db.ForeignKey('demands.id'), nullable=True) # Linked Order
    model_name = db.Column(db.String(100), nullable=False) # Keep for historical/display
    log_data = db.Column(db.JSON, nullable=False) # Stores the full table snapshot
    status = db.Column(db.String(20), default='PENDING') # PENDING, APPROVED, REJECTED
    supervisor_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.now())

    deo = db.relationship('User', foreign_keys=[deo_id], backref='daily_logs')
    car_model = db.relationship('CarModel', backref='daily_logs')
    demand = db.relationship('Demand', backref='daily_logs')

    def to_dict(self):
        d = {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "deo_id": self.deo_id,
            "deo_name": self.deo.name if self.deo else 'Unknown',
            "car_model_id": self.car_model_id,
            "demand_id": self.demand_id,
            "model_name": self.model_name,
            "log_data": self.log_data,
            "status": self.status,
            "supervisor_comment": self.supervisor_comment,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "target_vehicles": self.demand.quantity if self.demand else 0,
            "line_name": self.car_model.line.name if self.car_model and self.car_model.line else "LINE 1",
            "customer_name": self.demand.customer if self.demand else "T4",
            "manager_name": self.demand.manager if self.demand else "Admin"
        }
        
        # Calculate derived stats if log_data exists
        if self.log_data:
            d["total_unique_parts"] = len(self.log_data)
            total_req = 0
            for row in self.log_data:
                try:
                    target = float(row.get("Target Qty", 0))
                except:
                    target = 0
                total_req += target
            d["total_requirements"] = int(total_req)
        else:
            d["total_unique_parts"] = 0
            d["total_requirements"] = 0
            
        return d


