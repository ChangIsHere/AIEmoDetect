
import request from '../../utils/request.js'

const __sfc__ = defineComponent({
	data() {
		return {
			step: 1, // 当前步骤：1-权限获取，2-视频录制，3-分析中
			isRecordingVideo: false, // 标记是否正在录制视频
			countdownValue: 15, // 倒计时秒数，默认为15秒视频录制
			countdownProgress: 100, // 倒计时进度条
			countdownInterval: null,
			cameraContext: null,
			hasPermissions: false,
			tempVideoPath: '', // 临时视频路径
			emotionData: null  // 情绪分析数据
		}
	},
	onReady() {
		// 初始化相机上下文
		this.cameraContext = uni.createCameraContext();
	},
	methods: {
		// 返回上一页
		goBack() {
			uni.navigateBack()
		},
		
		// 处理相机错误
		handleCameraError(err) {
			console.error('相机错误:', err)
			uni.showToast({
				title: '相机初始化失败，请检查权限',
				icon: 'none',
				duration: 2000
			})
		},
		
		// 请求麦克风和摄像头权限
		requestPermissions() {
			uni.showLoading({
				title: '请求权限中...'
			})
			
			// 请求麦克风权限
			uni.authorize({
				scope: 'scope.record',
				success: () => {
					// 请求摄像头权限
					uni.authorize({
						scope: 'scope.camera',
						success: () => {
							this.hasPermissions = true
							uni.hideLoading()
							uni.showToast({
								title: '授权成功',
								icon: 'success',
								duration: 1500
							})
							
							setTimeout(() => {
								this.step = 2
							}, 1500)
						},
						fail: () => {
							this.handlePermissionFailure()
						}
					})
				},
				fail: () => {
					this.handlePermissionFailure()
				}
			})
		},
		
		// 处理权限请求失败
		handlePermissionFailure() {
			uni.hideLoading()
			uni.showModal({
				title: '权限请求',
				content: '需要麦克风和摄像头权限才能进行情绪分析。请在设置中开启相关权限。',
				confirmText: '去设置',
				success: (res) => {
					if (res.confirm) {
						uni.openSetting()
					}
				}
			})
		},
		
		// 开始倒计时
		startCountdown(callback) {
			this.countdownValue = 15
			this.countdownProgress = 100
			
			// 清除可能存在的旧倒计时
			if (this.countdownInterval) {
				clearInterval(this.countdownInterval)
			}
			
			this.countdownInterval = setInterval(() => {
				this.countdownValue--
				this.countdownProgress = (this.countdownValue / 15) * 100
				
				if (this.countdownValue <= 0) {
					clearInterval(this.countdownInterval)
					callback()
				}
			}, 1000)
		},
		
		// 开始视频录制
		startVideoRecording() {
			if (!this.cameraContext) {
				uni.showToast({ title: '相机初始化失败', icon: 'none' })
				return
			}
			this.isRecordingVideo = true
			this.tempVideoPath = ''
			
			this.startCountdown(() => {
				this.stopVideoRecording()
			})

			this.cameraContext.startRecord({
				duration: 15, // 录制15秒
				compressed: true, // 启用压缩，减少文件大小
				success: (res) => {
					console.log('视频录制完成:', res.tempFilePath)
					this.tempVideoPath = res.tempFilePath
				},
				fail: (err) => {
					console.error('视频录制失败:', err)
					uni.showToast({ title: '视频录制失败', icon: 'none' })
					this.isRecordingVideo = false // 录制失败也停止状态
				}
			})

			// 监听录制停止事件（无论成功或失败）
			this.cameraContext.onStop((res) => {
				console.log('相机录制已停止', res)
				this.isRecordingVideo = false
				if (res.tempFilePath) {
					this.tempVideoPath = res.tempFilePath
				}
			})
		},
		
		// 停止视频录制
		stopVideoRecording() {
			clearInterval(this.countdownInterval)
			if (this.cameraContext) {
				this.cameraContext.stopRecord()
			}
		},
		
		// 放弃视频，重置状态以便重新录制
		discardVideo() {
			this.tempVideoPath = ''
			this.isRecordingVideo = false
			this.countdownValue = 15 // 重置倒计时
			this.countdownProgress = 100 // 重置进度条
			uni.showToast({ title: '已取消录制', icon: 'none' })
		},
		
		// 提交视频进行分析
		async submitVideo() {
			if (!this.tempVideoPath) {
				uni.showToast({ title: '请先录制视频', icon: 'none' })
				return
			}

			this.step = 3 // 进入分析中步骤
			uni.showLoading({
				title: '视频分析中...',
				mask: true
			})

      try {
        const resData = await request.analyzeEmotionFromVideo({
          filePath: this.tempVideoPath
        });

        uni.hideLoading()
        console.log('视频分析结果:', resData)
        this.emotionData = resData
        uni.showToast({ title: '分析完成', icon: 'success' })
        // 跳转到结果页
        setTimeout(() => {
          this.goToResultPage()
        }, 1000)
      } catch (err) {
        uni.hideLoading()
        console.error('视频上传或分析失败:', err)
        uni.showToast({
          title: '视频分析失败，请重试',
          icon: 'none',
          duration: 3000
        })
        // 失败后回到视频录制步骤，允许重试
        this.step = 2
      }
		},
		
		// 跳转到结果页
		goToResultPage() {
			if (this.emotionData) {
				uni.redirectTo({
					url: '/pages/emotion-result/emotion-result?data=' + encodeURIComponent(JSON.stringify(this.emotionData))
				})
			} else {
				uni.showToast({ title: '未获取到分析数据', icon: 'none' })
				// 如果没有数据，回到初始或录制页面
				this.step = 2
			}
		}
	}
})

