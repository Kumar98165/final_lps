import os
import sys
import re
import pandas as pd
from app_factory import create_app
from models import db, MasterData, CarModel, Demand
from services import MasterDataDBService, IdentityDBService

def clean_val(val):
    if pd.isna(val) or str(val).strip().lower() in ['nan', 'none', '']:
        return ""
    try:
        # Convert 41.0 to "41"
        if float(val) == int(val):
            return str(int(val))
        return str(val)
    except:
        return str(val).strip()

def clean_header(h):
    """Normalize header: remove newlines/tabs, collapse spaces."""
    s = str(h).replace("\n", " ").replace("\t", " ").strip()
    return re.sub(r'\s+', ' ', s)

def import_master_data(model_name, prod_file, mat_file, prod_header=0, mat_header=0, prod_sheet=0, mat_sheet=0, filter_model=None):
    print(f"Loading Production Data: {prod_file} (sheet={prod_sheet}, header={prod_header})")
    prod_df = pd.read_excel(prod_file, sheet_name=prod_sheet, header=prod_header)
    print(f"Loading Material Data: {mat_file} (sheet={mat_sheet}, header={mat_header})")
    mat_df = pd.read_excel(mat_file, sheet_name=mat_sheet, header=mat_header)
    
    # Clean all headers first
    prod_df.columns = [clean_header(c) for c in prod_df.columns]
    mat_df.columns = [clean_header(c) for c in mat_df.columns]
    
    app = create_app()
    with app.app_context():
        # Identification headers standardized across system
        id_heads = ["SR NO", "PART NUMBER", "SAP PART NUMBER", "PART DESCRIPTION", "SALEABLE NO", "ASSEMBLY NUMBER"]
        sap_col = "SAP PART NUMBER"

        def consolidate_sap(df, label):
            # Look for any column containing "SAP" (case insensitive)
            variants = [c for c in df.columns if "SAP" in str(c).upper()]
            
            # If still nothing, move on
            if not variants: return df
            
            print(f"  Found SAP variants in {label}: {variants}")
            
            # Vectorized consolidation: take first non-null value across SAP variants
            # Ensure we start with a Series
            combined = df[variants[0]].astype(str).str.strip().replace({'nan': '', 'None': '', 'NaN': '', '0.0': '', '0': ''})
            for v in variants[1:]:
                other = df[v].astype(str).str.strip().replace({'nan': '', 'None': '', 'NaN': '', '0.0': '', '0': ''})
                combined = combined.mask(combined == '', other)
            
            df[sap_col] = combined
            to_drop = [v for v in variants if v != sap_col]
            if to_drop:
                print(f"  Consolidated SAP variants in {label}: {to_drop}")
                df.drop(columns=to_drop, errors='ignore', inplace=True)
            return df

        prod_df = consolidate_sap(prod_df, "Production")
        mat_df = consolidate_sap(mat_df, "Material")

        # ---- Filter unwanted headers ----
        def is_unwanted(col):
            c = str(col).strip()
            c_up = c.upper()
            if not c or c_up == "NAN" or c.startswith("Unnamed:"): return True
            unwanted = id_heads + [
                "SR. NO.", "S.NO", "SL NO", "NO.", "NO", "S. NO", "SERIAL", "SR NO.",
                "PART NUMBER", "PART NO", "DRG NO", "PART DESCRIPTION", "DESCRIPTION", "DESC",
                "MODEL", "CAR MODEL", "MODEL NAME", "VEHICLE", "ID", "SL. NO.", "PARTNUMBER",
                "TOTAL SCH", "SCH", "TOTAL", "TOTAL SCHEDULE"
            ]
            if c_up in unwanted: return True
            if "SAP PART" in c_up or "SAP#" in c_up: return True
            return False

        def get_heads(cols):
            return list(dict.fromkeys([c for c in cols if not is_unwanted(c) and c != sap_col]))

        prod_heads = get_heads(prod_df.columns)
        mat_heads = get_heads(mat_df.columns)
        
        print(f"  Prod headers ({len(prod_heads)}): {prod_heads[:8]}...")
        print(f"  Mat headers ({len(mat_heads)}): {mat_heads[:8]}...")

        # ---- Prepare for merge ----
        prod_df[sap_col] = prod_df[sap_col].astype(str).str.strip()
        mat_df[sap_col] = mat_df[sap_col].astype(str).str.strip()
        
        # Filter out empty/nan SAPs and deduplicate
        prod_df = prod_df[(prod_df[sap_col] != "") & (prod_df[sap_col].str.lower() != "nan")]
        mat_df = mat_df[(mat_df[sap_col] != "") & (mat_df[sap_col].str.lower() != "nan")]
        prod_df = prod_df.drop_duplicates(subset=[sap_col])
        mat_df = mat_df.drop_duplicates(subset=[sap_col])

        print(f"  Prod rows: {len(prod_df)}, Mat rows: {len(mat_df)}")

        # ---- Build lookup dictionaries instead of merge ----
        # This avoids the _dup suffix problem entirely!
        
        # Build production lookup: SAP -> {header: value}
        prod_lookup = {}
        for _, row in prod_df.iterrows():
            # If filtering by model, skip rows that don't match
            if filter_model:
                row_model = ""
                for col in row.index:
                    if "MODEL" in str(col).upper():
                        row_model = str(row[col]).strip()
                        break
                if row_model.upper() != filter_model.upper():
                    continue

            sap = str(row[sap_col]).strip()
            if sap and sap.lower() != 'nan' and sap != "":
                p_data = {}
                for h in prod_heads:
                    if h in row.index:
                        p_data[h] = clean_val(row[h])
                # Also grab identification fields
                pn = ""
                desc = ""
                saleable = ""
                assy = ""
                for col in row.index:
                    col_up = col.upper()
                    if col_up in ["PART NUMBER", "PART NO", "DRG NO"]:
                        v = clean_val(row[col])
                        if v and not pn: pn = v
                    if col_up in ["PART DESCRIPTION", "DESCRIPTION", "DESC"]:
                        v = clean_val(row[col])
                        if v and not desc: desc = v
                    if col_up in ["SALEABLE NO", "SALEABLE"]:
                        v = clean_val(row[col])
                        if v and not saleable: saleable = v
                    if col_up in ["ASSEMBLY NUMBER", "ASSY NO", "ASSEMBLY"]:
                        v = clean_val(row[col])
                        if v and not assy: assy = v
                prod_lookup[sap] = {"data": p_data, "pn": pn, "desc": desc, "saleable": saleable, "assy": assy}
        
        # Build material lookup: SAP -> {header: value}
        mat_lookup = {}
        for _, row in mat_df.iterrows():
            sap = str(row[sap_col]).strip()
            if sap and sap.lower() != 'nan':
                m_data = {}
                for h in mat_heads:
                    if h in row.index:
                        m_data[h] = clean_val(row[h])
                # Also grab identification fields as fallback
                pn = ""
                desc = ""
                saleable = ""
                assy = ""
                for col in row.index:
                    col_up = col.upper()
                    if col_up in ["PART NUMBER", "PART NO", "DRG NO"]:
                        v = clean_val(row[col])
                        if v and not pn: pn = v
                    if col_up in ["PART DESCRIPTION", "DESCRIPTION", "DESC"]:
                        v = clean_val(row[col])
                        if v and not desc: desc = v
                    if col_up in ["SALEABLE NO", "SALEABLE"]:
                        v = clean_val(row[col])
                        if v and not saleable: saleable = v
                    if col_up in ["ASSEMBLY NUMBER", "ASSY NO", "ASSEMBLY"]:
                        v = clean_val(row[col])
                        if v and not assy: assy = v
                mat_lookup[sap] = {"data": m_data, "pn": pn, "desc": desc, "saleable": saleable, "assy": assy}

        # Get all unique SAPs
        # Only import SAPs that exist in the production sheet (if provided)
        if prod_lookup:
            all_saps = list(prod_lookup.keys())
        else:
            all_saps = list(mat_lookup.keys())
        print(f"  Total unique SAPs: {len(all_saps)}")

        # ---- Clear and save ----
        MasterData.query.filter_by(model=model_name).delete()
        
        cm = CarModel.query.filter_by(name=model_name).first()
        if not cm:
            cm = CarModel(name=model_name, model_code=f"{model_name[:3].upper()}-NEW", type="Car")
            db.session.add(cm)
        
        cm.identification_headers = id_heads
        cm.production_headers = prod_heads
        cm.material_headers = mat_heads
        db.session.commit()

        count = 0
        mat_with_data = 0
        for sap in all_saps:
            prod_entry = prod_lookup.get(sap, {"data": {h: "" for h in prod_heads}, "pn": "", "desc": ""})
            mat_entry = mat_lookup.get(sap, {"data": {h: "" for h in mat_heads}, "pn": "", "desc": ""})
            
            # Get best identification values
            pn = prod_entry.get("pn") or mat_entry.get("pn") or ""
            desc = prod_entry.get("desc") or mat_entry.get("desc") or ""
            saleable = prod_entry.get("saleable") or mat_entry.get("saleable") or ""
            assy = prod_entry.get("assy") or mat_entry.get("assy") or ""
            
            p_data = prod_entry["data"]
            m_data = mat_entry["data"]
            
            # Sequential SR NO
            count += 1
            p_data["SR NO"] = str(count)
            
            # Track mat data stats
            if any(v != "" for v in m_data.values()):
                mat_with_data += 1

            # UPSERT LOGIC
            item = MasterData.query.filter_by(sap_part_number=sap).first()
            if not item:
                item = MasterData(sap_part_number=sap)
                db.session.add(item)
            
            item.model = model_name
            item.part_number = str(pn)
            item.description = str(desc)
            item.saleable_no = str(saleable)
            item.assembly_number = str(assy)
            item.production_data = {str(k): str(v) for k, v in p_data.items()}
            item.material_data = {str(k): str(v) for k, v in m_data.items()}
            item.is_ad_hoc = False

        try:
            db.session.commit()
            print(f"Successfully imported {count} items for {model_name}! ({mat_with_data} with material data)")
        except Exception as e:
            db.session.rollback()
            print(f"CRITICAL ERROR during DB commit: {e}")
            # Try to identify the offensive item
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--prod", required=True)
    parser.add_argument("--mat", required=True)
    parser.add_argument("--prod_header", type=int, default=0)
    parser.add_argument("--mat_header", type=int, default=0)
    parser.add_argument("--prod_sheet", default="0")
    parser.add_argument("--mat_sheet", default="0")
    parser.add_argument("--filter_model", default=None)
    args = parser.parse_args()
    
    # Try to convert sheet indices to int if possible
    try: prod_sheet = int(args.prod_sheet)
    except: prod_sheet = args.prod_sheet
    try: mat_sheet = int(args.mat_sheet)
    except: mat_sheet = args.mat_sheet

    import_master_data(args.model, args.prod, args.mat, args.prod_header, args.mat_header, prod_sheet, mat_sheet, args.filter_model)
