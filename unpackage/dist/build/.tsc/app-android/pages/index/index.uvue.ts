
const negativeKeywords = [
  "难受", "心情不好", "自杀", "焦虑", "恐慌", "抑郁", "不想活", "压力大", "很累", "绝望", "无助", "烦躁",
  "痛苦", "崩溃", "想哭", "不开心", "伤心", "失眠", "没意义", "想放弃", "没人懂", "孤独", "害怕", "恐惧",
  "烦", "累", "不想说话", "不想动", "不想见人", "不想上班", "不想上学", "没动力", "没希望", "想死", "想离开",
  "烦闷", "心累", "心痛", "绝望", "麻木", "无感", "无聊", "无助", "无望", "不想活了", "撑不住", "撑不下去",
  "情绪低落", "消沉", "郁闷", "闷闷不乐", "萎靡不振", "沮丧", "悲伤", "哀伤", "愁苦", "失落", "灰心", "失望",
  "愤懑", "恼怒", "火大", "暴躁", "狂躁", "怨恨", "厌恶", "憎恨", "反感", "不满", "气愤",
  "紧张", "担忧", "忧虑", "不安", "手足无措", "心烦意乱", "忐忑", "惊恐", "骇然", "毛骨悚然", "不寒而栗",
  "寂寞", "孤单", "空虚", "失落", "无聊", "空虚", "迷茫", "彷徨", "困惑",
  "疲惫", "精疲力尽", "身心俱疲", "筋疲力尽", "虚弱", "乏力", "力不从心", "透支",
  "厌世", "生无可恋", "了无生趣", "苟延残喘", "行尸走肉", "自我否定", "自我怀疑", "无地自容", "羞愧", "内疚",
  "逃避", "躲避", "退缩", "不敢面对", "不敢想", "不想提", "忘不掉", "放不下", "走不出来"
];

import request from '../../utils/request.js'

let resizeTimer = null; // 用于防抖的定时器

