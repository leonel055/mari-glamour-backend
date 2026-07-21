const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Curso = sequelize.define('Curso', {
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
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fechaFin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  horario: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ej: 18:00 - 20:00',
  },
  duracion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duracion total en horas',
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cupos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  cuposDisponibles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  temario: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Array de {titulo, items[]}',
  },
  incluye: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Array de strings',
  },
  inscripcion: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Costo de inscripcion',
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Curso;
