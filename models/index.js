const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Servicio = require('./Servicio');
const Turno = require('./Turno');
const Curso = require('./Curso');
const Producto = require('./Producto');

Cliente.hasMany(Turno, { foreignKey: 'clienteId' });
Turno.belongsTo(Cliente, { foreignKey: 'clienteId' });

Servicio.hasMany(Turno, { foreignKey: 'servicioId' });
Turno.belongsTo(Servicio, { foreignKey: 'servicioId' });

Usuario.hasMany(Turno, { foreignKey: 'usuarioId' });
Turno.belongsTo(Usuario, { foreignKey: 'usuarioId' });

module.exports = {
  sequelize,
  Usuario,
  Cliente,
  Servicio,
  Turno,
  Curso,
  Producto,
};
