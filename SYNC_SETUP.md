# Configuración de Sincronización Offline-First

## Descripción

La aplicación ahora implementa sincronización **offline-first** entre el frontend (Ionic + SQLite) y el backend (NestJS + PostgreSQL).

## Características Implementadas

### ✅ Funcionalidad Offline-First
- **Trabajo sin conexión**: Todas las operaciones CRUD funcionan localmente con SQLite
- **Sincronización automática**: Al detectar conexión, sincroniza cambios automáticamente
- **Resolución de conflictos**: El servidor es la fuente de verdad
- **Indicadores visuales**: Muestra el estado de sincronización de cada tarea

### ✅ Estados de Sincronización
- **Synced** (verde): Tarea sincronizada con el servidor
- **Pending** (amarillo): Cambios pendientes de sincronizar
- **Error** (rojo): Error en la sincronización

### ✅ Detección de Red
- Monitoreo automático del estado de conexión
- Notificaciones cuando se pierde/recupera la conexión
- Funciona en web y móvil (iOS/Android)

## Configuración

### 1. Backend

Asegúrate de que el backend esté corriendo en `http://localhost:3000`:

```bash
cd todo-backend
npm install
npm run start:dev
```

### 2. Frontend - Variables de Entorno

#### Desarrollo (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

#### Producción (`src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'  // Cambiar por tu URL de producción
};
```

### 3. Instalar Dependencias

```bash
cd todo-app
npm install
```

### 4. Ejecutar la Aplicación

#### Web (Desarrollo)
```bash
ionic serve
```

#### Android
```bash
ionic capacitor run android
```

#### iOS
```bash
ionic capacitor run ios
```

## Arquitectura de Sincronización

### Flujo de Trabajo

1. **Operación Local**
   - Usuario crea/edita/elimina una tarea
   - Se guarda inmediatamente en SQLite local
   - Estado: `syncStatus = 'pending'`

2. **Sincronización Automática**
   - Si hay conexión, se intenta sincronizar automáticamente
   - Si no hay conexión, la operación queda pendiente

3. **Proceso de Sincronización**
   - Envía cambios locales pendientes al servidor
   - Recibe cambios del servidor desde la última sincronización
   - Actualiza la base de datos local con cambios del servidor
   - Marca tareas como `synced`

4. **Manejo de Errores**
   - Si falla la sincronización, marca como `error`
   - Reintenta automáticamente cuando se recupera la conexión

### Estructura de Base de Datos Local

#### Tabla: `tasks`
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serverId TEXT,                    -- ID del servidor (UUID)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncStatus TEXT DEFAULT 'pending' -- 'synced' | 'pending' | 'error'
);
```

#### Tabla: `sync_metadata`
```sql
CREATE TABLE sync_metadata (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  lastSyncTimestamp TEXT NOT NULL
);
```

## Servicios Implementados

### 1. `ApiService`
Maneja todas las peticiones HTTP al backend:
- `getAllTasks()`: Obtener todas las tareas
- `getTask(id)`: Obtener una tarea específica por ID
- `createTask()`: Crear nueva tarea
- `updateTask(id, data)`: Actualizar tarea existente
- `toggleTaskComplete(id)`: Alternar estado de completado
- `deleteTask(id)`: Eliminar tarea
- `getChangesSince(timestamp)`: Obtener cambios desde un timestamp
- `syncTasks(request)`: Sincronizar cambios bidireccionales

### 2. `NetworkService`
Detecta el estado de la red:
- `online$`: Observable del estado de conexión
- `isOnline()`: Estado actual (síncrono)
- `checkNetworkStatus()`: Verificar estado
- Funciona en web y móvil

### 3. `DatabaseService`
Maneja SQLite local:
- `initializeDatabase()`: Inicializar DB
- `getLastSyncTimestamp()`: Obtener última sincronización
- `updateLastSyncTimestamp()`: Actualizar timestamp

### 4. `TaskService`
Lógica de negocio y sincronización:
- Operaciones CRUD locales
- Sincronización automática
- Manejo de conflictos

## Endpoints del Backend

```
GET    /api/tasks              - Obtener todas las tareas
GET    /api/tasks/:id          - Obtener una tarea
POST   /api/tasks              - Crear tarea
PUT    /api/tasks/:id          - Actualizar tarea
PATCH  /api/tasks/:id/toggle   - Alternar completado
DELETE /api/tasks/:id          - Eliminar tarea
POST   /api/tasks/sync         - Sincronizar cambios
GET    /api/tasks/changes      - Obtener cambios desde timestamp
```

## Pruebas de Funcionalidad

### Escenario 1: Trabajo Offline
1. Desconectar internet
2. Crear/editar/eliminar tareas
3. Verificar que aparecen con badge "Pendiente"
4. Reconectar internet
5. Verificar sincronización automática

### Escenario 2: Sincronización Manual
1. Hacer cambios offline
2. Pulsar botón de sincronización en el header
3. Verificar que los cambios se sincronizan

### Escenario 3: Cambios desde Otro Dispositivo
1. Crear tarea en dispositivo A
2. Abrir aplicación en dispositivo B
3. Hacer pull-to-refresh
4. Verificar que aparece la nueva tarea

## Solución de Problemas

### Error: "Database not initialized"
- Asegúrate de llamar `await taskService.initialize()` antes de usar el servicio

### Error: "Network request failed"
- Verifica que el backend esté corriendo
- Verifica la URL en `environment.ts`
- Revisa la consola del navegador para más detalles

### Tareas no se sincronizan
- Verifica el estado de red en el header
- Revisa la consola para errores de sincronización
- Intenta sincronización manual con el botón de sync

### CORS en desarrollo
Si tienes problemas de CORS, asegúrate de que el backend tenga configurado:
```typescript
app.enableCors({
  origin: ['http://localhost:8100', 'capacitor://localhost'],
  credentials: true
});
```

## Próximas Mejoras

- [ ] Resolución de conflictos más sofisticada (CRDT)
- [ ] Cola de sincronización con reintentos exponenciales
- [ ] Sincronización en segundo plano
- [ ] Compresión de datos para sincronización
- [ ] Métricas de sincronización

## Notas Técnicas

- **SQLite**: Usado para almacenamiento local persistente
- **Capacitor Network**: Para detección de red en móvil
- **RxJS**: Para manejo reactivo de estado
- **HttpClient**: Para peticiones HTTP con timeout
- **Ionic Storage**: Alternativa considerada pero no usada (SQLite es más robusto)
