const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pedidoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  preferenceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO'),
    defaultValue: 'PENDIENTE',
  },
  metodoPago: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
});

module.exports = Pago;
