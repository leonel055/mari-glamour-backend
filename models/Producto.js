const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
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
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ej: Uñas, Cuidado, Accesorios',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Producto;
