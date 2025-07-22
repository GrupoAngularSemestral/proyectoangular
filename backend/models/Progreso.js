const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Progreso = sequelize.define('Progreso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  habitoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'habitos',
      key: 'id'
    },
    comment: 'ID del hábito relacionado'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha del registro de progreso'
  },
  valorCompletado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Valor completado (ej: 6 vasos de agua, 45 minutos ejercicio)'
  },
  metaDelDia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Meta que tenía ese día'
  },
  porcentajeCompletado: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    comment: 'Porcentaje de completado (0-100)'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales sobre el progreso del día'
  },
  completado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si se completó la meta del día'
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha y hora del registro'
  }
}, {
  tableName: 'progreso',
  timestamps: false,
  comment: 'Tabla de progreso diario de los hábitos',
  indexes: [
    {
      unique: true,
      fields: ['habitoId', 'fecha'],
      name: 'progreso_habito_fecha_unico'
    }
  ]
});

module.exports = Progreso;
