# 零售通 APP
## 以旧换新

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

