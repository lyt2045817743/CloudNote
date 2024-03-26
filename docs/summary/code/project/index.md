# 项目总结

## 【婷的空间】
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


## 【RN 异常组件】
### 异常处理
- ErrorBoundary能捕获到的
  - 
- ErrorBoundary不能捕获到的
  - 未处理的promise异常：在全局绑定onunhandledrejection回调，在回调中上报Sentry
  ```js
    function unhandRejection (exceptionError) {
      const error = exceptionError;
      error.name = `[Promise] ${exceptionError.name}`;
      if (!error) {
        return;
      }

      if (__DEV__) {
        Modal.confirm({
          title: '运行异常',
          message: `异常信息：${error}`,
          cancelText: '取消',
          okText: '快去解Bug！',
        });
        return;
      }

      // 手动上报Sentry
      Sentry.captureException(error);
    }

    global.onunhandledrejection = function onunhandledrejection(error) {
    // Warning: when running in "remote debug" mode (JS environment is Chrome browser),
    // this handler is called a second time by Bluebird with a custom "dom-event".
    // We need to filter this case out:
    if (error instanceof Error) {
      if (__DEV__) {
        console.log(`promise unHandle rejection exception:`, error?.stack);
      }
      unhandRejection && unhandRejection(error);
    }
  };
  ```
  - 事件处理、异步错误、自身抛出的错误：全局JS异常捕获
  ```js
    function customHandler (e, hasError) {
      !__DEV__ && hasError && Sentry.captureException(e);
    }
    // RN 侧
    global.ErrorUtils.setGlobalHandler(customHandler);
    // web 侧
    window.addEventListener('error', customHandler);
  ```

### 业务请求异常
通过exceptionType结合判断networkResponse请求code确定是否为业务请求异常
```js
  this.exceptionType = this.getNetworkExceptionType() ?? props?.exceptionType;

  // 返回异常类型：是接口异常还是网络错误
  getNetworkExceptionType() {
    const noNetworkFromReachability = this._checkNetworkFromReachability();
    const noNetworkFromResponse = ExceptionConfig._checkNetworkFromResponse(this.networkResponse);
    const isNoNetworkError = (noNetworkFromReachability || noNetworkFromResponse);
    const exceptionType = isNoNetworkError
      ? ExceptionType.NoNetwork 
      : this.networkResponse?.length ? ExceptionType.RequestError : null;

    return exceptionType;
  }

  // 静态方法，可以绕开异常组件，单独对接口状态进行判断
  static _checkNetworkFromResponse(networkResponse) {
    let noNetwork = false;
    const errList = networkResponse ?? this.networkResponse ?? [];
    if (Array.isArray(errList)) {
      if (errList.length > 0) {
        // 底层对接口异常进行统一拦截处理后修改成-1000
        noNetwork = errList[0]?.code === -1000;
      }
    } else {
      noNetwork = errList?.code === -1000;
    }
    return noNetwork;
  }

```