const __sfc__ = defineComponent({
	data() {
		return {
			messages: [] as Array<{ content: string; type: 'user' | 'ai'; id: number }>,
			userInput: '',
			keyboardHeight: 0,
			animating: false,
			scrollTop: 0,
			loading: false,
			messageCount: 0,
			showEmotionModal: false,
			sessionId: 'user_' + Date.now(), // 为每个用户创建唯一的会话ID
			lastShowPromptTime: 0, // 上次提示情绪扫描的时间
			isLandscape: false, // 是否横屏（水平放置）
            windowWidth: 0, // 窗口宽度
            windowHeight: 0, // 窗口高度
		}
	},
    onLoad() {
        console.log("页面 onLoad: 初始化屏幕尺寸和监听器");
        const systemInfo = uni.getSystemInfoSync();
        this.windowWidth = systemInfo.windowWidth;
        this.windowHeight = systemInfo.windowHeight;
        this.checkOrientation();
        // 直接在onLoad中添加事件监听器
        window.addEventListener('resize', this.handleResize);
    },
    onUnload() {
        console.log("页面 onUnload: 移除屏幕尺寸监听器");
        window.removeEventListener('resize', this.handleResize);
        if (resizeTimer) {
            clearTimeout(resizeTimer);
        }
    },
	methods: {
        // 检查横竖屏状态
        checkOrientation() {
            const isLand = this.windowWidth > this.windowHeight;
            if (this.isLandscape !== isLand) { // 只有在状态改变时才更新和打印
                this.isLandscape = isLand;
                console.log(`屏幕方向切换到: ${isLand ? "横屏模式" : "竖屏模式"}`);
            }
        },

        // 处理尺寸变化
        handleResize() {
            console.log("窗口尺寸变化事件触发");
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const systemInfo = uni.getSystemInfoSync();
                this.windowWidth = systemInfo.windowWidth;
                this.windowHeight = systemInfo.windowHeight;
                console.log(`新窗口尺寸: 宽度=${this.windowWidth}, 高度=${this.windowHeight}`);
                this.checkOrientation();
            }, 100); // 防抖延迟
        },
		// 新增：检测消息是否包含负面关键词
		containsNegativeKeyword(msg) {
			return negativeKeywords.some(word => msg.includes(word));
		},
		// 新增：检测AI回复中是否包含情绪扫描推荐关键词
		containsAIRecommendedKeyword(response) {
			const promptKeywords = ['情绪扫描', '情绪分析', '检测你的情绪', '心理检测', '情绪波动',
				'情绪状态', '心情如何', '心理状况', '需要帮助', '看起来很', '建议你', '似乎你在',
				'或许你需要', '我感受到你的', '看起来你可能在', '你的语气显示', '让我们一起'
			];
			const emotionWordsInAIResponse = ['伤心', '难过', '焦虑', '担忧', '生气', '愤怒', '恐惧',
				'紧张', '压力', '困扰', '烦恼', '消极', '抑郁', '悲观'
			];

			let foundPromptKeyword = promptKeywords.some(keyword => response.includes(keyword));
			let emotionWordCount = emotionWordsInAIResponse.filter(word => response.includes(word)).length;

			return foundPromptKeyword || (emotionWordCount >= 2);
		},

		// 统一的情绪检测触发逻辑
		runComprehensiveEmotionCheck() {
			// 确保至少聊了3句（用户消息和AI回复总和）才开始检测
			if (this.messageCount < 3) {
				return;
			}

			// 检查冷却时间，避免频繁弹窗（5分钟 = 300000毫秒）
			if (Date.now() - this.lastShowPromptTime < 300000) {
				return;
			}

			let shouldTriggerModal = false;

			// 遍历所有消息（用户和AI的），检测关键词
			// 注意：这里可以根据需要优化，例如只检测最近N条消息
			for (const message of this.messages) {
				if (message.type === 'user') {
					if (this.containsNegativeKeyword(message.content)) {
						shouldTriggerModal = true;
						break; // 发现关键词即可触发
					}
				} else if (message.type === 'ai') {
					// 如果AI回复中包含情绪相关的关键词或AI推荐词
					if (this.containsAIRecommendedKeyword(message.content)) {
						shouldTriggerModal = true;
						break; // 发现关键词即可触发
					}
				}
			}

			if (shouldTriggerModal && !this.showEmotionModal) {
				setTimeout(() => {
					this.showEmotionModal = true;
					this.lastShowPromptTime = Date.now();
				}, 1000); // 延迟1秒显示弹窗，更自然
			}
		},

		// 处理消息发送
		handleSend() {
			if (!this.userInput.trim() || this.animating || this.loading) return

			const userText = this.userInput.trim()
			this.userInput = ''
			this.animating = true
			this.loading = true

			// 添加用户消息
			this.messages.push({
				content: userText,
				type: 'user',
				id: Date.now()
			})

			// 消息发送后滚动到底部
			this.$nextTick(() => {
				this.scrollToBottom()

				// 调用API获取回复
				this.getAIResponse(userText)

				// 增加消息计数
				this.messageCount++

				// 每次用户发送消息后，运行全面的情绪检测
				this.runComprehensiveEmotionCheck()
			})
		},

		// 调用API获取AI响应
		getAIResponse(userText) {
            console.log('getAIResponse: 开始调用LLM API');
            console.log('发送给LLM的userText:', userText);
            console.log('使用的sessionId:', this.sessionId);

			// 显示加载指示器
			uni.showLoading({
				title: '分析中...',
				mask: false
			});

			// 使用真实的LLM API
			request.chatWithLLM({
				message: userText,
				sessionId: this.sessionId
			})
			.then(res => {
                console.log('LLM API调用成功，收到完整响应:', res);
				uni.hideLoading(); // 提前隐藏loading

				const response = res.response_text;

				if (response) {
					this.messages.push({
						content: response,
						type: 'ai',
						id: Date.now()
					});
					console.log('LLM响应内容:', response);
					// AI回复后也进行全面的情绪检测
					this.runComprehensiveEmotionCheck();
				} else {
					console.warn('LLM响应中未找到response_text或其为空:', res);
					uni.showToast({ title: 'AI响应内容为空', icon: 'none', duration: 2000 });
				}
			})
			.catch(err => {
                console.error('LLM API调用失败，捕获到错误:', err);
				uni.hideLoading(); // 提前隐藏loading
				// 打印完整的错误对象，确保能看到所有细节
				console.error('LLM请求失败的完整错误信息:', JSON.stringify(err, null, 2)); 
				let errorMessage = 'AI服务暂时不可用';
				if (err) {
					if (err.message) {
						errorMessage = err.message;
					}
					// 尝试从不同的错误结构中提取详细信息
					if (err.detail) {
						if (typeof err.detail === 'string') {
							errorMessage += `: ${err.detail}`;
						} else if (err.detail.errMsg) { // 针对uni.request的errMsg
                            errorMessage += `: ${err.detail.errMsg}`;
                        } else if (Array.isArray(err.detail) && err.detail.length > 0 && err.detail[0].msg) {
							errorMessage += `: ${err.detail[0].msg}`;
						}
					}
				}
				uni.showToast({ title: errorMessage, icon: 'none', duration: 4000 });
			})
			.finally(() => {
                console.log('LLM API调用结束，执行 finally 块');
				this.$nextTick(() => {
					this.scrollToBottom();
					this.loading = false;
					setTimeout(() => { this.animating = false; }, 300);
				});
			});
		},

		// 处理输入框点击
		handleInputClick() {
			// 简化的输入框点击处理，根据实际需要扩展
		},

		// 滚动到底部 - 使用scroll-view的滚动特性
		scrollToBottom() {
			setTimeout(() => {
				const query = uni.createSelectorQuery().in(this)
				query.selectAll('.chat-box view').boundingClientRect(data => {
					if (data && data.length > 0) {
						this.scrollTop = 10000
					}
				}).exec()
			}, 100)
		},

		// 关闭情绪检测弹窗
		closeEmotionModal() {
			this.showEmotionModal = false
		},

		// 开始情绪检测
		startEmotionDetection() {
			this.closeEmotionModal()
			uni.navigateTo({
				url: '/pages/emotion-detect/emotion-detect'
			})
		},
		onSettingTap() {
			uni.showToast({ title: '设置功能开发中...', icon: 'none' });
		}
	}
})

