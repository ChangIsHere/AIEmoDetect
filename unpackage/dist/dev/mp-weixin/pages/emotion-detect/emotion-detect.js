"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      step: 1,
      isRecordingVideo: false,
      countdownValue: 15,
      countdownProgress: 100,
      countdownInterval: null,
      cameraContext: null,
      hasPermissions: false,
      tempVideoPath: "",
      emotionData: null
      // 情绪分析数据
    };
  },
  onReady() {
    this.cameraContext = common_vendor.index.createCameraContext();
  },
  methods: {
    // 返回上一页
    goBack() {
      common_vendor.index.navigateBack();
    },
    // 处理相机错误
    handleCameraError(err = null) {
      common_vendor.index.__f__("error", "at pages/emotion-detect/emotion-detect.uvue:111", "相机错误:", err);
      common_vendor.index.showToast({
        title: "相机初始化失败，请检查权限",
        icon: "none",
        duration: 2e3
      });
    },
    // 请求麦克风和摄像头权限
    requestPermissions() {
      common_vendor.index.showLoading({
        title: "请求权限中..."
      });
      common_vendor.index.authorize(new UTSJSONObject({
        scope: "scope.record",
        success: () => {
          common_vendor.index.authorize(new UTSJSONObject({
            scope: "scope.camera",
            success: () => {
              this.hasPermissions = true;
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "授权成功",
                icon: "success",
                duration: 1500
              });
              setTimeout(() => {
                this.step = 2;
              }, 1500);
            },
            fail: () => {
              this.handlePermissionFailure();
            }
          }));
        },
        fail: () => {
          this.handlePermissionFailure();
        }
      }));
    },
    // 处理权限请求失败
    handlePermissionFailure() {
      common_vendor.index.hideLoading();
      common_vendor.index.showModal(new UTSJSONObject({
        title: "权限请求",
        content: "需要麦克风和摄像头权限才能进行情绪分析。请在设置中开启相关权限。",
        confirmText: "去设置",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.openSetting();
          }
        }
      }));
    },
    // 开始倒计时
    startCountdown(callback = null) {
      this.countdownValue = 15;
      this.countdownProgress = 100;
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      this.countdownInterval = setInterval(() => {
        this.countdownValue--;
        this.countdownProgress = this.countdownValue / 15 * 100;
        if (this.countdownValue <= 0) {
          clearInterval(this.countdownInterval);
          callback();
        }
      }, 1e3);
    },
    // 开始视频录制
    startVideoRecording() {
      if (!this.cameraContext) {
        common_vendor.index.showToast({ title: "相机初始化失败", icon: "none" });
        return null;
      }
      this.isRecordingVideo = true;
      this.tempVideoPath = "";
      this.startCountdown(() => {
        this.stopVideoRecording();
      });
      this.cameraContext.startRecord(new UTSJSONObject({
        duration: 15,
        compressed: true,
        success: (res = null) => {
          common_vendor.index.__f__("log", "at pages/emotion-detect/emotion-detect.uvue:209", "视频录制完成:", res.tempFilePath);
          this.tempVideoPath = res.tempFilePath;
        },
        fail: (err = null) => {
          common_vendor.index.__f__("error", "at pages/emotion-detect/emotion-detect.uvue:213", "视频录制失败:", err);
          common_vendor.index.showToast({ title: "视频录制失败", icon: "none" });
          this.isRecordingVideo = false;
        }
      }));
      this.cameraContext.onStop((res = null) => {
        common_vendor.index.__f__("log", "at pages/emotion-detect/emotion-detect.uvue:221", "相机录制已停止", res);
        this.isRecordingVideo = false;
        if (res.tempFilePath) {
          this.tempVideoPath = res.tempFilePath;
        }
      });
    },
    // 停止视频录制
    stopVideoRecording() {
      clearInterval(this.countdownInterval);
      if (this.cameraContext) {
        this.cameraContext.stopRecord();
      }
    },
    // 放弃视频，重置状态以便重新录制
    discardVideo() {
      this.tempVideoPath = "";
      this.isRecordingVideo = false;
      this.countdownValue = 15;
      this.countdownProgress = 100;
      common_vendor.index.showToast({ title: "已取消录制", icon: "none" });
    },
    // 提交视频进行分析
    submitVideo() {
      if (!this.tempVideoPath) {
        common_vendor.index.showToast({ title: "请先录制视频", icon: "none" });
        return null;
      }
      this.step = 3;
      common_vendor.index.showLoading({
        title: "视频分析中...",
        mask: true
      });
      common_vendor.index.uploadFile({
        url: "http://localhost:5000/analyze/video",
        filePath: this.tempVideoPath,
        name: "video",
        header: new UTSJSONObject({
          "Content-Type": "multipart/form-data"
        }),
        success: (uploadFileRes) => {
          common_vendor.index.hideLoading();
          const resData = UTS.JSON.parse(uploadFileRes.data);
          common_vendor.index.__f__("log", "at pages/emotion-detect/emotion-detect.uvue:269", "视频分析结果:", resData);
          this.emotionData = resData;
          common_vendor.index.showToast({ title: "分析完成", icon: "success" });
          setTimeout(() => {
            this.goToResultPage();
          }, 1e3);
        },
        fail: (err) => {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/emotion-detect/emotion-detect.uvue:279", "视频上传或分析失败:", err);
          common_vendor.index.showToast({
            title: "视频分析失败，请重试",
            icon: "none",
            duration: 3e3
          });
          this.step = 2;
        }
      });
    },
    // 跳转到结果页
    goToResultPage() {
      if (this.emotionData) {
        common_vendor.index.redirectTo({
          url: "/pages/emotion-result/emotion-result?data=" + encodeURIComponent(UTS.JSON.stringify(this.emotionData))
        });
      } else {
        common_vendor.index.showToast({ title: "未获取到分析数据", icon: "none" });
        this.step = 2;
      }
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: $data.step >= 1 ? 1 : "",
    c: $data.step > 1 ? 1 : "",
    d: $data.step >= 2 ? 1 : "",
    e: $data.step > 2 ? 1 : "",
    f: $data.step >= 3 ? 1 : "",
    g: $data.step > 3 ? 1 : "",
    h: $data.step === 1
  }, $data.step === 1 ? {
    i: common_assets._imports_0$2,
    j: common_vendor.o((...args) => $options.requestPermissions && $options.requestPermissions(...args))
  } : {}, {
    k: $data.step === 2
  }, $data.step === 2 ? common_vendor.e({
    l: !$data.isRecordingVideo && $data.tempVideoPath
  }, !$data.isRecordingVideo && $data.tempVideoPath ? {
    m: common_vendor.sei("videoCapture", "video"),
    n: $data.tempVideoPath
  } : !$data.tempVideoPath ? {
    p: common_vendor.o((...args) => $options.handleCameraError && $options.handleCameraError(...args))
  } : {}, {
    o: !$data.tempVideoPath,
    q: $data.isRecordingVideo
  }, $data.isRecordingVideo ? {} : {}, {
    r: common_vendor.t($data.isRecordingVideo ? "正在录制中，请对着镜头讲述您的问题或情绪..." : $data.tempVideoPath ? "视频已录制完成，您可以预览或重新录制" : "点击下方按钮开始录制"),
    s: $data.isRecordingVideo
  }, $data.isRecordingVideo ? {
    t: common_vendor.t($data.countdownValue),
    v: $data.countdownProgress + "%"
  } : {}, {
    w: !$data.isRecordingVideo && !$data.tempVideoPath
  }, !$data.isRecordingVideo && !$data.tempVideoPath ? {
    x: common_vendor.o((...args) => $options.startVideoRecording && $options.startVideoRecording(...args))
  } : {}, {
    y: !$data.isRecordingVideo && $data.tempVideoPath
  }, !$data.isRecordingVideo && $data.tempVideoPath ? {
    z: common_vendor.o((...args) => $options.discardVideo && $options.discardVideo(...args)),
    A: common_vendor.o((...args) => $options.submitVideo && $options.submitVideo(...args))
  } : {}) : {}, {
    B: $data.step === 3
  }, $data.step === 3 ? {} : {}, {
    C: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/emotion-detect/emotion-detect.js.map
