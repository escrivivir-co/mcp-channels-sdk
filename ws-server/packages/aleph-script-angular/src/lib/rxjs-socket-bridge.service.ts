/**
 * RxJS Socket Bridge for AlephScript
 * Advanced reactive integration with channel-based message routing
 */

import { Injectable, OnDestroy } from '@angular/core';
import { 
  BehaviorSubject, 
  Subject, 
  Observable, 
  combineLatest,
  merge,
  timer,
  EMPTY
} from 'rxjs';
import { 
  filter, 
  map, 
  takeUntil, 
  debounceTime, 
  throttleTime,
  shareReplay, 
  startWith,
  switchMap,
  catchError,
  scan,
  distinctUntilChanged
} from 'rxjs/operators';

import { 
  AlephScriptClient,
  AlephMessage,
  ConnectionStatus 
} from '@alephscript/core-browser';

import { 
  MessageChannel, 
  StreamConfig, 
  AlephScriptError 
} from './types';

export interface ChannelMessage {
  channel: MessageChannel;
  message: AlephMessage;
  timestamp: number;
}

export interface BridgeStats {
  totalMessages: number;
  messagesByChannel: Record<MessageChannel, number>;
  connectionUptime: number;
  lastMessageTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class RxjsSocketBridge implements OnDestroy {
  private client: AlephScriptClient | null = null;
  private destroy$ = new Subject<void>();
  
  // Core subjects for reactive streams
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>('disconnected');
  private messageStream$ = new Subject<ChannelMessage>();
  private errorStream$ = new Subject<AlephScriptError>();
  private bridgeEvents$ = new Subject<any>();
  private isReconnecting$ = new BehaviorSubject<boolean>(false);
  
  // Channel-specific streams
  private sysChannel$ = new Subject<AlephMessage>();
  private appChannel$ = new Subject<AlephMessage>();
  private uiChannel$ = new Subject<AlephMessage>();
  private agentChannel$ = new Subject<AlephMessage>();
  private gameChannel$ = new Subject<AlephMessage>();
  
  // Stats tracking
  private stats$ = new BehaviorSubject<BridgeStats>({
    totalMessages: 0,
    messagesByChannel: {
      [MessageChannel.SYSTEM]: 0,
      [MessageChannel.APPLICATION]: 0,
      [MessageChannel.UI]: 0,
      [MessageChannel.AGENT]: 0,
      [MessageChannel.GAME]: 0
    },
    connectionUptime: 0,
    lastMessageTime: 0
  });

  // Public observables
  public readonly connectionStatus: Observable<ConnectionStatus>;
  public readonly messages: Observable<ChannelMessage>;
  public readonly errors: Observable<AlephScriptError>;
  public readonly events: Observable<any>;
  public readonly isReconnecting: Observable<boolean>;
  public readonly stats: Observable<BridgeStats>;
  
  // Channel-specific observables
  public readonly sysMessages: Observable<AlephMessage>;
  public readonly appMessages: Observable<AlephMessage>;
  public readonly uiMessages: Observable<AlephMessage>;
  public readonly agentMessages: Observable<AlephMessage>;
  public readonly gameMessages: Observable<AlephMessage>;

  constructor() {
    // Initialize observables with advanced RxJS operators
    this.connectionStatus = this.connectionStatus$.asObservable().pipe(
      distinctUntilChanged(),
      shareReplay(1)
    );
    
    this.messages = this.messageStream$.asObservable().pipe(
      shareReplay(1)
    );
    
    this.errors = this.errorStream$.asObservable();
    this.events = this.bridgeEvents$.asObservable();
    this.isReconnecting = this.isReconnecting$.asObservable();
    this.stats = this.stats$.asObservable();
    
    // Channel-specific observables with replay
    this.sysMessages = this.sysChannel$.asObservable().pipe(shareReplay(1));
    this.appMessages = this.appChannel$.asObservable().pipe(shareReplay(1));
    this.uiMessages = this.uiChannel$.asObservable().pipe(shareReplay(1));
    this.agentMessages = this.agentChannel$.asObservable().pipe(shareReplay(1));
    this.gameMessages = this.gameChannel$.asObservable().pipe(shareReplay(1));

    console.log('🔗 RxjsSocketBridge initialized with AlephScript');
    
    // Set up message distribution pipeline
    this.setupMessagePipeline();
    
    // Set up reconnection handling
    this.setupReconnectionHandler();
    
    // Set up stats tracking
    this.setupStatsTracking();
  }

  /**
   * Initialize bridge with AlephScript client
   */
  initialize(client: AlephScriptClient): void {
    if (this.client) {
      console.warn('⚠️ Bridge already initialized');
      return;
    }

    this.client = client;
    this.setupClientEventBindings();
    console.log('✅ RxjsSocketBridge initialized with client');
  }

  /**
   * Create filtered stream for specific message types
   */
  createFilteredStream<T = AlephMessage>(
    config: StreamConfig & { 
      filter: (message: AlephMessage) => boolean;
      map?: (message: AlephMessage) => T;
    }
  ): Observable<T> {
    const baseStream = this.getChannelStream(config.channel);
    
    let stream: Observable<AlephMessage> = baseStream.pipe(
      filter(config.filter),
      takeUntil(this.destroy$)
    );

    // Apply debouncing if configured
    if (config.debounceTime) {
      stream = stream.pipe(debounceTime(config.debounceTime));
    }

    // Apply mapping if provided
    if (config.map) {
      const mappedStream = stream.pipe(map(config.map));
      
      // Apply replay if configured
      if (config.shareReplay) {
        return mappedStream.pipe(shareReplay(1));
      }
      
      return mappedStream;
    }

    // Apply replay if configured
    if (config.shareReplay) {
      stream = stream.pipe(shareReplay(1));
    }

    return stream as Observable<T>;
  }

  /**
   * Create throttled stream for high-frequency events
   */
  createThrottledStream<T = any>(
    channel: MessageChannel,
    throttleMs: number = 100,
    leading: boolean = true
  ): Observable<AlephMessage> {
    return this.getChannelStream(channel).pipe(
      throttleTime(throttleMs, undefined, { leading, trailing: !leading }),
      takeUntil(this.destroy$),
      shareReplay(1)
    );
  }

  /**
   * Create buffered stream for batching events
   */
  createBufferedStream(
    channel: MessageChannel,
    bufferTime: number = 1000
  ): Observable<AlephMessage[]> {
    return timer(0, bufferTime).pipe(
      switchMap(() => this.getChannelStream(channel).pipe(
        scan((acc: AlephMessage[], curr) => [...acc, curr], []),
        filter(buffer => buffer.length > 0)
      )),
      takeUntil(this.destroy$),
      shareReplay(1)
    );
  }

  /**
   * Send message through the bridge
   */
  sendMessage(channel: MessageChannel, data: any): void {
    if (!this.client?.isConnected()) {
      this.emitError('message', 'Cannot send message - not connected');
      return;
    }

    try {
      switch (channel) {
        case MessageChannel.GAME:
          if (data.action) {
            this.client.sendGameAction(data.action, data.payload);
          }
          break;
        case MessageChannel.AGENT:
          if (data.type === 'selection') {
            this.client.selectAgent(data.agentIndex, data.reasoning);
          } else if (data.type === 'postulations') {
            this.client.requestPostulations(data.context);
          }
          break;
        default:
          this.client.sendUserInput(data.message || data, { channel });
      }
    } catch (error) {
      this.emitError('message', 'Failed to send message', error);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): Observable<{
    isConnected: boolean;
    uptime: number;
    messageCount: number;
    lastActivity: number;
  }> {
    return combineLatest([
      this.connectionStatus,
      this.stats
    ]).pipe(
      map(([status, stats]) => ({
        isConnected: status === 'connected',
        uptime: stats.connectionUptime,
        messageCount: stats.totalMessages,
        lastActivity: stats.lastMessageTime
      }))
    );
  }

  /**
   * Get channel stream
   */
  private getChannelStream(channel: MessageChannel): Observable<AlephMessage> {
    switch (channel) {
      case MessageChannel.SYSTEM:
        return this.sysMessages;
      case MessageChannel.APPLICATION:
        return this.appMessages;
      case MessageChannel.UI:
        return this.uiMessages;
      case MessageChannel.AGENT:
        return this.agentMessages;
      case MessageChannel.GAME:
        return this.gameMessages;
      default:
        return merge(
          this.sysMessages,
          this.appMessages,
          this.uiMessages,
          this.agentMessages,
          this.gameMessages
        );
    }
  }

  /**
   * Setup client event bindings
   */
  private setupClientEventBindings(): void {
    if (!this.client) return;

    // Connection events
    this.client.on('connected', () => {
      this.connectionStatus$.next('connected');
      this.bridgeEvents$.next({ type: 'connected', timestamp: Date.now() });
    });

    this.client.on('disconnected', () => {
      this.connectionStatus$.next('disconnected');
      this.bridgeEvents$.next({ type: 'disconnected', timestamp: Date.now() });
    });

    this.client.on('connection_error', (error) => {
      this.connectionStatus$.next('error');
      this.emitError('connection', 'Connection error', error);
    });

    // Message events
    this.client.on('message', (message) => {
      this.routeMessage(message);
    });

    this.client.on('system_message', (data) => {
      this.sysChannel$.next(this.wrapMessage('system_message', data));
    });

    this.client.on('agent_message', (data) => {
      this.agentChannel$.next(this.wrapMessage('agent_message', data));
    });

    this.client.on('ui_message', (data) => {
      this.uiChannel$.next(this.wrapMessage('ui_message', data));
    });

    this.client.on('game_state_update', (data) => {
      this.gameChannel$.next(this.wrapMessage('game_state_update', data));
    });
  }

  /**
   * Setup message distribution pipeline
   */
  private setupMessagePipeline(): void {
    // Log all messages if debugging is enabled
    this.messages.pipe(
      takeUntil(this.destroy$)
    ).subscribe((channelMessage) => {
      console.log('📨 Bridge message:', channelMessage);
    });
  }

  /**
   * Setup reconnection handling
   */
  private setupReconnectionHandler(): void {
    // Monitor connection status for reconnection logic
    this.connectionStatus.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((status) => {
      if (status === 'disconnected') {
        // Could trigger reconnection logic here
        this.bridgeEvents$.next({ type: 'reconnection_needed', timestamp: Date.now() });
      }
    });
  }

  /**
   * Setup stats tracking
   */
  private setupStatsTracking(): void {
    // Track message counts by channel
    this.messages.pipe(
      takeUntil(this.destroy$)
    ).subscribe((channelMessage) => {
      const currentStats = this.stats$.value;
      const newStats: BridgeStats = {
        ...currentStats,
        totalMessages: currentStats.totalMessages + 1,
        messagesByChannel: {
          ...currentStats.messagesByChannel,
          [channelMessage.channel]: currentStats.messagesByChannel[channelMessage.channel] + 1
        },
        lastMessageTime: Date.now()
      };
      
      this.stats$.next(newStats);
    });

    // Track connection uptime
    this.connectionStatus.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((status) => {
      if (status === 'connected') {
        // Start uptime tracking
        timer(0, 1000).pipe(
          takeUntil(this.connectionStatus.pipe(filter(s => s !== 'connected'))),
          takeUntil(this.destroy$)
        ).subscribe((seconds) => {
          const currentStats = this.stats$.value;
          this.stats$.next({
            ...currentStats,
            connectionUptime: seconds * 1000
          });
        });
      }
    });
  }

  /**
   * Route message to appropriate channel
   */
  private routeMessage(message: AlephMessage): void {
    let channel: MessageChannel;
    
    // Determine channel based on message type
    if (this.isSystemMessage(message)) {
      channel = MessageChannel.SYSTEM;
      this.sysChannel$.next(message);
    } else if (this.isAgentMessage(message)) {
      channel = MessageChannel.AGENT;
      this.agentChannel$.next(message);
    } else if (this.isGameMessage(message)) {
      channel = MessageChannel.GAME;
      this.gameChannel$.next(message);
    } else if (this.isUIMessage(message)) {
      channel = MessageChannel.UI;
      this.uiChannel$.next(message);
    } else {
      channel = MessageChannel.APPLICATION;
      this.appChannel$.next(message);
    }

    // Emit to main stream
    this.messageStream$.next({
      channel,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Message type detection helpers
   */
  private isSystemMessage(message: AlephMessage): boolean {
    return ['system_message', 'GET_LIST_OF_THREADS', 'SET_DOMAIN_BASE_DATA', 'GET_ENGINE'].includes(message.type);
  }

  private isAgentMessage(message: AlephMessage): boolean {
    return ['agent_message', 'agent_postulations', 'agent_selection_result'].includes(message.type);
  }

  private isGameMessage(message: AlephMessage): boolean {
    return ['game_action', 'game_state_update', 'phase_change'].includes(message.type);
  }

  private isUIMessage(message: AlephMessage): boolean {
    return ['ui_message', 'notification', 'error_message'].includes(message.type);
  }

  /**
   * Wrap data in message format
   */
  private wrapMessage(type: string, data: any): AlephMessage {
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Emit error
   */
  private emitError(type: AlephScriptError['type'], message: string, originalError?: any): void {
    const error: AlephScriptError = {
      type,
      message,
      originalError,
      timestamp: Date.now()
    };
    
    this.errorStream$.next(error);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 Disposing RxjsSocketBridge');
    
    this.destroy$.next();
    this.destroy$.complete();
    
    // Complete all subjects
    this.connectionStatus$.complete();
    this.messageStream$.complete();
    this.errorStream$.complete();
    this.bridgeEvents$.complete();
    this.sysChannel$.complete();
    this.appChannel$.complete();
    this.uiChannel$.complete();
    this.agentChannel$.complete();
    this.gameChannel$.complete();
    this.isReconnecting$.complete();
    this.stats$.complete();
  }
}
