const { sequelize } = require('../config/baseDatos');

async function actualizarTablaProgreso() {
  try {
    console.log('🔧 Iniciando actualización de tabla progreso...');

    // Eliminar el índice único existente si existe
    try {
      await sequelize.query('DROP INDEX IF EXISTS progreso_habito_fecha_unico ON progreso');
      console.log('✅ Índice único eliminado exitosamente');
    } catch (error) {
      console.log('⚠️ El índice único no existía o ya fue eliminado:', error.message);
    }

    // Crear nuevo índice no único
    try {
      await sequelize.query('CREATE INDEX progreso_habito_fecha_indice ON progreso (habitoId, fecha)');
      console.log('✅ Nuevo índice creado exitosamente');
    } catch (error) {
      console.log('⚠️ El índice ya existe:', error.message);
    }

    console.log('✅ Actualización completada. Ahora se pueden crear múltiples registros de progreso por día.');
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

actualizarTablaProgreso();
