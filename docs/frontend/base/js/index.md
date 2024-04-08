# js

## 数据类型
### 集合（Set）
1. 是一个类数组，可使用for of、forEach进行迭代
2. 基础属性和方法：
    - size
    - keys(): 返回Set Iterator
    - has()
    - add()
    - delete()
    - clear()
3. 为了兼容Map而有的方法：
    - set.entries() —— 遍历并返回一个包含所有的实体 [value, value] 的可迭代对象
    - values —— 与 set.keys() 作用相同