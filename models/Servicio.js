const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define('Servicio', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duracion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duracion en minutos',
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Servicio;
