/**
 * Type-safe event emitter for AlephScript clients
 */
import { EventMap, EventName, EventHandler } from '../types';
export declare class AlephEventEmitter {
    private handlers;
    /**
     * Register an event handler
     */
    on<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): void;
    /**
     * Register a one-time event handler
     */
    once<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): void;
    /**
     * Remove an event handler
     */
    off<K extends EventName>(event: K, handler?: EventHandler<EventMap[K]>): void;
    /**
     * Emit an event to all registered handlers
     */
    emit<K extends EventName>(event: K, data: EventMap[K]): void;
    /**
     * Get the number of handlers for an event
     */
    listenerCount(event: EventName): number;
    /**
     * Get all registered event names
     */
    eventNames(): EventName[];
    /**
     * Remove all event handlers
     */
    removeAllListeners(event?: EventName): void;
    /**
     * Check if there are any handlers for an event
     */
    hasListeners(event: EventName): boolean;
}
//# sourceMappingURL=AlephEventEmitter.d.ts.map