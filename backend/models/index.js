const { sequelize } = require('../config/baseDatos');

// Importar todos los modelos
const Habito = require('./Habito');
const Progreso = require('./Progreso');
const Recordatorio = require('./Recordatorio');
const Logro = require('./Logro');
const LogroObtenido = require('./LogroObtenido');
const Configuracion = require('./Configuracion');

// Definir las relaciones entre modelos
// Un hábito puede tener muchos registros de progreso
Habito.hasMany(Progreso, {
  foreignKey: 'habitoId',
  as: 'registrosProgreso',
  onDelete: 'CASCADE'
});
Progreso.belongsTo(Habito, {
  foreignKey: 'habitoId',
  as: 'habito'
});

// Un hábito puede tener muchos recordatorios
Habito.hasMany(Recordatorio, {
  foreignKey: 'habitoId',
  as: 'recordatorios',
  onDelete: 'CASCADE'
});
Recordatorio.belongsTo(Habito, {
  foreignKey: 'habitoId',
  as: 'habito'
});

// Un logro puede ser obtenido muchas veces
Logro.hasMany(LogroObtenido, {
  foreignKey: 'logroId',
  as: 'obtenidos',
  onDelete: 'CASCADE'
});
LogroObtenido.belongsTo(Logro, {
  foreignKey: 'logroId',
  as: 'logro'
});

// Un hábito puede estar relacionado con logros obtenidos
Habito.hasMany(LogroObtenido, {
  foreignKey: 'habitoId',
  as: 'logrosObtenidos',
  onDelete: 'SET NULL'
});
LogroObtenido.belongsTo(Habito, {
  foreignKey: 'habitoId',
  as: 'habito'
});

// Exportar todos los modelos y la instancia de sequelize
module.exports = {
  sequelize,
  Habito,
  Progreso,
  Recordatorio,
  Logro,
  LogroObtenido,
  Configuracion
};
