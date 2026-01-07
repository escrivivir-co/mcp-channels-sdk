"use strict";
/**
 * Utility functions for AlephScript Browser Client
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHash = getHash;
exports.generateId = generateId;
exports.isLogable = isLogable;
exports.safeJsonParse = safeJsonParse;
exports.debounce = debounce;
exports.throttle = throttle;
exports.isBrowser = isBrowser;
exports.createLogger = createLogger;
/**
 * Generate a session hash
 */
function getHash(key = '', options = {}) {
    const { length = 2 } = options;
    const l = (s) => s.substring(s.length - length);
    const a = new Date().getTime().toString();
    const b = Math.random().toString();
    return key + ">" + l(a) + l(b);
}
/**
 * Generate unique ID
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
/**
 * Check if event should be logged (filter out noisy events)
 */
function isLogable(event) {
    const noisyEvents = ['ping', 'pong', 'heartbeat', 'heartbeat_response'];
    return !noisyEvents.includes(event.toLowerCase());
}
/**
 * Safe JSON parse with fallback
 */
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
/**
 * Create a debounced function
 */
function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
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
function throttle(func, limit) {
    let inThrottle = false;
    return (...args) => {
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
function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}
/**
 * Create a logger with prefix
 */
function createLogger(prefix, debug = true) {
    return {
        log: (...args) => {
            if (debug) {
                console.log(`[${prefix}]`, ...args);
            }
        },
        warn: (...args) => {
            if (debug) {
                console.warn(`[${prefix}]`, ...args);
            }
        },
        error: (...args) => {
            console.error(`[${prefix}]`, ...args);
        }
    };
}
//# sourceMappingURL=utils.js.map