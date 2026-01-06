# @alephscript/angular

Angular integration library for AlephScript - RxJS-powered reactive client.

## 🚀 Features

- **Reactive by Design**: Built with RxJS observables for seamless Angular integration
- **Type Safe**: Full TypeScript support with comprehensive type definitions
- **SSR Ready**: Server-side rendering support with automatic fallback
- **Channel-based Messaging**: Organized message streams by category (System, Agent, Game, UI)
- **Auto-Reconnection**: Intelligent reconnection with exponential backoff
- **Ready-to-use Components**: Pre-built UI components for common scenarios
- **Advanced Filtering**: RxJS operators for debouncing, throttling, and buffering
- **Statistics Tracking**: Connection uptime and message analytics

## 📦 Installation

```bash
npm install @alephscript/angular @alephscript/core-browser
# or
yarn add @alephscript/angular @alephscript/core-browser
```

## 🎯 Quick Start

### 1. Module Setup

```typescript
import { NgModule } from '@angular/core';
import { AlephScriptModule } from '@alephscript/angular';

@NgModule({
  imports: [
    AlephScriptModule.forRoot({
      name: 'MyAngularApp',
      url: 'ws://localhost:3000',
      uiType: 'angular',
      uiId: 'main-app',
      debug: true,
      enableSSR: true,
      rxjs: {
        autoUnsubscribe: true,
        debounceTime: 100
      }
    })
  ]
})
export class AppModule { }
```

### 2. Service Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { AlephScriptService, MessageChannel } from '@alephscript/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-aleph-client',
  template: `
    <div>
      <h2>AlephScript Status</h2>
      <p>Connection: {{ connectionStatus$ | async }}</p>
      
      <div>
        <h3>Agent Messages</h3>
        <div *ngFor="let message of agentMessages$ | async">
          {{ message.data | json }}
        </div>
      </div>
      
      <button (click)="sendGameAction()" [disabled]="!(isConnected$ | async)">
        Send Game Action
      </button>
    </div>
  `
})
export class AlephClientComponent implements OnInit {
  connectionStatus$ = this.alephService.connectionStatus;
  agentMessages$ = this.alephService.agentMessages;
  isConnected$ = this.alephService.connectionStatus.pipe(
    map(status => status === 'connected')
  );

  constructor(private alephService: AlephScriptService) {}

  ngOnInit() {
    // Service auto-connects, but you can manually connect if needed
    // this.alephService.connect();
  }

  sendGameAction() {
    this.alephService.sendGameAction('player_move', {
      x: 100,
      y: 200,
      direction: 'north'
    });
  }
}
```

### 3. Using Pre-built Components

```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <!-- Connection status indicator -->
      <aleph-connection-status 
        [showDetails]="true">
      </aleph-connection-status>
      
      <!-- Message display with channel filtering -->
      <aleph-message-display 
        title="Game Messages"
        channel="GAME"
        [showChannelFilter]="true"
        [maxMessages]="100">
      </aleph-message-display>
    </div>
  `
})
export class DashboardComponent { }
```

## 📚 Advanced Usage

### Custom Message Filtering

```typescript
import { RxjsSocketBridge, MessageChannel } from '@alephscript/angular';

export class GameComponent {
  constructor(private bridge: RxjsSocketBridge) {}

  ngOnInit() {
    // Create filtered stream for specific message types
    const playerMoveStream = this.bridge.createFilteredStream({
      channel: MessageChannel.GAME,
      filter: (message) => message.type === 'player_move',
      debounceTime: 200,
      shareReplay: true
    });

    playerMoveStream.subscribe(message => {
      console.log('Player moved:', message.data);
    });

    // Create throttled stream for high-frequency events
    const heartbeatStream = this.bridge.createThrottledStream(
      MessageChannel.SYSTEM, 
      1000, // 1 second throttle
      true  // leading edge
    );

    heartbeatStream.subscribe(message => {
      console.log('Heartbeat (throttled):', message);
    });
  }
}
```

### Channel-based Message Routing

```typescript
export class MessageHandlerService {
  constructor(private alephService: AlephScriptService) {
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    // System messages
    this.alephService.systemMessages.subscribe(message => {
      console.log('System:', message);
    });

    // Agent messages with filtering
    this.alephService.agentMessages.pipe(
      filter(message => message.type === 'agent_postulations'),
      debounceTime(500)
    ).subscribe(message => {
      this.handleAgentPostulations(message.data);
    });

    // Game state updates
    this.alephService.gameMessages.pipe(
      filter(message => message.type === 'game_state_update')
    ).subscribe(message => {
      this.updateGameState(message.data);
    });
  }
}
```

### Statistics and Monitoring

```typescript
export class MonitoringComponent {
  constructor(private bridge: RxjsSocketBridge) {}

  ngOnInit() {
    // Monitor connection statistics
    this.bridge.getConnectionStats().subscribe(stats => {
      console.log('Connection Stats:', {
        connected: stats.isConnected,
        uptime: stats.uptime,
        messages: stats.messageCount,
        lastActivity: new Date(stats.lastActivity)
      });
    });

    // Monitor bridge statistics
    this.bridge.stats.subscribe(stats => {
      console.log('Bridge Stats:', stats);
    });
  }
}
```

## 🔧 Configuration Options

```typescript
interface AlephScriptAngularConfig {
  // Core configuration (from @alephscript/core-browser)
  name?: string;
  url?: string;
  namespace?: string;
  autoConnect?: boolean;
  debug?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  timeout?: number;
  uiType?: string;
  uiId?: string;

  // Angular-specific configuration
  enableSSR?: boolean;                    // Enable SSR support
  fallbackMode?: {
    enabled?: boolean;                    // Enable fallback mode
    timeout?: number;                     // Fallback timeout
  };
  rxjs?: {
    autoUnsubscribe?: boolean;            // Auto-unsubscribe on destroy
    debounceTime?: number;                // Default debounce time
    bufferTime?: number;                  // Default buffer time
  };
}
```

## 🎮 Gaming Integration Example

```typescript
@Component({
  selector: 'game-client',
  template: `
    <aleph-connection-status></aleph-connection-status>
    
    <div class="game-controls">
      <button (click)="requestAgentPostulations()">
        Request AI Agents
      </button>
      <button (click)="selectAgent(0)">
        Select Agent 1
      </button>
    </div>
    
    <aleph-message-display 
      channel="AGENT" 
      title="AI Agent Messages">
    </aleph-message-display>
  `
})
export class GameClientComponent {
  constructor(private alephService: AlephScriptService) {}

  requestAgentPostulations() {
    this.alephService.requestPostulations({
      scenario: 'battle',
      playerLevel: 5,
      difficulty: 'hard'
    });
  }

  selectAgent(index: number) {
    this.alephService.selectAgent(index, 'Strategic choice for current scenario');
  }
}
```

## 🔄 Migration from Legacy Code

If you're migrating from the old implementation:

```typescript
// OLD (threejs-ui-lib)
import { AlephScriptService as OldService } from 'old-path';

// NEW (@alephscript/angular)
import { AlephScriptService, MessageChannel } from '@alephscript/angular';

// The new service provides the same methods plus reactive streams:
// - sendMessage() -> sendMessage() or sendUserInput()
// - on() -> Use reactive observables instead
// - connect() -> Auto-connects or call connect()
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
