# FitTrack Backend API - Documentación

## 🚀 Configuración Inicial

### Variables de Entorno (.env)
```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@host:port/database
FRONTEND_URL=http://localhost:4200
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Comandos Iniciales
```bash
# Instalar dependencias
npm install

# Crear tablas en la base de datos
npm run crear-tablas

# Inicializar datos de ejemplo
npm run inicializar-datos

# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start
```

## 📋 Endpoints Disponibles

### 🏥 Salud del Sistema
- **GET** `/api/salud` - Verificar estado del servidor
- **GET** `/api/prueba` - Endpoint de prueba con información

### 🎯 Hábitos

#### Crear Hábito
**POST** `/api/habitos`
```json
{
  "nombre": "Beber agua",
  "tipo": "water",
  "meta": 8,
  "unidad": "vasos",
  "frecuencia": "daily",
  "recordatorioActivo": true,
  "horaRecordatorio": "09:00",
  "diasRepeticion": ["Monday", "Tuesday", "Wednesday"]
}
```

#### Obtener Hábitos
**GET** `/api/habitos`
```json
{
  "exito": true,
  "datos": {
    "habitos": [...]
  }
}
```

#### Actualizar Hábito
**PUT** `/api/habitos/:id`
```json
{
  "nombre": "Nuevo nombre",
  "meta": 10
}
```

#### Eliminar Hábito
**DELETE** `/api/habitos/:id`

### 📊 Progreso

#### Registrar Progreso
**POST** `/api/progreso`
```json
{
  "habitoId": 1,
  "valorCompletado": 6,
  "fecha": "2025-01-22",
  "notas": "Buen día de hidratación"
}
```

#### Obtener Progreso de un Hábito
**GET** `/api/progreso/:habitoId?desde=2025-01-15&hasta=2025-01-22&limite=30`

#### Obtener Estadísticas
**GET** `/api/progreso/estadisticas/:habitoId?periodo=30`
```json
{
  "exito": true,
  "datos": {
    "estadisticas": {
      "totalDias": 15,
      "diasCompletados": 10,
      "porcentajeExito": 66.67,
      "promedioCompletado": 7.2,
      "rachaActual": 3
    }
  }
}
```

### 🏆 Logros

#### Obtener Todos los Logros
**GET** `/api/logros`
```json
{
  "exito": true,
  "datos": {
    "logrosDisponibles": [...],
    "logrosObtenidos": [...]
  }
}
```

#### Verificar y Otorgar Logros
**POST** `/api/logros/verificar`
```json
{
  "exito": true,
  "mensaje": "Verificación completada. 2 nuevos logros obtenidos",
  "datos": {
    "nuevosLogros": [...]
  }
}
```

#### Marcar Logro Como Visto
**POST** `/api/logros/marcar-visto/:id`

### 📁 Exportación

#### Exportar Datos
**GET** `/api/exportacion/datos?formato=json&desde=2025-01-01&hasta=2025-01-31&incluir=habitos,progreso,logros`

Parámetros:
- `formato`: json, csv
- `desde`: fecha inicio (YYYY-MM-DD)
- `hasta`: fecha fin (YYYY-MM-DD)
- `incluir`: array con ["habitos", "progreso", "logros"]

#### Exportar Estadísticas
**GET** `/api/exportacion/estadisticas?periodo=30`

## 🗄️ Estructura de Base de Datos

### Tabla: habitos
- `id`: INT (PK, AUTO_INCREMENT)
- `nombre`: VARCHAR(100) NOT NULL
- `tipo`: ENUM('exercise', 'water', 'sleep', 'custom')
- `meta`: INT NOT NULL
- `unidad`: VARCHAR(20) NOT NULL
- `frecuencia`: ENUM('daily', 'weekly', 'custom')
- `recordatorioActivo`: BOOLEAN DEFAULT false
- `horaRecordatorio`: TIME
- `diasRepeticion`: JSON
- `estaActivo`: BOOLEAN DEFAULT true
- `fechaCreacion`: TIMESTAMP
- `fechaActualizacion`: TIMESTAMP

### Tabla: progreso
- `id`: INT (PK, AUTO_INCREMENT)
- `habitoId`: INT (FK a habitos.id)
- `fecha`: DATE NOT NULL
- `valorCompletado`: INT NOT NULL
- `metaDelDia`: INT NOT NULL
- `porcentajeCompletado`: DECIMAL(5,2)
- `completado`: BOOLEAN DEFAULT false
- `notas`: TEXT
- `fechaRegistro`: TIMESTAMP

### Tabla: logros
- `id`: INT (PK, AUTO_INCREMENT)
- `nombre`: VARCHAR(100) NOT NULL
- `descripcion`: TEXT NOT NULL
- `tipo`: ENUM('racha', 'meta_diaria', 'meta_semanal', 'especial')
- `icono`: VARCHAR(50)
- `condicion`: JSON NOT NULL
- `puntos`: INT DEFAULT 10
- `rareza`: ENUM('comun', 'raro', 'epico', 'legendario')
- `estaActivo`: BOOLEAN DEFAULT true

### Tabla: logros_obtenidos
- `id`: INT (PK, AUTO_INCREMENT)
- `logroId`: INT (FK a logros.id)
- `habitoId`: INT (FK a habitos.id, NULL)
- `fechaObtenido`: TIMESTAMP
- `detalles`: JSON
- `visto`: BOOLEAN DEFAULT false

### Tabla: recordatorios
- `id`: INT (PK, AUTO_INCREMENT)
- `habitoId`: INT (FK a habitos.id)
- `tipo`: ENUM('web', 'push', 'email')
- `hora`: TIME NOT NULL
- `diasSemana`: JSON
- `mensaje`: VARCHAR(200)
- `estaActivo`: BOOLEAN DEFAULT true
- `ultimoEnviado`: TIMESTAMP
- `fechaCreacion`: TIMESTAMP

## 🔧 Funcionalidades Implementadas

### ✅ Registro de Hábitos Diarios
- Crear hábitos personalizados (ejercicio, agua, sueño, custom)
- Definir metas numéricas con unidades
- Configurar frecuencia (diario, semanal, personalizado)
- Soft delete para mantener historial

### ✅ Gráficos de Progreso
- Registro diario de progreso
- Cálculo automático de porcentajes
- Estadísticas por período
- Cálculo de rachas actuales
- Promedios y métricas de éxito

### ✅ Recordatorios Configurables
- Horarios personalizables
- Días específicos de la semana
- Mensajes personalizados
- Diferentes tipos (web, push, email)

### ✅ Logros y Recompensas
- Sistema de logros automático
- Diferentes tipos: rachas, metas diarias/semanales, especiales
- Niveles de rareza: común, raro, épico, legendario
- Sistema de puntos
- Verificación automática de condiciones

### ✅ Exportación de Datos
- Formatos JSON y CSV
- Filtros por fecha y tipo de dato
- Estadísticas resumidas
- Compatibilidad para reportes profesionales

### ✅ Configuración Personalizable
- Metas individuales por hábito
- Horarios de recordatorios flexibles
- Configuraciones globales del sistema

## 🌐 Integración con Frontend Angular

### Servicio de Hábitos Actualizado
El frontend debe actualizar sus servicios para hacer peticiones HTTP al backend:

```typescript
// En habit.service.ts
async addHabit(habit: Habit): Promise<void> {
  const response = await fetch('http://localhost:3000/api/habitos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: habit.name,
      tipo: habit.type,
      meta: habit.goal,
      unidad: habit.unit,
      frecuencia: habit.frequency,
      recordatorioActivo: habit.reminderEnabled,
      horaRecordatorio: habit.reminderTime,
      diasRepeticion: habit.repeatDays
    })
  });
  
  if (!response.ok) throw new Error('Error al crear hábito');
}
```

## 🚦 Códigos de Respuesta

- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Error en los datos enviados
- **404**: Not Found - Recurso no encontrado
- **500**: Internal Server Error - Error del servidor

## 🔄 Flujo de Trabajo Recomendado

1. **Configurar variables de entorno**
2. **Ejecutar `npm run crear-tablas`** para crear la estructura
3. **Ejecutar `npm run inicializar-datos`** para datos de ejemplo
4. **Iniciar el servidor con `npm run dev`**
5. **Actualizar el frontend** para usar las nuevas APIs
6. **Probar las funcionalidades** con los endpoints documentados
