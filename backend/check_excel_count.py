import pandas as pd

EXCEL_PATH = r"c:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\RM_Master_Data_Final.xlsx"

def check():
    try:
        df = pd.read_excel(EXCEL_PATH)
        print(f"Total Rows: {len(df)}")
        # Check for Model and SAP_Code or similar
        print(f"Columns: {df.columns.tolist()}")
        
        # Determine key columns (case insensitive search)
        model_col = next((c for c in df.columns if 'MODEL' in c.upper()), None)
        sap_col = next((c for c in df.columns if 'SAP' in c.upper()), None)
        
        if model_col and sap_col:
            unique_keys = df.groupby([model_col, sap_col]).size().reset_index()
            print(f"Unique ({model_col}, {sap_col}) pairs: {len(unique_keys)}")
        else:
            print("Could not find Model or SAP columns.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
