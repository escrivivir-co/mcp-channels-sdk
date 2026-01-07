/**
 * AlephScript client with protocol-specific functionality
 * Extends SocketClient with AlephScript-specific features
 */
import { SocketClient } from './SocketClient';
import { AlephClientConfig } from '../types';
export declare class AlephScriptClient extends SocketClient {
    private subscriptions;
    private masterFeatures;
    constructor(config?: AlephClientConfig);
    /**
     * Setup AlephScript-specific event handlers
     */
    private setupAlephScriptHandlers;
    /**
     * Register as AlephScript client with the server
     */
    private registerAlephScriptClient;
    /**
     * Initialize with specific features
     */
    initializeWithFeatures(features?: string[]): void;
    /**
     * Run the client with bot features
     */
    run(): void;
    /**
     * Send user input message
     */
    sendUserInput(input: string, metadata?: any): void;
    /**
     * Send game action
     */
    sendGameAction(action: string, payload?: any): void;
    /**
     * Select agent
     */
    selectAgent(agentIndex: number, reasoning?: string): void;
    /**
     * Request agent postulations
     */
    requestPostulations(context?: any): void;
    /**
     * Send heartbeat
     */
    sendHeartbeat(): void;
    /**
     * Subscribe to a specific event
     */
    subscribe(eventName: string, handler: (data: any) => void): void;
    /**
     * Broadcast message to room
     */
    broadcast(message: {
        type: string;
        event: string;
        data: any;
        timestamp: number;
    }): void;
    /**
     * Enhanced disconnect with cleanup
     */
    disconnect(): void;
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
    };
}
//# sourceMappingURL=AlephScriptClient.d.ts.map