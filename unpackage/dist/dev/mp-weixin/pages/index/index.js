"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const negativeKeywords = [
  "难受",
  "心情不好",
  "自杀",
  "焦虑",
  "恐慌",
  "抑慌",
  "不想活",
  "压力大",
  "很累",
  "绝望",
  "无助",
  "烦躁",
  "痛苦",
  "崩溃",
  "想哭",
  "不开心",
  "伤心",
  "失眠",
  "没意义",
  "想放弃",
  "没人懂",
  "孤独",
  "害怕",
  "恐惧",
  "烦",
  "累",
  "不想说话",
  "不想动",
  "不想见人",
  "不想上班",
  "不想上学",
  "没动力",
  "没希望",
  "想死",
  "想离开",
  "烦闷",
  "心累",
  "心痛",
  "绝望",
  "麻木",
  "无感",
  "无聊",
  "无助",
  "无望",
  "不想活了",
  "撑不住",
  "撑不下去",
  "情绪低落",
  "消沉",
  "郁闷",
  "闷闷不乐",
  "萎靡不振",
  "沮丧",
  "悲伤",
  "哀伤",
  "愁苦",
  "失落",
  "灰心",
  "失望",
  "愤懑",
  "恼怒",
  "火大",
  "暴躁",
  "狂躁",
  "怨恨",
  "厌恶",
  "憎恨",
  "反感",
  "不满",
  "气愤",
  "紧张",
  "担忧",
  "忧虑",
  "不安",
  "手足无措",
  "心烦意乱",
  "忐忑",
  "惊恐",
  "骇然",
  "毛骨悚然",
  "不寒而栗",
  "寂寞",
  "孤单",
  "空虚",
  "失落",
  "无聊",
  "空虚",
  "迷茫",
  "彷徨",
  "困惑",
  "疲惫",
  "精疲力尽",
  "身心俱疲",
  "筋疲力尽",
  "虚弱",
  "乏力",
  "力不从心",
  "透支",
  "厌世",
  "生无可恋",
  "了无生趣",
  "苟延残喘",
  "行尸走肉",
  "自我否定",
  "自我怀疑",
  "无地自容",
  "羞愧",
  "内疚",
  "逃避",
  "躲避",
  "退缩",
  "不敢面对",
  "不敢想",
  "不想提",
  "忘不掉",
  "放不下",
  "走不出来"
];
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      messages: [],
      userInput: "",
      keyboardHeight: 0,
      animating: false,
      scrollTop: 0,
      loading: false,
      messageCount: 0,
      showEmotionModal: false,
      sessionId: "user_" + Date.now(),
      emotionCounter: 0,
      lastShowPromptTime: 0
      // 上次提示情绪扫描的时间
    };
  },
  methods: {
    // 新增：检测消息是否包含负面关键词
    containsNegativeKeyword(msg = null) {
      return negativeKeywords.some((word) => {
        return msg.includes(word);
      });
    },
    // 新增：检测AI回复中是否包含情绪扫描推荐关键词
    containsAIRecommendedKeyword(response = null) {
      const promptKeywords = [
        "情绪扫描",
        "情绪分析",
        "检测你的情绪",
        "心理检测",
        "情绪波动",
        "情绪状态",
        "心情如何",
        "心理状况",
        "需要帮助",
        "看起来很",
        "建议你",
        "似乎你在",
        "或许你需要",
        "我感受到你的",
        "看起来你可能在",
        "你的语气显示",
        "让我们一起"
      ];
      const emotionWordsInAIResponse = [
        "伤心",
        "难过",
        "焦虑",
        "担忧",
        "生气",
        "愤怒",
        "恐惧",
        "紧张",
        "压力",
        "困扰",
        "烦恼",
        "消极",
        "抑郁",
        "悲观"
      ];
      let foundPromptKeyword = promptKeywords.some((keyword) => {
        return response.includes(keyword);
      });
      let emotionWordCount = emotionWordsInAIResponse.filter((word) => {
        return response.includes(word);
      }).length;
      return foundPromptKeyword || emotionWordCount >= 2;
    },
    // 统一的情绪检测触发逻辑
    runComprehensiveEmotionCheck() {
      var e_1, _a;
      if (this.messageCount < 3) {
        return null;
      }
      if (Date.now() - this.lastShowPromptTime < 3e5) {
        return null;
      }
      let shouldTriggerModal = false;
      try {
        for (var _b = common_vendor.__values(this.messages), _c = _b.next(); !_c.done; _c = _b.next()) {
          var message = _c.value;
          if (message.type === "user") {
            if (this.containsNegativeKeyword(message.content)) {
              shouldTriggerModal = true;
              break;
            }
          } else if (message.type === "ai") {
            if (this.containsAIRecommendedKeyword(message.content)) {
              shouldTriggerModal = true;
              break;
            }
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return))
            _a.call(_b);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
      if (shouldTriggerModal && !this.showEmotionModal) {
        setTimeout(() => {
          this.showEmotionModal = true;
          this.lastShowPromptTime = Date.now();
        }, 1e3);
      }
    },
    // 处理消息发送
    handleSend() {
      if (!this.userInput.trim() || this.animating || this.loading)
        return null;
      const userText = this.userInput.trim();
      this.userInput = "";
      this.animating = true;
      this.loading = true;
      this.messages.push({
        content: userText,
        type: "user",
        id: Date.now()
      });
      this.$nextTick(() => {
        this.scrollToBottom();
        this.getAIResponse(userText);
        this.messageCount++;
        this.runComprehensiveEmotionCheck();
      });
    },
    // 调用API获取AI响应
    getAIResponse(userText = null) {
      common_vendor.index.showLoading({
        title: "分析中...",
        mask: false
      });
      utils_request.request.chatWithLLM(new UTSJSONObject({
        message: userText,
        sessionId: this.sessionId
      })).then((res = null) => {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("log", "at pages/index/index.uvue:222", "LLM响应:", res);
        const response = res.response_text;
        if (response) {
          this.messages.push({
            content: response,
            type: "ai",
            id: Date.now()
          });
          this.runComprehensiveEmotionCheck();
        } else {
          common_vendor.index.__f__("warn", "at pages/index/index.uvue:235", "LLM响应中未找到response_text或其为空:", res);
          common_vendor.index.showToast({ title: "AI响应内容为空", icon: "none", duration: 2e3 });
        }
      }).catch((err = null) => {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/index/index.uvue:241", "LLM请求失败:", UTS.JSON.stringify(err, null, 2));
        let errorMessage = "AI服务暂时不可用";
        if (err) {
          if (err.message) {
            errorMessage = err.message;
          }
          if (err.detail) {
            if (typeof err.detail === "string") {
              errorMessage += `: ${err.detail}`;
            } else if (err.detail.length > 0 && err.detail[0].msg) {
              errorMessage += `: ${err.detail[0].msg}`;
            }
          }
        }
        common_vendor.index.showToast({ title: errorMessage, icon: "none", duration: 4e3 });
      }).finally(() => {
        this.$nextTick(() => {
          this.scrollToBottom();
          this.loading = false;
          setTimeout(() => {
            this.animating = false;
          }, 300);
        });
      });
    },
    // 处理输入框点击
    handleInputClick() {
    },
    // 滚动到底部 - 使用scroll-view的滚动特性
    scrollToBottom() {
      setTimeout(() => {
        const query = common_vendor.index.createSelectorQuery().in(this);
        query.selectAll(".chat-box view").boundingClientRect((data = null) => {
          if (data && data.length > 0) {
            this.scrollTop = 1e4;
          }
        }).exec();
      }, 100);
    },
    // 关闭情绪检测弹窗
    closeEmotionModal() {
      this.showEmotionModal = false;
    },
    // 开始情绪检测
    startEmotionDetection() {
      this.closeEmotionModal();
      common_vendor.index.navigateTo({
        url: "/pages/emotion-detect/emotion-detect"
      });
    },
    onSettingTap() {
      common_vendor.index.showToast({ title: "设置功能开发中...", icon: "none" });
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f(20, (i, k0, i0) => {
      return {
        a: i
      };
    }),
    b: common_vendor.f($data.messages, (message, index, i0) => {
      return {
        a: common_vendor.t(message.content),
        b: message.id,
        c: common_vendor.n(message.type === "user" ? "user-message" : "ai-message")
      };
    }),
    c: $data.loading
  }, $data.loading ? {} : {}, {
    d: $data.scrollTop,
    e: common_vendor.o((...args) => $options.handleInputClick && $options.handleInputClick(...args)),
    f: common_vendor.o((...args) => $options.handleSend && $options.handleSend(...args)),
    g: $data.loading,
    h: $data.userInput,
    i: common_vendor.o(($event) => $data.userInput = $event.detail.value),
    j: common_vendor.o((...args) => $options.handleSend && $options.handleSend(...args)),
    k: $data.loading ? 1 : "",
    l: $data.showEmotionModal
  }, $data.showEmotionModal ? {
    m: common_vendor.o((...args) => $options.closeEmotionModal && $options.closeEmotionModal(...args)),
    n: common_vendor.o((...args) => $options.closeEmotionModal && $options.closeEmotionModal(...args)),
    o: common_vendor.o((...args) => $options.startEmotionDetection && $options.startEmotionDetection(...args)),
    p: common_vendor.o(() => {
    })
  } : {}, {
    q: common_vendor.o((...args) => $options.onSettingTap && $options.onSettingTap(...args)),
    r: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-00a60067"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
