const fs = require('fs');
const path = require('path');

let sensitiveWords = [];

// 从文件加载敏感词，每行一个
try {
  const dictPath = path.join(__dirname, '../config/sensitive_words.txt');
  const content = fs.readFileSync(dictPath, 'utf8');
  sensitiveWords = content.split('\n').filter(w => w.trim());
} catch (err) {
  console.warn('敏感词库加载失败，使用默认空列表');
}

exports.filter = (text) => {
  let filtered = text;
  for (const word of sensitiveWords) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    filtered = filtered.replace(regex, '***');
  }
  return filtered;
};