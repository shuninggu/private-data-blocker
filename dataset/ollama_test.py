import pandas as pd
import subprocess
import time

# ------------------------------------------------------------------------------
# 1) Configuration
# ------------------------------------------------------------------------------
# Input and output files
input_file = "enron_emails_100_labels_converted.xlsx"
output_file = "enron_emails_100_llama3.2_3b_test3.xlsx"

# # Prompt template
# PROMPT_TEMPLATE = """
# Identify any potential privacy-sensitive data in the following email body and return all potential private data in a JSON format: ["private data1", "private data2", ...]. 
# Return only one JSON output with no comments or explanations. 
# Extract only the values without considering the keys. 
# If there are repeated values, display them only once.
# ======== email body ========
# {}
# """

# Prompt template
PROMPT_TEMPLATE = """
Any privacy sensitive data in the following email body? 
Please return all potential private data in a json format, ['private data1', 'private data2', ...]. 
Return only one json, no comment, no explanation. 
======== email body ========
{}
"""


# ------------------------------------------------------------------------------
# 2) Read the Excel file
# ------------------------------------------------------------------------------
df = pd.read_excel(input_file, header=None, dtype=str)

# Ensure the DataFrame has at least one column
if df.shape[1] < 1:
    raise ValueError("The Excel file does not have the first column.")

# Limit to the first 5 rows for testing
df = df.iloc[:20].copy()  # Copy ensures we do not modify the original DataFrame reference

num_rows = len(df)  # Number of rows being processed

# ------------------------------------------------------------------------------
# 3) Define a function to call the local LLaMA model
# ------------------------------------------------------------------------------
def call_llama_local(email_body: str) -> str:
    """
    Calls the local LLaMA model via `ollama run llama3.2` and returns the model output.
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

for idx in range(num_rows):
    email_text = df.iloc[idx, 0] if df.iloc[idx, 0] is not None else ""

    row_start_time = time.time()  # Track time per row
    model_response = call_llama_local(email_text)
    row_end_time = time.time()  # End time per row

    df.iloc[idx, 3] = model_response  # Store in the fourth column

    print(f"Processed row {idx+1}/{num_rows} in {row_end_time - row_start_time:.2f} seconds.")

end_time = time.time()  # End time
total_time = end_time - start_time  # Total runtime
avg_time_per_row = total_time / num_rows if num_rows > 0 else 0  # Average time per row

# ------------------------------------------------------------------------------
# 5) Save the updated DataFrame to a new XLSX file
# ------------------------------------------------------------------------------
df.to_excel(output_file, index=False, header=False)

# Print summary statistics
print(f"\nProcessing completed (first {num_rows} rows only).")
print(f"Total execution time: {total_time:.2f} seconds.")
print(f"Average time per row: {avg_time_per_row:.2f} seconds.")
print(f"The updated file is saved to: {output_file}")
