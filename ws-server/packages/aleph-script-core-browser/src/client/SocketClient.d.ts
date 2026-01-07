/**
 * Base Socket.IO client for AlephScript
 * Framework-agnostic implementation suitable for browser environments
 */
import { Socket } from 'socket.io-client';
import { AlephEventEmitter } from '../events';
import { AlephClientConfig, ConnectionStatus, RoomMessage } from '../types';
import { createLogger } from '../utils';
export declare class SocketClient extends AlephEventEmitter {
    protected socket: Socket | null;
    protected connectionStatus: ConnectionStatus;
    protected initTriggers: (() => void)[];
    protected initTriggersDefinition: (() => void)[];
    protected interval: number | null;
    protected configurationSet: boolean;
    protected logger: ReturnType<typeof createLogger>;
    protected config: Required<AlephClientConfig>;
    constructor(config?: AlephClientConfig);
    /**
     * Initialize socket connection
     */
    protected initialize(): void;
    /**
     * Setup core socket event handlers
     */
    protected setupEventHandlers(): void;
    /**
     * Get connection status
     */
    getConnectionStatus(): ConnectionStatus;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get socket ID
     */
    getSocketId(): string | undefined;
    /**
     * Get room name based on config
     */
    getRoomName(): string;
    /**
     * Send message to a room
     */
    room(event: string, data?: any, room?: string): void;
    /**
     * Send room message with full payload
     */
    roomPayload(payload: RoomMessage): void;
    /**
     * Connect to server
     */
    connect(): void;
    /**
     * Disconnect from server
     */
    disconnect(): void;
    /**
     * Add initialization trigger
     */
    addInitTrigger(trigger: () => void): void;
    /**
     * Destroy client and cleanup
     */
    destroy(): void;
}
//# sourceMappingURL=SocketClient.d.ts.map