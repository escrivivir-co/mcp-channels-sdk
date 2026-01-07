/**
 * Utility functions for AlephScript Browser Client
 */
import { HashOptions } from './types';
/**
 * Generate a session hash
 */
export declare function getHash(key?: string, options?: HashOptions): string;
/**
 * Generate unique ID
 */
export declare function generateId(): string;
/**
 * Check if event should be logged (filter out noisy events)
 */
export declare function isLogable(event: string): boolean;
/**
 * Safe JSON parse with fallback
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
/**
 * Create a debounced function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Create a throttled function
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Check if running in browser environment
 */
export declare function isBrowser(): boolean;
/**
 * Create a logger with prefix
 */
export declare function createLogger(prefix: string, debug?: boolean): {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
};
//# sourceMappingURL=utils.d.ts.map