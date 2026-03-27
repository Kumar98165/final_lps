import pandas as pd
import json

excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
print(f"Loading {excel_path}...")
xl = pd.ExcelFile(excel_path)
print(f"Sheets: {xl.sheet_names}")

# Read first sheet (presumably G Chart)
df_g = df_rm = None

for sheet in xl.sheet_names:
    if "RM" in sheet.upper():
         df_rm = pd.read_excel(excel_path, sheet_name=sheet, header=2) # Adjust header if needed
    elif "BOLERO" in sheet.upper():
         # just an example
         df_g = pd.read_excel(excel_path, sheet_name=sheet, header=3)

print("Checking SAP Parts...")
# Let's inspect the DataFrame heads
if df_rm is not None:
    sap_cols_rm = [c for c in df_rm.columns if 'SAP' in str(c).upper()]
    print(f"RM SAP columns: {sap_cols_rm}")
    if sap_cols_rm:
        print(df_rm[[sap_cols_rm[0]]].head())

print("Done")
