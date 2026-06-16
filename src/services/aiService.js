// services/aiService.js
const axios = require('axios');
const { AiAssistant } = require('../models');

// ========== 配置区域 ==========
const ALIYUN_API_KEY = 'sk-b2716158c80d4d96b276872163586a90';          // 通义千问 API Key
const ALIYUN_MODEL = 'qwen-turbo';

// 豆包（火山引擎）
const DOUBAO_API_KEY = 'your-doubao-key';
const DOUBAO_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'; // 示例地址

// 文心一言（百度）
const WENXIN_API_KEY = 'your-wenxin-key';
const WENXIN_SECRET_KEY = 'your-wenxin-secret';
const WENXIN_ENDPOINT = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';

const BAIDU_APP_ID = '123014153';//122978540
const BAIDU_API_KEY = 'T5fFp5xNR9gzFHjLbZ7zAEEk';
const BAIDU_SECRET_KEY = 'LNQ0d5m3uPFg8WnHVW5rYVHBQv8e6xEV';
// ============================

// 通义千问调用（接收 messages 数组）
async function callQwen(messages) {
  if (!ALIYUN_API_KEY || ALIYUN_API_KEY === 'sk-') {
    console.warn('通义千问未配置，返回默认回复');
    return "通义千问暂时无法回复，请稍后再试。";
  }
  try {
    const response = await axios.post('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      model: ALIYUN_MODEL,
      input: { messages },
      parameters: { result_format: 'message' }
    }, {
      headers: { 'Authorization': `Bearer ${ALIYUN_API_KEY}`, 'Content-Type': 'application/json' }
    });
    return response.data.output.choices[0].message.content;
  } catch (err) {
    console.error('通义千问调用失败:', err.message);
    return "通义千问暂时无法回复，请稍后再试。";
  }
}

