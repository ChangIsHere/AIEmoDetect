"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/pages2/pages2.js";
  "./pages/pages3/pages3.js";
  "./pages/pages4/pages4.js";
  "./pages/emotion-detect/emotion-detect.js";
  "./pages/emotion-result/emotion-result.js";
}
const _sfc_main = common_vendor.defineComponent(new UTSJSONObject({
  onLaunch() {
    common_vendor.index.__f__("log", "at App.uvue:10", "App Launch");
  },
  onShow() {
    common_vendor.index.__f__("log", "at App.uvue:13", "App Show");
  },
  onHide() {
    common_vendor.index.__f__("log", "at App.uvue:16", "App Hide");
  }
}));
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  };
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  app.config.globalProperties.$global = {
    isApiInitialized: false,
    apiReadyCallbacks: [],
    // 注册API就绪回调
    onApiReady(callback = null) {
      if (this.isApiInitialized) {
        callback();
      } else {
        this.apiReadyCallbacks.push(callback);
      }
    },
    // 标记API已初始化并触发回调
    markApiAsInitialized() {
      this.isApiInitialized = true;
      this.apiReadyCallbacks.forEach((callback = null) => {
        try {
          callback();
        } catch (err) {
          common_vendor.index.__f__("error", "at main.uts:33", "API就绪回调执行错误:", err);
        }
      });
      this.apiReadyCallbacks = [];
    }
  };
  return {
    app,
    // 初始化完成时的回调
    onLaunch() {
      common_vendor.index.__f__("log", "at main.uts:46", "App onLaunch");
      setTimeout(() => {
        app.config.globalProperties.$global.markApiAsInitialized();
        common_vendor.index.__f__("log", "at main.uts:52", "标记API已初始化");
      }, 1500);
    }
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
