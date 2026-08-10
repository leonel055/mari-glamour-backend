const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MpCredencial = sequelize.define('MpCredencial', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  mpUserId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tokenType: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  liveMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  publicKey: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = MpCredencial;
