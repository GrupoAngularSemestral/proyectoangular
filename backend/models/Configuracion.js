const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Configuracion = sequelize.define('Configuracion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Nombre de la configuración'
  },
  valor: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Valor de la configuración'
  },
  tipo: {
    type: DataTypes.ENUM('global', 'perfil', 'notificacion', 'exportacion'),
    defaultValue: 'global',
    comment: 'Tipo de configuración'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de la configuración'
  },
  fechaActualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de última actualización'
  }
}, {
  tableName: 'configuraciones',
  timestamps: false,
  comment: 'Tabla de configuraciones del sistema'
});

module.exports = Configuracion;
