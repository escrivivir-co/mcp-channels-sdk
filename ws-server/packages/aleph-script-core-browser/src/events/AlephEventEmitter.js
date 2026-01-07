"use strict";
/**
 * Type-safe event emitter for AlephScript clients
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlephEventEmitter = void 0;
class AlephEventEmitter {
    constructor() {
        this.handlers = new Map();
    }
    /**
     * Register an event handler
     */
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
    }
    /**
     * Register a one-time event handler
     */
    once(event, handler) {
        const onceHandler = (data) => {
            handler(data);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }
    /**
     * Remove an event handler
     */
    off(event, handler) {
        const handlers = this.handlers.get(event);
        if (!handlers)
            return;
        if (!handler) {
            // Remove all handlers for this event
            this.handlers.delete(event);
            return;
        }
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
            if (handlers.length === 0) {
                this.handlers.delete(event);
            }
        }
    }
    /**
     * Emit an event to all registered handlers
     */
    emit(event, data) {
        const handlers = this.handlers.get(event);
        if (!handlers)
            return;
        // Create a copy to avoid issues if handlers are modified during iteration
        const handlersCopy = [...handlers];
        handlersCopy.forEach(handler => {
            try {
                handler(data);
            }
            catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    }
    /**
     * Get the number of handlers for an event
     */
    listenerCount(event) {
        const handlers = this.handlers.get(event);
        return handlers ? handlers.length : 0;
    }
    /**
     * Get all registered event names
     */
    eventNames() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Remove all event handlers
     */
    removeAllListeners(event) {
        if (event) {
            this.handlers.delete(event);
        }
        else {
            this.handlers.clear();
        }
    }
    /**
     * Check if there are any handlers for an event
     */
    hasListeners(event) {
        return this.listenerCount(event) > 0;
    }
}
exports.AlephEventEmitter = AlephEventEmitter;
//# sourceMappingURL=AlephEventEmitter.js.map