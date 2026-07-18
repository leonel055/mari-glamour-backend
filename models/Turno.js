const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Turno = sequelize.define('Turno', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  horaInicio: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  horaFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'PENDIENTE',
    validate: {
      isIn: [['PENDIENTE', 'CONFIRMADO', 'FINALIZADO', 'CANCELADO']],
    },
  },
  servicioIds: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    defaultValue: [],
  },
  costoAdicional: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Turno;