// 豆包（火山引擎）调用，接收 messages 数组
async function callDoubao(messages) {
  if (!DOUBAO_API_KEY || DOUBAO_API_KEY === 'your-doubao-key') {
    console.warn('豆包未配置，返回默认回复');
    return "豆包助手暂时无法回复，请稍后再试。";
  }
  try {
    const response = await axios.post(DOUBAO_ENDPOINT, {
      model: 'doubao-lite-32k',  // 根据实际模型名称修改
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${DOUBAO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('豆包调用失败:', err.message);
    return "豆包助手暂时不可用，请稍后再试。";
  }
}

// 获取文心一言 access_token
let wenxinAccessToken = null;
let tokenExpireTime = 0;
async function getWenxinAccessToken() {
  if (wenxinAccessToken && Date.now() < tokenExpireTime) {
    return wenxinAccessToken;
  }
  try {
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${WENXIN_API_KEY}&client_secret=${WENXIN_SECRET_KEY}`;
    const response = await axios.post(url);
    wenxinAccessToken = response.data.access_token;
    tokenExpireTime = Date.now() + (response.data.expires_in - 60) * 1000;
    return wenxinAccessToken;
  } catch (err) {
    console.error('获取文心一言 token 失败:', err.message);
    return null;
  }
}

// 文心一言调用
async function callWenxin(messages) {
  if (!WENXIN_API_KEY || WENXIN_API_KEY === 'your-wenxin-key') {
    console.warn('文心一言未配置，返回默认回复');
    return "文心一言暂时无法回复，请稍后再试。";
  }
  const accessToken = await getWenxinAccessToken();
  if (!accessToken) {
    return "文心一言助手暂时不可用，请稍后再试。";
  }
  try {
    const response = await axios.post(`${WENXIN_ENDPOINT}?access_token=${accessToken}`, {
      messages: messages,
      temperature: 0.7,
      max_output_tokens: 500
    });
    // 文心一言返回格式：{ result: "..." }
    return response.data.result;
  } catch (err) {
    console.error('文心一言调用失败:', err.message);
    return "文心一言助手暂时不可用，请稍后再试。";
  }
}

// 2. 百度情感分析
async function sentimentAnalysis(text) {
  // 如果没有配置，返回默认中性结果，不影响发帖
  if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
    console.warn('百度API未配置，使用默认中性结果');
    return { sentiment: 'neutral', score: 0.5 };
  }
  try {
    const tokenRes = await axios.post(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`);
    const accessToken = tokenRes.data.access_token;
    const res = await axios.post(`https://aip.baidubce.com/rpc/2.0/nlp/v1/sentiment_classify?access_token=${accessToken}`, { text });
    const item = res.data.items[0];
    let sentiment = 'neutral';
    if (item.sentiment === 0) sentiment = 'negative';
    if (item.sentiment === 2) sentiment = 'positive';
    if (sentiment === 'negative' && /焦虑|压力|抑郁|失眠/.test(text)) sentiment = 'anxious';
    if (sentiment === 'negative' && /愤怒|生气|恨/.test(text)) sentiment = 'angry';
    return { sentiment, score: item.confidence };
  } catch (err) {
    console.error('情感分析失败:', err.message);
    return { sentiment: 'neutral', score: 0.5 };
  }
}

// 3. 智能归类（返回7个板块名称之一）
async function categorizePost(title, content) {
  if (!ALIYUN_API_KEY || ALIYUN_API_KEY === 'sk-') {
    // 无AI时默认归入"其他碎碎念"
    return '其他碎碎念';
  }
  const prompt = `请将以下帖子内容归类为以下之一：情感倾诉、学业压力、职场焦虑、人际关系、生活琐事、积极分享、其他碎碎念。只输出分类名称，不要输出其他任何内容。
标题：${title}
内容：${content}
分类：`;
  const result = await callQwen([{ role: 'user', content: prompt }]);
  const valid = ['情感倾诉', '学业压力', '职场焦虑', '人际关系', '生活琐事', '积极分享', '其他碎碎念'];
  return valid.includes(result) ? result : '其他碎碎念';
}

// 4. 恶意内容审核（本地敏感词过滤，安全稳定）
// 恶意内容审核（本地敏感词 + AI 语义审核）
async function contentModeration(text) {
  // 第一层：本地敏感词快速过滤
  const fs = require('fs');
  const path = require('path');
  let sensitiveWords = [];
  try {
    const dictPath = path.join(process.cwd(), 'config', 'sensitive_words.txt');
    const content = fs.readFileSync(dictPath, 'utf8');
    sensitiveWords = content.split('\n').filter(w => w.trim());
  } catch (err) {
    sensitiveWords = ['色情', '暴力', '政治', '法轮功', '习', '傻X', '去死', '垃圾', '傻逼'];
  }
  const normalized = text.replace(/\s+/g, '');
  for (const word of sensitiveWords) {
    if (normalized.includes(word) || text.includes(word)) {
      return { passed: false, reason: `内容包含敏感词: ${word}` };
    }
  }

  // 第二层：AI 语义审核
  const aiResult = await aiContentModeration(text);
  if (!aiResult.passed) {
    return aiResult;
  }

  return { passed: true, reason: null };
}
// 5. AI共情回复
async function generateEmpatheticReply(postTitle, postContent) {
  if (!ALIYUN_API_KEY || ALIYUN_API_KEY === 'sk-') return "感谢你的分享，这里是树洞，会一直倾听你的声音。";
  const prompt = `你是一个温暖的心理支持者。用户发表了以下内容，请写一段共情、安慰且给予希望的回复（50字以内）。
标题：${postTitle}
内容：${postContent}
回复：`;
  const reply = await callQwen([{ role: 'user', content: prompt }]);
  return reply || "你的心情我们感受到了，树洞会一直陪伴着你。";
}

// 6. 生成情绪周报
async function generateWeeklyReport(username, posts) {
  if (!ALIYUN_API_KEY || ALIYUN_API_KEY === 'sk-') return { trend: '波动', encouragement: '继续加油，树洞会一直陪伴你。' };
  const prompt = `用户 ${username} 本周发布了以下树洞内容：
${posts.map(p => `- ${p.title}：${p.content.substring(0, 100)}`).join('\n')}
请分析他的情绪走势（变好/变差/波动），并写一段鼓励语（100字以内）。
输出格式：
情绪走势：xxx
鼓励语：xxx`;
  const result = await callQwen([{ role: 'user', content: prompt }]);
  if (!result) return { trend: '波动', encouragement: '继续加油，树洞会一直陪伴你。' };
  const lines = result.split('\n');
  let trend = '波动', encouragement = result;
  for (let line of lines) {
    if (line.startsWith('情绪走势')) trend = line.split('：')[1] || trend;
    if (line.startsWith('鼓励语')) encouragement = line.split('：')[1] || encouragement;
  }
  return { trend, encouragement };
}

// 7. AI 智能内容审核（使用通义千问）
async function aiContentModeration(text) {
  if (!ALIYUN_API_KEY || ALIYUN_API_KEY === 'sk-') {
    console.warn('未配置通义千问 API Key，跳过 AI 审核');
    return { passed: true, reason: null };
  }
  const prompt = `你是一个内容安全审核员。请判断以下用户发布的内容是否包含恶意攻击、侮辱、诅咒、暴力、色情、政治敏感或其他违规内容。如果安全，只回复"安全"；如果不安全，回复"违规:具体原因"。注意：讽刺、暗讽、隐晦诅咒也属于违规。
内容：${text}
判断：`;
  const result = await callQwen([{ role: 'user', content: prompt }]);
  if (result && result.startsWith('违规')) {
    const reason = result.replace('违规:', '').trim() || 'AI 判定内容违规';
    return { passed: false, reason };
  }
  return { passed: true, reason: null };
}


// 调用指定角色的 AI 助手
async function callRoleAssistant(assistant, userMessage, history = []) {
  if (!assistant || !assistant.system_prompt) {
    throw new Error('无效的AI助手配置');
  }
  const messages = [
    { role: 'system', content: assistant.system_prompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  // 根据模型类型分发
  switch (assistant.model_type) {
    case 'qwen':
      return await callQwen(messages);
    case 'doubao':
      return await callDoubao(messages);
    case 'wenxin':
      return await callWenxin(messages);
    default:
      console.warn(`未知模型类型: ${assistant.model_type}，降级到通义千问`);
      return await callQwen(messages);
  }
}

// 获取默认兜底助手（优先级：is_default = 1 且 status = 1，否则取第一个启用的）
async function getDefaultAssistant() {
  let assistant = await AiAssistant.findOne({ where: { is_default: true, status: 1 } });
  if (!assistant) {
    assistant = await AiAssistant.findOne({ where: { status: 1 } });
  }
  return assistant;
}

module.exports = {
  callQwen,
  sentimentAnalysis,
  categorizePost,
  contentModeration,
  aiContentModeration,
  generateEmpatheticReply,
  generateWeeklyReport,
  callRoleAssistant,
  getDefaultAssistant
};