from app_factory import create_app
from models import db, MasterData
from collections import Counter
import json

app = create_app()
with app.app_context():
    all_data = MasterData.query.all()
    total = len(all_data)
    missing_sap = [e.id for e in all_data if not e.sap_part_number]
    missing_model = [e.id for e in all_data if not e.model]
    # Count duplicates of (model, sap_part_number)
    combo_counts = Counter((e.model, e.sap_part_number) for e in all_data if e.model and e.sap_part_number)
    duplicates = [combo for combo, cnt in combo_counts.items() if cnt > 1]
    # Stats on production and material fields
    prod_counts = [len(e.production_data or {}) for e in all_data]
    mat_counts = [len(e.material_data or {}) for e in all_data]
    avg_prod = sum(prod_counts) / total if total else 0
    avg_mat = sum(mat_counts) / total if total else 0
    # Build report
    report = {
        "total_records": total,
        "missing_sap_ids": missing_sap,
        "missing_model_ids": missing_model,
        "duplicate_model_sap": duplicates,
        "average_production_fields": round(avg_prod, 2),
        "average_material_fields": round(avg_mat, 2),
        "records_with_no_production": len([c for c in prod_counts if c == 0]),
        "records_with_no_material": len([c for c in mat_counts if c == 0]),
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
