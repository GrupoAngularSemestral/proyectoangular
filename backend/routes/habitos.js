const express = require('express');
const { body, validationResult } = require('express-validator');
const { Habito, Progreso, Recordatorio } = require('../models');

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
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
    const habitos = await Habito.findAll({
      where: { estaActivo: true },
      include: [
        {
          model: Recordatorio,
          as: 'recordatorios',
          where: { estaActivo: true },
          required: false
        }
      ],
      order: [['fechaCreacion', 'DESC']]
    });

    res.json({
      exito: true,
      datos: {
        habitos: habitos
      }
    });

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

// DELETE /api/habitos/:id - Eliminar hábito (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [numFilasActualizadas] = await Habito.update(
      { estaActivo: false },
      { where: { id, estaActivo: true } }
    );

    if (numFilasActualizadas === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Hábito no encontrado'
      });
    }

    res.json({
      exito: true,
      mensaje: 'Hábito eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar hábito:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
