/*
 * Public API Surface of @alephscript/angular
 */

// Core services
export * from './lib/alephscript.service';
export * from './lib/rxjs-socket-bridge.service';

// Module
export * from './lib/alephscript.module';

// Types and interfaces
export * from './lib/types';

// Components
export * from './lib/components';

// Convenience re-exports from core-browser
export { 
  AlephScriptClient,
  SocketClient,
  createAlephScriptClient,
  createAlephScriptClientForUI,
  AlephMessage,
  ConnectionStatus,
  EventMap,
  AlephClientConfig
} from '@alephscript/core-browser';
