const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clienteNombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clienteEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clienteTelefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'CANCELADO', 'ENTREGADO'),
    defaultValue: 'PENDIENTE',
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Pedido;
