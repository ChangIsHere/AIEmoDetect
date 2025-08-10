"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent(new UTSJSONObject({
  __name: "pages2",
  setup(__props) {
    function startScale() {
      common_vendor.index.showToast({
        title: "即将开始测评",
        icon: "none"
      });
    }
    return (_ctx = null, _cache = null) => {
      const __returned__ = {
        a: common_vendor.o(startScale),
        b: common_vendor.o(startScale),
        c: common_vendor.o(startScale),
        d: common_vendor.o(startScale),
        e: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
      };
      return __returned__;
    };
  }
}));
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e175b73e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/pages2/pages2.js.map
