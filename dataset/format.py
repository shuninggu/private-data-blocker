import pandas as pd
import ast

# 读取 Excel 文件
file_path = "enron_emails_100_llama3.2_3b_test4.xlsx"
df = pd.read_excel(file_path)

# 处理第一列的数据
def format_private_data(cell):
    try:
        # 解析字符串为列表
        parsed_list = ast.literal_eval(cell) if isinstance(cell, str) else cell
        if isinstance(parsed_list, list):
            return str(parsed_list).replace("'", '"')  # 替换单引号为双引号
    except Exception:
        pass
    return cell

df[df.columns[0]] = df[df.columns[0]].apply(format_private_data)

# 输出到新的 Excel 文件
df.to_excel("formatted_enron_emails——test5.xlsx", index=False)
