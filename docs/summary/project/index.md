# 婷的空间
### 项目子系统添加
记录目的：防止下次新建系统时走弯路

#### 步骤
1. 始终使用vuecli创建子系统，使用vite创建项目，跑不起来
```bash
> vue create my_calendar
```
2. 在main.js中添加逻辑
```js
import { createApp } from 'vue';
import App from './App.vue';

let instance;

async function render(props = {}) {
  const { container } = props;
  instance = createApp(App);
  instance.mount(container ? container.querySelector('#app') : '#app');
}

// 单独调试子应用时挂载
if (!window.__POWERED_BY_QIANKUN__) {
  // console.log('window.__POWERED_BY_QIANKUN__: ', window.__POWERED_BY_QIANKUN__);
  render();
}

export async function bootstrap() {
  // console.log('vue app bootStrap');
}

// 主应用挂载
export async function mount(props) {
  // console.log('mount');
  instance = await render(props);
}

export async function unmount() {
  instance?.unmount('#app');
}
```

3. 在主应用中注册该应用
```js
// packages/SparkingGrowth_main/src/constant/micro.js
{
  name: '我的日历',
  entry: '//localhost:60003',
  container: '#container',
  activeRule: '/my_calendar',
}
```

4. 添加该应用的vue.config.ts文件
```js
const path = require('path');
const { name } = require('./package.json');

const port = 60003; // 改为一个其他系统没有用过的端口号

let publicPath = `//localhost:${port}`;

module.exports = {
  publicPath,
  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${name}`
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '-': path.resolve(__dirname, 'src/common'),
        '~': path.resolve(__dirname, 'src/components')
      }
    },
    devtool: false
  },
  devServer: {
    port,
    open: false,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
};
```
5. 在一键启动脚本中添加新系统的配置信息
```js
// scripts/startAllProcess.cjs
const projects = [
  // 其他子应用
  { name: 'my_calendar', port: 60003 },
  // 主应用
];
```

#### TODO：
[ ] 弄清楚每一步的原理
