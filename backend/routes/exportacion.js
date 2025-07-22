const express = require('express');
const { query, validationResult } = require('express-validator');
const { Habito, Progreso, LogroObtenido, Logro } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/exportacion/datos - Exportar datos en formato JSON/CSV
router.get('/datos', [
  query('formato')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Formato debe ser json o csv'),
  query('desde')
    .optional()
    .isDate()
    .withMessage('Fecha desde debe ser válida'),
  query('hasta')
    .optional()
    .isDate()
    .withMessage('Fecha hasta debe ser válida'),
  query('incluir')
    .optional()
    .isArray()
    .withMessage('Incluir debe ser un array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error en parámetros',
        errores: errors.array()
      });
    }

    const { 
      formato = 'json', 
      desde, 
      hasta, 
      incluir = ['habitos', 'progreso', 'logros'] 
    } = req.query;

    const datosExportacion = {
      fechaExportacion: new Date(),
      rangoFechas: {
        desde: desde || null,
        hasta: hasta || null
      }
    };

    // Configurar filtros de fecha
    let filtroFecha = {};
    if (desde || hasta) {
      if (desde) filtroFecha[Op.gte] = desde;
      if (hasta) filtroFecha[Op.lte] = hasta;
    }

    // Exportar hábitos
    if (incluir.includes('habitos')) {
      datosExportacion.habitos = await Habito.findAll({
        where: { estaActivo: true },
        order: [['fechaCreacion', 'DESC']]
      });
    }

    // Exportar progreso
    if (incluir.includes('progreso')) {
      let whereProgreso = {};
      if (Object.keys(filtroFecha).length > 0) {
        whereProgreso.fecha = filtroFecha;
      }

      datosExportacion.progreso = await Progreso.findAll({
        where: whereProgreso,
        include: [
          {
            model: Habito,
            as: 'habito',
            attributes: ['id', 'nombre', 'tipo', 'unidad']
          }
        ],
        order: [['fecha', 'DESC']]
      });
    }

    // Exportar logros
    if (incluir.includes('logros')) {
      let whereLogros = {};
      if (Object.keys(filtroFecha).length > 0) {
        whereLogros.fechaObtenido = filtroFecha;
      }

      datosExportacion.logros = await LogroObtenido.findAll({
        where: whereLogros,
        include: [
          {
            model: Logro,
            as: 'logro'
          },
          {
            model: Habito,
            as: 'habito',
            attributes: ['id', 'nombre', 'tipo'],
            required: false
          }
        ],
        order: [['fechaObtenido', 'DESC']]
      });
    }

    // Responder según el formato solicitado
    if (formato === 'csv') {
      // Convertir a CSV
      const csv = convertirACSV(datosExportacion);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=fittrack_datos.csv');
      res.send(csv);
    } else {
      // Responder como JSON
      res.json({
        exito: true,
        datos: datosExportacion
      });
    }

  } catch (error) {
    console.error('Error al exportar datos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/exportacion/estadisticas - Exportar estadísticas resumidas
router.get('/estadisticas', async (req, res) => {
  try {
    const { periodo = '30' } = req.query;

    // Calcular fecha de inicio
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    // Obtener estadísticas generales
    const totalHabitos = await Habito.count({
      where: { estaActivo: true }
    });

    const totalProgreso = await Progreso.count({
      where: {
        fecha: {
          [Op.gte]: fechaInicio.toISOString().split('T')[0]
        }
      }
    });

    const metasCompletadas = await Progreso.count({
      where: {
        completado: true,
        fecha: {
          [Op.gte]: fechaInicio.toISOString().split('T')[0]
        }
      }
    });

    const totalLogros = await LogroObtenido.count();

    // Estadísticas por tipo de hábito
    const estadisticasPorTipo = await Habito.findAll({
      attributes: [
        'tipo',
        [Habito.sequelize.fn('COUNT', Habito.sequelize.col('tipo')), 'cantidad']
      ],
      where: { estaActivo: true },
      group: ['tipo']
    });

    // Progreso de la última semana
    const fechaSemanaPasada = new Date();
    fechaSemanaPasada.setDate(fechaSemanaPasada.getDate() - 7);

    const progresoSemanal = await Progreso.findAll({
      where: {
        fecha: {
          [Op.gte]: fechaSemanaPasada.toISOString().split('T')[0]
        }
      },
      include: [
        {
          model: Habito,
          as: 'habito',
          attributes: ['nombre', 'tipo']
        }
      ],
      order: [['fecha', 'DESC']]
    });

    const estadisticas = {
      resumen: {
        totalHabitos,
        totalProgreso,
        metasCompletadas,
        totalLogros,
        porcentajeExito: totalProgreso > 0 ? ((metasCompletadas / totalProgreso) * 100).toFixed(2) : 0
      },
      estadisticasPorTipo,
      progresoSemanal,
      periodo: `Últimos ${periodo} días`,
      fechaGeneracion: new Date()
    };

    res.json({
      exito: true,
      datos: estadisticas
    });

  } catch (error) {
    console.error('Error al exportar estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Función auxiliar para convertir datos a CSV
function convertirACSV(datos) {
  let csv = 'Tipo,Nombre,Valor,Fecha,Notas\n';

  // Agregar hábitos
  if (datos.habitos) {
    datos.habitos.forEach(habito => {
      csv += `Hábito,"${habito.nombre}","${habito.meta} ${habito.unidad}","${habito.fechaCreacion}","${habito.tipo}"\n`;
    });
  }

  // Agregar progreso
  if (datos.progreso) {
    datos.progreso.forEach(progreso => {
      csv += `Progreso,"${progreso.habito?.nombre || 'N/A'}","${progreso.valorCompletado}/${progreso.metaDelDia}","${progreso.fecha}","${progreso.notas || ''}"\n`;
    });
  }

  // Agregar logros
  if (datos.logros) {
    datos.logros.forEach(logro => {
      csv += `Logro,"${logro.logro?.nombre || 'N/A'}","${logro.logro?.puntos || 0} puntos","${logro.fechaObtenido}","${logro.logro?.descripcion || ''}"\n`;
    });
  }

  return csv;
}

module.exports = router;
