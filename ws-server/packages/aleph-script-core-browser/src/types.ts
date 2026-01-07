/**
 * Core types for AlephScript Browser Client
 * 
 * RE-EXPORTS from @alephscript/mcp-core-sdk/types/browser
 * All types are centralized in mcp-core-sdk to maintain DRY principle.
 * 
 * @module @alephscript/core-browser
 * @since 1.2.0 - Now fully re-exporting from mcp-core-sdk (no duplicates)
 */

// Re-export all browser types from mcp-core-sdk
// In monorepo: uses relative path. In npm: uses package import.
export {
  // Connection types
  ConnectionStatus,
  AlephClientConfig,
  
  // Message types
  AlephMessage,
  RoomMessage,
  
  // Event handler types
  EventHandler,
  ErrorHandler,
  ConnectionHandler,
  
  // Event map
  EventMap,
  EventName,
  
  // Gaming types
  GameAction,
  AgentSelection,
  
  // Utility types
  HashOptions
} from '@alephscript/mcp-core-sdk/types/browser';

// Browser-specific extensions (not in core-sdk)
export interface IUserDetails {
  usuario: string;
  sesion: string;
}

