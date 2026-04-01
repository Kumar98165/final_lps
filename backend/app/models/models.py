from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

# ----------------------------- Constants -----------------------------
class Status:
    PENDING = 'PENDING'
    IN_PROGRESS = 'IN_PROGRESS'
    READY = 'READY'
    COMPLETED = 'COMPLETED'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    DONE = 'DONE'
    VERIFIED = 'VERIFIED'
    UNREAD = 'UNREAD'
    READ = 'READ'
    PROCESSED = 'PROCESSED'

# ----------------------------- MasterData -----------------------------
class MasterData(db.Model):
    """Stores master data for parts, with dynamic JSON fields."""
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
        # Add indexes for performance
        db.Index('ix_master_data_model_sap', 'model', 'sap_part_number'),
    )

    def __repr__(self):
        return f'<MasterData {self.model} {self.sap_part_number}>'

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

# ----------------------------- User -----------------------------
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, index=True)
    name = db.Column(db.String(255))
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(50))
    shop = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    last_activity = db.Column(db.DateTime, nullable=True)
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    # ---------------------------------------------------------------------
    # Password handling helpers
    # ---------------------------------------------------------------------
    @property
    def password(self):
        raise AttributeError("Password is write‑only; use set via the property setter.")

    @password.setter
    def password(self, raw_password: str):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash or "", raw_password)

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "role": self.role,
            "shop": self.shop,
            "isActive": self.is_active,
            "lastActivity": self.last_activity.isoformat() if self.last_activity else None
        }

# ----------------------------- AuditLog -----------------------------
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    username = db.Column(db.String(100))  # Snapshot for easy reading
    action = db.Column(db.String(100))    # e.g., 'LOGIN', 'UPDATE_BOM', 'DELETE_EMAIL'
    ip_address = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=db.func.now(), index=True)

    user = db.relationship('User', backref='logs')

    def __repr__(self):
        return f'<AuditLog {self.action} by {self.username} at {self.timestamp}>'

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "username": self.username,
            "action": self.action,
            "ipAddress": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

# ----------------------------- ProductionLine -----------------------------
class ProductionLine(db.Model):
    __tablename__ = 'production_lines'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<ProductionLine {self.name}>'

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "isActive": self.is_active
        }

# ----------------------------- CarModel -----------------------------
class CarModel(db.Model):
    __tablename__ = 'car_models'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    model_code = db.Column(db.String(50), unique=True, index=True)
    type = db.Column(db.String(50))  # SUV, Sedan, etc.

    # Assignments
    production_line_id = db.Column(db.Integer, db.ForeignKey('production_lines.id'), nullable=True, index=True)
    supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    assigned_deo_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    deo_accepted = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default=Status.PENDING)  # Use constant

    identification_headers = db.Column(db.JSON)
    production_headers = db.Column(db.JSON)
    material_headers = db.Column(db.JSON)

    # Relationships
    line = db.relationship('ProductionLine', backref='models')
    supervisor = db.relationship('User', foreign_keys=[supervisor_id], backref='supervised_models')
    deo = db.relationship('User', foreign_keys=[assigned_deo_id], backref='assigned_models')

    def __repr__(self):
        return f'<CarModel {self.name} ({self.model_code})>'

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

# ----------------------------- DailyWorkStatus -----------------------------
class DailyWorkStatus(db.Model):
    __tablename__ = 'daily_work_status'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=db.func.current_date(), index=True)
    car_model_id = db.Column(db.Integer, db.ForeignKey('car_models.id'), nullable=False, index=True)
    deo_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # KPIs from DailyProduction
    shift = db.Column(db.String(20))  # e.g. Shift A, Shift B
    planned_qty = db.Column(db.Integer, default=0)
    actual_qty = db.Column(db.Integer, default=0)
    
    status = db.Column(db.String(20), default=Status.PENDING)  # Use constant
    supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    verified_at = db.Column(db.DateTime, nullable=True)

    # Relationships (added missing ones)
    car_model = db.relationship('CarModel', backref='daily_work_statuses')
    deo = db.relationship('User', foreign_keys=[deo_id], backref='daily_work_statuses')
    supervisor = db.relationship('User', foreign_keys=[supervisor_id], backref='verified_work_statuses')

    def __repr__(self):
        return f'<DailyWorkStatus {self.date} model={self.car_model_id} deo={self.deo_id}>'

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

