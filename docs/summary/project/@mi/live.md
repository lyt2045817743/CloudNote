# 直播
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
