"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "https://git.yukexx.com";
const request = (options) => {
  const { url, method, data, headers } = options;
  common_vendor.index.__f__("log", "at utils/request.js:13", "Request URL:", url);
  common_vendor.index.__f__("log", "at utils/request.js:14", "Request Data:", data);
  common_vendor.index.__f__("log", "at utils/request.js:15", "Request Headers:", headers);
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: method || "POST",
      data,
      header: headers,
      // 直接使用传入的headers
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res.data || { message: `请求失败，状态码: ${res.statusCode}` });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/request.js:31", "Network request failed:", err);
        reject({ message: "网络请求失败，请检查网络连接", detail: err });
      }
    });
  });
};
const chatWithLLM = (params) => {
  return request({
    url: `${BASE_URL}/chat/text`,
    method: "POST",
    data: {
      question: params.message,
      session_id: params.sessionId
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
};
const uploadVideoForAnalysis = (options) => {
  const {
    filePath,
    taskType = "emotion_analysis",
    detailsLevel = "high",
    question = "分析视频中人物的情感，并且给出详细原因",
    maxFrames = 100
  } = options;
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: `${BASE_URL}/analyze/video`,
      filePath,
      name: "file",
      formData: {
        "task_type": taskType,
        "details_level": detailsLevel,
        "question": question,
        "max_frames": maxFrames
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (err) {
            reject({ message: "视频分析接口返回数据解析失败", detail: res.data, error: err });
          }
        } else {
          reject({ message: `上传失败: ${res.statusCode}`, statusCode: res.statusCode });
        }
      },
      fail: (err) => {
        reject({ message: "视频分析请求失败", error: err });
      }
    });
  });
};
const request$1 = {
  chatWithLLM,
  uploadVideoForAnalysis
};
exports.request = request$1;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
