/**
 * @alephscript/core-browser
 * Universal browser client for AlephScript - framework agnostic socket.io wrapper
 */
export * from './types';
export * from './utils';
export * from './events';
export * from './client';
import { AlephScriptClient } from './client/AlephScriptClient';
import { AlephClientConfig } from './types';
/**
 * Create AlephScript client instance
 */
export declare function createAlephScriptClient(config?: AlephClientConfig): AlephScriptClient;
/**
 * Create AlephScript client for specific UI type
 */
export declare function createAlephScriptClientForUI(uiType: string, uiId: string, serverUrl?: string, options?: Partial<AlephClientConfig>): AlephScriptClient;
export { AlephScriptClient, SocketClient } from './client';
export { AlephEventEmitter } from './events';
//# sourceMappingURL=index.d.ts.map