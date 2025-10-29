# To-Do List App - Ionic Angular

Aplicación móvil híbrida de lista de tareas construida con Ionic, Angular y Capacitor, con persistencia local usando SQLite.

## 🚀 Características

- ✅ Crear tareas
- ✅ Marcar tareas como completadas
- ✅ Editar tareas existentes
- ✅ Eliminar tareas
- ✅ Persistencia local con SQLite
- ✅ Funcionalidad offline
- ✅ Sincronización cuando hay conexión
- ✅ Interfaz moderna y responsiva

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Ionic CLI (`npm install -g @ionic/cli`)
- Para desarrollo móvil:
  - Android Studio (para Android)
  - Xcode (para iOS, solo en macOS)

## 🛠️ Instalación

1. Clonar el repositorio o navegar al directorio del proyecto:

2. Instalar dependencias:
```bash
npm install
```

## 🏃‍♂️ Ejecutar la Aplicación

### Desarrollo en navegador
```bash
ionic serve
```

La aplicación se abrirá en `http://localhost:8100`

### Desarrollo en dispositivo móvil

#### Android
```bash
# Agregar plataforma Android
ionic capacitor add android

# Compilar proyecto
ionic capacitor build android

# Sincronizar cambios
ionic capacitor sync android

# Abrir en Android Studio
ionic capacitor open android
```

#### iOS (solo macOS)
```bash
# Agregar plataforma iOS
ionic capacitor add ios

# Compilar proyecto
ionic capacitor build ios

# Sincronizar cambios
ionic capacitor sync ios

# Abrir en Xcode
ionic capacitor open ios
```

## 🧪 Pruebas

Ejecutar pruebas unitarias:
```bash
npm test
```

Ejecutar linter:
```bash
npm run lint
```

Verificar tipos de TypeScript:
```bash
npm run typecheck
```

## 📁 Estructura del Proyecto

```
src/
└── app/
    ├── core/                    # Servicios core y configuración
    │   ├── services/
    │   │   └── database.service.ts
    │   └── core.module.ts
    ├── shared/                  # Componentes y módulos compartidos
    │   └── shared.module.ts
    ├── features/                # Módulos de características
    │   └── tasks/
    │       ├── components/      # Componentes de UI
    │       │   ├── task-list.component.*
    │       │   └── task-form.component.*
    │       ├── services/        # Lógica de negocio
    │       │   └── task.service.ts
    │       ├── models/          # Interfaces y tipos
    │       │   └── task.model.ts
    │       ├── pages/           # Páginas/Vistas
    │       │   └── tasks.page.*
    │       ├── tasks.module.ts
    │       └── tasks-routing.module.ts
    └── app-routing.module.ts
```

## 🎯 Funcionalidades Implementadas

### CRUD Completo
- **Crear**: Formulario con validación para crear nuevas tareas
- **Leer**: Lista de tareas con estado de completado
- **Actualizar**: Edición de tareas existentes y toggle de completado
- **Eliminar**: Eliminación con confirmación

### Persistencia Local
- Base de datos SQLite local
- Funciona completamente offline
- Los datos persisten entre sesiones

### Sincronización
- Detección automática de estado de red
- Indicador visual de modo offline
- Sincronización manual mediante botón
- Estado de sincronización por tarea

## 🏗️ Arquitectura

La aplicación sigue los principios de:
- **Separación de responsabilidades**: Componentes para UI, servicios para lógica
- **Modularidad**: Feature modules con lazy loading
- **Tipado fuerte**: TypeScript en todo el código
- **Reactive Programming**: RxJS para manejo de estado
- **Clean Code**: Nomenclatura clara y código mantenible

## 📱 Compatibilidad

- ✅ Web (navegadores modernos)
- ✅ Android (API 22+)
- ✅ iOS (iOS 13+)

## 🔧 Tecnologías Utilizadas

- **Framework**: Ionic 7 + Angular 17
- **Base de datos**: SQLite (via @capacitor-community/sqlite)
- **Plataforma**: Capacitor
- **Lenguaje**: TypeScript
- **Testing**: Jasmine + Karma
- **Linting**: ESLint

## 📝 Notas de Desarrollo

### Convenciones de Código
- Nomenclatura: PascalCase para clases, camelCase para variables
- Archivos: kebab-case
- Componentes: sufijo `.component.ts`
- Servicios: sufijo `.service.ts`
- Páginas: sufijo `.page.ts`

### Flujo TDD
1. 🟥 RED: Escribir prueba que falle
2. 🟩 GREEN: Implementar código mínimo
3. 🟦 REFACTOR: Limpiar y optimizar

## 🤝 Contribuir

Para contribuir al proyecto:
1. Seguir las convenciones de código establecidas
2. Escribir pruebas para nuevas funcionalidades
3. Asegurar que todas las pruebas pasen
4. Ejecutar linter antes de commit

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
