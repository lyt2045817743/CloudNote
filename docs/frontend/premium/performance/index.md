# 性能优化
- 无论前端历史如何演进，性能优化/用户体验始终是贯穿始终的事情。
- 可以围绕任意角度展开（需全面）
- 本质上就是用空间换时间：多使用内存、缓存或其他方法；减少CPU计算、网络加载耗时

## 资源加载
### 资源体积更小
#### 压缩代码
1. 代码实例：js代码压缩
```js
    const TerserPlugin = require('terser-webpack-plugin')
    module.exports = {
        ...
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    parallel: true // 电脑cpu核数-1
                })
            ]
        }
    }
```

#### 压缩图片
#### 代码分离
默认情况下，业务代码、第三方依赖都会在首页全部都加载，这会影响首页的加载速度。
对此我们可以分离代码、控制加载优先级。
1. webpack的处理：splitChunksPlugin来实现
```js
module.exports = {
    optimization:{
        splitChunks:{
            chunks: "all", // 按需加载：异步组件
            // minChunks：被引用的次数
            // maxSize：大于maxSize的包被拆分
            // minSize：拆分包的大小至少为minSize
        }
    }
}
```

#### Tree Shaking
指删除掉没有被使用的代码，依赖于ESM的静态语法分析
1. usedExports：通过标记某些函数是否被使用，后面通过Terser进行优化
```js
    // 配置
    module.exports = {
        optimization:{
            usedExports: true
        }
    }
    // 使用后，webpack会在打包过程中加上注释unused harmony export mul注释，用来告知 Terser 在优化时，可以删除掉这段代码

    /* unused harmony export mul */
    function sum(num1, num2) {
        return num1 + num2;
    }
```

### 减少访问次数
#### 资源合并：代码合并、雪碧图
#### SSR
#### 缓存：bundle缓存（webpack contenthash：自动触发http缓存机制304）
#### 内联chunk（？）
将一些runtime代码内联到html中，这些代码量不大，但是是必须加载的
```js
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
    plugin:[
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin,[/runtime.+\.js/])
    ]
}
```

### 资源位置
#### CDN


## 渲染
### 资源加载时机
#### css放到head、js放到body最下面

#### 懒加载：图片、数据
1. 图片懒加载代码实例
```html
<!-- 先展示特别小的预览图片 -->
<img id="img1" src="preview.png" data-realsrc="ab.png" />
<script type="text/javascript">
    // ...
    // 当浏览器滚动到该图片的位置时，再赋值真正的图片链接
    var img1 = document.getElementById('img1');
    img1.src = img1.getAttribute('data-realsrc');
</script>
```


### DOM
#### 对 DOM 查询进行缓存
#### DOM操作合并到一起执行
1. 代码实例：多个 DOM 一起插入
```js
    const listNode = document.getElementById('list');
    // 创建一个文档片段，此时还没有插入到 DOM 树中
    const frag = document.createDocumentFragment();

    for (let x = 0; x < 10; x++) {
        const li = document.createElement('li');
        li.innerHTML = 'list item' + x;
        frag.appendChild(li);
    }

    // 此时，才真正地插入到 DOM 树中
    listNode.appendChild(frag);
```

## 用户体验
- 节流防抖