const { sequelize } = require('../config/baseDatos');

async function limpiarTablas() {
  try {
    console.log('🧹 Iniciando limpieza de tablas...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');
    
    // Eliminar tablas problemáticas si existen
    const tablasParaEliminar = [
      'habitos',
      'usuarios', 
      'logros',
      'progreso',
      'recordatorios',
      'logros_obtenidos',
      'configuraciones'
    ];
    
    for (const tabla of tablasParaEliminar) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${tabla}" CASCADE;`);
        console.log(`🗑️  Tabla ${tabla} eliminada`);
      } catch (error) {
        console.log(`⚠️  No se pudo eliminar ${tabla}: ${error.message}`);
      }
    }
    
    // Eliminar tipos ENUM si existen
    const enumsParaEliminar = [
      'enum_habitos_tipo',
      'enum_habitos_frecuencia',
      'enum_logros_tipo',
      'enum_logros_rareza'
    ];
    
    for (const enumType of enumsParaEliminar) {
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE;`);
        console.log(`🗑️  Tipo ENUM ${enumType} eliminado`);
      } catch (error) {
        console.log(`⚠️  No se pudo eliminar tipo ${enumType}: ${error.message}`);
      }
    }
    
    console.log('✅ Limpieza completada exitosamente');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

limpiarTablas();
