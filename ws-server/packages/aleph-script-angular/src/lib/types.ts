/**
 * Angular-specific types extending core types
 */

import { InjectionToken } from '@angular/core';
import { AlephClientConfig } from '@alephscript/core-browser';

// Injection token for AlephScript configuration
export const ALEPH_SCRIPT_CONFIG = new InjectionToken<AlephScriptAngularConfig>('ALEPH_SCRIPT_CONFIG');

// Angular-specific configuration
export interface AlephScriptAngularConfig extends AlephClientConfig {
  /**
   * Enable SSR support (disable socket connection on server)
   */
  enableSSR?: boolean;
  
  /**
   * Fallback mode configuration
   */
  fallbackMode?: {
    enabled?: boolean;
    timeout?: number;
  };
  
  /**
   * RxJS configuration
   */
  rxjs?: {
    /**
     * Enable automatic subscription management
     */
    autoUnsubscribe?: boolean;
    
    /**
     * Debounce time for frequent events (ms)
     */
    debounceTime?: number;
    
    /**
     * Buffer time for batching events (ms)
     */
    bufferTime?: number;
  };
}

// Default Angular configuration
export const DEFAULT_ANGULAR_CONFIG: Required<AlephScriptAngularConfig> = {
  name: "AngularAlephClient",
  url: "http://localhost:3000",
  namespace: "/runtime",
  autoConnect: true,
  debug: true,
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 10000,
  uiType: "LuzbelBot",
  uiId: "AS-NG",
  enableSSR: true,
  fallbackMode: {
    enabled: true,
    timeout: 5000
  },
  rxjs: {
    autoUnsubscribe: true,
    debounceTime: 100,
    bufferTime: 50
  }
};

// Message channel types for RxJS streams
export enum MessageChannel {
  SYSTEM = 'SYSTEM',
  APPLICATION = 'APPLICATION',
  UI = 'UI',
  AGENT = 'AGENT',
  GAME = 'GAME'
}

// Stream configuration interface
export interface StreamConfig {
  channel: MessageChannel;
  debounceTime?: number;
  bufferTime?: number;
  shareReplay?: boolean;
}

// Error types
export interface AlephScriptError {
  type: 'connection' | 'message' | 'timeout' | 'protocol';
  message: string;
  originalError?: any;
  timestamp: number;
}