export default __sfc__
function GenPagesEmotionDetectEmotionDetectRender(this: InstanceType<typeof __sfc__>): any | null {
const _ctx = this
const _cache = this.$.renderCache
const _component_camera = resolveComponent("camera")

  return createElementVNode("view", utsMapOf({ class: "container" }), [
    createElementVNode("view", utsMapOf({
      class: "back-button",
      onClick: _ctx.goBack
    }), [
      createElementVNode("text", utsMapOf({ class: "back-icon" }), "←"),
      createElementVNode("text", utsMapOf({ class: "back-text" }), "返回")
    ], 8 /* PROPS */, ["onClick"]),
    createElementVNode("view", utsMapOf({ class: "header" }), [
      createElementVNode("text", utsMapOf({ class: "title" }), "情绪识别")
    ]),
    createElementVNode("view", utsMapOf({ class: "main-content" }), [
      createElementVNode("view", utsMapOf({ class: "progress-bar" }), [
        createElementVNode("view", utsMapOf({
          class: normalizeClass(["progress-step", utsMapOf({ active: _ctx.step >= 1, completed: _ctx.step > 1 })])
        }), [
          createElementVNode("view", utsMapOf({ class: "step-circle" }), "1"),
          createElementVNode("text", utsMapOf({ class: "step-label" }), "获取权限")
        ], 2 /* CLASS */),
        createElementVNode("view", utsMapOf({ class: "progress-line" })),
        createElementVNode("view", utsMapOf({
          class: normalizeClass(["progress-step", utsMapOf({ active: _ctx.step >= 2, completed: _ctx.step > 2 })])
        }), [
          createElementVNode("view", utsMapOf({ class: "step-circle" }), "2"),
          createElementVNode("text", utsMapOf({ class: "step-label" }), "视频录制")
        ], 2 /* CLASS */),
        createElementVNode("view", utsMapOf({ class: "progress-line" })),
        createElementVNode("view", utsMapOf({
          class: normalizeClass(["progress-step", utsMapOf({ active: _ctx.step >= 3, completed: _ctx.step > 3 })])
        }), [
          createElementVNode("view", utsMapOf({ class: "step-circle" }), "3"),
          createElementVNode("text", utsMapOf({ class: "step-label" }), "分析中")
        ], 2 /* CLASS */)
      ]),
      _ctx.step === 1
        ? createElementVNode("view", utsMapOf({
            key: 0,
            class: "step-content permission-step"
          }), [
            createElementVNode("image", utsMapOf({
              class: "permission-icon",
              src: "/static/permission.png"
            })),
            createElementVNode("text", utsMapOf({ class: "step-title" }), "需要获取权限"),
            createElementVNode("text", utsMapOf({ class: "step-description" }), "为了进行完整的情绪分析，我们需要获取麦克风和摄像头权限"),
            createElementVNode("view", utsMapOf({
              class: "button primary-button",
              onClick: _ctx.requestPermissions
            }), "授权并继续", 8 /* PROPS */, ["onClick"])
          ])
        : createCommentVNode("v-if", true),
      _ctx.step === 2
        ? createElementVNode("view", utsMapOf({
            key: 1,
            class: "step-content face-step"
          }), [
            createElementVNode("view", utsMapOf({ class: "camera-container" }), [
              isTrue(!_ctx.isRecordingVideo && _ctx.tempVideoPath)
                ? createElementVNode("video", utsMapOf({
                    key: 0,
                    id: "videoCapture",
                    class: "video-preview",
                    src: _ctx.tempVideoPath,
                    controls: ""
                  }), null, 8 /* PROPS */, ["src"])
                : isTrue(!_ctx.tempVideoPath)
                  ? createVNode(_component_camera, utsMapOf({
                      key: 1,
                      class: "camera-preview",
                      "device-position": "front",
                      flash: "off",
                      onError: _ctx.handleCameraError
                    }), null, 8 /* PROPS */, ["onError"])
                  : createCommentVNode("v-if", true),
              createElementVNode("view", utsMapOf({ class: "face-outline" })),
              isTrue(_ctx.isRecordingVideo)
                ? createElementVNode("view", utsMapOf({
                    key: 2,
                    class: "scan-line"
                  }))
                : createCommentVNode("v-if", true)
            ]),
            createElementVNode("text", utsMapOf({ class: "step-title" }), "视频录制"),
            createElementVNode("text", utsMapOf({ class: "step-description" }), toDisplayString(_ctx.isRecordingVideo ? '正在录制中，请对着镜头讲述您的问题或情绪...' : (_ctx.tempVideoPath ? '视频已录制完成，您可以预览或重新录制' : '点击下方按钮开始录制')), 1 /* TEXT */),
            isTrue(_ctx.isRecordingVideo)
              ? createElementVNode("view", utsMapOf({
                  key: 0,
                  class: "countdown-container"
                }), [
                  createElementVNode("text", utsMapOf({ class: "countdown-text" }), toDisplayString(_ctx.countdownValue) + "s", 1 /* TEXT */),
                  createElementVNode("view", utsMapOf({
                    class: "countdown-progress",
                    style: normalizeStyle(utsMapOf({width: _ctx.countdownProgress + '%'}))
                  }), null, 4 /* STYLE */)
                ])
              : createCommentVNode("v-if", true),
            isTrue(!_ctx.isRecordingVideo && !_ctx.tempVideoPath)
              ? createElementVNode("view", utsMapOf({
                  key: 1,
                  class: "button primary-button",
                  onClick: _ctx.startVideoRecording
                }), "开始录制", 8 /* PROPS */, ["onClick"])
              : createCommentVNode("v-if", true),
            isTrue(!_ctx.isRecordingVideo && _ctx.tempVideoPath)
              ? createElementVNode("view", utsMapOf({
                  key: 2,
                  class: "button-group"
                }), [
                  createElementVNode("view", utsMapOf({
                    class: "button secondary-button",
                    onClick: _ctx.discardVideo
                  }), "重录", 8 /* PROPS */, ["onClick"]),
                  createElementVNode("view", utsMapOf({
                    class: "button primary-button",
                    onClick: _ctx.submitVideo
                  }), "提交分析", 8 /* PROPS */, ["onClick"])
                ])
              : createCommentVNode("v-if", true)
          ])
        : createCommentVNode("v-if", true),
      _ctx.step === 3
        ? createElementVNode("view", utsMapOf({
            key: 2,
            class: "step-content analyzing-step"
          }), [
            createElementVNode("view", utsMapOf({ class: "analyzing-animation" }), [
              createElementVNode("view", utsMapOf({ class: "pulse-circle" })),
              createElementVNode("view", utsMapOf({ class: "pulse-circle delay-1" })),
              createElementVNode("view", utsMapOf({ class: "pulse-circle delay-2" }))
            ]),
            createElementVNode("text", utsMapOf({ class: "step-title" }), "正在分析"),
            createElementVNode("text", utsMapOf({ class: "step-description" }), "我们正在处理您的情绪数据，马上完成...")
          ])
        : createCommentVNode("v-if", true)
    ])
  ])
}
const GenPagesEmotionDetectEmotionDetectStyles = [utsMapOf([["container", padStyleMapOf(utsMapOf([["backgroundColor", "#050410"], ["backgroundImage", "linear-gradient(-45deg, #4f00bc, #7d1b7e, #0f0c29, #2a0845, #12c2e9)"], ["backgroundSize", "400% 400%"], ["animation", "gradient-bg 12s ease infinite"], ["paddingTop", "60rpx"], ["paddingRight", "40rpx"], ["paddingBottom", "60rpx"], ["paddingLeft", "40rpx"], ["boxSizing", "border-box"], ["position", "relative"]]))], ["back-button", padStyleMapOf(utsMapOf([["position", "absolute"], ["top", "60rpx"], ["left", "30rpx"], ["display", "flex"], ["alignItems", "center"], ["paddingTop", "10rpx"], ["paddingRight", "10rpx"], ["paddingBottom", "10rpx"], ["paddingLeft", "10rpx"], ["zIndex", 10]]))], ["back-icon", padStyleMapOf(utsMapOf([["fontSize", "36rpx"], ["color", "#ffffff"], ["marginRight", "10rpx"]]))], ["back-text", padStyleMapOf(utsMapOf([["fontSize", "30rpx"], ["color", "#ffffff"]]))], ["header", padStyleMapOf(utsMapOf([["marginTop", "40rpx"], ["textAlign", "center"]]))], ["title", padStyleMapOf(utsMapOf([["fontSize", "48rpx"], ["color", "#ffffff"], ["fontWeight", "bold"]]))], ["main-content", padStyleMapOf(utsMapOf([["marginTop", "80rpx"], ["display", "flex"], ["flexDirection", "column"], ["alignItems", "center"]]))], ["progress-bar", padStyleMapOf(utsMapOf([["display", "flex"], ["justifyContent", "center"], ["alignItems", "center"], ["width", "90%"], ["marginBottom", "60rpx"]]))], ["progress-step", padStyleMapOf(utsMapOf([["display", "flex"], ["flexDirection", "column"], ["alignItems", "center"], ["width", "150rpx"]]))], ["step-circle", utsMapOf([["", utsMapOf([["width", "60rpx"], ["height", "60rpx"], ["borderTopLeftRadius", "30rpx"], ["borderTopRightRadius", "30rpx"], ["borderBottomRightRadius", "30rpx"], ["borderBottomLeftRadius", "30rpx"], ["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.3)"], ["display", "flex"], ["justifyContent", "center"], ["alignItems", "center"], ["color", "#ffffff"], ["fontWeight", "bold"], ["marginBottom", "20rpx"]])], [".progress-step.active ", utsMapOf([["backgroundImage", "none"], ["backgroundColor", "#6847c2"]])], [".progress-step.completed ", utsMapOf([["backgroundImage", "none"], ["backgroundColor", "#32cd32"]])]])], ["step-label", padStyleMapOf(utsMapOf([["fontSize", "26rpx"], ["color", "#ffffff"]]))], ["progress-line", padStyleMapOf(utsMapOf([["flex", 1], ["height", "4rpx"], ["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.3)"], ["marginTop", 0], ["marginRight", "10rpx"], ["marginBottom", "20rpx"], ["marginLeft", "10rpx"]]))], ["step-content", padStyleMapOf(utsMapOf([["width", "100%"], ["display", "flex"], ["flexDirection", "column"], ["alignItems", "center"], ["paddingTop", "40rpx"], ["paddingRight", "40rpx"], ["paddingBottom", "40rpx"], ["paddingLeft", "40rpx"], ["boxSizing", "border-box"], ["animation", "fade-in 0.3s ease"]]))], ["step-title", padStyleMapOf(utsMapOf([["fontSize", "40rpx"], ["color", "#ffffff"], ["marginBottom", "30rpx"], ["textAlign", "center"]]))], ["step-description", padStyleMapOf(utsMapOf([["fontSize", "30rpx"], ["color", "rgba(255,255,255,0.8)"], ["textAlign", "center"], ["marginBottom", "60rpx"], ["lineHeight", 1.5]]))], ["button", padStyleMapOf(utsMapOf([["width", "350rpx"], ["height", "90rpx"], ["borderTopLeftRadius", "45rpx"], ["borderTopRightRadius", "45rpx"], ["borderBottomRightRadius", "45rpx"], ["borderBottomLeftRadius", "45rpx"], ["display", "flex"], ["justifyContent", "center"], ["alignItems", "center"], ["fontSize", "32rpx"], ["marginTop", "40rpx"]]))], ["button-group", padStyleMapOf(utsMapOf([["display", "flex"], ["justifyContent", "space-between"], ["width", "100%"], ["paddingTop", 0], ["paddingRight", "50rpx"], ["paddingBottom", 0], ["paddingLeft", "50rpx"]]))], ["primary-button", padStyleMapOf(utsMapOf([["backgroundImage", "none"], ["backgroundColor", "#6847c2"], ["color", "#ffffff"], ["boxShadow", "0 8rpx 20rpx rgba(104, 71, 194, 0.4)"], ["transform:active", "scale(0.98)"], ["boxShadow:active", "0 4rpx 10rpx rgba(104, 71, 194, 0.4)"]]))], ["secondary-button", padStyleMapOf(utsMapOf([["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.2)"], ["color", "#ffffff"], ["borderTopWidth", "1rpx"], ["borderRightWidth", "1rpx"], ["borderBottomWidth", "1rpx"], ["borderLeftWidth", "1rpx"], ["borderTopStyle", "solid"], ["borderRightStyle", "solid"], ["borderBottomStyle", "solid"], ["borderLeftStyle", "solid"], ["borderTopColor", "rgba(255,255,255,0.5)"], ["borderRightColor", "rgba(255,255,255,0.5)"], ["borderBottomColor", "rgba(255,255,255,0.5)"], ["borderLeftColor", "rgba(255,255,255,0.5)"], ["transform:active:active", "scale(0.98)"], ["boxShadow:active:active", "0 4rpx 10rpx rgba(104, 71, 194, 0.4)"]]))], ["permission-icon", padStyleMapOf(utsMapOf([["width", "180rpx"], ["height", "180rpx"], ["marginBottom", "40rpx"]]))], ["video-preview", padStyleMapOf(utsMapOf([["width", "100%"], ["height", "100%"], ["marginBottom", "40rpx"], ["objectFit", "cover"]]))], ["camera-container", padStyleMapOf(utsMapOf([["width", "400rpx"], ["height", "400rpx"], ["position", "relative"], ["marginBottom", "40rpx"], ["overflow", "hidden"], ["borderTopLeftRadius", "200rpx"], ["borderTopRightRadius", "200rpx"], ["borderBottomRightRadius", "200rpx"], ["borderBottomLeftRadius", "200rpx"]]))], ["camera-preview", padStyleMapOf(utsMapOf([["width", "100%"], ["height", "100%"]]))], ["face-outline", padStyleMapOf(utsMapOf([["position", "absolute"], ["top", 0], ["left", 0], ["right", 0], ["bottom", 0], ["borderTopWidth", "4rpx"], ["borderRightWidth", "4rpx"], ["borderBottomWidth", "4rpx"], ["borderLeftWidth", "4rpx"], ["borderTopStyle", "dashed"], ["borderRightStyle", "dashed"], ["borderBottomStyle", "dashed"], ["borderLeftStyle", "dashed"], ["borderTopColor", "rgba(255,255,255,0.8)"], ["borderRightColor", "rgba(255,255,255,0.8)"], ["borderBottomColor", "rgba(255,255,255,0.8)"], ["borderLeftColor", "rgba(255,255,255,0.8)"], ["zIndex", 5], ["pointerEvents", "none"]]))], ["scan-line", padStyleMapOf(utsMapOf([["position", "absolute"], ["top", 0], ["left", 0], ["width", "100%"], ["height", "4rpx"], ["backgroundImage", "none"], ["backgroundColor", "rgba(104,71,194,0.8)"], ["boxShadow", "0 0 10rpx #6847c2"], ["animation", "scan 2s ease-in-out infinite"], ["zIndex", 6], ["pointerEvents", "none"]]))], ["countdown-container", padStyleMapOf(utsMapOf([["width", "100%"], ["height", "40rpx"], ["backgroundImage", "none"], ["backgroundColor", "rgba(255,255,255,0.2)"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["marginTop", "20rpx"], ["marginRight", 0], ["marginBottom", "20rpx"], ["marginLeft", 0], ["position", "relative"], ["overflow", "hidden"]]))], ["countdown-progress", padStyleMapOf(utsMapOf([["position", "absolute"], ["left", 0], ["top", 0], ["height", "100%"], ["backgroundImage", "none"], ["backgroundColor", "rgba(104,71,194,0.8)"], ["borderTopLeftRadius", "20rpx"], ["borderTopRightRadius", "20rpx"], ["borderBottomRightRadius", "20rpx"], ["borderBottomLeftRadius", "20rpx"], ["transitionProperty", "width"], ["transitionDuration", "1s"], ["transitionTimingFunction", "linear"]]))], ["countdown-text", padStyleMapOf(utsMapOf([["position", "absolute"], ["width", "100%"], ["textAlign", "center"], ["lineHeight", "40rpx"], ["color", "#ffffff"], ["fontWeight", "bold"], ["zIndex", 1]]))], ["analyzing-animation", padStyleMapOf(utsMapOf([["width", "200rpx"], ["height", "200rpx"], ["position", "relative"], ["marginBottom", "40rpx"]]))], ["pulse-circle", utsMapOf([["", utsMapOf([["position", "absolute"], ["top", "50%"], ["left", "50%"], ["transform", "translate(-50%, -50%)"], ["width", "100rpx"], ["height", "100rpx"], ["backgroundImage", "none"], ["backgroundColor", "rgba(104,71,194,0.2)"], ["animation", "pulse-out 2s infinite"]])], [".delay-1", utsMapOf([["animationDelay", 0.5]])], [".delay-2", utsMapOf([["animationDelay", 1]])]])], ["@FONT-FACE", utsMapOf([["0", utsMapOf([])], ["1", utsMapOf([])], ["2", utsMapOf([])], ["3", utsMapOf([])]])], ["@TRANSITION", utsMapOf([["countdown-progress", utsMapOf([["property", "width"], ["duration", "1s"], ["timingFunction", "linear"]])]])]])]
