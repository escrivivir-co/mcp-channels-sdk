# Manual de Uso de AlephScriptClient

## Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración Básica](#configuración-básica)
4. [Patrones de Comunicación](#patrones-de-comunicación)
5. [Creación de Bots](#creación-de-bots)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [API Reference](#api-reference)

## Introducción

AlephScriptClient es un cliente Socket.IO especializado para conectarse al sistema AlephScript. Permite crear bots que se comunican con el runtime del sistema AlephScript usando un protocolo de mensajería basado en rooms (salas) y eventos.

## Arquitectura del Sistema

### Namespaces Disponibles
El sistema Socket.IO de AlephScript utiliza tres namespaces principales:

- `/runtime` - Para comunicación con el motor de FIAs (Functional Intelligent Agents)
- `/admin` - Para administración del servidor (usado por la UI de administración)
- `/` - Namespace base para comunicación general

### Salas (Rooms) Principales
- `ENGINE_THREADS` - Sala principal para comunicación con el runtime
- `IDE-app` - Sala para aplicaciones de IDE
- Salas dinámicas basadas en nombres de aplicaciones

## Configuración Básica

### Instalación y Importación
```typescript
import { AlephScriptClient } from './path/to/alephscript/client';
```

### Constructor
```typescript
const client = new AlephScriptClient(
    name?: string,           // Nombre del bot (default: "ClientID")
    url?: string,           // URL del servidor (default: "http://localhost:3000")
    namespace?: string,     // Namespace (default: "/runtime")
    autoConnect?: boolean   // Conectar automáticamente (default: true)
);
```

## Patrones de Comunicación Descubiertos

### 1. Registro Automático del Cliente
Al conectarse, el SocketClient automáticamente:
```typescript
// Se ejecuta automáticamente en el constructor
this.io.emit("CLIENT_REGISTER", { usuario: this.name, sesion: getHash("") });
this.io.emit("CLIENT_SUSCRIBE", { room: "ENGINE_THREADS" });
```

### 2. Protocolo GET/SET
El sistema utiliza un patrón Master-Room donde:
- Los eventos que empiezan con `GET_` son solicitudes
- Los eventos que empiezan con `SET_` son respuestas  
- Un master por sala procesa las solicitudes GET y responde con SET

### 3. Protocolo ROOM_MESSAGE
Todos los mensajes a salas se envían usando el evento `ROOM_MESSAGE` que transporta:
```typescript
{
    event: string,  // El evento real
    room: string,   // La sala destino
    data: any       // Los datos del evento
}
```

### 4. Eventos Principales del Sistema Observados

#### Eventos de Estado del Servidor (ejemplos reales del codebase)
- `GET_SERVER_STATE` → `SET_SERVER_STATE`
- `GET_LIST_OF_THREADS` → `SET_LIST_OF_THREADS`

#### Eventos de Control de Aplicaciones (encontrados en adapter.ts)
- `GET_ENGINE` - Controlar ejecución de aplicaciones FIA
- `SET_DOMAIN_BASE_DATA` - Actualizar datos del dominio
- `SET_MODEL_RPC_DATA` - Actualizar datos RPC del modelo
- `SET_EXECUTION_PROCESS` - Proceso de ejecución

#### Eventos de Master/Room
- `MAKE_MASTER` - Declararse master de una sala

### 5. Estructura de Mensajes de Sala
Basado en el análisis del código, el método `room()` del cliente envía un `ROOM_MESSAGE` con esta estructura:
```typescript
// Estructura real del ROOM_MESSAGE
{
    event: string,    // Evento a enviar
    room: string,     // Sala destino 
    data: any         // Datos del evento
}
```

## Creación de Bots

### Bot Básico de Monitoreo
```typescript
// Ejemplo real basado en ws-server/src/index.ts
const monitorBot = new AlephScriptClient("MonitorBot", "http://localhost:3000", "/runtime");

monitorBot.initTriggersDefinition.push(() => {
    // Escuchar respuestas del sistema
    monitorBot.io.on("SET_LIST_OF_THREADS", (...args: any[]) => {
        console.log(">>>> Receiving list of threads...", args[0]);
    });
    
    // Solicitar lista de threads usando el método room()
    monitorBot.room("GET_LIST_OF_THREADS");
    
    // Monitorear estado del servidor
    monitorBot.io.on("SET_SERVER_STATE", (...args: any[]) => {
        console.log(">>>> Receiving server state...", args[0]);
    });
    
    monitorBot.room("GET_SERVER_STATE");
});
```

### Bot Master para Procesar Solicitudes
```typescript
// Ejemplo real basado en alephscript/src/FIA/engine/apps/app.ts
const masterBot = new AlephScriptClient("MasterBot", "http://localhost:3000", "/runtime");

masterBot.initTriggersDefinition.push(() => {
    // El cliente se registra automáticamente al conectar (esto es automático en SocketClient)
    // Se declara master de una sala con features específicas
    masterBot.room("MAKE_MASTER", { features: ["GET_LIST_OF_THREADS"] });
    
    // Procesar solicitudes que lleguen (el patrón GET/SET es manejado por el servidor)
    masterBot.io.on("GET_LIST_OF_THREADS", (...args: any[]) => {
        const requestData = args[0];
        console.log(`Solicitud de ${requestData.requesterName}`);
        
        // Responder usando roomP para enviar payload completo
        const responseData = {
            ...requestData,
            room: "ENGINE_THREADS", 
            event: "SET_LIST_OF_THREADS",
            data: getCurrentThreads() // Tu función para obtener threads
        };
        
        masterBot.roomP(responseData);
    });
});
```

### Bot de Control de Aplicaciones
```typescript
const controlBot = new AlephScriptClient("ControlBot", "http://localhost:3000", "/runtime");

controlBot.initTriggersDefinition.push(() => {
    // Función para ejecutar una aplicación FIA
    const executeApp = (engineIndex: number, action: string) => {
        controlBot.room("GET_ENGINE", {
            action: action,  // "PLAY", "PLAY_STEP", "PAUSE", "STOP"
            engine: engineIndex
        });
    };
    
    // Función para actualizar datos del dominio
    const updateDomainData = (engineIndex: number, data: any) => {
        controlBot.room("SET_DOMAIN_BASE_DATA", {
            action: "SET_DATA",
            engine: engineIndex,
            blob: data
        });
    };
    
    // Ejemplo de uso
    setTimeout(() => {
        executeApp(0, "PLAY_STEP"); // Ejecutar app 0 un paso
    }, 5000);
});
```

## Ejemplos Prácticos

### Ejemplo 1: Bot Observador Simple
```typescript
const observer = new AlephScriptClient("Observer", "http://localhost:3000", "/runtime");

observer.initTriggersDefinition.push(() => {
    // Obtener estado inicial
    observer.room("GET_LIST_OF_THREADS");
    observer.room("GET_SERVER_STATE");
    
    // Escuchar actualizaciones
    observer.io.on("SET_LIST_OF_THREADS", (data) => {
        console.log("📋 Aplicaciones disponibles:", data.data?.length || 0);
    });
    
    observer.io.on("SET_EXECUTION_PROCESS", (data) => {
        console.log("⚙️ Proceso de ejecución:", data);
    });
});
```

### Ejemplo 2: Bot Spider para Captura de Datos
```typescript
// Ejemplo real basado en el código comentado en adapter.ts
const spider = new AlephScriptClient("Spider", "http://localhost:3000", "/runtime");

spider.initTriggersDefinition.push(() => {
    // Registro automático al conectar (manejado por SocketClient)
    // Suscripción a sala específica usando emit directo
    spider.io.emit("CLIENT_SUSCRIBE", { room: "SUDOKU" });
    
    const capturedData = [];
    
    // Escuchar datos específicos de la sala
    spider.io.on("BOARD", (...args: any[]) => {
        capturedData.push(args[0]);
        console.log("🕷️ Datos capturados:", capturedData.length);
    });
    
    // Enviar datos usando el método room()
    setInterval(() => {
        if (capturedData.length > 0) {
            const data = capturedData.shift();
            spider.room("BOARD_DATA", data, "SUDOKU");
        }
    }, 1000);
});
```

### Ejemplo 3: Bot de Administración
```typescript
const admin = new AlephScriptClient("AdminBot", "http://localhost:3000", "/admin");

admin.initTriggersDefinition.push(() => {
    // Monitorear conexiones
    admin.room("GET_SERVER_STATE");
    
    admin.io.on("SET_SERVER_STATE", (state) => {
        console.log("👥 Clientes conectados:", state.clients);
        console.log("🏠 Salas activas:", state.rooms?.length || 0);
        console.log("🔌 Sockets por namespace:", state.socketsPerNamespace);
    });
    
    // Reporte periódico
    setInterval(() => {
        admin.room("GET_SERVER_STATE");
    }, 30000);
});
```

## API Reference

### Métodos Principales

#### `room(event: string, data?: any, room?: string)`
Envía un mensaje a una sala específica usando el protocolo ROOM_MESSAGE.
- `event`: Nombre del evento
- `data`: Datos a enviar (default: {})
- `room`: Nombre de la sala (default: "ENGINE_THREADS")

Internamente ejecuta:
```typescript
this.io.emit("ROOM_MESSAGE", { event, room, data });
```

#### `roomP(payload: any)`
Envía un payload completo como ROOM_MESSAGE.
- `payload`: Objeto que debe contener al menos `{ event, room, data }`

Internamente ejecuta:
```typescript
this.io.emit("ROOM_MESSAGE", payload);
```

### Eventos del Cliente

#### `initTriggersDefinition: (() => void)[]`
Array de funciones que se ejecutan cuando el cliente se conecta. Aquí se definen los listeners de eventos.

### Eventos del Socket.IO

#### Eventos de Conexión
- `connect` - Cliente conectado
- `disconnect` - Cliente desconectado
- `connect_error` - Error de conexión
- `reconnect` - Reconectado al servidor

#### Eventos del Sistema
Basado en el análisis del código, estos son los eventos reales que maneja el sistema:

**Eventos automáticos del cliente:**
- `CLIENT_REGISTER` - Se envía automáticamente al conectar con `{ usuario: nombre, sesion: hash }`
- `CLIENT_SUSCRIBE` - Se envía automáticamente para unirse a "ENGINE_THREADS", o manualmente para otras salas

**Eventos de comunicación:**
- `ROOM_MESSAGE` - Protocolo interno para envío de mensajes a salas (usado por `room()` y `roomP()`)

**Eventos específicos del dominio AlephScript:**
- Los eventos GET_/SET_ específicos que descubras en tu aplicación

### Estados de Ejecución (RunStateEnum)
```typescript
enum RunStateEnum {
    PLAY = "PLAY",           // Ejecutar continuamente
    PLAY_STEP = "PLAY_STEP", // Ejecutar un paso
    PAUSE = "PAUSE",         // Pausar ejecución
    STOP = "STOP"            // Detener ejecución
}
```

## Mejores Prácticas Observadas en el Código

1. **Usar initTriggersDefinition**: Siempre define los listeners en este array. El sistema los ejecuta automáticamente después de la conexión en un intervalo de 1 segundo.

2. **El registro es automático**: No necesitas llamar `CLIENT_REGISTER` manualmente, el SocketClient lo hace automáticamente al conectar.

3. **Suscripción automática a ENGINE_THREADS**: El cliente se suscribe automáticamente a esta sala, pero puedes suscribirte a salas adicionales usando `emit("CLIENT_SUSCRIBE", { room: "NOMBRE_SALA" })`.

4. **Usar room() para eventos simples**: Para enviar eventos usa `room(evento, datos, sala)`.

5. **Usar roomP() para payloads complejos**: Cuando necesites enviar un payload completo con metadatos adicionales.

6. **Nombres descriptivos**: Usa nombres descriptivos para tus bots para facilitar el debugging en los logs del servidor.

## Troubleshooting

### Problemas Comunes
- **Bot no responde**: Verificar que esté suscrito a la sala correcta
- **Master no encontrado**: Asegurarse de que hay un master declarado para la sala
- **Eventos no llegan**: Verificar el namespace y la estructura del mensaje

### Debug
Habilita logs detallados agregando logging en los eventos:
```typescript
bot.io.onAny((event, ...args) => {
    console.log(`🔍 Evento: ${event}`, args);
});
```

Este manual proporciona una base sólida para crear bots conectados al sistema Socket.IO de AlephScript.
