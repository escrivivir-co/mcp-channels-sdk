/**
 * AlephScript client with protocol-specific functionality
 * Extends SocketClient with AlephScript-specific features
 */

import { SocketClient } from './SocketClient';
import { 
  AlephClientConfig, 
  IUserDetails, 
  GameAction, 
  AgentSelection,
  AlephMessage 
} from '../types';
import { getHash, generateId } from '../utils';

export class AlephScriptClient extends SocketClient {
  private subscriptions: string[] = [];
  private masterFeatures: string[] = [];

  constructor(config: AlephClientConfig = {}) {
    super({
      name: "AlephScriptClient",
      ...config
    });
    
    this.setupAlephScriptHandlers();
  }

  /**
   * Setup AlephScript-specific event handlers
   */
  private setupAlephScriptHandlers(): void {
    // Add connection initialization for AlephScript protocol
    this.addInitTrigger(() => {
      this.registerAlephScriptClient();
    });

    // AlephScript specific events
    this.socket?.on("GET_LIST_OF_THREADS", (...args: any[]) => {
      this.logger.log("Received GET_LIST_OF_THREADS from:", args[0]?.requesterName);
      this.emit('system_message', {
        type: 'GET_LIST_OF_THREADS',
        data: args[0],
        source: args[0]?.requesterName
      });
    });

    this.socket?.on("SET_DOMAIN_BASE_DATA", (...args: any[]) => {
      const responseData = args[0];
      this.logger.log("SET_DOMAIN_BASE_DATA received for engine:", responseData?.action);
      
      if (responseData?.action === "SET_DATA") {
        this.logger.log("Engine data set:", responseData.blob);
      }
      
      this.emit('system_message', {
        type: 'SET_DOMAIN_BASE_DATA',
        data: responseData
      });
    });

    this.socket?.on("SET_MODEL_RPC_DATA", (...args: any[]) => {
      const responseData = args[0];
      this.logger.log("SET_MODEL_RPC_DATA received:", responseData);
      this.emit('system_message', {
        type: 'SET_MODEL_RPC_DATA',
        data: responseData
      });
    });

    this.socket?.on("GET_ENGINE", (...args: any[]) => {
      const responseData = args[0];
      this.logger.log("GET_ENGINE request received:", responseData);
      this.emit('system_message', {
        type: 'GET_ENGINE',
        data: responseData
      });
    });
  }

  /**
   * Register as AlephScript client with the server
   */
  private registerAlephScriptClient(): void {
    const roomName = this.getRoomName();
    const registerPayload: IUserDetails = {
      usuario: this.config.name,
      sesion: getHash("xS")
    };

    // Register client
    this.socket?.emit("CLIENT_REGISTER", registerPayload);
    
    // Subscribe to room
    this.socket?.emit("CLIENT_SUSCRIBE", { room: roomName });
    
    // Make master with default features
    this.room("MAKE_MASTER", { features: this.masterFeatures }, roomName);
    
    this.logger.log("AlephScript client registered and subscribed to room:", roomName);
  }

  /**
   * Initialize with specific features
   */
  initializeWithFeatures(features: string[] = []): void {
    this.masterFeatures = [...features];
    
    // Core AlephScript features
    const coreFeatures = ["GET_LIST_OF_THREADS", "GET_ENGINE"];
    this.room("MAKE_MASTER", { features: coreFeatures }, "IDE-app");
    
    // Custom features
    if (features.length > 0) {
      this.room("MAKE_MASTER", { features }, this.getRoomName());
    }
  }

  /**
   * Run the client with bot features
   */
  run(): void {
    // Initialize with kick-as-bot features
    this.initializeWithFeatures(["kick-as-bot-feature-1"]);
    
    // Clean up previous subscriptions
    this.subscriptions.forEach(eventName => {
      this.socket?.off(eventName);
    });
    this.subscriptions = [];

    this.logger.log("AlephScript client running with bot features");
  }

  /**
   * Send user input message
   */
  sendUserInput(input: string, metadata: any = {}): void {
    const message: AlephMessage = {
      id: generateId(),
      type: 'user_input',
      data: { input, metadata },
      timestamp: Date.now()
    };
    console.log("SOCKET-GYM-WS-SERVE-CORE-BROWSER-CLIENT", "sendUserInput");
    this.room('USER_INPUT', message);
    this.emit('message', message);
  }

  /**
   * Send game action
   */
  sendGameAction(action: string, payload: any = {}): void {
    const gameAction: GameAction = {
      action,
      payload,
      timestamp: Date.now(),
      room: this.getRoomName()
    };

    this.room('GAME_ACTION', gameAction);
    this.logger.log("Game action sent:", action);
  }

  /**
   * Select agent
   */
  selectAgent(agentIndex: number, reasoning: string = ''): void {
    const selection: AgentSelection = {
      agentIndex,
      reasoning,
      timestamp: Date.now(),
      room: this.getRoomName()
    };

    this.room('AGENT_SELECTION', selection);
    this.logger.log("Agent selected:", agentIndex);
  }

  /**
   * Request agent postulations
   */
  requestPostulations(context: any = {}): void {
    this.room('REQUEST_POSTULATIONS', {
      context,
      timestamp: Date.now(),
      room: this.getRoomName()
    });
    this.logger.log("Agent postulations requested");
  }

  /**
   * Send heartbeat
   */
  sendHeartbeat(): void {
    this.room('CLIENT_HEARTBEAT', {
      timestamp: Date.now(),
      room: this.getRoomName(),
      uiType: this.config.uiType
    });
  }

  /**
   * Subscribe to a specific event
   */
  subscribe(eventName: string, handler: (data: any) => void): void {
    this.socket?.on(eventName, handler);
    this.subscriptions.push(eventName);
  }

  /**
   * Broadcast message to room
   */
  broadcast(message: {
    type: string;
    event: string;
    data: any;
    timestamp: number;
  }): void {
    this.room(message.event, {
      type: message.type,
      data: message.data,
      timestamp: message.timestamp
    });
    this.logger.log("Message broadcasted:", message.type);
  }

  /**
   * Enhanced disconnect with cleanup
   */
  disconnect(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(eventName => {
      this.socket?.off(eventName);
    });
    this.subscriptions = [];
    this.masterFeatures = [];
    
    super.disconnect();
  }

  /**
   * Get client status
   */
  getStatus(): {
    connected: boolean;
    roomName: string;
    subscriptions: string[];
    features: string[];
    uiType: string;
    uiId: string;
  } {
    return {
      connected: this.isConnected(),
      roomName: this.getRoomName(),
      subscriptions: [...this.subscriptions],
      features: [...this.masterFeatures],
      uiType: this.config.uiType,
      uiId: this.config.uiId
    };
  }
}
