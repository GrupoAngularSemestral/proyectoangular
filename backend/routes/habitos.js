const express = require('express');
const { body, validationResult } = require('express-validator');
const { Habito, Progreso, Recordatorio } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// POST /api/habitos - Crear nuevo hábito
router.post('/', [
  body('nombre')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('tipo')
    .isIn(['exercise', 'water', 'sleep', 'custom'])
    .withMessage('Tipo debe ser: exercise, water, sleep o custom'),
  body('meta')
    .isInt({ min: 1 })
    .withMessage('La meta debe ser un número entero mayor a 0'),
  body('unidad')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('La unidad debe tener entre 1 y 20 caracteres'),
  body('frecuencia')
    .optional()
    .isIn(['daily', 'weekly', 'custom'])
    .withMessage('Frecuencia debe ser: daily, weekly o custom'),
  body('recordatorioActivo')
    .optional()
    .isBoolean()
    .withMessage('recordatorioActivo debe ser true o false'),
  body('horaRecordatorio')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora debe tener formato HH:mm'),
  body('diasRepeticion')
    .optional()
    .isArray()
    .withMessage('diasRepeticion debe ser un array')
], async (req, res) => {
  try {
    console.log('📝 Datos recibidos para crear hábito:', JSON.stringify(req.body, null, 2));
    
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({
        exito: false,
        mensaje: 'Error en los datos enviados',
        errores: errors.array()
      });
    }

    const {
      nombre,
      tipo,
      meta,
      unidad,
      frecuencia = 'daily',
      recordatorioActivo = false,
      horaRecordatorio,
      diasRepeticion
    } = req.body;

    // Crear el hábito
    const nuevoHabito = await Habito.create({
      nombre,
      tipo,
      meta,
      unidad,
      frecuencia,
      recordatorioActivo,
      horaRecordatorio,
      diasRepeticion
    });

    // Si tiene recordatorio, crear el recordatorio
    if (recordatorioActivo && horaRecordatorio) {
      await Recordatorio.create({
        habitoId: nuevoHabito.id,
        tipo: 'web',
        hora: horaRecordatorio,
        diasSemana: diasRepeticion,
        mensaje: `Es hora de: ${nombre}`
      });
    }

    res.status(201).json({
      exito: true,
      mensaje: 'Hábito creado exitosamente',
      datos: {
        habito: nuevoHabito
      }
    });

  } catch (error) {
    console.error('Error al crear hábito:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/habitos - Obtener todos los hábitos
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de hábitos...');
    
    const includeStats = req.query.includeStats === 'true';
    
    const habitos = await Habito.findAll({
      where: { estaActivo: true },
      include: [
        {
          model: Recordatorio,
          as: 'recordatorios',
          where: { estaActivo: true },
          required: false
        },
        {
          model: Progreso,
          as: 'registrosProgreso',
          ...(includeStats ? {} : {
            where: { fecha: new Date().toISOString().split('T')[0] }, // Solo progreso de hoy si no se piden stats
          }),
          required: false
        }
      ],
      order: [['fechaCreacion', 'DESC']]
    });

    // Si se piden estadísticas, calcular datos adicionales
    if (includeStats) {
      const habitosConStats = await Promise.all(habitos.map(async (habito) => {
        const habitoJson = habito.toJSON();
        
        // Calcular estadísticas del último mes
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        
        const progresosUltimoMes = await Progreso.findAll({
          where: {
            habitoId: habito.id,
            fecha: {
              [Op.gte]: hace30Dias.toISOString().split('T')[0]
            }
          },
          order: [['fecha', 'ASC']]
        });
        
        // Calcular racha actual
        let rachaActual = 0;
        const hoy = new Date();
        for (let i = 0; i < 30; i++) {
          const fecha = new Date(hoy);
          fecha.setDate(hoy.getDate() - i);
          const fechaStr = fecha.toISOString().split('T')[0];
          
          // Sumar todos los registros de progreso del día
          const progresosDelDia = progresosUltimoMes.filter(p => p.fecha === fechaStr);
          const totalDelDia = progresosDelDia.reduce((sum, p) => sum + p.valorCompletado, 0);
          
          if (totalDelDia >= habito.meta) {
            rachaActual++;
          } else {
            break;
          }
        }
        
        // Progreso de hoy - sumar todos los registros del día
        const hoyStr = hoy.toISOString().split('T')[0];
        const progresosHoy = progresosUltimoMes.filter(p => p.fecha === hoyStr);
        const progresoTotalHoy = progresosHoy.reduce((sum, p) => sum + p.valorCompletado, 0);
        
        return {
          ...habitoJson,
          estadisticas: {
            rachaActual,
            totalRegistros: progresosUltimoMes.length,
            progresoHoy: progresoTotalHoy,
            completadoHoy: progresoTotalHoy >= habito.meta,
            registrosHoy: progresosHoy.length
          },
          registrosProgreso: progresosUltimoMes
        };
      }));
      
      res.json({
        exito: true,
        datos: {
          habitos: habitosConStats
        }
      });
    } else {
      console.log(`📊 Se encontraron ${habitos.length} hábitos activos`);
      console.log('📋 Hábitos:', habitos.map(h => ({ 
        id: h.id, 
        nombre: h.nombre, 
        estaActivo: h.estaActivo,
        progresoHoy: h.registrosProgreso?.length > 0 ? h.registrosProgreso[0].valorCompletado : 0
      })));

      res.json({
        exito: true,
        datos: {
          habitos: habitos
        }
      });
    }

  } catch (error) {
    console.error('Error al obtener hábitos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/habitos/:id - Actualizar hábito
router.put('/:id', [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('meta')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La meta debe ser un número entero mayor a 0'),
  body('unidad')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('La unidad debe tener entre 1 y 20 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error en los datos enviados',
        errores: errors.array()
      });
    }

    const { id } = req.params;
    const datosActualizacion = req.body;

    const [numFilasActualizadas] = await Habito.update(datosActualizacion, {
      where: { id, estaActivo: true }
    });

    if (numFilasActualizadas === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Hábito no encontrado'
      });
    }

    const habitoActualizado = await Habito.findByPk(id);

    res.json({
      exito: true,
      mensaje: 'Hábito actualizado exitosamente',
      datos: {
        habito: habitoActualizado
      }
    });

  } catch (error) {
    console.error('Error al actualizar hábito:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/habitos/:id - Eliminar hábito (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Intentando eliminar hábito con ID: ${id} (tipo: ${typeof id})`);

    // Convertir ID a número para la consulta
    const habitoId = parseInt(id);
    if (isNaN(habitoId)) {
      console.log(`❌ ID inválido: ${id}`);
      return res.status(400).json({
        exito: false,
        mensaje: 'ID de hábito inválido'
      });
    }

    console.log(`🔄 ID convertido a número: ${habitoId}`);

    // Primero verificar que el hábito existe
    const habito = await Habito.findByPk(habitoId);
    if (!habito) {
      console.log(`❌ Hábito con ID ${habitoId} no encontrado en la base de datos`);
      return res.status(404).json({
        exito: false,
        mensaje: 'Hábito no encontrado'
      });
    }

    console.log(`📋 Hábito encontrado: ${habito.nombre} (estaActivo: ${habito.estaActivo})`);

    // Verificar si hay registros relacionados
    const progresoCount = await Progreso.count({ where: { habitoId: habitoId } });
    const recordatorioCount = await Recordatorio.count({ where: { habitoId: habitoId } });
    
    console.log(`📊 Registros relacionados - Progreso: ${progresoCount}, Recordatorios: ${recordatorioCount}`);

    // Eliminar registros relacionados primero
    if (progresoCount > 0) {
      await Progreso.destroy({ where: { habitoId: habitoId } });
      console.log(`🗑️ Eliminados ${progresoCount} registros de progreso`);
    }

    if (recordatorioCount > 0) {
      await Recordatorio.destroy({ where: { habitoId: habitoId } });
      console.log(`🗑️ Eliminados ${recordatorioCount} recordatorios`);
    }

    // Ahora eliminar el hábito
    const numFilasEliminadas = await Habito.destroy({
      where: { id: habitoId }
    });

    console.log(`🔢 Número de filas eliminadas: ${numFilasEliminadas}`);

    if (numFilasEliminadas === 0) {
      console.log(`❌ No se pudo eliminar el hábito con ID ${habitoId} de la base de datos`);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al eliminar el hábito de la base de datos'
      });
    }

    console.log(`✅ Hábito con ID ${habitoId} y todos sus registros relacionados eliminados exitosamente`);
    res.json({
      exito: true,
      mensaje: 'Hábito eliminado exitosamente',
      datos: {
        habitoEliminado: habito.nombre,
        registrosEliminados: {
          progreso: progresoCount,
          recordatorios: recordatorioCount
        }
      }
    });

  } catch (error) {
    console.error('❌ Error al eliminar hábito:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