关于-1000的code来源
```js
  export const BslNetImpl = {
    async fetchData(options) {
      const app = GetAppData();
      const logger = app?.getLogger();

      const mode = app?.getHostMode() || 'release';
      let { baseURL, url, headers, enableUnifiedErrorHandler = false } = options;

      try {
        const httpRequest = GetAppData().getRequest();

        const result = await httpRequest.request(options);

        // 默认异常处理
        if (enableUnifiedErrorHandler) {
          // 返回的body为空的情况
          if (!result) {
            return renderDataNull();
          }

          // code不是0，且不是serviceToken失效的情况
          if (result.code != 0 || result.code != 1001) {
            return renderServerError(null);
          }
        }

        return result;
      } catch (error) {
        // 错误日志上报
        const netUrl = baseURL + url;
        let errorCode = '';
        let errorMessage = '';
        errorCode = error?.code ?? (typeof error?.response !== 'string' && error?.response?.code);
        errorMessage = error?.message ?? (typeof error?.response !== 'string' ? error?.response?.message : error?.response);

        try {
          logger?.verbose && logger.verbose(
            'RN',
            JSON.stringify({
              source: 'network request',
              netUrl,
              errorCode,
              errorMessage,
            }),
            'log'
          );

          logger?.printLog && logger.printLog(
            'RN',
            JSON.stringify({
              source: 'network request',
              netUrl,
              errorCode,
              errorMessage,
            }),
            2,
            'log',
            false
          );
        } catch (error) {
          console.log('log verbose error:', error);
        }

        if (error && error.code == 401) {
          return error;
        }

        const req = {
          url: baseURL + url,
          host: baseURL,
          path: url,
        };

        if (error) {
          error.req = req;
        }

        // 默认异常处理
        if (enableUnifiedErrorHandler) {
          if (error && error.response && error.response.status > 401 && error.response.status < 600) {
            return renderNetError(error);
          }
        }

        return {
          success: false,
          code: errorCode ?? -1000,
          message: errorMessage ?? '网络请求错误，请检查网络是否正常',
          error,
          req,
        };
      }
    },
  };

  const fetchDataOuter = {
    async fetchRequest(fetchFun, timeout = 30000) {
      let timer = null;
      const request = new Promise((resolve, reject) => {
        fetchFun().then(
          (res) => {
            if (timer) {
              clearTimeout(timer);
            }
            resolve(res);
          },
          (error) => {
            if (timer) {
              clearTimeout(timer);
            }
            reject(error);
          }
        );
      });
      // 定义一个延时函数
      const timeoutRequest = new Promise((resolve, reject) => {
        timer = setTimeout(typeof resolve === 'function' ? resolve : (res) => res, timeout, {
          type: 'timeout',
        });
      });

      // 竞时函数，谁先完成调用谁
      return Promise.race([request, timeoutRequest]).then(
        (res) => {
          if (timer) {
            clearTimeout(timer);
          }
          return res;
        },
        (error) => {
          if (timer) {
            clearTimeout(timer);
          }
          throw new Error(error);
        }
      );
    },
  };

  export const BslPipeImpl = {
    async appRequest(params) {
      const { host, path, param = [], method = 'POST', timeout, cancelToken, headers, showLogin } = params;

      let result;

      if (timeout && typeof timeout === 'number' && !isNaN(timeout) && timeout > 0) {
        result = await fetchDataOuter
          .fetchRequest(async () => {
            return await BslNetImpl.fetchData({
              baseURL: host,
              headers,
              method,
              url: path,
              data: param,
              showLogin,
              // timeout,
              cancelToken,
            });
          }, timeout)
          .then((response) => {
            if (response?.type === 'timeout') {
              RRLog.info('RRBSL-BslPipeImpl-timeout-', path);
              return {
                ...NetConst.TimeoutError,
                req: {
                  path,
                },
              };
            } else {
              return response;
            }
          })
          .catch(() => {
            RRLog.info('RRBSL-BslPipeImpl-timeout-catch', path);
            return {
              ...NetConst.CatchError, // -1000
              req: {
                path,
              },
            };
          });
      } else {
        result = await BslNetImpl.fetchData({
          baseURL: host,
          headers,
          method,
          url: path,
          data: param,
          showLogin,
          // timeout,
          cancelToken,
        });
      }

      const ret = result && result.request ? result.request : result;

      return ret;
    },
  };

  async getCompanyRankData(params) {
    return await BslPipeImpl.appRequest(BusinessPlanNet.getCompanyRankData(params));
  },

  getCompanyRankData(param) {
    return {
      method: 'POST',
      path: '/api/proretail/bi/v1/warroom/company/plan/union/rank',
      param,
    };
  },
```

### 网络异常
```js
  _checkNetworkFromReachability() {
    return !NetworkReachability.isConnected;
  }

  import NetInfo from '@react-native-community/netinfo';
  class NetworkReachability {
    static shared = new NetworkReachability();
    // in constructor function
    NetInfo.addEventListener((reach) => {
      if (this._networkIsConnected === reach.isInternetReachable) {
        return;
      }
      this._networkType = reach.type;
      this._networkIsConnected = reach.isInternetReachable;

      // 处理用来监听网络变化的回调函数map
      for (const key in this._listenerMap) {
        if (Object.hasOwnProperty.call(this._listenerMap, key)) {
          const fn = this._listenerMap[key];
          fn?.({ isConnected: this._networkIsConnected, type: this._networkType });
        }
      }
    });

    get isConnected() {
      return this._networkIsConnected;
    }
  }
```
### 使用场景
#### 


