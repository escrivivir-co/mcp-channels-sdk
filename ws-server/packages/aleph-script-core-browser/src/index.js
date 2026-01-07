"use strict";
/**
 * @alephscript/core-browser
 * Universal browser client for AlephScript - framework agnostic socket.io wrapper
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlephEventEmitter = exports.SocketClient = exports.AlephScriptClient = void 0;
exports.createAlephScriptClient = createAlephScriptClient;
exports.createAlephScriptClientForUI = createAlephScriptClientForUI;
// Core exports
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./events"), exports);
__exportStar(require("./client"), exports);
// Factory function for easy instantiation
const AlephScriptClient_1 = require("./client/AlephScriptClient");
/**
 * Create AlephScript client instance
 */
function createAlephScriptClient(config = {}) {
    return new AlephScriptClient_1.AlephScriptClient(config);
}
/**
 * Create AlephScript client for specific UI type
 */
function createAlephScriptClientForUI(uiType, uiId, serverUrl = 'http://localhost:3000', options = {}) {
    return new AlephScriptClient_1.AlephScriptClient({
        uiType,
        uiId,
        url: serverUrl,
        debug: true, // Enable debug by default
        ...options
    });
}
// Re-export main classes for direct usage
var client_1 = require("./client");
Object.defineProperty(exports, "AlephScriptClient", { enumerable: true, get: function () { return client_1.AlephScriptClient; } });
Object.defineProperty(exports, "SocketClient", { enumerable: true, get: function () { return client_1.SocketClient; } });
var events_1 = require("./events");
Object.defineProperty(exports, "AlephEventEmitter", { enumerable: true, get: function () { return events_1.AlephEventEmitter; } });
//# sourceMappingURL=index.js.map