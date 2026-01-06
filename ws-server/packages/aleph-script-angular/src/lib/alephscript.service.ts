/**
 * AlephScript Angular Service
 * Reactive wrapper around @alephscript/core-browser using RxJS
 */

import { Injectable, Inject, Optional, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { 
  BehaviorSubject, 
  Observable, 
  Subject, 
  EMPTY, 
  fromEvent,
  merge,
  timer
} from 'rxjs';
import { 
  map, 
  filter, 
  takeUntil, 
  debounceTime, 
  shareReplay, 
  startWith,
  catchError,
  switchMap,
  tap
} from 'rxjs/operators';

import { 
  AlephScriptClient, 
  createAlephScriptClient,
  AlephMessage,
  ConnectionStatus,
  EventMap
} from '@alephscript/core-browser';

import { 
  ALEPH_SCRIPT_CONFIG, 
  AlephScriptAngularConfig,
  DEFAULT_ANGULAR_CONFIG,
  AlephScriptError,
  MessageChannel
} from './types';

@Injectable({
  providedIn: 'root'
})
export class AlephScriptService {
  private client: AlephScriptClient | null = null;
  private destroy$ = new Subject<void>();
  private reconnectionTimer: any = null;

  // Core reactive streams
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>('disconnected');
  private messageStream$ = new Subject<AlephMessage>();
  private errorStream$ = new Subject<AlephScriptError>();
  private isReconnecting$ = new BehaviorSubject<boolean>(false);

  // Channel-specific streams
  private systemMessages$ = new Subject<any>();
  private appMessages$ = new Subject<any>();
  private uiMessages$ = new Subject<any>();
  private agentMessages$ = new Subject<any>();
  private gameMessages$ = new Subject<any>();

  // Configuration
  private config: Required<AlephScriptAngularConfig>;

  // Public observables
  public readonly connectionStatus: Observable<ConnectionStatus>;
  public readonly messages: Observable<AlephMessage>;
  public readonly errors: Observable<AlephScriptError>;
  public readonly isReconnecting: Observable<boolean>;

  // Channel-specific observables
  public readonly systemMessages: Observable<any>;
  public readonly appMessages: Observable<any>;
  public readonly uiMessages: Observable<any>;
  public readonly agentMessages: Observable<any>;
  public readonly gameMessages: Observable<any>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() @Inject(ALEPH_SCRIPT_CONFIG) config?: AlephScriptAngularConfig
  ) {
    // Merge configuration
    this.config = { ...DEFAULT_ANGULAR_CONFIG, ...config };

    // Initialize observables with RxJS configuration
    const { debounceTime: defaultDebounce = 100, bufferTime = 50 } = this.config.rxjs || {};

    this.connectionStatus = this.connectionStatus$.asObservable();
    
    this.messages = this.messageStream$.asObservable().pipe(
      debounceTime(defaultDebounce),
      shareReplay(1)
    );

    this.errors = this.errorStream$.asObservable();
    this.isReconnecting = this.isReconnecting$.asObservable();

    // Channel-specific observables
    this.systemMessages = this.systemMessages$.asObservable().pipe(shareReplay(1));
    this.appMessages = this.appMessages$.asObservable().pipe(shareReplay(1));
    this.uiMessages = this.uiMessages$.asObservable().pipe(shareReplay(1));
    this.agentMessages = this.agentMessages$.asObservable().pipe(shareReplay(1));
    this.gameMessages = this.gameMessages$.asObservable().pipe(shareReplay(1));

    console.log('🔗 AlephScriptService initialized - Angular reactive implementation');
    
    // Setup message distribution pipeline
    this.setupMessagePipeline();
    
    // Setup reconnection handling
    this.setupReconnectionHandler();

    // Auto-connect if configured and in browser
    if (isPlatformBrowser(this.platformId) && this.config.autoConnect) {
      this.connect().catch(error => {
        this.handleError('connection', 'Auto-connection failed', error);
      });
    }
  }

  /**
   * Connect to AlephScript server
   */
  async connect(customConfig?: Partial<AlephScriptAngularConfig>): Promise<void> {
    if (this.client?.isConnected()) {
      console.warn('⚠️ Already connected to AlephScript server');
      return;
    }

    // Handle SSR
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🖥️ Server-side rendering detected, skipping socket connection');
      this.enableFallbackMode();
      return;
    }

    // Merge custom config
    const finalConfig = { ...this.config, ...customConfig };
    
    console.log('📡 Connecting to AlephScript server:', finalConfig.url);
    this.connectionStatus$.next('connecting');

    try {
      // Create client instance
      this.client = createAlephScriptClient(finalConfig);
      
      // Setup event handlers
      this.setupClientEventHandlers();
      
      // Start connection with timeout
      await this.connectWithTimeout(finalConfig.timeout);
      
    } catch (error) {
      this.handleError('connection', 'Failed to connect', error);
      
      if (finalConfig.fallbackMode?.enabled) {
        this.enableFallbackMode();
      }
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from AlephScript server');
    
    this.stopReconnection();
    
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    
    this.connectionStatus$.next('disconnected');
  }

  /**
   * Send message to server
   */
  sendMessage(type: string, data: any): void {
    if (!this.client?.isConnected()) {
      this.handleError('message', 'Cannot send message - not connected');
      return;
    }

    this.client.sendUserInput(data, { type });
  }

  /**
   * Send game action
   */
  sendGameAction(action: string, payload: any): void {
    if (!this.client?.isConnected()) {
      this.handleError('message', 'Cannot send game action - not connected');
      return;
    }

    this.client.sendGameAction(action, payload);
  }

  /**
   * Select agent
   */
  selectAgent(agentIndex: number, reasoning?: string): void {
    if (!this.client?.isConnected()) {
      this.handleError('message', 'Cannot select agent - not connected');
      return;
    }

    this.client.selectAgent(agentIndex, reasoning);
  }

  /**
   * Request agent postulations
   */
  requestPostulations(context?: any): void {
    if (!this.client?.isConnected()) {
      this.handleError('message', 'Cannot request postulations - not connected');
      return;
    }

    this.client.requestPostulations(context);
  }

  /**
   * Get filtered messages by channel
   */
  getMessagesByChannel(channel: MessageChannel): Observable<any> {
    switch (channel) {
      case MessageChannel.SYSTEM:
        return this.systemMessages;
      case MessageChannel.APPLICATION:
        return this.appMessages;
      case MessageChannel.UI:
        return this.uiMessages;
      case MessageChannel.AGENT:
        return this.agentMessages;
      case MessageChannel.GAME:
        return this.gameMessages;
      default:
        return this.messages;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }

  /**
   * Get current status
   */
  getStatus(): {
    connected: boolean;
    status: ConnectionStatus;
    isReconnecting: boolean;
    client: any;
  } {
    return {
      connected: this.isConnected(),
      status: this.connectionStatus$.value,
      isReconnecting: this.isReconnecting$.value,
      client: this.client?.getStatus()
    };
  }

  /**
   * Setup client event handlers
   */
  private setupClientEventHandlers(): void {
    if (!this.client) return;

    console.log('🔧 [ANGULAR-SERVICE] Setting up client event handlers...');

    // Connection events
    this.client.on('connected', () => {
      console.log('✅ Connected to AlephScript server');
      this.connectionStatus$.next('connected');
      this.isReconnecting$.next(false);
      this.stopReconnection();
    });

    this.client.on('disconnected', () => {
      // Only trigger disconnection logic if we're actually disconnected
      if (!this.client?.isConnected()) {
        console.log('🔌 Disconnected from AlephScript server');
        this.connectionStatus$.next('disconnected');
        // Only start reconnection if we're actually disconnected
        if (this.config.reconnection && !this.isReconnecting$.value) {
          this.startReconnection();
        }
      }
    });

    this.client.on('connection_error', (error) => {
      console.error('❌ Connection error:', error);
      this.connectionStatus$.next('error');
      this.handleError('connection', 'Connection error', error);
    });

    // Message events
    this.client.on('message', (message) => {
      console.log('📨 [ANGULAR-SERVICE] Received message event:', message);
      this.messageStream$.next(message);
      this.routeMessageToChannel(message);
    });

    this.client.on('agent_message', (data) => {
      console.log('🤖 [ANGULAR-SERVICE] Received agent_message:', data);
      this.agentMessages$.next(data);
    });

    this.client.on('system_message', (data) => {
      console.log('⚙️ [ANGULAR-SERVICE] Received system_message:', data);
      this.systemMessages$.next(data);
    });

    this.client.on('ui_message', (data) => {
      console.log('🎨 [ANGULAR-SERVICE] Received ui_message:', data);
      this.uiMessages$.next(data);
    });

    this.client.on('game_state_update', (data) => {
      console.log('🎮 [ANGULAR-SERVICE] Received game_state_update:', data);
      this.gameMessages$.next(data);
    });

    // 🚀 NEW: Listen for room events specifically
    // Use 'any' type to bypass TypeScript restrictions for custom events
    (this.client as any).on('LuzbelBot_AS-NG_ROOM', (data: any) => {
      console.log('🏠 [ANGULAR-SERVICE] Received LuzbelBot_AS-NG_ROOM event:', data);
      this.systemMessages$.next(data);
    });

    // 🚀 NEW: Access underlying socket for generic event listening
    const underlyingSocket = (this.client as any).socket;
    if (underlyingSocket && typeof underlyingSocket.onAny === 'function') {
      console.log('🌐 [ANGULAR-SERVICE] Setting up generic socket event listener...');
      underlyingSocket.onAny((event: string, ...args: any[]) => {
        console.log(`🌐 [ANGULAR-SERVICE] Socket event received: ${event}`, args);
        
        // Route room events to systemMessages
        if (event.includes('_ROOM') || event.includes('_AS-NG_')) {
          console.log(`🏠 [ANGULAR-SERVICE] Routing room event ${event} to systemMessages`);
          this.systemMessages$.next(args[0] || args);
        }
      });
    } else {
      console.warn('⚠️ [ANGULAR-SERVICE] Cannot access underlying socket onAny method');
    }

    console.log('✅ [ANGULAR-SERVICE] Client event handlers setup complete');
  }

  /**
   * Setup message distribution pipeline
   */
  private setupMessagePipeline(): void {
    // Combine all message streams for centralized processing
    const allMessages$ = merge(
      this.messages,
      this.systemMessages,
      this.agentMessages,
      this.uiMessages,
      this.gameMessages
    );

    // Setup debugging if enabled
    if (this.config.debug) {
      allMessages$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(message => {
        console.log('📨 Message received:', message);
      });
    }
  }

  /**
   * Setup reconnection handling
   */
  private setupReconnectionHandler(): void {
    // Auto-reconnect on disconnect if enabled
    this.connectionStatus$.pipe(
      filter(status => status === 'disconnected'),
      filter(() => this.config.reconnection),
      // Check if we're actually disconnected before starting reconnection
      filter(() => !this.client?.isConnected()),
      debounceTime(1000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.startReconnection();
    });
  }

  /**
   * Connect with timeout
   */
  private async connectWithTimeout(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      const subscription = this.connectionStatus$.pipe(
        filter(status => status === 'connected' || status === 'error'),
        takeUntil(this.destroy$)
      ).subscribe(status => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        
        if (status === 'connected') {
          resolve();
        } else {
          reject(new Error('Connection failed'));
        }
      });

      // Trigger connection
      this.client?.connect();
    });
  }

  /**
   * Route message to appropriate channel
   */
  private routeMessageToChannel(message: AlephMessage): void {
    // Simple routing based on message type
    switch (message.type) {
      case 'system_message':
      case 'GET_LIST_OF_THREADS':
      case 'SET_DOMAIN_BASE_DATA':
      case 'GET_ENGINE':
        this.systemMessages$.next(message);
        break;
      case 'agent_message':
      case 'agent_postulations':
      case 'agent_selection_result':
        this.agentMessages$.next(message);
        break;
      case 'ui_message':
      case 'notification':
        this.uiMessages$.next(message);
        break;
      case 'game_action':
      case 'game_state_update':
      case 'phase_change':
        this.gameMessages$.next(message);
        break;
      default:
        this.appMessages$.next(message);
    }
  }

  /**
   * Start reconnection process
   */
  private startReconnection(): void {
    // Don't start reconnection if already connected or already reconnecting
    if (!this.config.reconnection || this.isReconnecting$.value || this.client?.isConnected()) {
      if (this.client?.isConnected()) {
        console.log('🔗 Connection already active, skipping reconnection');
        this.connectionStatus$.next('connected');
      }
      return;
    }

    console.log('🔄 Starting reconnection process');
    this.isReconnecting$.next(true);

    let attempts = 0;
    const maxAttempts = this.config.reconnectionAttempts;

    this.reconnectionTimer = setInterval(() => {
      // Double-check if we're already connected before attempting
      if (this.client?.isConnected()) {
        console.log('🔗 Already connected, stopping reconnection');
        this.stopReconnection();
        this.connectionStatus$.next('connected');
        return;
      }

      attempts++;
      console.log(`🔄 Reconnection attempt ${attempts}/${maxAttempts}`);

      if (attempts >= maxAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.stopReconnection();
        this.enableFallbackMode();
        return;
      }

      this.connect().catch(error => {
        console.warn('⚠️ Reconnection attempt failed:', error);
      });
    }, 2000 + (attempts * 1000)); // Exponential backoff
  }

  /**
   * Stop reconnection process
   */
  private stopReconnection(): void {
    if (this.reconnectionTimer) {
      clearInterval(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    this.isReconnecting$.next(false);
  }

  /**
   * Enable fallback mode
   */
  private enableFallbackMode(): void {
    console.log('⚠️ Enabling fallback mode');
    this.connectionStatus$.next('offline');
    this.stopReconnection();
  }

  /**
   * Handle errors
   */
  private handleError(type: AlephScriptError['type'], message: string, originalError?: any): void {
    const error: AlephScriptError = {
      type,
      message,
      originalError,
      timestamp: Date.now()
    };

    console.error(`❌ AlephScript ${type} error:`, message, originalError);
    this.errorStream$.next(error);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 Destroying AlephScriptService');
    
    this.destroy$.next();
    this.destroy$.complete();
    
    this.disconnect();
    
    // Complete all subjects
    this.connectionStatus$.complete();
    this.messageStream$.complete();
    this.errorStream$.complete();
    this.systemMessages$.complete();
    this.appMessages$.complete();
    this.uiMessages$.complete();
    this.agentMessages$.complete();
    this.gameMessages$.complete();
    this.isReconnecting$.complete();
  }
}