## 【直播】
#### 目录结构
```
  #  |--src
  #  |    |-- common  一些公共模块
  #  |    |   |-- LiveManager
  #  |    |   |   |-- AliyunLiveError.ts 阿里云错误码及文案映射
  #  |    |   |   |-- LiveError.ts 封装直播错误类
  #  |    |   |   |-- LiveManager.ts 二次封装Aliyun rts sdk
  #  |    |   |-- LiveSocket 二次封装socket类
  #  |    |-- controller
  #  |    |   |-- live api中转站 对出参入参进行预处理
  #  |    |-- model
  #  |    |   |-- live
  #  |    |   |   |-- Message
  #  |    |   |   |   |-- LiveMentorMessage.ts 讲师消息类
  #  |    |   |   |   |-- LiveMessage.ts IM消息基类
  #  |    |   |   |   |-- LiveOnlineMessage.ts 在线人数消息类
  #  |    |   |   |   |-- LiveUserMessage.ts 观众消息类
  #  |    |   |   |-- LivePlayer.ts 封装直播播放器类
  #  |    |   |   |-- LiveRoom.ts 封装直播间类
  #  |    |   |   |-- LiveRoomPlayer.ts
  #  |    |   |   |-- LiveTeacher.ts 讲师类
  #  |    |-- pages  业务代码
  #  |    |   |-- liveManage(_modules)  业务模块（可重复建多个）
  #  |    |   |   |-- components
  #  |    |   |   |   |-- LiveBox.vue
  #  |    |   |   |   |-- MessageBox.vue
  #  |    |   |   |   |-- MessageItem.vue
  #  |    |   |   |   |-- OBSLive.vue
  #  |    |   |   |   |-- SignInDialog.vue
  #  |    |   |   |-- utils
  #  |    |   |   |   |-- index.ts  业务模块的公共方法
  #  |    |   |   |   |-- common.ts  业务模块的公共静态数据
  #  |    |   |   |-- hooks
  #  |    |   |   |   |-- use-signIn.ts
  #  |    |   |   |-- ChatRoom 聊天室功能模块
  #  |    |   |   |   |-- MessageManager.ts 
  #  |    |   |   |   |-- MessageSocket.ts 
  #  |    |   |   |   |-- MessageController.ts 
  #  |    |   |   |-- LiveSignInPool 签到池功能模块
  #  |    |   |   |   |-- SignIn.ts 签到类
  #  |    |   |   |   |-- SignInController.ts 签到控制类
  #  |    |   |   |-- index.vue
  #  |    |   |   |-- detail.vue
  #  |    |   |   |-- inLive.vue
  #  |    |   |   |-- playBack.vue
  #  |    |   |   |-- LiveRoomManager.ts 
```

