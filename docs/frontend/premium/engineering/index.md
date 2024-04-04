# 前端工程化
前端历史 -> 各个工具的出现 -> 工具优化迭代

主要目的：组件化、自动化、规范化、模块化

从三个地方入手：html、css、js

## 构建
### webpack
#### 一、介绍
是一个前端静态模块打包工具。

webpack最初的目标是：使得前端更好地进行模块化。

1. 在此之前的模块化分为几个阶段：

（1）各个模块都通过独立的script标签引入，都在全局工作（污染全局变量、模块间没有依赖关系、维护困难）
```js
  <script src="module-a.js"></script>
  <script src="module-b.js"></script>
```

（2）各个模块有单独的命名空间 ：解决了命名冲突的问题（但模块间依然没有依赖关系）
```js
  window.moduleA = {
    method1: function () {
      console.log('moduleA#method1')
    }
  }
```

（3）IIFE：解决了模块间依赖关系的问题（模块的加载不是通过代码控制，不好维护）
```js
  // module-a.js 依赖于 jQuery
  (function ($) {
    var name = 'module-a'

    function method1 () {
      console.log(name + '#method1')
      $('body').animate({ margin: '200px' })
    }
      
    window.moduleA = {
      method1: method1
    }
  })(jQuery)
```

#### 二、构建过程
1. webpack的构建过程可以从文件名称上表示为：module -> chunk -> bundle。

三者区别：

module：每一个源文件都是一个module，在webpack看来，万物皆模块

chunk：webpack通过分析entry等配置、动态引入的模块，将互相依赖的模块整合为多个内存中的代码块

bundle：每一个chunk对应一个bundle,打包后的chunk就是bundle

2. 从整体流程上讲

（1）先解析配置文件和命令行参数、进行一些初始化操作

（2）从配置的入口文件开始，依次将其依赖的module使用对应的loader翻译文件内容，依次递归地处理所有依赖

（3）将所有编译后的module结合成chunk，再将chunk组合成bundle输出到文件系统的指定output位置

（4）开发环境（？）：当检测到文件变化后，再重新编译、输出

#### 三、webpack的能力
##### 编译源代码：loader
- 总结：loader对模块（源代码）进行预处理，编译为webpack能直接识别的文件类型
- webpack只支持对js进行打包，而对于其他webpack无法识别的文件时，它会在配置中找改文件的解析规则
- 支持链式调用，对于一个类型的文件，可以依次经过多个loader的处理
```js
  module.exports = {
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: true
              }
            },
            { loader: 'sass-loader' }
          ]
        }
      ]
    }
  };
```

###### 常见loader
- css
  - style-loader：将css通过style标签内联到html中
  - postcss-loader：将css代码扩展为兼容各个浏览器的样式代码
  - sass-loader：将sass语法的css转成普通css代码
  - css-loader：允许css通过require的方式引入，并返回css代码
- js
  - babel-loader：转换ES6+的js代码为符合ES5规范的js代码
- 框架
  - vue-loader
- 图片
  - file-loader：将文件直接输出到指定的输出目录
  - url-loader：和file-loader相似，但可以把比较小的图片，直接以base64字符串的格式插入到js里
```js
  rules: [
    {
      test: /\.(png|jpe?g|gif)$/,
      use: {
        loader: "file-loader",
        options: {
          // placeholder 占位符 [name] 源资源模块的名称
          // [ext] 源资源模块的后缀
          name: "[name]_[hash].[ext]",
          //打包后的存放位置
          outputPath: "./images",
          // 打包后文件的 url
          publicPath: './images',
        }
      }
    },
    {
      test: /\.(png|jpe?g|gif)$/,    
      use: {      
        loader: "url-loader",      
        options: {
          // placeholder 占位符 [name] 源资源模块的名称
          // [ext] 源资源模块的后缀
          name: "[name]_[hash].[ext]",
          // 小于 100 字节转成 base64 格式        
          limit: 100,
          //打包后的存放位置
          outputPath: "./images"
          // 打包后文件的 url
          publicPath: './images',
        }    
      } 
    }
  ]
```


##### 扩展webpack功能：plugin
作用：增强系统的可扩展性，将扩展的功能添加到webpack不同阶段的运行机制中




#### 四、cli对webpack的处理
1. @vue-cli-service
```js
  // /node_modules/@vue/cli-service/lib/Service.js
  init (mode = process.env.VUE_CLI_MODE) {
    if (this.initialized) {
      return
    }
    this.initialized = true
    this.mode = mode

    // load mode .env
    if (mode) {
      this.loadEnv(mode)
    }
    // load base .env
    this.loadEnv()

    // load user config -> './vue.config.js'文件
    const userOptions = this.loadUserOptions()
    this.projectOptions = defaultsDeep(userOptions, {
        // project deployment base
        publicPath: '/',

        // where to output built files
        outputDir: 'dist',

        // where to put static assets (js/css/img/font/...)
        assetsDir: '',

        // filename for index.html (relative to outputDir)
        indexPath: 'index.html',

        // whether filename will contain hash part
        filenameHashing: true,

        // boolean, use full build?
        runtimeCompiler: false,

        // deps to transpile
        transpileDependencies: [],

        // sourceMap for production build?
        productionSourceMap: !process.env.VUE_CLI_TEST,

        // use thread-loader for babel & TS in production build
        // enabled by default if the machine has more than 1 cores
        parallel: hasMultipleCores(),

        // multi-page config
        pages: undefined,

        // <script type="module" crossorigin="use-credentials">
        // #1656, #1867, #2025
        crossorigin: undefined,

        // subresource integrity
        integrity: false,

        css: {},

        // whether to use eslint-loader
        lintOnSave: 'default',

        devServer: {}
    })

    // apply plugins.
    this.plugins.forEach(({ id, apply }) => {
      if (this.pluginsToSkip.has(id)) return
      apply(new PluginAPI(id, this), this.projectOptions)
    })

    // apply webpack configs from project config file
    if (this.projectOptions.chainWebpack) {
      this.webpackChainFns.push(this.projectOptions.chainWebpack)
    }
    if (this.projectOptions.configureWebpack) {
      this.webpackRawConfigFns.push(this.projectOptions.configureWebpack)
    }
  }
```
