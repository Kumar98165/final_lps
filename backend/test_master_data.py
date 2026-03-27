from app_factory import create_app
from models import db, MasterData
import json

app = create_app()
with app.app_context():
    entries = MasterData.query.limit(10).all()
    summary = []
    for e in entries:
        summary.append({
            "id": e.id,
            "model": e.model,
            "sap_part_number": e.sap_part_number,
            "part_number": e.part_number,
            "description": e.description,
            "saleable_no": e.saleable_no,
            "assembly_number": e.assembly_number,
            "prod_fields": len(e.production_data) if e.production_data else 0,
            "mat_fields": len(e.material_data) if e.material_data else 0,
        })
    print(json.dumps(summary, indent=2, ensure_ascii=False))