### IM模块
1. 视图层
```js
  // view of MessageBox
  <MessageItem
    v-for="(item, index) in messageController.messages"
    :key="index"
    :message="item"
    :is-diff-with-the-last-guy="
      Boolean(item.content?.nickName !== messageController.messages[index - 1]?.content?.nickName)
    "
  />
  // setup 钩子
  // 1-初始化消息管理器
  const messageController = reactive(new MessageController(props.liveRoom));
  // 绑定钩子
  messageController.onMessage(function() { // 接收消息
    if (atBottom.value) {
      // 自动滚到最新消息
      scrollToBottom();
    }
  });

  messageController.onError((e, params) => {
    const { reconnectedNum, reconnectOptions } = params ?? {};
    if (reconnectedNum === reconnectOptions?.maxRetries) {
      ElMessage.error('尝试重连失败，请刷新页面重试');
    }
    if (reconnectedNum === 0) {
      ElMessage.error('互动区连接失败，尝试重连，重连中...');
    }
  });

  messageController.onConnectSuccess(() => {
    console.log('互动区连接成功');
  });

  // 2-发送消息 
  const myMessage = ref('');
  function sendMessageByChat() {
    // 不能发送空消息
    if (myMessage.value.trim() === '') {
      myMessage.value = '';
      return;
    }

    messageController.sendMessage(myMessage.value);

    // 重置输入框内容
    myMessage.value = '';

    // 自动滚到最新消息
    scrollToBottom();
  }

  // 系统自动下发消息-抛出给父组件，再由父组件传递给签到组件
  function sendMessage(message: string) {
    // 开启/结束签到时，自动下发消息
    if (message) {
      messageController.sendMessage(message);
      scrollToBottom();
    }
  }
  defineExpose({
    sendMessage
  });

  // 滚动交互
  // 自动滚到底部
  function scrollToBottom() {
    setTimeout(() => {
      if (msgBoxRef.value) msgBoxRef.value.scrollTop = msgBoxRef.value?.scrollHeight;
    }, 0);
  }

  // 滚动监听事件
  let initPosition = 0;
  const isLoading = ref(false); // 控制上面加载状态
  const atBottom = ref(true); // 控制一键回到底部按钮展示
  function handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = msgBoxRef.value || {};
    const scroll = scrollTop - initPosition;
    initPosition = scrollTop;

    // 向上滑动
    if (scroll < 0) {
      // 上滑距离等于50时，开始展示向下箭头
      if (scrollHeight - scrollTop - clientHeight === 50) {
        atBottom.value = false;
      }

      // 滑到顶部 && 没有正在加载数据
      if (scrollTop < 10 && !isLoading.value) {
        console.log('我到顶部啦');
        const lastScrollHeight = scrollHeight;
        isLoading.value = true;
        setTimeout(async () => {
          await messageController.loadHistoryMessages();
          const newScrollTop = msgBoxRef.value?.scrollHeight - lastScrollHeight;
          if (msgBoxRef.value) msgBoxRef.value.scrollTop = newScrollTop;
          isLoading.value = false;
        }, 200);
      }
    }

    // 滚动到底部
    if (!atBottom.value && scrollHeight - scrollTop === clientHeight) {
      atBottom.value = true;
      console.log('已到底部');
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, true);
    scrollToBottom();
  });
```

2. 控制层
```js
export default class MessageController {
  private liveController: LiveController;

  private page: number = 1;

  private pageSize: number = 20;

  private latestMessageTime: number | null = null;

  private useMessageTimes = 0;

  public isMuted: boolean = false;

  constructor(liveRoom) {
    this.liveController = new LiveController();
    this.messageManager = new MessageManager();
    this.messageSocket = new MessageSocket();
    this.liveRoom = liveRoom;
  }

  // 消息列表
  public get messages() {
    return this.messageManager.messages;
  }

  private get roomId() {
    return this.liveRoom.roomId;
  }

  private get liveTeacher() {
    return this.liveRoom.liveTeacher;
  }

  public onMessage (callback) {
    const c = (e: any) => {
      const rawMessage = JSON.parse(e?.data ?? {});
      let message: LiveUserMessage;
      let content: any;
      switch (rawMessage?.t) {
        case LiveMessageType.MentorComment:
        case LiveMessageType.UserComment:
          message = this.messageManager.generateMessage(rawMessage?.c ?? {}, rawMessage?.t);
          this.messageManager.addMessage(message);

          if (this.useMessageTimes === 0) {
            const time = message.content.time ?? null;
            this.latestMessageTime = time;
          }
          this.useMessageTimes++;
          
          callback && callback();
          break;
        default:
          break;
      }
    }
    this.messageSocket.onMessage(c);
  }

  /**
   * @description 发送消息
   */
    public sendMessage(content: string) {
      const messageInfo = {
        message: content ?? '',
        avatar: this.liveTeacher?.avatar ?? '',
        workplace: this.liveTeacher?.workplace ?? '',
        nickName: this.liveTeacher?.nickname ?? ''
      };
      const message =  this.messageManager.generateMessage(messageInfo, LiveMessageType.MentorComment);
      this.messageSocket.sendMessage(message);
      this.messageManager.addMessage(message.submitMessage);
    }

  /**
   * @description 加载历史消息
   */
  public async loadHistoryMessages() {
    const res: any = await this.liveController.getCommentsList({
      roomId: this.roomId ?? 0,
      page: this.page,
      pageSize: this.pageSize,
      commentTime: this.latestMessageTime
    });
    if (res?.code === 0) {
      const list = res?.data;
      this.messageManager.unshiftMessage(...list);
      this.page++;
    }
    return this.page;
  }

  /**
   * @description 连接成功
   */
  public onConnectSuccess(callback: () => {}) {
    this.messageSocket.onConnectSuccess(callback);
  }

  public onError(callback: (e: any, params: Object) => void) {
    this.messageSocket.onError(callback);
  }
}
```

