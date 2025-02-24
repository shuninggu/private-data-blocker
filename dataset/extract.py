import pandas as pd
import re

# 1. 读取 CSV 文件
df = pd.read_csv("enron_emails_100.csv", encoding="utf-8")

# 2. 定义正则表达式：匹配从 "Body:" 开始到文本结尾的所有内容
pattern = re.compile(r"Body:\s*(.*)", re.DOTALL)

# 3. 定义一个函数，用于从每条邮件中提取正文
def extract_body(text):
    match = pattern.search(text)
    if match:
        # group(1) 就是匹配到的正文部分
        return match.group(1).strip()
    else:
        return ""

# 4. 应用该函数到第一列（这里假设列名为 "text"）
df["body_extracted"] = df["text"].apply(extract_body)

# 5. 查看提取结果
print(df["body_extracted"].head(5))

# 6. 如果需要，可以将结果保存为新的 CSV 文件
df.to_csv("enron_emails_100_with_body_extracted.csv", index=False, encoding="utf-8")
