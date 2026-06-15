const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, Sequelize);
const Forum = require('./Forum')(sequelize, Sequelize);
const Post = require('./Post')(sequelize, Sequelize);
const Reply = require('./Reply')(sequelize, Sequelize);
const UserVote = require('./UserVote')(sequelize, Sequelize);
const Favorite = require('./Favorite')(sequelize, Sequelize);
const Report = require('./Report')(sequelize, Sequelize);
const Notification = require('./Notification')(sequelize, Sequelize);
const OperationLog = require('./OperationLog')(sequelize, Sequelize);
const Announcement = require('./Announcement')(sequelize, Sequelize);
const Settings = require('./Settings')(sequelize, Sequelize);
const EmotionLog = require('./EmotionLog')(sequelize, Sequelize);
const WeeklyReport = require('./WeeklyReport')(sequelize, Sequelize);
const AiConversation = require('./AiConversation')(sequelize, Sequelize);
const AiMessage = require('./AiMessage')(sequelize, Sequelize);
const PsychologicalTest = require('./PsychologicalTest')(sequelize, Sequelize);
const TestResult = require('./TestResult')(sequelize, Sequelize);
const GratitudePractice = require('./GratitudePractice')(sequelize, Sequelize);


// 关联关系
User.hasMany(Post, { foreignKey: 'user_id' , constraints: false });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author', constraints: false  });

User.hasMany(Reply, { foreignKey: 'user_id' , constraints: false });
Reply.belongsTo(User, { foreignKey: 'user_id', as: 'author', constraints: false });

Post.hasMany(Reply, { foreignKey: 'post_id' , constraints: false });
Reply.belongsTo(Post, { foreignKey: 'post_id', as: 'post', constraints: false });

Forum.hasMany(Post, { foreignKey: 'forum_id' , constraints: false });
Post.belongsTo(Forum, { foreignKey: 'forum_id', constraints: false });

User.belongsToMany(Post, { through: Favorite, foreignKey: 'user_id', otherKey: 'post_id', as: 'favorited_posts' , constraints: false });
Post.belongsToMany(User, { through: Favorite, foreignKey: 'post_id', otherKey: 'user_id', as: 'favorited_by' , constraints: false });

// 版主关系
Forum.belongsTo(User, { foreignKey: 'moderator_id', as: 'moderator' , constraints: false });

// 在 index.js 中，其他关联定义之后添加
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter', constraints: false });
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'reports', constraints: false });


Post.hasOne(EmotionLog, { foreignKey: 'post_id', as: 'emotion_log', constraints: false });
EmotionLog.belongsTo(Post, { foreignKey: 'post_id', constraints: false });
User.hasMany(WeeklyReport, { foreignKey: 'user_id', as: 'weekly_reports', constraints: false });
User.hasMany(EmotionLog, { foreignKey: 'user_id', as: 'emotion_logs', constraints: false });

const AiAssistant = require('./AiAssistant')(sequelize, Sequelize);

// 关联 AI 助手与回复
Reply.belongsTo(AiAssistant, { foreignKey: 'assistant_id', as: 'assistant' });
AiAssistant.hasMany(Reply, { foreignKey: 'assistant_id', as: 'replies' });


// 自关联：回复可以属于另一个回复（父回复）
Reply.belongsTo(Reply, { as: 'parent', foreignKey: 'parent_reply_id', constraints: false });
Reply.hasMany(Reply, { as: 'children', foreignKey: 'parent_reply_id', constraints: false });


// 关联
AiConversation.belongsTo(AiAssistant, { foreignKey: 'assistant_id', as: 'assistant' });
AiConversation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
AiMessage.belongsTo(AiConversation, { foreignKey: 'conversation_id', as: 'conversation' });
AiConversation.hasMany(AiMessage, { foreignKey: 'conversation_id', as: 'messages' });


// 在定义完所有关联关系后，调用每个模型的 associate 方法（如果存在）
const models = { User, Forum, Post, Reply, UserVote, Favorite, Report, Notification, OperationLog, Announcement, Settings, AiAssistant, EmotionLog, WeeklyReport, AiConversation, AiMessage };
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});


module.exports = {
  sequelize,
  User,
  Forum,
  Post,
  Reply,
  UserVote,
  Favorite,
  Report,
  Notification,
  OperationLog,
  Announcement,
  Settings,
  EmotionLog,
  WeeklyReport,
  AiAssistant,
  AiConversation,
  AiMessage,
  PsychologicalTest,
  TestResult,
  GratitudePractice
};