export default __sfc__
function GenPagesIndexIndexRender(this: InstanceType<typeof __sfc__>): any | null {
const _ctx = this
const _cache = this.$.renderCache
  return createElementVNode("view", utsMapOf({ class: "container" }), [
    createElementVNode("view", utsMapOf({ class: "welcome-header" }), [
      createElementVNode("view", utsMapOf({ class: "welcome-card" }), [
        createElementVNode("view", utsMapOf({ class: "ai-avatar" }), "🤖"),
        createElementVNode("view", utsMapOf({ class: "welcome-text" }), [
          createElementVNode("text", utsMapOf({ class: "welcome-title" }), "Hi，欢迎回来！"),
          createElementVNode("text", utsMapOf({ class: "welcome-tip" }), "🌈 今日温馨提示：保持微笑，世界会更美好！")
        ])
      ])
    ]),
    createElementVNode("view", utsMapOf({ class: "particles" }), [
      createElementVNode(Fragment, null, RenderHelpers.renderList(20, (i, __key, __index, _cached): any => {
        return createElementVNode("view", utsMapOf({
          key: i,
          class: "particle"
        }))
      }), 64 /* STABLE_FRAGMENT */)
    ]),
    createElementVNode("view", utsMapOf({ class: "top-section" }), [
      createElementVNode("view", utsMapOf({ class: "face-container" }), [
        createElementVNode("view", utsMapOf({ class: "eye" })),
        createElementVNode("view", utsMapOf({ class: "eye" }))
      ])
    ]),
    createElementVNode("view", utsMapOf({ class: "chat-card" }), [
      createElementVNode("scroll-view", utsMapOf({
        class: "chat-box",
        "scroll-y": "true",
        "scroll-top": _ctx.scrollTop,
        "scroll-with-animation": true
      }), [
        createElementVNode("view", utsMapOf({
          class: "ai-message",
          style: normalizeStyle(utsMapOf({"animation-duration":"0.3s"}))
        }), [
          createElementVNode("view", utsMapOf({ class: "chat-message" }), "你好！你今天过的还好吗？或许你的心情难以用言语形容，那让我来给你做一个心理检测怎么样！")
        ], 4 /* STYLE */),
        createElementVNode(Fragment, null, RenderHelpers.renderList(_ctx.messages, (message, index, __index, _cached): any => {
          return createElementVNode("view", utsMapOf({
            key: message.id,
            class: normalizeClass(message.type === 'user' ? 'user-message' : 'ai-message')
          }), [
            createElementVNode("view", utsMapOf({ class: "chat-message" }), toDisplayString(message.content), 1 /* TEXT */)
          ], 2 /* CLASS */)
        }), 128 /* KEYED_FRAGMENT */),
        isTrue(_ctx.loading)
          ? createElementVNode("view", utsMapOf({
              key: 0,
              class: "ai-message loading-message"
            }), [
              createElementVNode("view", utsMapOf({ class: "loading-dots" }), [
                createElementVNode("view", utsMapOf({ class: "dot" })),
                createElementVNode("view", utsMapOf({ class: "dot" })),
                createElementVNode("view", utsMapOf({ class: "dot" }))
              ])
            ])
          : createCommentVNode("v-if", true)
      ], 8 /* PROPS */, ["scroll-top"])
    ]),
    createElementVNode("view", utsMapOf({ class: "input-card" }), [
      createElementVNode("input", utsMapOf({
        class: "chat-input",
        type: "text",
        modelValue: _ctx.userInput,
        onInput: ($event: InputEvent) => {(_ctx.userInput) = $event.detail.value},
        placeholder: "输入你的心情...",
        onClick: _ctx.handleInputClick,
        "confirm-type": "send",
        onConfirm: _ctx.handleSend,
        disabled: _ctx.loading
      }), null, 40 /* PROPS, NEED_HYDRATION */, ["modelValue", "onInput", "onClick", "onConfirm", "disabled"]),
      createElementVNode("view", utsMapOf({
        class: normalizeClass(["send-button", utsMapOf({ 'disabled': _ctx.loading })]),
        onClick: _ctx.handleSend
      }), "发送", 10 /* CLASS, PROPS */, ["onClick"])
    ]),
    isTrue(_ctx.showEmotionModal)
      ? createElementVNode("view", utsMapOf({
          key: 0,
          class: "emotion-modal",
          onTouchmove: withModifiers(() => {}, ["stop","prevent"])
        }), [
          createElementVNode("view", utsMapOf({ class: "emotion-modal-content" }), [
            createElementVNode("view", utsMapOf({
              class: "modal-close",
              onClick: _ctx.closeEmotionModal
            }), "×", 8 /* PROPS */, ["onClick"]),
            createElementVNode("view", utsMapOf({ class: "modal-header" }), [
              createElementVNode("text", utsMapOf({ class: "modal-title" }), "AI情绪分析")
            ]),
            createElementVNode("view", utsMapOf({ class: "modal-body" }), [
              createElementVNode("text", utsMapOf({ class: "modal-text" }), "通过分析您的对话，我们发现您最近的情绪可能波动较大。"),
              createElementVNode("text", utsMapOf({ class: "modal-text" }), "想要进行更精确的情绪分析吗？"),
              createElementVNode("text", utsMapOf({ class: "modal-description" }), "我们将通过语音和面部表情来综合评估您的情绪状态，帮助您更好地了解自己。"),
              createElementVNode("view", utsMapOf({ class: "modal-icon" }), [
                createElementVNode("view", utsMapOf({ class: "pulse-circle" }))
              ])
            ]),
            createElementVNode("view", utsMapOf({ class: "modal-footer" }), [
              createElementVNode("view", utsMapOf({
                class: "modal-button cancel",
                onClick: _ctx.closeEmotionModal
              }), "稍后再说", 8 /* PROPS */, ["onClick"]),
              createElementVNode("view", utsMapOf({
                class: "modal-button primary",
                onClick: _ctx.startEmotionDetection
              }), "立即检测", 8 /* PROPS */, ["onClick"])
            ])
          ])
        ], 40 /* PROPS, NEED_HYDRATION */, ["onTouchmove"])
      : createCommentVNode("v-if", true),
    createElementVNode("view", utsMapOf({ class: "privacy-footer-card" }), [
      createElementVNode("text", utsMapOf({ class: "privacy-icon" }), "🔒"),
      createElementVNode("text", utsMapOf({ class: "privacy-text" }), "数据加密传输，保护您的隐私")
    ]),
    createElementVNode("view", utsMapOf({
      class: "fab-setting",
      onClick: _ctx.onSettingTap
    }), [
      createElementVNode("text", utsMapOf({ class: "fab-icon" }), "⚙️")
    ], 8 /* PROPS */, ["onClick"])
  ])
}
const GenPagesIndexIndexStyles = [utsMapOf([["container", padStyleMapOf(utsMapOf([["backgroundColor", "#050410"], ["backgroundImage", "linear-gradient(-45deg, #4f00bc, #7d1b7e, #0f0c29, #2a0845, #12c2e9)"], ["backgroundSize", "400% 400%"], ["animation", "gradient-bg 12s ease infinite"], ["display", "flex"], ["flexDirection", "column"], ["alignItems", "center"], ["paddingTop", "32rpx"], ["paddingRight", 0], ["paddingBottom", "32rpx"], ["paddingLeft", 0], ["boxSizing", "border-box"], ["position", "relative"], ["overflow", "hidden"], ["content::before", "''"], ["position::before", "absolute"], ["top::before", 0], ["left::before", 0], ["right::before", 0], ["bottom::before", 0], ["animation::before", "pulse-bg 18s ease-in-out infinite alternate"], ["zIndex::before", 0], ["willChange::before", "opacity, transform"]]))], ["particles", padStyleMapOf(utsMapOf([["position", "absolute"], ["top", 0], ["left", 0], ["width", "100%"], ["height", "100%"], ["overflow", "hidden"], ["zIndex", 0]]))], ["particle", padStyleMapOf(utsMapOf([["position", "absolute"], ["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.4)"], ["pointerEvents", "none"]]))], ["top-section", padStyleMapOf(utsMapOf([["display", "flex"], ["flexDirection", "column"], ["alignItems", "center"], ["width", "100%"], ["marginTop", "20rpx"], ["position", "relative"], ["zIndex", 1]]))], ["face-container", padStyleMapOf(utsMapOf([["display", "flex"], ["flexDirection", "row"], ["alignItems", "center"], ["marginBottom", "20rpx"]]))], ["eye", padStyleMapOf(utsMapOf([["width", "80rpx"], ["height", "100rpx"], ["backgroundImage", "linear-gradient(135deg, #fff, #f0f0f0)"], ["backgroundColor", "rgba(0,0,0,0)"], ["boxShadow", "0 0 12rpx rgba(255, 255, 255, 0.7)"], ["animation", "eye-blink 6s infinite ease-in-out"], ["marginTop", 0], ["marginRight", "30rpx"], ["marginBottom", 0], ["marginLeft", "30rpx"], ["position", "relative"], ["overflow", "hidden"]]))], ["chat-card", padStyleMapOf(utsMapOf([["maxWidth", "700rpx"], ["minHeight", "420rpx"], ["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.1)"], ["borderTopLeftRadius", "32rpx"], ["borderTopRightRadius", "32rpx"], ["borderBottomRightRadius", "32rpx"], ["borderBottomLeftRadius", "32rpx"], ["boxShadow", "0 6rpx 32rpx 0 rgba(80,60,180,0.10)"], ["paddingTop", "24rpx"], ["paddingRight", "18rpx"], ["paddingBottom", "24rpx"], ["paddingLeft", "18rpx"], ["marginTop", 0], ["marginRight", "auto"], ["marginBottom", "18rpx"], ["marginLeft", "auto"], ["backdropFilter", "blur(8rpx)"], ["borderTopWidth", "1.5rpx"], ["borderRightWidth", "1.5rpx"], ["borderBottomWidth", "1.5rpx"], ["borderLeftWidth", "1.5rpx"], ["borderTopStyle", "solid"], ["borderRightStyle", "solid"], ["borderBottomStyle", "solid"], ["borderLeftStyle", "solid"], ["borderTopColor", "rgba(255,255,255,0.13)"], ["borderRightColor", "rgba(255,255,255,0.13)"], ["borderBottomColor", "rgba(255,255,255,0.13)"], ["borderLeftColor", "rgba(255,255,255,0.13)"], ["zIndex", 1]]))], ["chat-box", padStyleMapOf(utsMapOf([["flex", 1], ["width", "90%"], ["marginTop", "20rpx"], ["marginRight", "auto"], ["marginBottom", "20rpx"], ["marginLeft", "auto"], ["paddingTop", "20rpx"], ["paddingRight", "20rpx"], ["paddingBottom", "20rpx"], ["paddingLeft", "20rpx"], ["backgroundColor", "rgba(255,255,255,0.1)"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["boxShadow", "0 5rpx 15rpx rgba(0, 0, 0, 0.2)"], ["boxSizing", "border-box"], ["overflowY", "auto"]]))], ["ai-message", padStyleMapOf(utsMapOf([["marginBottom", "10rpx"], ["paddingTop", "15rpx"], ["paddingRight", "20rpx"], ["paddingBottom", "15rpx"], ["paddingLeft", "20rpx"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "6rpx"], ["position", "relative"], ["animation", "message-in 0.3s ease-out forwards"], ["wordWrap", "break-word"], ["backgroundColor", "rgba(255,255,255,0.1)"], ["color", "#ffffff"], ["alignSelf", "flex-start"], ["marginRight", "auto"]]))], ["user-message", padStyleMapOf(utsMapOf([["marginBottom", "10rpx"], ["paddingTop", "15rpx"], ["paddingRight", "20rpx"], ["paddingBottom", "15rpx"], ["paddingLeft", "20rpx"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "6rpx"], ["borderBottomLeftRadius", "20rpx"], ["position", "relative"], ["animation", "message-in 0.3s ease-out forwards"], ["wordWrap", "break-word"], ["backgroundColor", "#6847c2"], ["color", "#ffffff"], ["alignSelf", "flex-end"], ["marginLeft", "auto"]]))], ["chat-message", padStyleMapOf(utsMapOf([["fontSize", "26rpx"], ["lineHeight", 1.3]]))], ["loading-message", padStyleMapOf(utsMapOf([["backgroundColor", "rgba(255,255,255,0.1)"], ["color", "#ffffff"], ["alignSelf", "flex-start"], ["marginRight", "auto"], ["borderBottomLeftRadius", "6rpx"], ["display", "flex"], ["justifyContent", "center"], ["alignItems", "center"], ["minHeight", "60rpx"]]))], ["loading-dots", padStyleMapOf(utsMapOf([["display", "flex"]]))], ["dot", padStyleMapOf(utsMapOf([["width", "12rpx"], ["height", "12rpx"], ["backgroundColor", "#ffffff"], ["marginTop", 0], ["marginRight", "2rpx"], ["marginBottom", 0], ["marginLeft", "2rpx"], ["animation", "bounce 1.4s infinite ease-in-out"]]))], ["input-card", padStyleMapOf(utsMapOf([["maxWidth", "700rpx"], ["display", "flex"], ["alignItems", "center"], ["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.13)"], ["borderTopLeftRadius", "32rpx"], ["borderTopRightRadius", "32rpx"], ["borderBottomRightRadius", "32rpx"], ["borderBottomLeftRadius", "32rpx"], ["boxShadow", "0 4rpx 16rpx 0 rgba(80,60,180,0.10)"], ["paddingTop", "12rpx"], ["paddingRight", "18rpx"], ["paddingBottom", "12rpx"], ["paddingLeft", "24rpx"], ["marginTop", 0], ["marginRight", "auto"], ["marginBottom", "18rpx"], ["marginLeft", "auto"], ["backdropFilter", "blur(8rpx)"], ["borderTopWidth", "1.5rpx"], ["borderRightWidth", "1.5rpx"], ["borderBottomWidth", "1.5rpx"], ["borderLeftWidth", "1.5rpx"], ["borderTopStyle", "solid"], ["borderRightStyle", "solid"], ["borderBottomStyle", "solid"], ["borderLeftStyle", "solid"], ["borderTopColor", "rgba(255,255,255,0.15)"], ["borderRightColor", "rgba(255,255,255,0.15)"], ["borderBottomColor", "rgba(255,255,255,0.15)"], ["borderLeftColor", "rgba(255,255,255,0.15)"], ["zIndex", 2]]))], ["chat-input", padStyleMapOf(utsMapOf([["flex", 1], ["fontSize", "28rpx"], ["borderTopWidth", "medium"], ["borderRightWidth", "medium"], ["borderBottomWidth", "medium"], ["borderLeftWidth", "medium"], ["borderTopStyle", "none"], ["borderRightStyle", "none"], ["borderBottomStyle", "none"], ["borderLeftStyle", "none"], ["borderTopColor", "#000000"], ["borderRightColor", "#000000"], ["borderBottomColor", "#000000"], ["borderLeftColor", "#000000"], ["outline", "none"], ["backgroundImage", "none"], ["backgroundColor", "rgba(0,0,0,0)"], ["color", "#ffffff"], ["paddingTop", "10rpx"], ["paddingRight", 0], ["paddingBottom", "10rpx"], ["paddingLeft", 0]]))], ["send-button", utsMapOf([["", utsMapOf([["marginLeft", "18rpx"], ["paddingTop", 0], ["paddingRight", "32rpx"], ["paddingBottom", 0], ["paddingLeft", "32rpx"], ["height", "56rpx"], ["lineHeight", "56rpx"], ["borderTopLeftRadius", "28rpx"], ["borderTopRightRadius", "28rpx"], ["borderBottomRightRadius", "28rpx"], ["borderBottomLeftRadius", "28rpx"], ["backgroundImage", "linear-gradient(90deg, #7d1b7e 0%, #4f00bc 100%)"], ["backgroundColor", "rgba(0,0,0,0)"], ["color", "#ffffff"], ["fontSize", "28rpx"], ["boxShadow", "0 2rpx 8rpx #4f00bc33"]])], [".disabled", utsMapOf([["opacity", 0.5], ["backgroundImage", "none"], ["backgroundColor", "#b0b0c0"], ["boxShadow", "none"]])]])], ["privacy-footer-card", padStyleMapOf(utsMapOf([["maxWidth", "700rpx"], ["display", "flex"], ["alignItems", "center"], ["justifyContent", "center"], ["paddingTop", "14rpx"], ["paddingRight", 0], ["paddingBottom", "10rpx"], ["paddingLeft", 0], ["marginTop", 0], ["marginRight", "auto"], ["marginBottom", 0], ["marginLeft", "auto"], ["backgroundImage", "none"], ["backgroundColor", "rgba(20,20,40,0.7)"], ["borderTopLeftRadius", "24rpx"], ["borderTopRightRadius", "24rpx"], ["borderBottomRightRadius", "24rpx"], ["borderBottomLeftRadius", "24rpx"], ["boxShadow", "0 2rpx 8rpx #4f00bc22"], ["borderTopWidth", "1.5rpx"], ["borderRightWidth", "1.5rpx"], ["borderBottomWidth", "1.5rpx"], ["borderLeftWidth", "1.5rpx"], ["borderTopStyle", "solid"], ["borderRightStyle", "solid"], ["borderBottomStyle", "solid"], ["borderLeftStyle", "solid"], ["borderTopColor", "rgba(255,255,255,0.1)"], ["borderRightColor", "rgba(255,255,255,0.1)"], ["borderBottomColor", "rgba(255,255,255,0.1)"], ["borderLeftColor", "rgba(255,255,255,0.1)"], ["zIndex", 2], ["position", "relative"]]))], ["fab-setting", padStyleMapOf(utsMapOf([["position", "fixed"], ["right", "38rpx"], ["bottom", "54rpx"], ["width", "88rpx"], ["height", "88rpx"], ["backgroundImage", "linear-gradient(135deg, #4f00bc 0%, #12c2e9 100%)"], ["backgroundColor", "rgba(0,0,0,0)"], ["boxShadow", "0 4rpx 16rpx #4f00bc55"], ["display", "flex"], ["alignItems", "center"], ["justifyContent", "center"], ["zIndex", 99], ["cursor", "pointer"], ["transitionProperty", "boxShadow"], ["transitionDuration", "0.2s"], ["boxShadow:active", "0 2rpx 6rpx #4f00bc33"]]))], ["fab-icon", padStyleMapOf(utsMapOf([["fontSize", "44rpx"], ["color", "#ffffff"]]))], ["emotion-modal", padStyleMapOf(utsMapOf([["position", "fixed"], ["top", 0], ["left", 0], ["width", "100%"], ["height", "100%"], ["backgroundColor", "rgba(0,0,0,0.6)"], ["display", "flex"], ["justifyContent", "center"], ["alignItems", "center"], ["zIndex", 1000]]))], ["emotion-modal-content", padStyleMapOf(utsMapOf([["backgroundImage", "linear-gradient(135deg, #4f00bc, #7d1b7e)"], ["backgroundColor", "rgba(0,0,0,0)"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["paddingTop", "25rpx"], ["paddingRight", "25rpx"], ["paddingBottom", "25rpx"], ["paddingLeft", "25rpx"], ["width", "90%"], ["maxWidth", "450rpx"], ["boxShadow", "0 6rpx 20rpx rgba(0, 0, 0, 0.3)"], ["textAlign", "center"], ["position", "relative"], ["animation", "modal-fade-in 0.3s ease-out"]]))], ["modal-close", padStyleMapOf(utsMapOf([["position", "absolute"], ["top", "10rpx"], ["right", "20rpx"], ["fontSize", "32rpx"], ["color", "rgba(255,255,255,0.7)"], ["cursor", "pointer"]]))], ["modal-header", padStyleMapOf(utsMapOf([["marginBottom", "20rpx"]]))], ["modal-title", padStyleMapOf(utsMapOf([["fontSize", "36rpx"], ["color", "#ffffff"], ["fontWeight", "bold"]]))], ["modal-body", padStyleMapOf(utsMapOf([["marginBottom", "25rpx"]]))], ["modal-text", padStyleMapOf(utsMapOf([["fontSize", "26rpx"], ["color", "rgba(255,255,255,0.9)"], ["lineHeight", 1.3], ["marginBottom", "6rpx"]]))], ["modal-description", padStyleMapOf(utsMapOf([["fontSize", "24rpx"], ["color", "rgba(255,255,255,0.7)"], ["marginTop", "10rpx"]]))], ["modal-icon", padStyleMapOf(utsMapOf([["width", "80rpx"], ["height", "80rpx"], ["backgroundColor", "rgba(255,255,255,0.2)"], ["display", "flex"], ["justifyContent", "center"], ["alignItems", "center"], ["marginTop", "25rpx"], ["marginRight", "auto"], ["marginBottom", "25rpx"], ["marginLeft", "auto"], ["position", "relative"]]))], ["pulse-circle", utsMapOf([[".modal-icon ", utsMapOf([["width", "100%"], ["height", "100%"], ["backgroundColor", "rgba(255,255,255,0.3)"], ["animation", "modal-pulse 1.5s infinite"]])]])], ["modal-footer", padStyleMapOf(utsMapOf([["display", "flex"], ["justifyContent", "space-around"], ["marginTop", "25rpx"]]))], ["modal-button", utsMapOf([["", utsMapOf([["paddingTop", "12rpx"], ["paddingRight", "25rpx"], ["paddingBottom", "12rpx"], ["paddingLeft", "25rpx"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["fontSize", "26rpx"], ["cursor", "pointer"], ["transitionProperty", "transform"], ["transitionDuration", "0.1s"], ["transitionTimingFunction", "ease"], ["transform:active", "scale(0.95)"]])], [".cancel", utsMapOf([["backgroundColor", "rgba(255,255,255,0.2)"], ["color", "#ffffff"]])], [".primary", utsMapOf([["backgroundColor", "#ffffff"], ["color", "#6847c2"]])]])], ["welcome-header", padStyleMapOf(utsMapOf([["width", "100%"], ["display", "flex"], ["alignItems", "center"], ["justifyContent", "flex-start"], ["paddingTop", "24rpx"], ["paddingRight", "32rpx"], ["paddingBottom", "8rpx"], ["paddingLeft", "32rpx"], ["boxSizing", "border-box"], ["marginBottom", "8rpx"], ["zIndex", 2]]))], ["welcome-card", padStyleMapOf(utsMapOf([["display", "flex"], ["alignItems", "center"], ["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.13)"], ["boxShadow", "0 4rpx 16rpx 0 rgba(80,60,180,0.10)"], ["borderTopLeftRadius", "32rpx"], ["borderTopRightRadius", "32rpx"], ["borderBottomRightRadius", "32rpx"], ["borderBottomLeftRadius", "32rpx"], ["paddingTop", "18rpx"], ["paddingRight", "32rpx"], ["paddingBottom", "18rpx"], ["paddingLeft", "24rpx"], ["backdropFilter", "blur(8rpx)"], ["borderTopWidth", "1.5rpx"], ["borderRightWidth", "1.5rpx"], ["borderBottomWidth", "1.5rpx"], ["borderLeftWidth", "1.5rpx"], ["borderTopStyle", "solid"], ["borderRightStyle", "solid"], ["borderBottomStyle", "solid"], ["borderLeftStyle", "solid"], ["borderTopColor", "rgba(255,255,255,0.18)"], ["borderRightColor", "rgba(255,255,255,0.18)"], ["borderBottomColor", "rgba(255,255,255,0.18)"], ["borderLeftColor", "rgba(255,255,255,0.18)"]]))], ["ai-avatar", padStyleMapOf(utsMapOf([["fontSize", "60rpx"], ["marginRight", "22rpx"], ["filter", "drop-shadow(0 2rpx 8rpx #fff3)"]]))], ["welcome-text", padStyleMapOf(utsMapOf([["display", "flex"], ["flexDirection", "column"]]))], ["welcome-title", padStyleMapOf(utsMapOf([["fontSize", "36rpx"], ["fontWeight", "700"], ["color", "#ffffff"], ["marginBottom", "4rpx"], ["letterSpacing", "2rpx"], ["textShadow", "0 2rpx 8rpx #4f00bc44"], ["fontFamily", "PingFang SC, Microsoft YaHei, Arial, sans-serif"]]))], ["welcome-tip", padStyleMapOf(utsMapOf([["fontSize", "26rpx"], ["color", "#ffe7b7"], ["fontStyle", "italic"], ["letterSpacing", "1rpx"], ["textShadow", "0 1rpx 4rpx #7d1b7e33"], ["fontFamily", "Fira Mono, Consolas, Arial, sans-serif"]]))], ["privacy-icon", padStyleMapOf(utsMapOf([["fontSize", "28rpx"], ["marginRight", "8rpx"]]))], ["privacy-text", padStyleMapOf(utsMapOf([["fontSize", "22rpx"], ["color", "#b0b0c0"]]))], ["@FONT-FACE", utsMapOf([["0", utsMapOf([])], ["1", utsMapOf([])], ["2", utsMapOf([])], ["3", utsMapOf([])], ["4", utsMapOf([])], ["5", utsMapOf([])], ["6", utsMapOf([])], ["7", utsMapOf([])]])], ["@TRANSITION", utsMapOf([["fab-setting", utsMapOf([["property", "boxShadow"], ["duration", "0.2s"]])], ["modal-button", utsMapOf([["property", "transform"], ["duration", "0.1s"], ["timingFunction", "ease"]])]])]])]
