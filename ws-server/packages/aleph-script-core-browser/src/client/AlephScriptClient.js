"use strict";
/**
 * AlephScript client with protocol-specific functionality
 * Extends SocketClient with AlephScript-specific features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlephScriptClient = void 0;
const SocketClient_1 = require("./SocketClient");
const utils_1 = require("../utils");
class AlephScriptClient extends SocketClient_1.SocketClient {
    constructor(config = {}) {
        super({
            name: "AlephScriptClient",
            ...config
        });
        this.subscriptions = [];
        this.masterFeatures = [];
        this.setupAlephScriptHandlers();
    }
    /**
     * Setup AlephScript-specific event handlers
     */
    setupAlephScriptHandlers() {
        // Add connection initialization for AlephScript protocol
        this.addInitTrigger(() => {
            this.registerAlephScriptClient();
        });
        // AlephScript specific events
        this.socket?.on("GET_LIST_OF_THREADS", (...args) => {
            this.logger.log("Received GET_LIST_OF_THREADS from:", args[0]?.requesterName);
            this.emit('system_message', {
                type: 'GET_LIST_OF_THREADS',
                data: args[0],
                source: args[0]?.requesterName
            });
        });
        this.socket?.on("SET_DOMAIN_BASE_DATA", (...args) => {
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
        this.socket?.on("SET_MODEL_RPC_DATA", (...args) => {
            const responseData = args[0];
            this.logger.log("SET_MODEL_RPC_DATA received:", responseData);
            this.emit('system_message', {
                type: 'SET_MODEL_RPC_DATA',
                data: responseData
            });
        });
        this.socket?.on("GET_ENGINE", (...args) => {
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
    registerAlephScriptClient() {
        const roomName = this.getRoomName();
        const registerPayload = {
            usuario: this.config.name,
            sesion: (0, utils_1.getHash)("xS")
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
    initializeWithFeatures(features = []) {
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
    run() {
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
    sendUserInput(input, metadata = {}) {
        const message = {
            id: (0, utils_1.generateId)(),
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
    sendGameAction(action, payload = {}) {
        const gameAction = {
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
    selectAgent(agentIndex, reasoning = '') {
        const selection = {
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
    requestPostulations(context = {}) {
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
    sendHeartbeat() {
        this.room('CLIENT_HEARTBEAT', {
            timestamp: Date.now(),
            room: this.getRoomName(),
            uiType: this.config.uiType
        });
    }
    /**
     * Subscribe to a specific event
     */
    subscribe(eventName, handler) {
        this.socket?.on(eventName, handler);
        this.subscriptions.push(eventName);
    }
    /**
     * Broadcast message to room
     */
    broadcast(message) {
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
    disconnect() {
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
    getStatus() {
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
exports.AlephScriptClient = AlephScriptClient;
//# sourceMappingURL=AlephScriptClient.js.map