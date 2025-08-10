// 移除显式导入，uni对象在UniApp环境中为全局对象

/**
 * 请求工具模块
 */

// API基础URL，直接指向LLM服务
const BASE_URL = 'http://git.yukexx.com:13023'; // 移除末尾的斜杠

const request = (options) => {
	const { url, method, data, headers } = options;

	console.log('Request URL:', url); // 打印请求URL
	console.log('Request Data:', data); // 打印请求数据
	console.log('Request Headers:', headers); // 打印请求头

	return new Promise((resolve, reject) => {
		uni.request({
			url: url,
			method: method || 'POST',
			data: data,
			header: headers, // 直接使用传入的headers
			success: (res) => {
				if (res.statusCode === 200) {
					resolve(res.data);
				} else {
					reject(res.data || { message: `请求失败，状态码: ${res.statusCode}` });
				}
			},
			fail: (err) => {
				console.error('Network request failed:', err);
				reject({ message: '网络请求失败，请检查网络连接', detail: err });
			},
		});
	});
};

const chatWithLLM = (params) => {
	return request({
		url: `${BASE_URL}/chat/text`,
		method: 'POST',
		data: {
			question: params.message,
			session_id: params.sessionId,
		},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded', // 关键点
		},
	});
};

const uploadVideoForAnalysis = (options) => {
	const {
		filePath,
		taskType = 'emotion_analysis',
		detailsLevel = 'high',
		question = '分析视频中人物的情感，并且给出详细原因',
		maxFrames = 100
	} = options;

	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: `${BASE_URL}/analyze/video`,
			filePath: filePath,
			name: 'file',
			formData: {
				'task_type': taskType,
				'details_level': detailsLevel,
				'question': question,
				'max_frames': maxFrames
			},
			success: (res) => {
				if (res.statusCode === 200) {
					try {
						const data = JSON.parse(res.data);
						resolve(data);
					} catch (err) {
						reject({ message: '视频分析接口返回数据解析失败', detail: res.data, error: err });
					}
				} else {
					reject({ message: `上传失败: ${res.statusCode}`, statusCode: res.statusCode });
				}
			},
			fail: (err) => {
				reject({ message: '视频分析请求失败', error: err });
			},
		});
	});
};

const analyzeEmotionFromVideo = (options) => {
	const {
		filePath,
		userName = '小明',
		userId = '明世隐',
		userSex = '男',
		userAge = '21'
	} = options;

	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: `${BASE_URL}/emotion/analysis`, // Updated endpoint
			filePath: filePath,
			name: 'file', // Changed to 'file' to match backend
			formData: {
				'userName': userName,
				'userId': userId,
				'userSex': userSex,
				'userAge': userAge
			},
			success: (res) => {
				if (res.statusCode === 200) {
					try {
						const data = JSON.parse(res.data);
						resolve(data);
					} catch (err) {
						reject({ message: '分析接口返回数据解析失败', detail: res.data, error: err });
					}
				} else {
					reject({ message: `上传失败: ${res.statusCode}`, statusCode: res.statusCode });
				}
			},
			fail: (err) => {
				reject({ message: '情绪分析请求失败', error: err });
			},
		});
	});
};

export default {
	chatWithLLM,
	uploadVideoForAnalysis,
  analyzeEmotionFromVideo, // Export the new function
}; 