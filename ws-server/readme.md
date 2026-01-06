# Socket Gym - AlephScript Monorepo

Un monorepo que contiene la librería **@alephscript/core** y una aplicación demo que demuestra su uso.

## 🚀 ¿Qué se logró?

### ✅ Problema Resuelto
- **Error TS6059**: Los archivos fuera del `rootDir` ya no causan errores de compilación
- **Separación limpia**: La librería está completamente separada de la aplicación consumidora
- **Imports con alias**: Uso de `@alephscript/core` para imports limpios

### ✅ Estructura del Monorepo

```
socket-gym/
├── package.json                    # Monorepo configuration
├── packages/
│   ├── alephscript-core/          # 📦 LA LIBRERÍA
│   │   ├── src/
│   │   │   ├── server/            # AlephScriptServer, SocketServer
│   │   │   ├── client/            # AlephScriptClient, SocketClient  
│   │   │   ├── types/             # Interfaces y tipos TypeScript
│   │   │   ├── utils/             # Utilidades (Message, isLogable)
│   │   │   └── index.ts           # Punto de entrada principal
│   │   ├── dist/                  # Build output
│   │   ├── package.json           # @alephscript/core
│   │   └── tsconfig.json
│   └── socket-gym-demo/           # 🎯 LA APLICACIÓN DEMO
│       ├── src/
│       │   └── index.ts           # Demo que consume la librería
│       ├── dist/                  # Build output
│       ├── package.json           # socket-gym-demo
│       └── tsconfig.json
└── README.md                      # Este archivo
```

### ✅ Clases Disponibles en la Librería

```typescript
import { 
    AlephScriptServer,    // Servidor principal con namespaces
    AlephScriptClient,    // Cliente con auto-reconnect
    SocketServer,         // Servidor base Socket.IO extendido
    SocketClient,         // Cliente base Socket.IO extendido
    IUserDetails,         // Tipos de usuario
    IServerState,         // Estado del servidor
    RoomDetails,          // Detalles de rooms
    // ... y muchos más tipos
} from '@alephscript/core';
```

## 🛠️ Comandos Disponibles

```bash
# Compilar toda la librería
npm run build:core

# Compilar la demo  
npm run build:demo

# Compilar todo el monorepo
npm run build

# Ejecutar la demo en modo desarrollo
npm run dev:demo
```

## 🎯 Demo en Funcionamiento

La demo muestra:

```typescript
// ✅ Imports limpios con alias
import { AlephScriptServer, AlephScriptClient } from '@alephscript/core';

// ✅ Uso de la librería
const as = new AlephScriptServer(server);

const client = new AlephScriptClient(
    "SERVER_cRUNTIME", 
    "http://localhost:3000", 
    "/runtime"
);
```

### 📊 Salida de la Demo

```
🚀 Socket Gym Demo - Server escuchando en el puerto 3000
📦 Usando @alephscript/core library
✅ Demo aplicación configurada correctamente usando @alephscript/core
📊 Receiving server state from @alephscript/core...
```

## 🔄 Migración Desde el Código Original

### Antes (código original):
```typescript
import { AlephScriptServer } from './alephscript/server';
import { AlephScriptClient } from './alephscript/client';
```

### Después (usando la librería):
```typescript
import { AlephScriptServer, AlephScriptClient } from '@alephscript/core';
```

## 🎁 Beneficios Obtenidos

1. **✅ Reutilizable**: La librería se puede usar en múltiples proyectos
2. **✅ Tipado fuerte**: TypeScript completo con exports organizados
3. **✅ Monorepo moderno**: Workspace de npm con build independientes
4. **✅ Imports limpios**: Alias `@alephscript/core` en lugar de rutas relativas
5. **✅ Separación de responsabilidades**: Librería vs aplicación
6. **✅ Build independientes**: Cada paquete compila por separado
7. **✅ Demo funcional**: Ejemplo listo para usar

## 📚 Próximos Pasos

1. **Publicar a npm**: `npm publish` en `packages/alephscript-core/`
2. **Agregar tests**: Configurar Jest para testing
3. **Documentación**: Expandir la documentación de la API
4. **Versionado**: Configurar semantic versioning
5. **CI/CD**: Setup de GitHub Actions

---

**¡La refactorización está completa y funcionando perfectamente!** 🎉

Tu código original de `src/index.ts` ahora consume la librería `@alephscript/core` de manera limpia y profesional.