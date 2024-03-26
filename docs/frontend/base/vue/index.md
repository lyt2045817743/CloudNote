# vue
是一个帮助我们快速开发迭代的工具，避免了我们去频繁地手动操作DOM
## 简介
### 前端发展历史
1. 静态页面
2. JSP（java server pages服务端渲染页面）不灵活
3. AJAX火了
4. JQuery、Vue、React等前端框架

每一个新技术的出现，都是一些特殊场景的解决方案。

### vue的作用
vue更关注MVC中的视图层，并在vue底层通过数据驱动视图（通过对数据进行监听，来实现重新执行render函数更新DOM，从而影响视图）

### vue的核心
#### 数据驱动
#### 组件化
#### 指令系统
当表达式的值发生改变时，将其产生的连带影响，响应式地作用于DOM

## 基础用法
### 插槽
是vue的<mark>内容分发机制</mark>，即内容交给父组件去控制，slot标签作为内容分发的载体。
1. 分类：默认插槽、具名插槽、作用域插槽(传递子组件中的数据，父组件根据这些数据确定该如何展示内容)
2. 插槽作用域：从子组件向父组件传递数据（而不是状态）
3. 原理：
当子组件实例实例化时，获取到父组件传过来的slot标签内容，存储在$slot中，当组件执行渲染函数的时候，将slot标签的内容替换为$slot中对应的内容，并且为插槽传递数据

### 选项式api【vue2】
#### mixin
1. vue2中 逻辑复用的方式，与vue实例有一样的配置属性


2. 用法：全局mixin和局部mixin（单个vue实例导入、mixin中混入其他mixin） <br/>
（1）全局mixin：Vue.mixin()，每个组件执行一次（包括new Vue） <br/>
（2）局部mixin：mixins: []


3. 特点：选项合并，合并规则如下： <br/>
（1）钩子：组件和mixin钩子中的内容全部保留（合并为一个数组），先执行mixin中逻辑，再执行组件中逻辑 <br/>
（2）状态/方法：如果出现同名，组件中的覆盖mixin中的


4. 缺点 <br/>
（1）数据来源不清晰：变量名被覆盖、不好维护 <br/>
（2）隐性地耦合
解决方案：命名空间，如mixin_base_XXX

### 组合式api
开始面向函数式编程，这种用法更加的灵活。

api使用从按约定的结构进行配置的方式 -> 函数调用的方式：data -> ref()、mounted -> onMounted()...

vue2中所有配置项，都可以写在setup钩子中

#### setup钩子
1. 参数：props、context{ emit, expose, slots, attrs }

#### 生命周期
用于debug的两个钩子（只有dev环境生效）：onRenderTracked(响应式数据的get触发时执行)、onRenderTriggered(响应式数据的set触发时执行)

#### 响应式数据
ref、shallowRef(浅层的ref，深层属性不具备响应式)：refImp类型

源码：
```js
    class RefImpl {
    constructor(value, __v_isShallow) {
      this.__v_isShallow = __v_isShallow;
      this.dep = void 0;
      this.__v_isRef = true;
      this._rawValue = __v_isShallow ? value : toRaw(value);
      this._value = __v_isShallow ? value : toReactive(value);
    }
    get value() {
      trackRefValue(this);
      return this._value;
    }
    set value(newVal) {
      const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal);
      newVal = useDirectValue ? newVal : toRaw(newVal);
      if (hasChanged(newVal, this._rawValue)) {
        this._rawValue = newVal;
        this._value = useDirectValue ? newVal : toReactive(newVal);
        triggerRefValue(this, 2, newVal);
      }
    }
  }
```

reactive：proxy类型

#### watch与watchEffect
watchEffect自动对回调中的响应式状态进行收集，只有一个参数即这个回调。相当于简化了立即执行的watch操作，因为watchEffect自动执行，触发了 getter ，实现自动收集依赖。

#### useHook
例子

1. 获取鼠标位置

优点：

1. 更好的 **逻辑复用**，同样是逻辑复用，但解决了mixin的很多问题：

    ① 数据来源不清晰问题，数据、方法等通过函数返回值的方式来引入，明确了变量来源，这种方式也更符合程序员思维

    ② 同一业务的代码过于分散，不好维护，各种跳

