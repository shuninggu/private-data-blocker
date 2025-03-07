import pandas as pd
import json

# Read the Excel file
input_file = "email_dataset.xlsx"  # Replace with your file path
output_file = "output.xlsx"

# Load the Excel file (assuming the second column contains the target data)
df = pd.read_excel(input_file, header=None, dtype=str)

# Ensure there are at least two columns
if len(df.columns) > 1:
    # Process the second column: strip spaces and convert to JSON array format
    df[2] = df[1].apply(lambda x: json.dumps([line.strip() for line in str(x).splitlines()], ensure_ascii=False))

    # Save the output as an Excel file
    df.to_excel(output_file, index=False, header=False)

    print(f"Conversion completed. The result has been saved to {output_file}")
else:
    print("The second column does not exist in the Excel file. Please check the input file.")
