"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent(new UTSJSONObject({
  __name: "pages4",
  setup(__props) {
    function handleMenuItem(name = null) {
      common_vendor.index.showToast({
        title: "点击了" + name,
        icon: "none"
      });
    }
    return (_ctx = null, _cache = null) => {
      const __returned__ = {
        a: common_vendor.f(20, (i = null, k0 = null, i0 = null) => {
          return {
            a: i
          };
        }),
        b: Math.random() * 100 + "%",
        c: Math.random() * 100 + "%",
        d: Math.random() * 0.5 + 0.3,
        e: Math.random() * 3 + 1 + "rpx",
        f: Math.random() * 3 + 1 + "rpx",
        g: "0 0 " + (Math.random() * 10 + 5) + "rpx rgba(255, 255, 255, 0.8)",
        h: Math.random() * 15 + "s",
        i: Math.random() * 30 + 15 + "s",
        j: common_assets._imports_0$1,
        k: common_assets._imports_1$1,
        l: common_vendor.o(($event = null) => {
          return handleMenuItem("历史记录");
        }),
        m: common_assets._imports_2$1,
        n: common_vendor.o(($event = null) => {
          return handleMenuItem("情绪分析报告");
        }),
        o: common_assets._imports_3$1,
        p: common_vendor.o(($event = null) => {
          return handleMenuItem("设置");
        }),
        q: common_assets._imports_4,
        r: common_vendor.o(($event = null) => {
          return handleMenuItem("帮助与反馈");
        }),
        s: common_assets._imports_5,
        t: common_vendor.o(($event = null) => {
          return handleMenuItem("关于我们");
        }),
        v: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
      };
      return __returned__;
    };
  }
}));
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ec542b81"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/pages4/pages4.js.map
