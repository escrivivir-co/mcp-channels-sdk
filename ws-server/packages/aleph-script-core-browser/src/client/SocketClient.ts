/**
 * Base Socket.IO client for AlephScript
 * Framework-agnostic implementation suitable for browser environments
 */

import { io, Socket } from 'socket.io-client';
import { AlephEventEmitter } from '../events';
import { 
  AlephClientConfig, 
  ConnectionStatus, 
  IUserDetails, 
  RoomMessage 
} from '../types';
import { getHash, isLogable, createLogger } from '../utils';

export class SocketClient extends AlephEventEmitter {
  protected socket: Socket | null = null;
  protected connectionStatus: ConnectionStatus = 'disconnected';
  protected initTriggers: (() => void)[] = [];
  protected initTriggersDefinition: (() => void)[] = [];
  protected interval: number | null = null;
  protected configurationSet = false;
  protected logger: ReturnType<typeof createLogger>;
  
  // Configuration with defaults
  protected config: Required<AlephClientConfig> = {
    name: "AlephClient",
    url: "http://localhost:3000",
    namespace: "/",
    autoConnect: true,
    debug: true,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10000,
    uiType: "browser",
    uiId: "default"
  };

  constructor(config: AlephClientConfig = {}) {
    super();
    
    // Merge with defaults
    this.config = { ...this.config, ...config };
    this.logger = createLogger(this.config.name, this.config.debug);
    
    this.logger.log("Initializing SocketClient with config:", this.config);
    this.initialize();
  }

  /**
   * Initialize socket connection
   */
  protected initialize(): void {
    const { url, namespace, autoConnect, reconnection, reconnectionAttempts, timeout } = this.config;
    
    this.socket = io(url + namespace, { 
      autoConnect,
      reconnection,
      reconnectionAttempts,
      timeout,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.logger.log("Socket initialized, connecting to backend...");
  }

  /**
   * Setup core socket event handlers
   */
  protected setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      this.connectionStatus = 'connected';
      this.logger.log(`Connected: ${this.config.namespace} | Socket ID: ${this.socket?.id} | Init triggers: ${this.initTriggersDefinition.length}`);
      
      this.configurationSet = true;
      this.initTriggers = [...this.initTriggersDefinition];

      // Process initialization triggers
      this.interval = window.setInterval(() => {
        while (this.initTriggers.length > 0) {
          const trigger = this.initTriggers.pop();
          if (trigger) trigger();
        }
      }, 1000);

      // Default registration
      this.socket?.emit("CLIENT_REGISTER", { 
        usuario: this.config.name, 
        sesion: getHash("") 
      } as IUserDetails);
      
      this.socket?.emit("CLIENT_SUSCRIBE", { room: "ENGINE_THREADS" });
      
      this.emit('connected', { roomName: this.getRoomName() });
    });

    this.socket.on("disconnect", () => {
      this.connectionStatus = 'disconnected';
      this.logger.log("Disconnected from server");
      
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      
      this.emit('disconnected', {});
    });

    this.socket.on("connect_error", (error: any) => {
      this.connectionStatus = 'error';
      this.logger.error("Connection error:", error.message);
      this.emit('connection_error', { error: error.message });
    });

    this.socket.on("connect_timeout", () => {
      this.logger.error("Connection timeout");
    });

    this.socket.on("reconnect", (attemptNumber: number) => {
      this.logger.log("Reconnected on attempt:", attemptNumber);
    });

    this.socket.on("reconnect_attempt", (attemptNumber: number) => {
      this.logger.log("Reconnection attempt:", attemptNumber);
      this.emit('reconnecting', { attempt: attemptNumber });
    });

    this.socket.on("reconnect_error", (error: any) => {
      this.logger.error("Reconnection error:", error);
    });

    this.socket.on("ping", () => {
      if (this.config.debug) {
        this.logger.log("Ping sent to server");
      }
    });

    this.socket.on("pong", (latency: number) => {
      if (this.config.debug) {
        this.logger.log("Pong received, latency:", latency);
      }
    });

    // Room events
    this.socket.on("room_joined", (...args: any[]) => {
      this.logger.log("Room joined:", args);
      this.emit('room_joined', { room: args[0]?.room || 'unknown' });
    });

    this.socket.on("room_left", (...args: any[]) => {
      this.logger.log("Room left:", args);
      this.emit('room_left', { room: args[0]?.room || 'unknown' });
    });

    // Catch-all for other events
    this.socket.onAny((event: string, ...args: any[]) => {
      // 🔍 DEBUG: Log all events regardless of filters
      console.log(`🔥 [SOCKET-CLIENT] Raw event received: ${event}`, args);
      console.log(`🔍 [SOCKET-CLIENT] isLogable(${event}):`, isLogable(event));
      console.log(`🔍 [SOCKET-CLIENT] hasListeners(${event}):`, this.hasListeners(event as any));
      
      if (!isLogable(event)) {
        console.log(`⚠️ [SOCKET-CLIENT] Event ${event} filtered out by isLogable`);
        return;
      }
      
      this.logger.log(`Event received: ${event}`, args);
      
      // 🚀 FORCE EMIT: Always emit room events regardless of listeners
      if (event.includes('_ROOM') || event === 'LuzbelBot_AS-NG_ROOM') {
        console.log(`🚀 [SOCKET-CLIENT] Force emitting room event: ${event}`);
        this.emit(event as any, args[0] || {});
        return;
      }
      
      // Forward to custom event handlers
      if (this.hasListeners(event as any)) {
        console.log(`✅ [SOCKET-CLIENT] Emitting event with listeners: ${event}`);
        this.emit(event as any, args[0] || {});
      } else {
        console.log(`⚠️ [SOCKET-CLIENT] No listeners for event: ${event}`);
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Get room name based on config
   */
  getRoomName(): string {
    return `${this.config.uiType}_${this.config.uiId}_ROOM`;
  }

  /**
   * Send message to a room
   */
  room(event: string, data: any = {}, room: string = "ENGINE_THREADS"): void {
    if (!this.isConnected()) {
      this.logger.warn("Cannot send room message - not connected");
      return;
    }

    const payload: RoomMessage = { event, room, data };
    this.socket?.emit("ROOM_MESSAGE", payload);
    
    if (this.config.debug && event !== "SET_EXECUTION_PROCESS") {
      this.logger.log("Room message sent:", { event, room, data });
    }
  }

  /**
   * Send room message with full payload
   */
  roomPayload(payload: RoomMessage): void {
    if (!this.isConnected()) {
      this.logger.warn("Cannot send room payload - not connected");
      return;
    }

    this.socket?.emit("ROOM_MESSAGE", payload);
  }

  /**
   * Connect to server
   */
  connect(): void {
    if (this.socket?.connected) {
      this.logger.warn("Already connected");
      return;
    }
    
    this.connectionStatus = 'connecting';
    this.socket?.connect();
    this.logger.log("Connecting...");
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    this.socket?.disconnect();
    this.connectionStatus = 'disconnected';
    this.logger.log("Disconnected");
  }

  /**
   * Add initialization trigger
   */
  addInitTrigger(trigger: () => void): void {
    this.initTriggersDefinition.push(trigger);
  }

  /**
   * Destroy client and cleanup
   */
  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
    this.socket = null;
    this.logger.log("Client destroyed");
  }
}