3. 基类-MessageManager
```js
import LiveMentorMessage from '@/model/live/Message/LiveMentorMessage';
import { LiveMessageType } from '@/model/live/Message/LiveMessage';
import LiveUserMessage from '@/model/live/Message/LiveUserMessage';

class LiveUserMessageFactory {
  createProduct(content) {
    return new LiveUserMessage(content);
  }
}

class LiveMentorMessageFactory {
  createProduct(content) {
    return new LiveMentorMessage(content);
  }
}

export default class MessageManager {
  // 双向消息队列
  private messageDequeue: Array<LiveMentorMessage | LiveUserMessage> = [];

  constructor() {
    this.messageDequeue = [];
    this.mentorMessageFactory = new LiveMentorMessageFactory();
    this.userMessageFactory = new LiveUserMessageFactory();
  }

  // 消息列表
  public get messages() {
    return this.messageDequeue;
  }

  public generateMessage(content, type) {
    switch(type) {
      case LiveMessageType.MentorComment:
        return this.mentorMessageFactory.createMessage(content);
      case LiveMessageType.UserComment:
        return this.userMessageFactory.createMessage(content);
      default:
        return null;
    }
  }

  public addMessage(message) {
    this.messageDequeue.push(message);
  }

  private unShiftMessage() {
    this.messageDequeue.unShift(...list);
  }

}
```

4. 基类-MessageSocket
```js
/* eslint-disable class-methods-use-this */
import Cookies from 'js-cookie';
import LiveSocket from '@/common/LiveSocket';

const isDevOrTest =
  process.env.VUE_APP_ENV === 'devtest' || process.env.VUE_APP_ENV === 'development';

const environmentWsConfig = {
  devOrTest: {
    wssAddress: 'wss://ws-m.test.mi.com/proretail_p2p',
    tokenKey: 'upc_nr_token_outer_dev'
  },
  preOrRelease: {
    wssAddress: 'wss://ws.m.mi.com/proretail_p2p',
    tokenKey: 'upc_nr_token_outer'
  }
};
const wsConfig = isDevOrTest ? environmentWsConfig.devOrTest : environmentWsConfig.preOrRelease;
export default class MessageSocket {
  // socket实例
  private liveSocket: LiveSocket;

  // 重新连接次数
  private reconnectedNum: number = -1;

  // 连接地址
  private address = () => {
    this.reconnectedNum++;
    const reconnected = this.reconnectedNum > 0;

    return `${wsConfig.wssAddress}?reconnected=${reconnected}&proretail-version=1&roomId=${this.roomId}`;
  };

  // websocket子协议
  private protocol: Array<string> = [];

  // 重新请求的配置参数
  private reconnectOptions: Object = {
    connectionTimeout: 1000, // 重新请求间隔时间
    maxRetries: 10 // 最大尝试次数
  };

  // 初始化 WebSocket 连接等操作
  constructor() {
    this.setToken();
    this.liveSocket = new LiveSocket(this.address, this.protocol, this.reconnectOptions);
  }

  private setToken() {
    const TOKEN = Cookies.get(wsConfig.tokenKey) ?? '';
    this.protocol = [TOKEN];
  }

  /**
   * @description 接收长连接消息
   */
  public onMessage(callback: () => void) {
    this.liveSocket.onMessage(callback);
  }

  /**
   * @description 发送消息
   */
  public sendMessage(submitMessage) {
    this.liveSocket.send(JSON.stringify(submitMessage));
  }

  /**
   * @description 连接成功
   */
  public onConnectSuccess(callback: () => {}) {
    this.liveSocket.onOpen(callback);
  }

  public onError(callback: (e: any, params: Object) => void) {
    this.liveSocket.onError((e) => {
      callback(e, {
        reconnectedNum: this.reconnectedNum,
        reconnectOptions: this.reconnectOptions
      });
    });
  }
}
```

### 签到模块

## 【新零售工作台】
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