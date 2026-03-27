import csv

CSV_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\Final_Merged_RM_Master.csv"

def inspect():
    with open(CSV_PATH, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        print(f"Headers: {headers}")
        
        for i, row in enumerate(reader):
            if i >= 10: break
            model = row.get('Model')
            sap = row.get('SAP_Code')
            print(f"{i}: Model='{model}', SAP='{sap}'")

if __name__ == "__main__":
    inspect()
