const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Habito = sequelize.define('Habito', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del hábito (ej: Beber agua, Hacer ejercicio)'
  },
  tipo: {
    type: DataTypes.ENUM('exercise', 'water', 'sleep', 'custom'),
    allowNull: false,
    comment: 'Tipo de hábito: ejercicio, agua, sueño, personalizado'
  },
  meta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Meta numérica del hábito (ej: 8 vasos, 30 minutos)'
  },
  unidad: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Unidad de medida (vasos, minutos, horas, etc.)'
  },
  frecuencia: {
    type: DataTypes.ENUM('daily', 'weekly', 'custom'),
    defaultValue: 'daily',
    comment: 'Frecuencia del hábito'
  },
  recordatorioActivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si el recordatorio está activado'
  },
  horaRecordatorio: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora del recordatorio (formato HH:mm)'
  },
  diasRepeticion: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array de días para repetir (ej: ["Monday", "Wednesday"])'
  },
  estaActivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si el hábito está activo'
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de creación del hábito'
  },
  fechaActualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de última actualización'
  }
}, {
  tableName: 'habitos',
  timestamps: true,
  createdAt: 'fechaCreacion',
  updatedAt: 'fechaActualizacion',
  comment: 'Tabla de hábitos registrados en FitTrack'
});

module.exports = Habito;
