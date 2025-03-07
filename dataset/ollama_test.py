import pandas as pd
import subprocess
import time

# ------------------------------------------------------------------------------
# 1) Configuration
# ------------------------------------------------------------------------------
# Input and output files
input_file = "enron.xlsx"
output_file = "enron_llama3.2_3b_prompt_1.xlsx"

# improved expression
# PROMPT_TEMPLATE = """
# Identify any potential privacy-sensitive data in the following email body and return all potential private data in a JSON format: ["private data1", "private data2", ...]. 
# Return only one JSON output with no comments or explanations. 
# Extract only the values without considering the keys. 
# If there are repeated values, display them only once.
# ======== email body ========
# {}
# """

# Prompt_general_baseline
# PROMPT_TEMPLATE = """
# Any privacy sensitive data in the following email body? 
# Please return all potential private data in a json format: ["private data1", "private data2", ...]. 
# Return only one json, no comment, no explanation. 
# If there are repeated values, display them only once.
# potential private data types:
# ======== email body ========
# {}
# """

# Prompt_1
# PROMPT_TEMPLATE = """
# Any privacy sensitive data in the following email body? 
# Please return all potential private data in a json format: ["private data1", "private data2", ...]. 
# Return only one json, no comment, no explanation. 
# If there are repeated values, display them only once.
# Potential private data types (but not limited to): bank account number, date of birth, email address, medical information, password or credentials, person's name, phone number, physical address, salary information.
# ======== email body ========
# {}.
# """

# Prompt_2
PROMPT_TEMPLATE = """
Any privacy sensitive data in the following email body? 
Please return all potential private data in a json format: ["private data1", "private data2", ...]. 
Return only one json, no comment, no explanation. 
If there are repeated values, display them only once.
Potential private data types (but not limited to): Person's name, Email address, Phone number, Company name, Geographic location, time, Date
======== email body ========
{}.
"""


# ------------------------------------------------------------------------------
# 2) Read the Excel file
# ------------------------------------------------------------------------------
df = pd.read_excel(input_file, dtype=str)

# Ensure the DataFrame has at least one column
if df.shape[1] < 1:
    raise ValueError("The Excel file does not have the first column.")

# Add a new column if necessary 
if df.shape[1] < 6:
    df.insert(6, "Prediction-llama3.2", "")

num_rows = len(df)  # Number of rows being processed

# ------------------------------------------------------------------------------
# 3) Define a function to call the local LLaMA model
# ------------------------------------------------------------------------------
def call_llama_local(email_body: str) -> str:
    """
    Calls the local LLaMA model via `ollama run deepseek-r1:1.5b` and returns the model output.
    """
    prompt = PROMPT_TEMPLATE.format(email_body)

    process = subprocess.run(
        ["ollama", "run", "llama3.2"],
        input=prompt,
        text=True,
        capture_output=True
    )

    return process.stdout.strip()

# ------------------------------------------------------------------------------
# 4) Process rows and measure execution time
# ------------------------------------------------------------------------------
start_time = time.time()  # Start time

for idx in range(1, num_rows):  # 第一行是表头，跳过
    email_text = df.iloc[idx, 0] if pd.notna(df.iloc[idx, 0]) else ""

    row_start_time = time.time()  # Track time per row
    model_response = call_llama_local(email_text)
    row_end_time = time.time()  # End time per row

    df.iloc[idx, 11] = model_response  # Store in the sixth column (F列)

    print(f"Processed row {idx}/{num_rows-1} in {row_end_time - row_start_time:.2f} seconds.")

end_time = time.time()  # End time
total_time = end_time - start_time  # Total runtime
avg_time_per_row = total_time / (num_rows - 1) if num_rows > 1 else 0  # Average time per row

# ------------------------------------------------------------------------------
# 5) Save the updated DataFrame to a new XLSX file
# ------------------------------------------------------------------------------
df.to_excel(output_file, index=False)

# Print summary statistics
print(f"\nProcessing completed (first {num_rows-1} rows only).")
print(f"Total execution time: {total_time:.2f} seconds.")
print(f"Average time per row: {avg_time_per_row:.2f} seconds.")
print(f"The updated file is saved to: {output_file}")
