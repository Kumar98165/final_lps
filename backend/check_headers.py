import pandas as pd

with open("output_headers.txt", "w") as f:
    excel_path = r"C:\Users\rjsx1\Downloads\lps_raj-main\lps_raj-main\LPS G CHART DEC'25.xlsx"
    xl = pd.ExcelFile(excel_path)

    for name, hdr in [('RM', 0), ('RM Stock W601', 1), ('Sheet4', 2), ('Sheet1', 2)]:
        if name in xl.sheet_names:
            df = pd.read_excel(excel_path, sheet_name=name, header=hdr)
            f.write(f"\nSheet {name} Headers:\n")
            f.write(str(df.columns.tolist()) + "\n")