2. **可维护性**：<mark>更好实现 UI和数据分离 </mark>

::: tip
  兼容性：vue3中可以使用vue2语法，vue2.7中也可以使用vue3语法（提供了setup的选项，供我们去使用vue3的api，但不推荐）
:::

对比：

1. 与普通函数

vueHooks虽然也只是一个函数，函数有的能力它都有

使用场景不同：但因为它和vue的api结合，就让它的使用场景范围缩小在了vue框架中，且只能在setup钩子中调用。

取决于是不是vueHooks的关键就是：是否在函数内部用了vue提供的api

2. 与react 的 Hook 对比

3. 与mixin（如上）

第三方库：

vue-hooks-plus

## 高级用法
### 过滤器【vue2】
1. 管道符，通过配置项filter进行配置，分为全局过滤器、vue单例过滤器
2. 在vue3中被废除，其功能使用methods、computed中也能实现

### 插件
十分实用的api，vuex、vueRouter等都是通过插件的方式集成在vue项目中
1. 定义：需要是一个install函数/一个包含install方法的对象，入参：Vue，options（调用时传递的）
2. 使用：vue.use(插件)
3. 实现源码
```js
  Vue.use = function (plugin: Function | any) {
    const installedPlugins =
      this._installedPlugins || (this._installedPlugins = [])
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)
    args.unshift(this)
    if (isFunction(plugin.install)) {
      plugin.install.apply(plugin, args)
    } else if (isFunction(plugin)) {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
```

### 自定义指令
一个按约定配置的特殊对象

对象属性包括：mounted等钩子

钩子入参：

（1）el：绑定的元素
（2）binding：指令的传递信息对象：value、oldValue、arg、modifiers(修饰符)
```js
  // v-focus:success.native="inputRef"
  {
    value: inputRef,
    oldValue: oldInputRef,
    org: 'success',
    modifiers: {
      native: true
    }
  }
```
（3）vNode
（4）prevNode

应用：封装一些与DOM相关的操作

v-model原理，就是通过自定义指令实现的语法糖：v-bind:model="value" + v-on:update:model="value"

### 异常捕获

### 异步组件
defineAsyncComponent 传参：① 一个返回组件的回调函数 () => import('') ② promise对象

体现在：打包时，会将异步组件单独打包成一个js文件

优点：优化了首页加载速度等

### Teleport
将组件移动到指定的元素下去

```js
  // to 接受一个css选择器语法的字符串 disabled 将目标元素移到定义时在的父组件下
  <Teleport to="body" disabled>
    <dialog />
  </Teleport>
```

原理：
在组件没加载前，先在指定位置放一个注释节点占位（createComment）

### 动画 transition
1. 类名：transition标签包裹的元素会在其进入/离开的时候自动添加相应的类名，只有动画过程中会有类名，动画结束后便移除 <br/>
（1）v-enter v-enter-active v-enter-to 进入动画 <br/>
（2）v-leave v-leave-active v-leave-to 移出动画


2. 样式配置：为类名添加动画样式配置 <br/>
（1）v-enter/v-leave：动画初始样式（透明度、宽高） <br/>
（2）v-enter-active/v-leave-active：动画中间态样式（动画时间、动画变化函数） <br/>
（3）v-enter-to/v-leave-to 动画结束后的样式（透明度、宽高）


3. 哪些情况会触发元素的进入/离开：
  - v-if
  - v-show
  - 由component标签动态切换的组件
  - 切换组件key导致


4. 特性 <br/>
（1）appear：设置页面进来一开始就有动画效果 <br/>
（2）自定义类名：name-定义前缀、自定义类名的属性enter-class/enter-to-class... <br/>
（3）钩子：<br/>
    - before-enter/enter/after-enter、before-leave... before-appear... before-cancelled... <br/>
    - 钩子参数：el、done回调函数（调用表示过渡结束）<br/>
    - before-cancelled：如果在一个动画没执行完就触发了另一个动画，就会执行cancelled


5. 其他动画