# ----------------------------- Demand -----------------------------
class Demand(db.Model):
    __tablename__ = 'demands'
    
    id = db.Column(db.Integer, primary_key=True)
    formatted_id = db.Column(db.String(50), unique=True)
    model_id = db.Column(db.Integer, db.ForeignKey('car_models.id'), index=True)
    model_name = db.Column(db.String(100))
    quantity = db.Column(db.Integer)
    start_date = db.Column(db.String(20))  # Storing as string YYYY-MM-DD
    end_date = db.Column(db.String(20))
    status = db.Column(db.String(20), default=Status.PENDING)  # Use constant
    line = db.Column(db.String(50))
    manager = db.Column(db.String(100))
    customer = db.Column(db.String(100))
    company = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=db.func.now(), index=True)

    # Relationship
    model = db.relationship('CarModel', backref='demands_list')

    # Computed properties for cleaner to_dict
    @property
    def line_name(self):
        if self.line:
            return self.line
        if self.model and self.model.line:
            return self.model.line.name
        return None

    @property
    def assigned_deo_name(self):
        if self.model and self.model.deo:
            return self.model.deo.name
        return None

    @property
    def deo_email(self):
        if self.model and self.model.deo:
            return f"{self.model.deo.username}@gmail.com"
        return None

    @property
    def supervisor_name(self):
        if self.model and self.model.supervisor:
            return self.model.supervisor.name
        return None

    @property
    def supervisor_email(self):
        if self.model and self.model.supervisor:
            return f"{self.model.supervisor.username}@gmail.com"
        return None

    def __repr__(self):
        return f'<Demand {self.formatted_id} - {self.model_name} qty={self.quantity}>'

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
            "line": self.line_name,
            "manager": self.manager,
            "assigned_deo_name": self.assigned_deo_name,
            "deo_email": self.deo_email,
            "supervisor_name": self.supervisor_name,
            "supervisor_email": self.supervisor_email,
            "customer": self.customer,
            "company": self.company,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

# ----------------------------- DailyProductionLog -----------------------------
class DailyProductionLog(db.Model):
    __tablename__ = 'daily_production_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=db.func.current_date(), index=True)
    deo_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    car_model_id = db.Column(db.Integer, db.ForeignKey('car_models.id'), nullable=True, index=True)
    demand_id = db.Column(db.Integer, db.ForeignKey('demands.id'), nullable=True, index=True)
    model_name = db.Column(db.String(100), nullable=False)  # Keep for historical/display
    log_data = db.Column(db.JSON, nullable=False)  # Stores the full table snapshot
    status = db.Column(db.String(20), default=Status.PENDING)  # Use constant
    supervisor_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.now(), index=True)

    deo = db.relationship('User', foreign_keys=[deo_id], backref='daily_logs')
    car_model = db.relationship('CarModel', backref='daily_logs')
    demand = db.relationship('Demand', backref='daily_logs')

    # Computed properties for derived stats
    @property
    def total_unique_parts(self):
        return len(self.log_data) if self.log_data else 0

    @property
    def total_requirements(self):
        if not self.log_data:
            return 0
        total = 0
        for row in self.log_data:
            try:
                target = float(row.get("Target Qty", 0))
            except (ValueError, TypeError):
                target = 0
            total += target
        return int(total)  # keep int as original

    @property
    def target_vehicles(self):
        return self.demand.quantity if self.demand else 0

    @property
    def line_name(self):
        if self.car_model and self.car_model.line:
            return self.car_model.line.name
        return "LINE 1"

    @property
    def customer_name(self):
        return self.demand.customer if self.demand else "T4"

    @property
    def manager_name(self):
        return self.demand.manager if self.demand else "Admin"

    def __repr__(self):
        return f'<DailyProductionLog {self.date} deo={self.deo_id} status={self.status}>'

    def to_dict(self):
        return {
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
            "target_vehicles": self.target_vehicles,
            "line_name": self.line_name,
            "customer_name": self.customer_name,
            "manager_name": self.manager_name,
            "total_unique_parts": self.total_unique_parts,
            "total_requirements": self.total_requirements
        }

# ----------------------------- EmailRequest -----------------------------
class EmailRequest(db.Model):
    __tablename__ = 'email_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    imap_uid = db.Column(db.String(50), unique=True, index=True)
    message_id = db.Column(db.Text, index=True)
    sender = db.Column(db.Text)
    sender_email = db.Column(db.Text)
    subject = db.Column(db.Text)
    body = db.Column(db.Text)
    received_at = db.Column(db.DateTime, index=True)
    status = db.Column(db.String(20), default=Status.UNREAD, index=True)
    created_at = db.Column(db.DateTime, default=db.func.now())

    def __repr__(self):
        return f'<EmailRequest {self.imap_uid} from {self.sender_email} status={self.status}>'

    def to_dict(self):
        return {
            "id": self.id,
            "imap_uid": self.imap_uid,
            "message_id": self.message_id,
            "sender": self.sender,
            "sender_email": self.sender_email,
            "subject": self.subject,
            "body": self.body,
            "received_date": self.received_at.isoformat() if self.received_at else None,
            "status": self.status,
            "is_read": self.status != Status.UNREAD
        }