module.exports = (sequelize, DataTypes) => {
  const UserVote = sequelize.define('UserVote', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    target_type: { type: DataTypes.ENUM('post', 'reply'), allowNull: false },
    target_id: DataTypes.INTEGER,
    vote_type: { type: DataTypes.ENUM('like', 'dislike'), allowNull: false }
  }, {
    tableName: 'user_votes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ unique: true, fields: ['user_id', 'target_type', 'target_id'] }]
  });
  return UserVote;
};