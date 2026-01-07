/**
 * Core types for AlephScript Browser Client
 *
 * RE-EXPORTS from @alephscript/mcp-core-sdk/types/browser
 * All types are centralized in mcp-core-sdk to maintain DRY principle.
 *
 * @module @alephscript/core-browser
 * @since 1.2.0 - Now fully re-exporting from mcp-core-sdk (no duplicates)
 */
export { ConnectionStatus, AlephClientConfig, AlephMessage, RoomMessage, EventHandler, ErrorHandler, ConnectionHandler, EventMap, EventName, GameAction, AgentSelection, HashOptions } from '@alephscript/mcp-core-sdk/types/browser';
export interface IUserDetails {
    usuario: string;
    sesion: string;
}
//# sourceMappingURL=types.d.ts.map