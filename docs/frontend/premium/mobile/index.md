# 移动端

## 移动端适配
### 基本概念介绍

### 解决方案
移动端多屏适配的需求，常见主要有两类：
   1. 布局伸缩式
        - 布局特点一般为横向伸缩，竖向高度固定或由内容填充决定、文字图标等网页内容大小固定（在宽屏窄屏上的视觉大小保持一致）或梯级变化（通过媒体查询实现）
        - 通过flex布局、%布局、float+ viewport 来实现
   2. 等比缩放式（布局和内容完全等比例缩放）
        - 布局特点简单粗暴，就是根据屏幕宽度整个页面等比缩放
        - 通过 rem + viewport实现
            ```scss
                <!-- 根据给定px的设计稿，来计算根字体大小，进而得出rem算法： -->
                $root_font_size: 100; // 这个值不重要，计算rem时会被抵消掉

                @function rem($px) {
                    @return calc($px / $root_font_size) * 1rem;
                }

                html {
                    width: 100%;
                    font-size: calc($root_font_size / $pc_vw_base) * 100vw;
                    font-family: 'MiSans', 'MI Lan Pro', serif;
                }

                <!-- 实际上  rem($px) = ($px / $pc_vw_base) * 100vw -->
                <!-- 若规定 根字体大小为12，则 1px = 1/12 rem -->

            ```

#### viewport meta标签
用于控制视口大小和形状（只对移动端生效，PC端忽视）
```html
    <!-- 指定宽度 device-width/数值 -->
    <meta name="viewport" content="width=device-width">
    <!-- 或设置 设备逻辑宽度（device-width）和视口宽度的初始缩放比值：比值越大，视口宽度越小，视图放得越大 -->
    <meta name="viewport" content="initial-scale=1">
```

1. 视口：浏览器的视口是指在其中查看web内容的窗口区域
    - PC端：视口宽度最小为980
    - 获取值：可以通过clientWidth获取视口宽度 
    - 设置值：通过viewport meta标签
```js
    document.documentElement.clientWidth
```

### 跨端应用
#### 响应式
常见于多端共用一套代码的场景

#### 自适应
- 把屏幕按宽度范围分为有限的几个区段，为每个区段定制固定的 UI。
- 为专门的设备设计专门的 UI：服务器根据浏览器请求的 user-agent 判断设备类型，然后返回(或重定向)对应的站点内容。(PC、m站)
