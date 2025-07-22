const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const LogroObtenido = sequelize.define('LogroObtenido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  logroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'logros',
      key: 'id'
    },
    comment: 'ID del logro obtenido'
  },
  habitoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'habitos',
      key: 'id'
    },
    comment: 'ID del hábito relacionado (si aplica)'
  },
  fechaObtenido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha en que se obtuvo el logro'
  },
  detalles: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Detalles específicos del logro obtenido'
  },
  visto: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Si el usuario ya vio la notificación del logro'
  }
}, {
  tableName: 'logros_obtenidos',
  timestamps: false,
  comment: 'Tabla de logros obtenidos por los usuarios'
});

module.exports = LogroObtenido;