（1）结合@keyframe
  ```js
    @keyframes bounce {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.5);
      }
      100% {
        transform: scale(1);
      }
    }

    .v-enter-active {
      animation: bounce 0.5s;
    }

    .v-leave-active {
      animation: bounce 0.5s reverse;
    }
  ```
（2）结合其他第三方库：animate.css、velocity、gasp(数字动画过度)



## 应用
### 组件通信
1. 父向子：props
2. 子向父：defineExpose、slot作用域插槽
3. 祖先向子孙组件传值：provide/inject
4. 状态管理vuex、pinna

## 原理
### defineExpose 原理
暴露公共属性，只允许父组件访问这些属性。

父组件通过ref可以访问到这些暴露的属性

<mark>ref怎么实现的？</mark>

### vue响应式原理
![vue响应式原理](/assets/img/vue.png)
![Vue双向数据绑定](/assets/img/vue_theory.png)

发布订阅实现代码：
```js
  function Dep() {
      this.subs = [];
  }
  Dep.prototype.addSub = function (sub) {
      this.subs.push(sub);
  }
  Dep.prototype.notify = function () {
      this.subs.forEach(sub=>sub.update());
  }

  function Watcher(fn) {
      this.fn = fn;
  }
  Watcher.prototype.update = function () {
      this.fn();
  }

  var dep = new Dep();
  dep.addSub(new Watcher(function () {
      console.log('okokok');
  }))
  dep.notify();
```

## 生态
生态库都是基于vue官方提供的api能力做的拓展，如vuex和vueRouter都是通过插件的方式注入到实例中，再通过provide/inject绑定到vNode上供实例访问
### vuex
原理：使用vue提供的api（provide、inject）来实现，而provide是将数据挂载到vnode的appContext上下文中

\$store 能访问到是因为其挂载到了app.config.globalProp中

### pinna
mutation的逻辑直接由框架来维护，只有state、getter、action，更像是vuex与vue3 setup语法的结合

```js
  // stores/counter.js 定义
  import { defineStore } from 'pinia'

  export const useCounterStore = defineStore('counter', {
    state: () => {
      return { count: 0 }
    },
    // 也可以这样定义
    // state: () => ({ count: 0 })
    actions: {
      increment() {
        this.count++
      },
    },
  })

  // 使用
  import { useCounterStore } from '@/stores/counter'
  const counter = useCounterStore()
  counter.count++
  // 自动补全！ ✨
  counter.$patch({ count: counter.count + 1 })
  // 或使用 action 代替
  counter.increment()

  // 或者
  export const useCounterStore = defineStore('counter', () => {
    const count = ref(0)
    function increment() {
      count.value++
    }

    return { count, increment }
  })
```

### vue-router


### vue-cli
不只是一个脚手架，还集成webpack能力等，是一个大而全的解决方案 

从源码目录看包含的内容/能力：

1. docs(官方文档)、scripts(build、CI、plugin...)、
2. 添加插件：官方插件、固定格式命名的自定义插件
3. template(代码模板)：新建工程时/添加第三方库时，通过其插件自动创建模板

命令行脚本执行步骤：

① 判断包管理工具

② 安装插件

③ 调用其 Generator脚本 生成代码模板

④ 构建、启动服务


### create-vue
使用vite集成的脚手架（使用esbuild进行构建）

与vue-cli比较：无插件集成，比较轻量


## 框架比较
### vue2 与 vue3

### 前端框架设计模式对比
通过分离关注点的方式来组织代码结构，优化开发效率。

#### MVC (model view controller)

model通知view层更新(updateView)、controller处理用户与应用的响应操作，通过调用model层，来完成对model的修改。

![MVC](/assets/img/MVC.png)

#### MVVM (model view viewModel)

model层定义数据和业务逻辑，viewModel负责监听model中数据的变化，并且控制视图的更新。model与view层并无直接关联，而是通过viewModel进行联系

![MVVM](/assets/img/MVVM.png)


#### MVP (model view presenter)

相比于MVC，实现了view和model的解耦：MVC中只知道Model提供的接口，没办法控制视图的更新，而MVP中，view层暴漏了接口给presenter，因此它可以将view和model绑定在一起，实现同步更新

