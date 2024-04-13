# 新零售工作台
### 项目目录结构
```
#  |--dist  生成打包后文件
#  |--node_modules  安装的依赖包
#  |--src
#  |    |-- api  与后端交互使用相关方法的配置
#  |    |   |-- config.ts  项目配置（生产，开发，测试接口配置）
#  |    |   |-- request.ts  封装使用的ajax方法，拦截器等（一般使用axios）
#  |    |   |-- common.ts  公共axios请求
#  |    |   |-- (_modules).ts 各个模块的接口定义，可根据相应模块划分添加多个
#  |    |-- assets  存放公共静态资源
#  |    |   |-- img 存放公共图片或图标等
#  |    |-- components  一些公共组件
#  |    |   |-- layout
#  |    |   |   |-- (...).vue 布局相关组件（如Menu, EcyBreadcrumb, Content）
#  |    |   |-- (...).vue 其它公共组件
#  |    |-- directives
#  |    |   |-- index.ts 自定义指令文件
#  |    |-- hooks
#  |    |   |-- useHooks.ts  存放公共hooks方法
#  |    |-- pages  业务代码
#  |    |   |-- (_modules)  业务模块（可重复建多个）
#  |    |   |   |-- components  业务模块内公共组件
#  |    |   |   |-- utils
#  |    |   |   |   |-- index.ts  业务模块的公共方法
#  |    |   |   |   |-- common.ts  业务模块的公共静态数据
#  |    |   |   |-- index.d.ts 业务模块的类型声明
#  |    |   |   |-- (...).vue  业务vue代码
#  |    |-- router
#  |    |   |-- index.ts  导出路由配置
#  |    |   |-- routes.ts  汇总路由文件并导出
#  |    |   |-- modules
#  |    |   |   |-- (_modules).ts  各模块路由
#  |    |-- store
#  |    |   |-- index.ts  导出全局vuex方法
#  |    |   |-- modules
#  |    |   |   |--  (_modules).ts 某模块对应的vuex文件
#  |    |-- style
#  |    |   |-- _variables.scss  存放公共色值变量
#  |    |   |-- element_variables.scss  存放公共覆盖elementUI的样式
#  |    |   |-- global.scss  存放公共初始化样式
#  |    |-- types
#  |    |   |-- (...).d.ts  依赖包类型声明文件
#  |    |-- utils
#  |    |   |-- common.ts  存放公共静态数据
#  |    |   |-- index.ts  存放公共方法
#  |    |-- app.vue  路由组件的顶层路由
#  |    |-- main.ts  入口文件
#  |--.env.development 本地启动环境配置
#  |--.env.pre 预发布环境配置
#  |--.env.production 正式环境配置
#  |--.eslintignore 配置eslint不检查的文件
#  |--.eslintrc.js 配置eslint规则
#  |--.gitignore 配置git不提交的文件
#  |--babel.config.js 配置babel
#  |-- ... 其它配置
```