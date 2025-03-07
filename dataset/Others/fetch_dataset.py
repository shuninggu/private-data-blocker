from datasets import load_dataset
import pandas as pd

# 加载 Hugging Face 数据集
dataset = load_dataset("snoop2head/enron_aeslc_emails", split="train")

# 选择前 100 条数据
df = pd.DataFrame(dataset[:100])

# 导出为 CSV 文件
df.to_csv("enron_emails_100.csv", index=False)

print("前100条数据已导出到 enron_emails_100.csv")
