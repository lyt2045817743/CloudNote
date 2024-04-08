# 性能优化
- 无论前端历史如何演进，性能优化/用户体验始终是贯穿始终的事情。
- 可以围绕任意角度展开（需全面）
- 本质上就是用空间换时间：多使用内存、缓存或其他方法；减少CPU计算、网络加载耗时

## 资源加载
### 资源体积更小
- 压缩代码：webpack
- 压缩图片
- 异步组件

### 减少访问次数
- 资源合并：代码合并、雪碧图
- SSR
- 缓存：bundle缓存（webpack contenthash：自动触发http缓存机制304）

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