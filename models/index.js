const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Servicio = require('./Servicio');
const Turno = require('./Turno');
const Curso = require('./Curso');
const Producto = require('./Producto');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const Pago = require('./Pago');
const ProductoImagen = require('./ProductoImagen');

Cliente.hasMany(Turno, { foreignKey: 'clienteId' });
Turno.belongsTo(Cliente, { foreignKey: 'clienteId' });

Servicio.hasMany(Turno, { foreignKey: 'servicioId' });
Turno.belongsTo(Servicio, { foreignKey: 'servicioId' });

Usuario.hasMany(Turno, { foreignKey: 'usuarioId' });
Turno.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId', as: 'detalles' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId' });

DetallePedido.belongsTo(Producto, { foreignKey: 'productoId' });
Producto.hasMany(DetallePedido, { foreignKey: 'productoId' });

Pedido.hasOne(Pago, { foreignKey: 'pedidoId', as: 'pago' });
Pago.belongsTo(Pedido, { foreignKey: 'pedidoId' });

Producto.hasMany(ProductoImagen, { foreignKey: 'productoId', as: 'imagenes', onDelete: 'CASCADE' });
ProductoImagen.belongsTo(Producto, { foreignKey: 'productoId' });

module.exports = {
  sequelize,
  Usuario,
  Cliente,
  Servicio,
  Turno,
  Curso,
  Producto,
  Pedido,
  DetallePedido,
  Pago,
  ProductoImagen,
};
