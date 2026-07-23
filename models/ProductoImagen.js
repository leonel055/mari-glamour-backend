const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductoImagen = sequelize.define('ProductoImagen', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  imagen: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = ProductoImagen;
