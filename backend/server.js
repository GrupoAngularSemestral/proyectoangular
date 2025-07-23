const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { sequelize, probarConexion } = require('./config/baseDatos');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar limitador de velocidad
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    exito: false,
    mensaje: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Inicializar base de datos y modelos
async function inicializarBaseDatos() {
  try {
    const conexionExitosa = await probarConexion();
    if (!conexionExitosa) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    // Importar modelos para establecer asociaciones
    require('./models');
    
    // Sincronizar base de datos (crear tablas si no existen)
    await sequelize.sync({ 
      force: false, // No forzar recreación de tablas
      alter: false  // Evitar alteraciones automáticas que pueden causar errores de sintaxis
    });
    
    console.log('✅ Tablas de la base de datos sincronizadas correctamente');
    
    // Inicializar logros predeterminados
    await inicializarLogros();
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

// Función para crear logros iniciales
async function inicializarLogros() {
  try {
    const { Logro } = require('./models');
    
    const logrosIniciales = [
      {
        nombre: 'Primer Paso',
        descripcion: '¡Felicitaciones! Has creado tu primer hábito',
        tipo: 'especial',
        icono: '🎯',
        condicion: { primerHabito: true },
        puntos: 10,
        rareza: 'comun'
      },
      {
        nombre: 'Constancia',
        descripcion: 'Completa un hábito durante 3 días consecutivos',
        tipo: 'racha',
        icono: '🔥',
        condicion: { diasConsecutivos: 3 },
        puntos: 25,
        rareza: 'comun'
      },
      {
        nombre: 'Semana Perfecta',
        descripcion: 'Completa un hábito durante 7 días consecutivos',
        tipo: 'racha',
        icono: '👑',
        condicion: { diasConsecutivos: 7 },
        puntos: 100,
        rareza: 'raro'
      },
      {
        nombre: 'Hidratación Pro',
        descripcion: 'Completa tu meta de agua durante 7 días',
        tipo: 'meta_semanal',
        icono: '💧',
        condicion: { metasSemanales: 7, tipoHabito: 'water' },
        puntos: 50,
        rareza: 'comun'
      },
      {
        nombre: 'Atleta en Entrenamiento',
        descripcion: 'Completa 10 sesiones de ejercicio',
        tipo: 'meta_diaria',
        icono: '💪',
        condicion: { metasCompletadas: 10, tipoHabito: 'exercise' },
        puntos: 75,
        rareza: 'raro'
      },
      {
        nombre: 'Maestro del Sueño',
        descripcion: 'Completa tu meta de sueño durante 14 días',
        tipo: 'racha',
        icono: '😴',
        condicion: { diasConsecutivos: 14, tipoHabito: 'sleep' },
        puntos: 150,
        rareza: 'epico'
      }
    ];

    for (let logro of logrosIniciales) {
      const existe = await Logro.findOne({ where: { nombre: logro.nombre } });
      if (!existe) {
        await Logro.create(logro);
      }
    }

    console.log('✅ Logros iniciales configurados');
  } catch (error) {
    console.error('❌ Error al inicializar logros:', error);
  }
}

// Rutas de la API
app.use('/api/users', require('./routes/users'));
app.use('/api/habitos', require('./routes/habitos'));
app.use('/api/progreso', require('./routes/progreso'));
app.use('/api/logros', require('./routes/logros'));
app.use('/api/exportacion', require('./routes/exportacion'));

// Endpoint de salud
app.get('/api/salud', (req, res) => {
  res.status(200).json({
    exito: true,
    mensaje: 'FitTrack API está funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    baseDatos: 'PostgreSQL (Render)'
  });
});

// Endpoint de prueba
app.get('/api/prueba', (req, res) => {
  res.json({
    exito: true,
    mensaje: 'Conexión exitosa con el backend de FitTrack',
    funcionalidades: [
      'Registro de hábitos diarios',
      'Gráficos de progreso',
      'Recordatorios configurables',
      'Logros y recompensas virtuales',
      'Exportación de datos',
      'Perfil personalizable'
    ]
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err.stack);
  
  // Error de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      exito: false,
      mensaje: 'Error de validación',
      errores: err.errors.map(e => ({
        campo: e.path,
        mensaje: e.message,
        valor: e.value
      }))
    });
  }
  
  // Error de restricción única
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      exito: false,
      mensaje: 'Registro duplicado',
      errores: err.errors.map(e => ({
        campo: e.path,
        mensaje: `${e.path} ya existe`,
        valor: e.value
      }))
    });
  }
  
  // Error de clave foránea
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      exito: false,
      mensaje: 'Referencia inválida',
      error: 'El registro referenciado no existe'
    });
  }

  res.status(500).json({
    exito: false,
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada',
    ruta: req.originalUrl
  });
});

// Inicializar base de datos y arrancar servidor
inicializarBaseDatos().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FitTrack Backend ejecutándose en puerto ${PORT}`);
    console.log(`📱 URL del Frontend: ${process.env.FRONTEND_URL}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Base de Datos: PostgreSQL (Render)`);
    console.log('📋 Rutas disponibles:');
    console.log('   GET  /api/salud - Estado del servidor');
    console.log('   POST /api/habitos - Crear hábito');
    console.log('   GET  /api/habitos - Listar hábitos');
    console.log('   POST /api/progreso - Registrar progreso');
    console.log('   GET  /api/logros - Obtener logros');
    console.log('   GET  /api/exportacion/datos - Exportar datos');
  });
}).catch(error => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});
