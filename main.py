import re

priv_set = ("username", "password")
pattern = r'(username|password)\s*(?:is|=)\s*"([^"]*)"'

text = 'username="ning" password is "12345"'

# 使用finditer来找到所有匹配项
matches = re.finditer(pattern, text)

result = []

# 遍历所有匹配项，记录每个匹配的开始位置、属性名、值
for match in matches:
    start_pos = match.start()  # 匹配的开始位置
    attribute = match.group(1)  # 匹配到的属性名（username 或 password）
    value = match.group(2)  # 匹配到的值
    result.append((start_pos, attribute, value))

print(result)  # 输出：[(0, 'username', 'ning'), (16, 'password', '12345')]