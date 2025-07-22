const { sequelize, Habito, Progreso, Logro } = require('../models');

async function inicializarDatosEjemplo() {
  try {
    console.log('🔄 Inicializando datos de ejemplo...');

    // Crear hábitos de ejemplo
    const habitosEjemplo = [
      {
        nombre: 'Beber agua',
        tipo: 'water',
        meta: 8,
        unidad: 'vasos',
        frecuencia: 'daily',
        recordatorioActivo: true,
        horaRecordatorio: '09:00',
        diasRepeticion: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      {
        nombre: 'Ejercicio cardiovascular',
        tipo: 'exercise',
        meta: 30,
        unidad: 'minutos',
        frecuencia: 'daily',
        recordatorioActivo: true,
        horaRecordatorio: '18:00',
        diasRepeticion: ['Monday', 'Wednesday', 'Friday']
      },
      {
        nombre: 'Dormir 8 horas',
        tipo: 'sleep',
        meta: 8,
        unidad: 'horas',
        frecuencia: 'daily',
        recordatorioActivo: false
      },
      {
        nombre: 'Leer un libro',
        tipo: 'custom',
        meta: 30,
        unidad: 'páginas',
        frecuencia: 'daily',
        recordatorioActivo: true,
        horaRecordatorio: '20:00',
        diasRepeticion: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      {
        nombre: 'Caminar',
        tipo: 'exercise',
        meta: 10000,
        unidad: 'pasos',
        frecuencia: 'daily',
        recordatorioActivo: true,
        horaRecordatorio: '16:00'
      }
    ];

    const habitosCreados = [];
    for (let habito of habitosEjemplo) {
      const existe = await Habito.findOne({ where: { nombre: habito.nombre } });
      if (!existe) {
        const nuevoHabito = await Habito.create(habito);
        habitosCreados.push(nuevoHabito);
        console.log(`✅ Hábito creado: ${habito.nombre}`);
      } else {
        console.log(`ℹ️  Hábito ya existe: ${habito.nombre}`);
      }
    }

    // Crear algunos registros de progreso de ejemplo para los últimos 7 días
    if (habitosCreados.length > 0) {
      console.log('🔄 Creando registros de progreso de ejemplo...');
      
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];

        for (let habito of habitosCreados) {
          // Crear progreso aleatorio para simular uso real
          const valorAleatorio = Math.floor(Math.random() * habito.meta * 1.2);
          const valorCompletado = Math.min(valorAleatorio, habito.meta);
          const porcentaje = (valorCompletado / habito.meta) * 100;
          
          await Progreso.create({
            habitoId: habito.id,
            fecha: fechaStr,
            valorCompletado: valorCompletado,
            metaDelDia: habito.meta,
            porcentajeCompletado: parseFloat(porcentaje.toFixed(2)),
            completado: porcentaje >= 100,
            notas: i === 0 ? 'Progreso de hoy' : `Progreso hace ${i} días`
          });
        }
      }
      console.log('✅ Registros de progreso de ejemplo creados');
    }

    // Verificar que los logros estén inicializados
    const totalLogros = await Logro.count();
    console.log(`ℹ️  Total de logros disponibles: ${totalLogros}`);

    console.log('🎉 Datos de ejemplo inicializados correctamente');
    console.log('📊 Resumen:');
    console.log(`   - Hábitos: ${habitosCreados.length} nuevos`);
    console.log(`   - Progreso: ${habitosCreados.length * 7} registros`);
    console.log(`   - Logros: ${totalLogros} disponibles`);

  } catch (error) {
    console.error('❌ Error al inicializar datos de ejemplo:', error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  inicializarDatosEjemplo();
}

module.exports = inicializarDatosEjemplo;
