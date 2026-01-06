/**
 * Utility functions for AlephScript Browser Client
 */

import { HashOptions } from './types';

/**
 * Generate a session hash
 */
export function getHash(key: string = '', options: HashOptions = {}): string {
  const { length = 2 } = options;
  const l = (s: string) => s.substring(s.length - length);
  const a = new Date().getTime().toString();
  const b = Math.random().toString();
  return key + ">" + l(a) + l(b);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Check if event should be logged (filter out noisy events)
 */
export function isLogable(event: string): boolean {
  const noisyEvents = ['ping', 'pong', 'heartbeat', 'heartbeat_response'];
  return !noisyEvents.includes(event.toLowerCase());
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Create a logger with prefix
 */
export function createLogger(prefix: string, debug: boolean = true) {
  return {
    log: (...args: any[]) => {
      if (debug) {
        console.log(`[${prefix}]`, ...args);
      }
    },
    warn: (...args: any[]) => {
      if (debug) {
        console.warn(`[${prefix}]`, ...args);
      }
    },
    error: (...args: any[]) => {
      console.error(`[${prefix}]`, ...args);
    }
  };
}
