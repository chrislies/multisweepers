result = ""
temp = "["

with open("test.txt") as file:
    for line in file:
        temp += '"' + line.strip() + '",'

# Check if temp is not empty before removing the last comma
if temp:
    temp = temp[:-1]

result += temp + "]"
print(result)
