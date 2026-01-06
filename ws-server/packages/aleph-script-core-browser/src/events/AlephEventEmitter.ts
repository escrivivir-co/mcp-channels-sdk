/**
 * Type-safe event emitter for AlephScript clients
 */

import { EventMap, EventName, EventHandler } from '../types';

export class AlephEventEmitter {
  private handlers = new Map<string, EventHandler[]>();

  /**
   * Register an event handler
   */
  on<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler as EventHandler);
  }

  /**
   * Register a one-time event handler
   */
  once<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): void {
    const onceHandler = (data: EventMap[K]) => {
      handler(data);
      this.off(event, onceHandler as EventHandler<EventMap[K]>);
    };
    this.on(event, onceHandler);
  }

  /**
   * Remove an event handler
   */
  off<K extends EventName>(event: K, handler?: EventHandler<EventMap[K]>): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    if (!handler) {
      // Remove all handlers for this event
      this.handlers.delete(event);
      return;
    }

    const index = handlers.indexOf(handler as EventHandler);
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
  emit<K extends EventName>(event: K, data: EventMap[K]): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Create a copy to avoid issues if handlers are modified during iteration
    const handlersCopy = [...handlers];
    
    handlersCopy.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  /**
   * Get the number of handlers for an event
   */
  listenerCount(event: EventName): number {
    const handlers = this.handlers.get(event);
    return handlers ? handlers.length : 0;
  }

  /**
   * Get all registered event names
   */
  eventNames(): EventName[] {
    return Array.from(this.handlers.keys()) as EventName[];
  }

  /**
   * Remove all event handlers
   */
  removeAllListeners(event?: EventName): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Check if there are any handlers for an event
   */
  hasListeners(event: EventName): boolean {
    return this.listenerCount(event) > 0;
  }
}
