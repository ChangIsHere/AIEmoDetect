"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent(new UTSJSONObject({
  __name: "pages3",
  setup(__props) {
    function startTherapy(name = null) {
      common_vendor.index.showToast({
        title: "开始 " + name,
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
        j: common_assets._imports_0,
        k: common_vendor.o(($event = null) => {
          return startTherapy("冥想放松练习");
        }),
        l: common_assets._imports_1,
        m: common_vendor.o(($event = null) => {
          return startTherapy("认知行为疗法");
        }),
        n: common_assets._imports_2,
        o: common_vendor.o(($event = null) => {
          return startTherapy("呼吸调节练习");
        }),
        p: common_assets._imports_3,
        q: common_vendor.o(($event = null) => {
          return startTherapy("情绪日记");
        }),
        r: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
      };
      return __returned__;
    };
  }
}));
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ce15a109"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/pages3/pages3.js.map
