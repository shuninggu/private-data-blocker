import pandas as pd
import re

# 读取 CSV 文件
df = pd.read_csv("enron_emails_100.csv")

# 定义提取 Body 的函数
def extract_body(text):
    match = re.search(r"Body:\s*(.*)", text, re.DOTALL)  # 使用 DOTALL 以匹配多行文本
    return match.group(1).strip() if match else ""

# 仅对第一列（假设第一列存的是邮件内容）提取 Body
df["Body"] = df.iloc[:, 0].apply(extract_body)

# 保存新的 CSV 文件，仅包含 Body 部分
df[["Body"]].to_csv("enron_emails_100_body.csv", index=False)

print("已提取 Body 并保存到 enron_emails_100_body.csv")
