import sqlite3
import os

db_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\backend\instance\lps_system.db"
print("DB Path:", db_path, "Exists:", os.path.exists(db_path))

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all car models
cursor.execute("SELECT id, name FROM car_models")
models = cursor.fetchall()
print("Models:", models)

# Let's search inside MasterData for the missing SAP PMAM0101EAF02880-I
cursor.execute("SELECT * FROM master_data WHERE sap_part_number='PMAM0101EAF02880-I'")
res = cursor.fetchall()
print("\nFound missing SAP directly in DB:", res)

# See if it exists under ANY column
cursor.execute("SELECT id, sap_part_number, part_number, description FROM master_data WHERE sap_part_number LIKE '%0101EAF02880%' OR part_number LIKE '%0101EAF02880%' OR production_data LIKE '%0101EAF02880%' OR material_data LIKE '%0101EAF02880%'")
print("\nFuzzy search in DB:", cursor.fetchall())

cursor.execute("SELECT id, sap_part_number, part_number, description FROM master_data WHERE part_number='PMAM0102AAP2410N-V'")
print("\nLook up by Finish Part Number PMAM0102AAP2410N-V:", cursor.fetchall())
