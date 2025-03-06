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

    # Compare elements at corresponding indices
    for i in range(min(len(arr1), len(arr2))):
        total_score += string_similarity(arr1[i], arr2[i])

    # Normalize by the maximum possible matches
    return total_score / max_length

# 读取Excel文件
df = pd.read_excel("enron_emails_100_llama3.2_3b.xlsx")

# 计算每一行第三列与第四列的相似度
similarities = []
for idx, row in df.iterrows():
    # 假设第三列为 df.columns[2]，第四列为 df.columns[3]
    text_col3 = str(row[df.columns[2]])  # 转成字符串，防止有空值或其他类型
    text_col4 = str(row[df.columns[3]])

    # 以空格拆分为词列表，如果需要按句子或其它方式拆分，可自行替换
    arr1 = text_col3.split()
    arr2 = text_col4.split()

    score = array_similarity(arr1, arr2)
    similarities.append(score)

# 将相似度结果存入新列
df["Similarity_Score"] = similarities

# 输出到新的Excel文件
df.to_excel("similarity_test0.xlsx", index=False)
