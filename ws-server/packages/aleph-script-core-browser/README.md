# AlephScript Core Browser

Universal browser client for AlephScript - framework agnostic socket.io wrapper.

## 🚀 Features

- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS
- **Type Safe**: Full TypeScript support with comprehensive type definitions
- **Event-Driven**: Type-safe event system with auto-completion
- **Browser Optimized**: Designed specifically for browser environments
- **Protocol Support**: Built-in AlephScript protocol implementation
- **Extensible**: Easy to extend for custom functionality

## 📦 Installation

```bash
npm install @alephscript/core-browser
# or
yarn add @alephscript/core-browser
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { createAlephScriptClient } from '@alephscript/core-browser';

// Create client instance
const client = createAlephScriptClient({
  name: 'MyApp',
  url: 'http://localhost:3000',
  uiType: 'web',
  uiId: 'app-1',
  debug: true
});

// Listen to connection events
client.on('connected', (data) => {
  console.log('Connected to AlephScript server!', data);
});

client.on('message', (message) => {
  console.log('Received message:', message);
});

// Connect
client.connect();
```

### Gaming/UI Specific Usage

```typescript
import { createAlephScriptClientForUI } from '@alephscript/core-browser';

// Create client for specific UI type
const gameClient = createAlephScriptClientForUI(
  'threejs',           // UI type
  'game-instance-1',   // UI ID
  'ws://localhost:3000' // Server URL
);

// Send game actions
gameClient.sendGameAction('player_move', {
  x: 100,
  y: 200,
  direction: 'north'
});

// Request agent postulations
gameClient.requestPostulations({
  scenario: 'battle',
  context: { playerLevel: 5 }
});
```

## 📚 API Reference

### Classes

#### `AlephScriptClient`

Main client class with full AlephScript protocol support.

**Methods:**
- `connect()` - Connect to server
- `disconnect()` - Disconnect from server
- `sendUserInput(input, metadata)` - Send user input
- `sendGameAction(action, payload)` - Send game action
- `selectAgent(index, reasoning)` - Select an agent
- `requestPostulations(context)` - Request agent postulations
- `sendHeartbeat()` - Send heartbeat to server

#### `SocketClient`

Base socket client (can be extended for custom implementations).

### Events

The client emits the following events:

```typescript
// Connection events
client.on('connected', (data) => { /* Connected to server */ });
client.on('disconnected', () => { /* Disconnected from server */ });
client.on('connection_error', (error) => { /* Connection error */ });

// Message events
client.on('message', (message) => { /* Generic message */ });
client.on('agent_message', (data) => { /* Agent message */ });
client.on('system_message', (data) => { /* System message */ });

// Game events
client.on('game_state_update', (state) => { /* Game state changed */ });
client.on('agent_postulations', (agents) => { /* Agent postulations */ });
```

### Configuration

```typescript
interface AlephClientConfig {
  name?: string;                    // Client name (default: "AlephClient")
  url?: string;                     // Server URL (default: "http://localhost:3000")
  namespace?: string;               // Socket namespace (default: "/")
  autoConnect?: boolean;            // Auto-connect on creation (default: true)
  debug?: boolean;                  // Enable debug logging (default: true)
  reconnection?: boolean;           // Enable reconnection (default: true)
  reconnectionAttempts?: number;    // Max reconnection attempts (default: 5)
  timeout?: number;                 // Connection timeout (default: 10000)
  uiType?: string;                  // UI type identifier (default: "browser")
  uiId?: string;                    // UI instance ID (default: "default")
}
```

## 🔧 Framework Integration

### React Example

```tsx
import React, { useEffect, useState } from 'react';
import { createAlephScriptClient, AlephScriptClient } from '@alephscript/core-browser';

function AlephScriptComponent() {
  const [client, setClient] = useState<AlephScriptClient | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const alephClient = createAlephScriptClient({
      name: 'ReactApp',
      uiType: 'react',
      uiId: 'main-app'
    });

    alephClient.on('connected', () => setConnected(true));
    alephClient.on('disconnected', () => setConnected(false));

    setClient(alephClient);

    return () => {
      alephClient.destroy();
    };
  }, []);

  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      <button 
        onClick={() => client?.sendUserInput('Hello from React!')}
        disabled={!connected}
      >
        Send Message
      </button>
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <div>
    <p>Status: {{ connected ? 'Connected' : 'Disconnected' }}</p>
    <button @click="sendMessage" :disabled="!connected">
      Send Message
    </button>
  </div>
</template>

<script>
import { createAlephScriptClient } from '@alephscript/core-browser';

export default {
  data() {
    return {
      client: null,
      connected: false
    };
  },
  mounted() {
    this.client = createAlephScriptClient({
      name: 'VueApp',
      uiType: 'vue',
      uiId: 'main-app'
    });

    this.client.on('connected', () => {
      this.connected = true;
    });

    this.client.on('disconnected', () => {
      this.connected = false;
    });
  },
  beforeUnmount() {
    this.client?.destroy();
  },
  methods: {
    sendMessage() {
      this.client?.sendUserInput('Hello from Vue!');
    }
  }
};
</script>
```

## 🏗️ Architecture

This library provides a clean separation of concerns:

- **SocketClient**: Base socket.io wrapper with connection management
- **AlephScriptClient**: Extended client with AlephScript protocol support
- **AlephEventEmitter**: Type-safe event system
- **Types**: Comprehensive TypeScript definitions
- **Utils**: Common utility functions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
