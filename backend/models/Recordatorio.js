const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Recordatorio = sequelize.define('Recordatorio', {
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
  tipo: {
    type: DataTypes.ENUM('web', 'push', 'email'),
    defaultValue: 'web',
    comment: 'Tipo de recordatorio'
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: 'Hora del recordatorio'
  },
  diasSemana: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Días de la semana para el recordatorio'
  },
  mensaje: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Mensaje personalizado del recordatorio'
  },
  estaActivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si el recordatorio está activo'
  },
  ultimoEnviado: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que se envió el recordatorio'
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de creación del recordatorio'
  }
}, {
  tableName: 'recordatorios',
  timestamps: false,
  comment: 'Tabla de recordatorios configurables'
});

module.exports = Recordatorio;
