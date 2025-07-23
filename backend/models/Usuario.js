const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/baseDatos');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre completo del usuario'
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: 'Correo electrónico único del usuario'
  },
  fechaNacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de nacimiento del usuario'
  },
  genero: {
    type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro'),
    allowNull: true,
    comment: 'Género del usuario'
  },
  altura: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true,
    comment: 'Altura en centímetros'
  },
  peso: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true,
    comment: 'Peso en kilogramos'
  },
  metaAgua: {
    type: DataTypes.DECIMAL(4,2),
    defaultValue: 2.0,
    comment: 'Meta de consumo de agua en litros por día'
  },
  metaSueno: {
    type: DataTypes.INTEGER,
    defaultValue: 8,
    comment: 'Meta de horas de sueño por día'
  },
  nivelActividad: {
    type: DataTypes.ENUM('Sedentario', 'Ligero', 'Moderado', 'Activo', 'Muy Activo'),
    defaultValue: 'Moderado',
    comment: 'Nivel de actividad física'
  },
  objetivoFitness: {
    type: DataTypes.ENUM('Bajar Peso', 'Mantener Peso', 'Subir Peso', 'Ganar Músculo'),
    defaultValue: 'Mantener Peso',
    comment: 'Objetivo principal de fitness'
  },
  notificacionesActivas: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si las notificaciones están activas'
  },
  tema: {
    type: DataTypes.ENUM('Claro', 'Oscuro'),
    defaultValue: 'Claro',
    comment: 'Tema preferido de la aplicación'
  },
  estaActivo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Si el usuario está activo en el sistema'
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de creación del registro'
  },
  fechaActualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de última actualización'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'fechaCreacion',
  updatedAt: 'fechaActualizacion',
  comment: 'Tabla de usuarios del sistema FitTrack'
});

module.exports = Usuario;
