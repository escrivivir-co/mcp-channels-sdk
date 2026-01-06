/**
 * @alephscript/core-browser
 * Universal browser client for AlephScript - framework agnostic socket.io wrapper
 */

// Core exports
export * from './types';
export * from './utils';
export * from './events';
export * from './client';

// Factory function for easy instantiation
import { AlephScriptClient } from './client/AlephScriptClient';
import { AlephClientConfig } from './types';

/**
 * Create AlephScript client instance
 */
export function createAlephScriptClient(config: AlephClientConfig = {}): AlephScriptClient {
  return new AlephScriptClient(config);
}

/**
 * Create AlephScript client for specific UI type
 */
export function createAlephScriptClientForUI(
  uiType: string, 
  uiId: string, 
  serverUrl: string = 'http://localhost:3000', 
  options: Partial<AlephClientConfig> = {}
): AlephScriptClient {
  return new AlephScriptClient({
    uiType,
    uiId,
    url: serverUrl,
    debug: true, // Enable debug by default
    ...options
  });
}

// Re-export main classes for direct usage
export { AlephScriptClient, SocketClient } from './client';
export { AlephEventEmitter } from './events';
