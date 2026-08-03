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
      isIn: [['PENDIENTE', 'CONFIRMADO', 'FINALIZADO', 'CANCELADO', 'REPROGRAMADO']],
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
  metodoReserva: {
    type: DataTypes.STRING,
    defaultValue: 'MANUAL',
    validate: {
      isIn: [['MANUAL', 'WHATSAPP', 'ONLINE']],
    },
  },
  montoSenia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Monto de la seña a abonar',
  },
  seniaPagada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  preferenceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reservaExpira: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Vencimiento de la reserva temporal online (10 min)',
  },
  clienteNombre: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nombre del cliente para reservas online sin cuenta',
  },
  clienteWhatsApp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clienteEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Turno;
