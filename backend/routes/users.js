const express = require('express');
const { body, validationResult } = require('express-validator');
const { Usuario } = require('../models');

const router = express.Router();

// GET /api/users/:id - Obtener perfil de usuario
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findOne({
      where: { id, estaActivo: true }
    });

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    res.json({
      exito: true,
      datos: {
        usuario: usuario
      }
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/users - Crear nuevo usuario
router.post('/', [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('fechaNacimiento')
    .optional()
    .isDate()
    .withMessage('Debe ser una fecha válida'),
  body('genero')
    .optional()
    .isIn(['Masculino', 'Femenino', 'Otro'])
    .withMessage('Género debe ser: Masculino, Femenino u Otro'),
  body('altura')
    .optional()
    .isFloat({ min: 100, max: 250 })
    .withMessage('Altura debe estar entre 100 y 250 cm'),
  body('peso')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Peso debe estar entre 30 y 300 kg'),
  body('metaAgua')
    .optional()
    .isFloat({ min: 1, max: 10 })
    .withMessage('Meta de agua debe estar entre 1 y 10 litros'),
  body('metaSueño')
    .optional()
    .isInt({ min: 4, max: 12 })
    .withMessage('Meta de sueño debe estar entre 4 y 12 horas'),
  body('nivelActividad')
    .optional()
    .isIn(['Sedentario', 'Ligero', 'Moderado', 'Activo', 'Muy Activo'])
    .withMessage('Nivel de actividad no válido'),
  body('objetivoFitness')
    .optional()
    .isIn(['Bajar Peso', 'Mantener Peso', 'Subir Peso', 'Ganar Músculo'])
    .withMessage('Objetivo fitness no válido'),
  body('tema')
    .optional()
    .isIn(['Claro', 'Oscuro'])
    .withMessage('Tema debe ser Claro u Oscuro')
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

    // Verificar que el email no esté en uso
    const emailExistente = await Usuario.findOne({
      where: { email: req.body.email, estaActivo: true }
    });

    if (emailExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese email'
      });
    }

    const nuevoUsuario = await Usuario.create(req.body);

    console.log('✅ Usuario creado exitosamente:', {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Usuario creado exitosamente',
      datos: {
        usuario: nuevoUsuario
      }
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese email'
      });
    }

    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Actualizar perfil de usuario
router.put('/:id', [
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('fechaNacimiento')
    .optional()
    .isDate()
    .withMessage('Debe ser una fecha válida'),
  body('genero')
    .optional()
    .isIn(['Masculino', 'Femenino', 'Otro'])
    .withMessage('Género debe ser: Masculino, Femenino u Otro'),
  body('altura')
    .optional()
    .isFloat({ min: 100, max: 250 })
    .withMessage('Altura debe estar entre 100 y 250 cm'),
  body('peso')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Peso debe estar entre 30 y 300 kg'),
  body('metaAgua')
    .optional()
    .isFloat({ min: 1, max: 10 })
    .withMessage('Meta de agua debe estar entre 1 y 10 litros'),
  body('metaSueño')
    .optional()
    .isInt({ min: 4, max: 12 })
    .withMessage('Meta de sueño debe estar entre 4 y 12 horas'),
  body('nivelActividad')
    .optional()
    .isIn(['Sedentario', 'Ligero', 'Moderado', 'Activo', 'Muy Activo'])
    .withMessage('Nivel de actividad no válido'),
  body('objetivoFitness')
    .optional()
    .isIn(['Bajar Peso', 'Mantener Peso', 'Subir Peso', 'Ganar Músculo'])
    .withMessage('Objetivo fitness no válido'),
  body('tema')
    .optional()
    .isIn(['Claro', 'Oscuro'])
    .withMessage('Tema debe ser Claro u Oscuro')
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

    // Si se está cambiando el email, verificar que no esté en uso
    if (datosActualizacion.email) {
      const emailExistente = await Usuario.findOne({
        where: { 
          email: datosActualizacion.email, 
          estaActivo: true,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (emailExistente) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Ya existe otro usuario con ese email'
        });
      }
    }

    const [numFilasActualizadas] = await Usuario.update(datosActualizacion, {
      where: { id, estaActivo: true }
    });

    if (numFilasActualizadas === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    const usuarioActualizado = await Usuario.findByPk(id);

    console.log('✅ Usuario actualizado exitosamente:', {
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombre,
      cambios: Object.keys(datosActualizacion)
    });

    res.json({
      exito: true,
      mensaje: 'Perfil actualizado exitosamente',
      datos: {
        usuario: usuarioActualizado
      }
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un usuario con ese email'
      });
    }

    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Desactivar usuario (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [numFilasActualizadas] = await Usuario.update(
      { estaActivo: false },
      { where: { id, estaActivo: true } }
    );

    if (numFilasActualizadas === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario desactivado exitosamente:', { id });

    res.json({
      exito: true,
      mensaje: 'Usuario desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/users/:id/dashboard - Obtener datos resumidos para dashboard
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findOne({
      where: { id, estaActivo: true }
    });

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Calcular IMC si hay datos
    let imc = null;
    let categoriaIMC = null;
    if (usuario.altura && usuario.peso) {
      const alturaEnMetros = usuario.altura / 100;
      imc = parseFloat((usuario.peso / (alturaEnMetros * alturaEnMetros)).toFixed(1));
      
      if (imc < 18.5) categoriaIMC = 'Bajo peso';
      else if (imc < 25) categoriaIMC = 'Normal';
      else if (imc < 30) categoriaIMC = 'Sobrepeso';
      else categoriaIMC = 'Obesidad';
    }

    const dashboardData = {
      usuario: {
        nombre: usuario.nombre,
        objetivoFitness: usuario.objetivoFitness,
        nivelActividad: usuario.nivelActividad
      },
      metas: {
        agua: usuario.metaAgua,
        sueño: usuario.metaSueño
      },
      medicas: imc ? {
        imc,
        categoriaIMC,
        altura: usuario.altura,
        peso: usuario.peso
      } : null
    };

    res.json({
      exito: true,
      datos: dashboardData
    });

  } catch (error) {
    console.error('Error al obtener dashboard de usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
