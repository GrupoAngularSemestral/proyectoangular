const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Logro = sequelize.define('Logro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre del logro'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Descripción del logro'
  },
  tipo: {
    type: DataTypes.ENUM('racha', 'meta_diaria', 'meta_semanal', 'meta_mensual', 'especial'),
    allowNull: false,
    comment: 'Tipo de logro'
  },
  icono: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Emoji o nombre del icono'
  },
  condicion: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Condiciones para obtener el logro'
  },
  puntos: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Puntos que otorga el logro'
  },
  rareza: {
    type: DataTypes.ENUM('comun', 'raro', 'epico', 'legendario'),
    defaultValue: 'comun',
    comment: 'Nivel de rareza del logro'
  },
  estaActivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si el logro está disponible'
  }
}, {
  tableName: 'logros',
  timestamps: false,
  comment: 'Tabla de logros y recompensas disponibles'
});

module.exports = Logro;
