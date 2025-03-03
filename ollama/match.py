from difflib import SequenceMatcher
import pandas as pd

def string_similarity(s1, s2):
    """Returns a similarity ratio between two strings."""
    return SequenceMatcher(None, s1, s2).ratio()

def array_similarity(arr1, arr2):
    """Computes a similarity score between two arrays of strings."""
    if arr1 == arr2:
        return 1.0  # Perfect match

    total_score = 0.0
    max_length = max(len(arr1), len(arr2))

    # Compare elements at corresponding indices
    for i in range(min(len(arr1), len(arr2))):
        total_score += string_similarity(arr1[i], arr2[i])

    # Normalize by the maximum possible matches
    return total_score / max_length

# Test cases
test_cases = [
    (["abc", "ee exy", "xx"], ["abc", "ee exy", "xx"]),  # Perfect match
    (["abc", "ee exy", "xx"], ["abc", "ee exy", "xy"]),  # Last element slightly different
    (["abc", "ee exy", "xx"], ["abc", "ee"]),  # Second array is shorter
    (["abc", "ee exy", "xx"], ["xyz", "ee"]),  # First element different, second similar
    (["hello world", "python"], ["hello", "python"]),  # Partial match on first element
    (["data science", "machine learning"], ["data", "learning"]),  # Partial word overlap
    (["one", "two", "three"], ["one", "2", "three"]),  # Number vs word difference
    (["apple", "banana", "cherry"], ["orange", "grape", "peach"]),  # Completely different
    (["same text", "identical"], ["same text", "identical", "extra"]),  # Additional element in second array
    (["short"], ["longer sentence"]),  # Completely different length but single comparison
]



# Run test cases
results = []
for i, (arr1, arr2) in enumerate(test_cases):
    score = array_similarity(arr1, arr2)
    results.append((i + 1, arr1, arr2, round(score, 2)))

# Display results
df = pd.DataFrame(results, columns=["Test Case", "Array 1", "Array 2", "Similarity Score"])
print(df)