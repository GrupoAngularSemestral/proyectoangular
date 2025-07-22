const express = require('express');
const { body, validationResult } = require('express-validator');
const { Logro, LogroObtenido, Habito, Progreso } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/logros - Obtener todos los logros disponibles
router.get('/', async (req, res) => {
  try {
    const logros = await Logro.findAll({
      where: { estaActivo: true },
      order: [['rareza', 'ASC'], ['puntos', 'ASC']]
    });

    // Obtener logros ya obtenidos
    const logrosObtenidos = await LogroObtenido.findAll({
      include: [
        {
          model: Logro,
          as: 'logro'
        }
      ]
    });

    res.json({
      exito: true,
      datos: {
        logrosDisponibles: logros,
        logrosObtenidos: logrosObtenidos
      }
    });

  } catch (error) {
    console.error('Error al obtener logros:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/logros/verificar - Verificar y otorgar logros automáticamente
router.post('/verificar', async (req, res) => {
  try {
    const nuevosLogros = [];

    // Obtener todos los hábitos activos
    const habitos = await Habito.findAll({
      where: { estaActivo: true },
      include: [
        {
          model: Progreso,
          as: 'registrosProgreso',
          order: [['fecha', 'DESC']]
        }
      ]
    });

    // Obtener logros disponibles
    const logrosDisponibles = await Logro.findAll({
      where: { estaActivo: true }
    });

    for (let logro of logrosDisponibles) {
      // Verificar si ya se obtuvo este logro
      const yaObtenido = await LogroObtenido.findOne({
        where: { logroId: logro.id }
      });

      if (yaObtenido) continue;

      let cumpleCondicion = false;
      let habitoRelacionado = null;

      // Verificar diferentes tipos de logros
      switch (logro.tipo) {
        case 'racha':
          // Verificar racha de días consecutivos
          for (let habito of habitos) {
            const rachaActual = calcularRachaActual(habito.registrosProgreso);
            if (rachaActual >= logro.condicion.diasConsecutivos) {
              cumpleCondicion = true;
              habitoRelacionado = habito.id;
              break;
            }
          }
          break;

        case 'meta_diaria':
          // Verificar metas diarias completadas
          for (let habito of habitos) {
            const registrosCompletados = habito.registrosProgreso.filter(r => r.completado);
            if (registrosCompletados.length >= logro.condicion.metasCompletadas) {
              cumpleCondicion = true;
              habitoRelacionado = habito.id;
              break;
            }
          }
          break;

        case 'meta_semanal':
          // Verificar metas semanales
          const fechaHaceSemana = new Date();
          fechaHaceSemana.setDate(fechaHaceSemana.getDate() - 7);
          
          for (let habito of habitos) {
            const registrosSemana = habito.registrosProgreso.filter(r => 
              new Date(r.fecha) >= fechaHaceSemana && r.completado
            );
            if (registrosSemana.length >= logro.condicion.metasSemanales) {
              cumpleCondicion = true;
              habitoRelacionado = habito.id;
              break;
            }
          }
          break;

        case 'especial':
          // Logros especiales (primera vez, etc.)
          if (logro.condicion.primerHabito && habitos.length === 1) {
            cumpleCondicion = true;
            habitoRelacionado = habitos[0].id;
          }
          break;
      }

      // Si cumple la condición, otorgar el logro
      if (cumpleCondicion) {
        const nuevoLogro = await LogroObtenido.create({
          logroId: logro.id,
          habitoId: habitoRelacionado,
          detalles: {
            fechaVerificacion: new Date(),
            condicionCumplida: logro.condicion
          }
        });

        nuevosLogros.push({
          ...nuevoLogro.toJSON(),
          logro: logro
        });
      }
    }

    res.json({
      exito: true,
      mensaje: `Verificación completada. ${nuevosLogros.length} nuevos logros obtenidos`,
      datos: {
        nuevosLogros
      }
    });

  } catch (error) {
    console.error('Error al verificar logros:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/logros/marcar-visto/:id - Marcar logro como visto
router.post('/marcar-visto/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [numFilasActualizadas] = await LogroObtenido.update(
      { visto: true },
      { where: { id } }
    );

    if (numFilasActualizadas === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Logro obtenido no encontrado'
      });
    }

    res.json({
      exito: true,
      mensaje: 'Logro marcado como visto'
    });

  } catch (error) {
    console.error('Error al marcar logro como visto:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Función auxiliar para calcular racha actual
function calcularRachaActual(registrosProgreso) {
  if (!registrosProgreso || registrosProgreso.length === 0) return 0;

  let racha = 0;
  const hoy = new Date().toISOString().split('T')[0];
  
  // Ordenar por fecha descendente
  const registrosOrdenados = registrosProgreso
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  for (let registro of registrosOrdenados) {
    if (registro.completado) {
      racha++;
    } else {
      break;
    }
  }

  return racha;
}

module.exports = router;
