import pandas as pd
from difflib import SequenceMatcher

def string_similarity(s1, s2):
    """Returns a similarity ratio between two strings."""
    return SequenceMatcher(None, s1, s2).ratio()

def array_similarity(arr1, arr2):
    """Computes a similarity score between two arrays of strings."""
    if arr1 == arr2:
        return 1.0  # Perfect match

    total_score = 0.0
    max_length = max(len(arr1), len(arr2))

    for i in range(min(len(arr1), len(arr2))):
        total_score += string_similarity(arr1[i], arr2[i])

    return total_score / max_length

# Load the Excel file
df = pd.read_excel("enron.xlsx")

# Ensure the third and fourth columns are treated as lists
def parse_list(column_value):
    """Convert a string representation of a list into an actual list."""
    if isinstance(column_value, str):
        try:
            return eval(column_value)
        except:
            return []
    return column_value if isinstance(column_value, list) else []

# Apply parsing to the third and fourth columns
df.iloc[1:, 2] = df.iloc[1:, 2].apply(parse_list)
df.iloc[1:, 3] = df.iloc[1:, 3].apply(parse_list)

# Compute similarity and store in the fifth column
df.iloc[1:, 4] = df.iloc[1:, [2, 3]].apply(lambda row: array_similarity(row[0], row[1]), axis=1)

# Save the new DataFrame to an Excel file
df.to_excel("similarity.xlsx", index=False)
