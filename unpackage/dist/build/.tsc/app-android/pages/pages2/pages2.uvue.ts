import { ref, computed } from 'vue';


const __sfc__ = defineComponent({
  __name: 'pages2',
  setup(__props): any | null {
const __ins = getCurrentInstance()!;
const _ctx = __ins.proxy as InstanceType<typeof __sfc__>;
const _cache = __ins.renderCache;

const showScaleQuestionnaire = ref(false);
const currentScaleType = ref(''); // 'DASS21' or 'PHQ9'
const currentQuestionIndex = ref(0);
const userAnswers = ref({}); // Stores answers for the current questionnaire { questionId: score }

const dass21Questions = [
  { id: 1, text: '我感觉很难让自己安静下来' },
  { id: 2, text: '我感到口干' },
  { id: 3, text: '我好像不能再有任何愉快、舒畅的感觉' },
  { id: 4, text: '我感到呼吸困难(例如不是做运动时也感到气促或透不过气来)' },
  { id: 5, text: '我感到很难自动去开始工作' },
  { id: 6, text: '我对事情往往作出过敏反应' },
  { id: 7, text: '我感到颤抖(例如手震)' },
  { id: 8, text: '我觉得自己消耗很多精神' },
  { id: 9, text: '我忧虑一些自己恐慌或出丑的场合' },
  { id: 10, text: '我觉得自己对将来没有甚么可盼望' },
  { id: 11, text: '我感到忐忑不安' },
  { id: 12, text: '我感到很难放松自己' },
  { id: 13, text: '我感到忧 沮丧' },
  { id: 14, text: '我无法容忍任何阻碍我继续作的事情' },
  { id: 15, text: '我感到快要恐慌了' },
  { id: 16, text: '我对任何事也不能热衷' },
  { id: 17, text: '我觉得自己不怎么配做人' },
  { id: 18, text: '我发觉自己很容易被触怒' },
  { id: 19, text: '我察觉自己没有明显的体力劳动时，也感到心律不正常' },
  { id: 20, text: '我无缘无故地感到害怕' },
  { id: 21, text: '我感到生命毫无意义' }
];

const phq9Questions = [
  { id: 1, text: '做事情几乎没有兴趣或乐趣' },
  { id: 2, text: '感到情绪低落，沮丧或绝望' },
  { id: 3, text: '难以入睡或保持睡眠，或睡得太多' },
  { id: 4, text: '感到疲倦或没有精力' },
  { id: 5, text: '食欲不振或暴饮暴食' },
  { id: 6, text: '对自己感到不好，或觉得自己是个失败者，或让自己或家人失望' },
  { id: 7, text: '难以集中注意力，例如阅读报纸或看电视' },
  { id: 8, text: '行动或说话缓慢，以至于其他人可能注意到，或者相反—坐立不安或烦躁不安，比平时动得更多' },
  { id: 9, text: '觉得自己死了会更好，或想伤害自己的念头' }
];

// 计算当前量表的题目列表
const currentQuestions = computed(() => {
  if (currentScaleType.value === 'DASS21') {
    return dass21Questions;
  } else if (currentScaleType.value === 'PHQ9') {
    return phq9Questions;
  }
  return [];
});

// 计算当前显示的题目
const currentQuestion = computed(() => {
  return currentQuestions.value[currentQuestionIndex.value];
});

// DASS21 评估值
const dass21Options = [
  { value: 0, text: '不适用' },
  { value: 1, text: '很适用，或经常适用' },
  { value: 2, text: '非常适用' },
  { value: 3, text: '最适用' }
];

// PHQ-9 评估值
const phq9Options = [
  { value: 0, text: '完全没有' },
  { value: 1, text: '几天' },
  { value: 2, text: '一半以上日子' },
  { value: 3, text: '几乎每天' }
];

// 计算当前量表的选项
const currentOptions = computed(() => {
  if (currentScaleType.value === 'DASS21') {
    return dass21Options;
  } else if (currentScaleType.value === 'PHQ9') {
    return phq9Options;
  }
  return [];
});

function startScale(type) {
  uni.navigateTo({
    url: `/pages/questionnaire/questionnaire?scaleType=${type}`
  });
}

function selectAnswer(questionId, score) {
  userAnswers.value[questionId] = score;
}

function nextQuestion() {
  if (currentQuestionIndex.value < currentQuestions.value.length - 1) {
    currentQuestionIndex.value++;
  } else {
    submitScale();
  }
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
}

async function submitScale() {
  // 检查是否所有题目都已回答
  const allAnswered = currentQuestions.value.every(q => userAnswers.value[q.id] !== undefined);
  if (!allAnswered) {
    uni.showToast({
      title: '请回答所有题目',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  // 整理数据，准备存储或发送后端
  const results = {
    scaleType: currentScaleType.value,
    timestamp: Date.now(),
    answers: userAnswers.value,
    // 可以在这里计算总分等，或留给后端
    totalScore: Object.values(userAnswers.value).reduce((sum, score) => sum + score, 0)
  };

  try {
    // 存储结果到本地
    await uni.setStorage({
      key: `scaleResult_${results.scaleType}_${results.timestamp}`,
      data: JSON.stringify(results)
    });
    console.log('量表结果已存储:', results);

    uni.showToast({
      title: '测评完成，结果已保存',
      icon: 'success',
      duration: 2000
    });

    // TODO: 将来在此处调用后端算法，将数据传给算法端
    // 例如: request.sendScaleResults(results);

  } catch (error) {
    console.error('量表结果保存失败:', error);
    uni.showToast({
      title: '结果保存失败',
      icon: 'error',
      duration: 2000
    });
  }

  // 返回量表列表视图
  showScaleQuestionnaire.value = false;
}

function backToScaleList() {
  showScaleQuestionnaire.value = false;
  currentScaleType.value = '';
}


return (): any | null => {

  return createElementVNode("view", utsMapOf({ class: "container" }), [
    createElementVNode("view", utsMapOf({ class: "header animate-fade-in" }), [
      createElementVNode("text", utsMapOf({ class: "title" }), "量表生成")
    ]),
    createElementVNode("view", utsMapOf({ class: "scale-list" }), [
      createElementVNode("view", utsMapOf({
        class: "scale-item animate-slide-in",
        style: normalizeStyle(utsMapOf({"--i":"0"})),
        onClick: () => {startScale('PHQ9')}
      }), [
        createElementVNode("view", utsMapOf({ class: "scale-info" }), [
          createElementVNode("text", utsMapOf({ class: "scale-title" }), "抑郁症状评估量表 (PHQ-9)"),
          createElementVNode("text", utsMapOf({ class: "scale-desc" }), "用于评估抑郁症状的严重程度")
        ]),
        createElementVNode("view", utsMapOf({ class: "start-button" }), "开始")
      ], 12 /* STYLE, PROPS */, ["onClick"]),
      createElementVNode("view", utsMapOf({
        class: "scale-item animate-slide-in",
        style: normalizeStyle(utsMapOf({"--i":"1"})),
        onClick: () => {startScale('DASS21')}
      }), [
        createElementVNode("view", utsMapOf({ class: "scale-info" }), [
          createElementVNode("text", utsMapOf({ class: "scale-title" }), "抑郁-焦虑-压力量表 (DASS-21)"),
          createElementVNode("text", utsMapOf({ class: "scale-desc" }), "同时评估抑郁、焦虑和压力症状")
        ]),
        createElementVNode("view", utsMapOf({ class: "start-button" }), "开始")
      ], 12 /* STYLE, PROPS */, ["onClick"])
    ])
  ])
}
}

})
export default __sfc__
const GenPagesPages2Pages2Styles = [utsMapOf([["container", padStyleMapOf(utsMapOf([["backgroundColor", "#050410"], ["backgroundSize", "4px 4px,\n\t\t\t400% 400%"], ["animation", "gradient-bg 8s ease infinite"], ["display", "flex"], ["flexDirection", "column"], ["alignItems", "center"], ["paddingTop", "40rpx"], ["paddingRight", "30rpx"], ["paddingBottom", "40rpx"], ["paddingLeft", "30rpx"], ["boxSizing", "border-box"], ["position", "relative"], ["overflow", "hidden"], ["content::before", "''"], ["position::before", "absolute"], ["top::before", 0], ["left::before", 0], ["right::before", 0], ["bottom::before", 0], ["animation::before", "pulse-bg 15s ease-in-out infinite alternate"], ["zIndex::before", 0]]))], ["header", padStyleMapOf(utsMapOf([["width", "100%"], ["paddingTop", "20rpx"], ["paddingRight", "20rpx"], ["paddingBottom", "20rpx"], ["paddingLeft", "20rpx"], ["marginBottom", "40rpx"], ["display", "flex"], ["justifyContent", "center"], ["position", "relative"], ["zIndex", 1]]))], ["title", padStyleMapOf(utsMapOf([["color", "#FFFFFF"], ["fontSize", "36rpx"], ["textAlign", "center"], ["textShadow", "0 2rpx 4rpx rgba(0, 0, 0, 0.3)"]]))], ["scale-list", padStyleMapOf(utsMapOf([["width", "92%"], ["flex", 1], ["display", "flex"], ["flexDirection", "column"], ["gap", "25rpx"], ["overflowY", "auto"], ["position", "relative"], ["zIndex", 1], ["paddingTop", "10rpx"], ["paddingRight", "10rpx"], ["paddingBottom", "10rpx"], ["paddingLeft", "10rpx"], ["maxWidth", "650rpx"], ["marginTop", 0], ["marginRight", "auto"], ["marginBottom", 0], ["marginLeft", "auto"]]))], ["scale-item", padStyleMapOf(utsMapOf([["display", "flex"], ["justifyContent", "space-between"], ["alignItems", "center"], ["backgroundImage", "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.9))"], ["backgroundColor", "rgba(0,0,0,0)"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["paddingTop", "25rpx"], ["paddingRight", "30rpx"], ["paddingBottom", "25rpx"], ["paddingLeft", "30rpx"], ["boxShadow", "0 4rpx 10rpx rgba(0, 0, 0, 0.2)"], ["transitionDuration", "0.3s"], ["transitionTimingFunction", "ease"], ["transform:active", "scale(0.98)"], ["boxShadow:active", "0 2rpx 5rpx rgba(0, 0, 0, 0.3)"]]))], ["scale-info", padStyleMapOf(utsMapOf([["flex", 1]]))], ["scale-title", padStyleMapOf(utsMapOf([["fontSize", "32rpx"], ["color", "#333333"], ["marginBottom", "10rpx"]]))], ["scale-desc", padStyleMapOf(utsMapOf([["fontSize", "24rpx"], ["color", "#666666"]]))], ["start-button", padStyleMapOf(utsMapOf([["backgroundColor", "#6b5b95"], ["color", "#FFFFFF"], ["paddingTop", "10rpx"], ["paddingRight", "20rpx"], ["paddingBottom", "10rpx"], ["paddingLeft", "20rpx"], ["borderTopLeftRadius", "10rpx"], ["borderTopRightRadius", "10rpx"], ["borderBottomRightRadius", "10rpx"], ["borderBottomLeftRadius", "10rpx"], ["fontSize", "28rpx"], ["boxShadow", "0 2rpx 5rpx rgba(0, 0, 0, 0.2)"], ["transitionDuration", "0.2s"], ["transitionTimingFunction", "ease"], ["transform:active", "scale(0.95)"], ["boxShadow:active", "0 1rpx 3rpx rgba(0, 0, 0, 0.3)"]]))], ["animate-fade-in", padStyleMapOf(utsMapOf([["animation", "fade-in 0.5s ease-out forwards"]]))], ["animate-slide-in", padStyleMapOf(utsMapOf([["animation", "slide-in 0.5s ease-out forwards"], ["opacity", 0], ["transform", "translateX(-20rpx)"], ["animationDelay", calc(var(--i) * 0.1s)]]))], ["questionnaire-container", padStyleMapOf(utsMapOf([["width", "90%"], ["backgroundImage", "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))"], ["backgroundColor", "rgba(0,0,0,0)"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["paddingTop", "30rpx"], ["paddingRight", "30rpx"], ["paddingBottom", "30rpx"], ["paddingLeft", "30rpx"], ["boxShadow", "0 8rpx 20rpx rgba(0, 0, 0, 0.3)"], ["transform", "translateY(-50rpx)"], ["zIndex", 2], ["position", "relative"]]))], ["question-header", padStyleMapOf(utsMapOf([["marginBottom", "30rpx"], ["paddingBottom", "20rpx"], ["borderBottomWidth", "1rpx"], ["borderBottomStyle", "solid"], ["borderBottomColor", "#eeeeee"]]))], ["question-title", padStyleMapOf(utsMapOf([["fontSize", "36rpx"], ["fontWeight", "bold"], ["color", "#333333"], ["textAlign", "center"]]))], ["options-list", padStyleMapOf(utsMapOf([["display", "flex"], ["flexDirection", "column"], ["gap", "20rpx"], ["marginBottom", "30rpx"]]))], ["option-item", utsMapOf([["", utsMapOf([["backgroundColor", "#f0f0f0"], ["borderTopLeftRadius", "15rpx"], ["borderTopRightRadius", "15rpx"], ["borderBottomRightRadius", "15rpx"], ["borderBottomLeftRadius", "15rpx"], ["paddingTop", "20rpx"], ["paddingRight", "30rpx"], ["paddingBottom", "20rpx"], ["paddingLeft", "30rpx"], ["cursor", "pointer"], ["transitionDuration", "0.2s"], ["transitionTimingFunction", "ease"], ["borderTopWidth", "1rpx"], ["borderRightWidth", "1rpx"], ["borderBottomWidth", "1rpx"], ["borderLeftWidth", "1rpx"], ["borderTopStyle", "solid"], ["borderRightStyle", "solid"], ["borderBottomStyle", "solid"], ["borderLeftStyle", "solid"], ["borderTopColor", "#eeeeee"], ["borderRightColor", "#eeeeee"], ["borderBottomColor", "#eeeeee"], ["borderLeftColor", "#eeeeee"], ["backgroundColor:active", "#e0e0e0"], ["transform:active", "scale(0.98)"]])], [".selected", utsMapOf([["backgroundColor", "#6b5b95"], ["color", "#FFFFFF"], ["borderTopColor", "#6b5b95"], ["borderRightColor", "#6b5b95"], ["borderBottomColor", "#6b5b95"], ["borderLeftColor", "#6b5b95"]])]])], ["option-text", utsMapOf([[".option-item.selected ", utsMapOf([["color", "#FFFFFF"]])], ["", utsMapOf([["fontSize", "28rpx"], ["color", "#333333"]])]])], ["question-footer", padStyleMapOf(utsMapOf([["display", "flex"], ["justifyContent", "space-between"], ["alignItems", "center"], ["paddingTop", "20rpx"], ["borderTopWidth", "1rpx"], ["borderTopStyle", "solid"], ["borderTopColor", "#eeeeee"]]))], ["prev-button", padStyleMapOf(utsMapOf([["backgroundColor", "#6b5b95"], ["color", "#FFFFFF"], ["paddingTop", "10rpx"], ["paddingRight", "25rpx"], ["paddingBottom", "10rpx"], ["paddingLeft", "25rpx"], ["borderTopLeftRadius", "10rpx"], ["borderTopRightRadius", "10rpx"], ["borderBottomRightRadius", "10rpx"], ["borderBottomLeftRadius", "10rpx"], ["fontSize", "28rpx"], ["boxShadow", "0 2rpx 5rpx rgba(0, 0, 0, 0.2)"], ["transitionDuration", "0.2s"], ["transitionTimingFunction", "ease"], ["transform:active", "scale(0.95)"], ["boxShadow:active", "0 1rpx 3rpx rgba(0, 0, 0, 0.3)"], ["backgroundColor:disabled", "#cccccc"], ["color:disabled", "#666666"], ["cursor:disabled", "not-allowed"]]))], ["next-button", padStyleMapOf(utsMapOf([["backgroundColor", "#6b5b95"], ["color", "#FFFFFF"], ["paddingTop", "10rpx"], ["paddingRight", "25rpx"], ["paddingBottom", "10rpx"], ["paddingLeft", "25rpx"], ["borderTopLeftRadius", "10rpx"], ["borderTopRightRadius", "10rpx"], ["borderBottomRightRadius", "10rpx"], ["borderBottomLeftRadius", "10rpx"], ["fontSize", "28rpx"], ["boxShadow", "0 2rpx 5rpx rgba(0, 0, 0, 0.2)"], ["transitionDuration", "0.2s"], ["transitionTimingFunction", "ease"], ["transform:active:active", "scale(0.95)"], ["boxShadow:active:active", "0 1rpx 3rpx rgba(0, 0, 0, 0.3)"], ["backgroundColor:disabled:disabled", "#cccccc"], ["color:disabled:disabled", "#666666"], ["cursor:disabled:disabled", "not-allowed"]]))], ["scale-result-container", padStyleMapOf(utsMapOf([["width", "90%"], ["backgroundImage", "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))"], ["backgroundColor", "rgba(0,0,0,0)"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["paddingTop", "30rpx"], ["paddingRight", "30rpx"], ["paddingBottom", "30rpx"], ["paddingLeft", "30rpx"], ["boxShadow", "0 8rpx 20rpx rgba(0, 0, 0, 0.3)"], ["transform", "translateY(-50rpx)"], ["zIndex", 2], ["position", "relative"]]))], ["result-header", padStyleMapOf(utsMapOf([["marginBottom", "30rpx"], ["paddingBottom", "20rpx"], ["borderBottomWidth", "1rpx"], ["borderBottomStyle", "solid"], ["borderBottomColor", "#eeeeee"]]))], ["result-title", padStyleMapOf(utsMapOf([["fontSize", "36rpx"], ["fontWeight", "bold"], ["color", "#333333"], ["textAlign", "center"]]))], ["result-content", padStyleMapOf(utsMapOf([["marginBottom", "30rpx"], ["paddingBottom", "20rpx"], ["borderBottomWidth", "1rpx"], ["borderBottomStyle", "solid"], ["borderBottomColor", "#eeeeee"]]))], ["result-text", padStyleMapOf(utsMapOf([["fontSize", "28rpx"], ["color", "#555555"], ["marginBottom", "10rpx"]]))], ["answer-item", padStyleMapOf(utsMapOf([["marginBottom", "10rpx"], ["paddingLeft", "20rpx"], ["borderLeftWidth", "4rpx"], ["borderLeftStyle", "solid"], ["borderLeftColor", "#6b5b95"]]))], ["answer-text", padStyleMapOf(utsMapOf([["fontSize", "26rpx"], ["color", "#444444"]]))], ["back-button", padStyleMapOf(utsMapOf([["backgroundColor", "#6b5b95"], ["color", "#FFFFFF"], ["paddingTop", "15rpx"], ["paddingRight", "30rpx"], ["paddingBottom", "15rpx"], ["paddingLeft", "30rpx"], ["borderTopLeftRadius", "10rpx"], ["borderTopRightRadius", "10rpx"], ["borderBottomRightRadius", "10rpx"], ["borderBottomLeftRadius", "10rpx"], ["fontSize", "28rpx"], ["boxShadow", "0 2rpx 5rpx rgba(0, 0, 0, 0.2)"], ["transitionDuration", "0.2s"], ["transitionTimingFunction", "ease"], ["transform:active", "scale(0.95)"], ["boxShadow:active", "0 1rpx 3rpx rgba(0, 0, 0, 0.3)"]]))], ["@FONT-FACE", utsMapOf([["0", utsMapOf([])], ["1", utsMapOf([])], ["2", utsMapOf([])], ["3", utsMapOf([])]])], ["@TRANSITION", utsMapOf([["scale-item", utsMapOf([["duration", "0.3s"], ["timingFunction", "ease"]])], ["start-button", utsMapOf([["duration", "0.2s"], ["timingFunction", "ease"]])], ["option-item", utsMapOf([["duration", "0.2s"], ["timingFunction", "ease"]])], ["prev-button", utsMapOf([["duration", "0.2s"], ["timingFunction", "ease"]])], ["next-button", utsMapOf([["duration", "0.2s"], ["timingFunction", "ease"]])], ["back-button", utsMapOf([["duration", "0.2s"], ["timingFunction", "ease"]])]])]])]
