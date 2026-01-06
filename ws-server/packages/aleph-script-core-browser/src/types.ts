/**
 * Core types for AlephScript Browser Client
 * 
 * RE-EXPORTS from @alephscript/mcp-core-sdk/types/browser
 * This file maintains backwards compatibility while centralizing types.
 * 
 * @module @alephscript/core-browser
 * @since 1.1.0 - Now re-exporting from mcp-core-sdk
 */

// Re-export all browser types from mcp-core-sdk
// Note: In production, these would come from the npm package.
// For monorepo development, we define them inline to avoid circular deps.

// Connection status types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'offline';

// User details interface (browser-specific, simpler than server IUserDetails)
export interface IUserDetails {
  usuario: string;
  sesion: string;
}

// Message interfaces
export interface AlephMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  source?: string;
  target?: string;
}

export interface RoomMessage {
  event: string;
  room: string;
  data: any;
}

// Client configuration
export interface AlephClientConfig {
  name?: string;
  url?: string;
  namespace?: string;
  autoConnect?: boolean;
  debug?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  timeout?: number;
  uiType?: string;
  uiId?: string;
}

// Event handler types
export type EventHandler<T = any> = (data: T) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectionHandler = (status: ConnectionStatus) => void;

// Event map for type safety
export interface EventMap {
  // Connection events
  'connected': { roomName?: string };
  'disconnected': {};
  'connection_error': { error: string };
  'reconnecting': { attempt: number };
  'heartbeat': { timestamp: number };

  // Message events
  'message': AlephMessage;
  'ui_message': any;
  'agent_message': any;
  'system_message': any;
  'notification': any;
  'error_message': any;

  // Game/Agent events
  'agent_postulations': any;
  'agent_selection_result': any;
  'game_state_update': any;
  'phase_change': any;

  // System events
  'room_joined': { room: string };
  'room_left': { room: string };
}

// Gaming-specific types (for extension)
export interface GameAction {
  action: string;
  payload: any;
  timestamp: number;
  room: string;
}

export interface AgentSelection {
  agentIndex: number;
  reasoning?: string;
  timestamp: number;
  room: string;
}

// Utility type for extracting event names
export type EventName = keyof EventMap;

// Hash generation utility type
export interface HashOptions {
  key?: string;
  length?: number;
}

/**
 * NOTE: When publishing as npm package, replace inline definitions with:
 * 
 * export * from '@alephscript/mcp-core-sdk/types/browser';
 * 
 * The inline definitions above are identical to mcp-core-sdk/src/types/browser/index.ts
 * and are kept here for monorepo development without circular dependencies.
 */
