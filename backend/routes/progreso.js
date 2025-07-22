const express = require('express');
const { body, validationResult } = require('express-validator');
const { Progreso, Habito } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// POST /api/progreso - Registrar progreso diario
router.post('/', [
  body('habitoId')
    .isInt({ min: 1 })
    .withMessage('habitoId debe ser un número entero mayor a 0'),
  body('valorCompletado')
    .isNumeric()
    .withMessage('valorCompletado debe ser un número válido')
    .custom((value) => {
      const num = parseFloat(value);
      if (num < 0) {
        throw new Error('valorCompletado debe ser mayor o igual a 0');
      }
      return true;
    }),
  body('fecha')
    .optional()
    .isDate()
    .withMessage('fecha debe tener formato válido YYYY-MM-DD'),
  body('notas')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
], async (req, res) => {
  try {
    console.log('📊 Registrando progreso - Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación en progreso:', errors.array());
      return res.status(400).json({
        exito: false,
        mensaje: 'Error en los datos enviados',
        errores: errors.array()
      });
    }

    const {
      habitoId,
      valorCompletado,
      fecha = new Date().toISOString().split('T')[0], // Fecha de hoy si no se especifica
      notas = ''
    } = req.body;

    // Verificar que el hábito existe
    const habito = await Habito.findOne({
      where: { id: habitoId, estaActivo: true }
    });

    console.log(`🔍 Buscando hábito con ID ${habitoId}:`, habito ? `Encontrado: ${habito.nombre}` : 'No encontrado');

    if (!habito) {
      console.log(`❌ Hábito con ID ${habitoId} no encontrado o no está activo`);
      return res.status(404).json({
        exito: false,
        mensaje: 'Hábito no encontrado'
      });
    }

    // Calcular porcentaje completado
    const porcentajeCompletado = Math.min((valorCompletado / habito.meta) * 100, 100);
    const completado = porcentajeCompletado >= 100;

    console.log(`📈 Calculando progreso: ${valorCompletado}/${habito.meta} = ${porcentajeCompletado.toFixed(1)}% (${completado ? 'COMPLETADO' : 'PENDIENTE'})`);

    // Verificar si ya existe un registro para este hábito y fecha
    const registroExistente = await Progreso.findOne({
      where: { habitoId, fecha }
    });

    console.log(`📋 Registro existente para ${fecha}:`, registroExistente ? 'SÍ (actualizando)' : 'NO (creando nuevo)');

    let progreso;
    if (registroExistente) {
      // Actualizar registro existente
      await registroExistente.update({
        valorCompletado,
        metaDelDia: habito.meta,
        porcentajeCompletado,
        completado,
        notas
      });
      progreso = registroExistente;
      console.log(`✅ Registro actualizado - ID: ${progreso.id}`);
    } else {
      // Crear nuevo registro
      progreso = await Progreso.create({
        habitoId,
        fecha,
        valorCompletado,
        metaDelDia: habito.meta,
        porcentajeCompletado,
        completado,
        notas
      });
      console.log(`✅ Nuevo registro creado - ID: ${progreso.id}`);
    }

    console.log(`📊 Progreso final:`, {
      id: progreso.id,
      habitoId: progreso.habitoId,
      fecha: progreso.fecha,
      valorCompletado: progreso.valorCompletado,
      completado: progreso.completado
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Progreso registrado exitosamente',
      datos: {
        progreso: progreso,
        habito: {
          id: habito.id,
          nombre: habito.nombre,
          tipo: habito.tipo
        }
      }
    });

  } catch (error) {
    console.error('Error al registrar progreso:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/progreso/:habitoId - Obtener progreso de un hábito
router.get('/:habitoId', async (req, res) => {
  try {
    const { habitoId } = req.params;
    const { desde, hasta, limite = 30 } = req.query;

    let whereCondition = { habitoId };
    
    // Filtrar por rango de fechas si se proporciona
    if (desde || hasta) {
      whereCondition.fecha = {};
      if (desde) whereCondition.fecha[Op.gte] = desde;
      if (hasta) whereCondition.fecha[Op.lte] = hasta;
    }

    const registrosProgreso = await Progreso.findAll({
      where: whereCondition,
      include: [
        {
          model: Habito,
          as: 'habito',
          attributes: ['id', 'nombre', 'tipo', 'meta', 'unidad']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: parseInt(limite)
    });

    res.json({
      exito: true,
      datos: {
        progreso: registrosProgreso
      }
    });

  } catch (error) {
    console.error('Error al obtener progreso:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/progreso/estadisticas/:habitoId - Obtener estadísticas de un hábito
router.get('/estadisticas/:habitoId', async (req, res) => {
  try {
    const { habitoId } = req.params;
    const { periodo = '30' } = req.query; // Días hacia atrás

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    const registros = await Progreso.findAll({
      where: {
        habitoId,
        fecha: {
          [Op.gte]: fechaInicio.toISOString().split('T')[0]
        }
      },
      include: [
        {
          model: Habito,
          as: 'habito',
          attributes: ['nombre', 'tipo', 'meta', 'unidad']
        }
      ],
      order: [['fecha', 'ASC']]
    });

    // Calcular estadísticas
    const totalDias = registros.length;
    const diasCompletados = registros.filter(r => r.completado).length;
    const porcentajeExito = totalDias > 0 ? (diasCompletados / totalDias) * 100 : 0;
    const promedioCompletado = totalDias > 0 
      ? registros.reduce((acc, r) => acc + r.valorCompletado, 0) / totalDias 
      : 0;

    // Calcular racha actual
    let rachaActual = 0;
    const hoy = new Date().toISOString().split('T')[0];
    const registrosRecientes = registros.reverse(); // Del más reciente al más antiguo
    
    for (let registro of registrosRecientes) {
      if (registro.completado) {
        rachaActual++;
      } else {
        break;
      }
    }

    res.json({
      exito: true,
      datos: {
        estadisticas: {
          totalDias,
          diasCompletados,
          porcentajeExito: parseFloat(porcentajeExito.toFixed(2)),
          promedioCompletado: parseFloat(promedioCompletado.toFixed(2)),
          rachaActual,
          habito: registros[0]?.habito || null
        },
        registros
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
