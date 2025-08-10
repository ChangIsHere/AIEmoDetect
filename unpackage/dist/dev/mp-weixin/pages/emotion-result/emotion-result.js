"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      rawData: null,
      mainEmotion: "neutral",
      emotionLabel: "平静",
      emotionScore: 65,
      scoreColor: "#6847c2",
      analysisText: "正在加载分析结果...",
      suggestions: [
        "每天抽出15-20分钟进行冥想或深呼吸练习，有助于维持情绪稳定。",
        "保持规律的锻炼习惯，每周至少进行3次30分钟的有氧运动。",
        "与亲友保持良好的沟通，分享您的感受和经历。"
      ]
    };
  },
  onLoad(options) {
    if (options.data) {
      try {
        this.rawData = UTS.JSON.parse(decodeURIComponent(options.data));
        this.processAnalysisData();
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/emotion-result/emotion-result.uvue:94", "解析数据错误:", err);
        common_vendor.index.showToast({
          title: "数据解析失败",
          icon: "none"
        });
        this.generateFallbackData();
      }
    } else {
      this.generateFallbackData();
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      common_vendor.index.navigateBack();
    },
    // 分享结果
    shareResult() {
      common_vendor.index.showToast({
        title: "分享功能开发中",
        icon: "none"
      });
    },
    // 预约专家
    findProfessional() {
      common_vendor.index.showToast({
        title: "预约功能开发中",
        icon: "none"
      });
    },
    // 处理API返回的分析数据
    processAnalysisData() {
      if (!this.rawData || typeof this.rawData.text !== "string" || this.rawData.text.trim() === "") {
        common_vendor.index.__f__("warn", "at pages/emotion-result/emotion-result.uvue:133", "rawData或其text属性无效，生成备用数据。", this.rawData);
        this.generateFallbackData();
        return null;
      }
      try {
        const analysisText = this.rawData.text;
        common_vendor.index.__f__("log", "at pages/emotion-result/emotion-result.uvue:140", "收到的分析文本:", analysisText);
        const emotionKeywords = new UTSJSONObject({
          happy: ["快乐", "开心", "高兴", "喜悦", "积极", "愉悦", "欢乐", "幸福", "乐观"],
          sad: ["伤心", "难过", "悲伤", "消极", "忧郁", "沮丧", "痛苦", "悲痛", "哀伤"],
          angry: ["生气", "愤怒", "恼火", "烦躁", "暴怒", "恼怒", "气愤", "不满", "怨恨"],
          anxious: ["焦虑", "不安", "担忧", "紧张", "忧虑", "害怕", "恐惧", "压力", "惊慌"],
          neutral: ["平静", "中性", "平淡", "中立", "稳定", "普通", "一般"]
        });
        const emotionCounts = new UTSJSONObject({});
        let maxCount = 0;
        let dominantEmotion = "neutral";
        for (const emotion in emotionKeywords) {
          let count = 0;
          emotionKeywords[emotion].forEach((keyword = null) => {
            const regex = new RegExp(keyword, "g");
            const matches = analysisText.match(regex);
            if (matches)
              count += matches.length;
          });
          emotionCounts[emotion] = count;
          if (count > maxCount) {
            maxCount = count;
            dominantEmotion = emotion;
          }
        }
        this.mainEmotion = dominantEmotion;
        this.setEmotionDetails(dominantEmotion, analysisText);
        this.analysisText = this.formatAnalysisText(analysisText);
        this.generateSuggestions(dominantEmotion);
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/emotion-result/emotion-result.uvue:184", "处理分析数据错误:", err);
        this.generateFallbackData();
      }
    },
    // 格式化API返回的文本
    formatAnalysisText(text = null) {
      if (text.length > 300) {
        return text.substring(0, 300) + "...";
      }
      return text;
    },
    // 根据情绪类型设置详细信息
    setEmotionDetails(emotion = null, analysisText = null) {
      switch (emotion) {
        case "happy":
          this.emotionLabel = "开心";
          this.emotionScore = 85;
          this.scoreColor = "#32CD32";
          break;
        case "sad":
          this.emotionLabel = "伤心";
          this.emotionScore = 35;
          this.scoreColor = "#6495ED";
          break;
        case "angry":
          this.emotionLabel = "愤怒";
          this.emotionScore = 25;
          this.scoreColor = "#FF6347";
          break;
        case "anxious":
          this.emotionLabel = "焦虑";
          this.emotionScore = 40;
          this.scoreColor = "#FFA500";
          break;
        default:
          this.emotionLabel = "平静";
          this.emotionScore = 65;
          this.scoreColor = "#6847c2";
      }
    },
    // 生成建议
    generateSuggestions(emotion = null) {
      const suggestionsByEmotion = new UTSJSONObject({
        happy: [
          "继续保持当前的积极情绪，可以尝试记录让您感到快乐的事物。",
          "与他人分享您的积极情绪，传递正能量。",
          "利用这种积极状态尝试新事物或迎接挑战。"
        ],
        sad: [
          "尝试进行一些让您感到愉快的活动，如听音乐、看电影或与朋友交流。",
          "确保充足的睡眠和均衡的饮食，这对情绪健康非常重要。",
          "如果低落情绪持续时间较长，建议寻求专业心理咨询师的帮助。"
        ],
        angry: [
          "尝试深呼吸练习或冥想来平复情绪，这可以有效缓解愤怒。",
          "找到适当的方式表达您的感受，如写日记或与信任的人交谈。",
          "身体活动如跑步或健身可以帮助释放紧张情绪。"
        ],
        anxious: [
          "尝试正念冥想或渐进式肌肉放松技术来缓解焦虑。",
          "确保规律的生活作息，包括充足的睡眠和健康饮食。",
          "适当控制咖啡因和糖分的摄入，因为它们可能增加焦虑感。"
        ],
        neutral: [
          "每天抽出15-20分钟进行冥想或深呼吸练习，有助于维持情绪稳定。",
          "保持规律的锻炼习惯，每周至少进行3次30分钟的有氧运动。",
          "与亲友保持良好的沟通，分享您的感受和经历。"
        ]
      });
      this.suggestions = suggestionsByEmotion[emotion] || suggestionsByEmotion.neutral;
    },
    // 生成备用数据
    generateFallbackData() {
      this.mainEmotion = "neutral";
      this.emotionLabel = "未识别情绪";
      this.emotionScore = 50;
      this.scoreColor = "#6847c2";
      this.analysisText = "抱歉，未能获取到情绪分析结果。请确保网络连接正常，并尝试重新检测。或者您的描述可能不包含明显情绪信息。建议多和AI聊聊哦~";
      this.suggestions = [
        "确保设备麦克风和摄像头权限已开启。",
        "尝试在更安静的环境下进行语音录制和面部扫描。",
        "尝试用更丰富和直接的词语表达您的情绪。",
        "如果问题持续，请联系技术支持。"
      ];
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: $data.mainEmotion === "happy"
  }, $data.mainEmotion === "happy" ? {} : $data.mainEmotion === "sad" ? {} : $data.mainEmotion === "angry" ? {} : $data.mainEmotion === "anxious" ? {} : {}, {
    c: $data.mainEmotion === "sad",
    d: $data.mainEmotion === "angry",
    e: $data.mainEmotion === "anxious",
    f: common_vendor.n($data.mainEmotion),
    g: common_vendor.t($data.emotionLabel),
    h: common_vendor.t($data.emotionScore),
    i: $data.emotionScore + "%",
    j: $data.scoreColor,
    k: common_vendor.t($data.analysisText),
    l: common_vendor.f($data.suggestions, (item, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: common_vendor.t(item),
        c: index
      };
    }),
    m: common_vendor.o((...args) => $options.shareResult && $options.shareResult(...args)),
    n: common_vendor.o((...args) => $options.findProfessional && $options.findProfessional(...args)),
    o: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/emotion-result/emotion-result.js.map
