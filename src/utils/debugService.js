/**
 * debugService.js - Centralized debug logging for the entire MVC stack
 *
 * Provides a single point of control for diagnostic logging across
 * model, view, and controller. Instead of each layer maintaining its
 * own debug flag, they all import and use this shared service.
 *
 * Usage:
 *   import { debugLog, setDebugEnabled, isDebugEnabled } from './debugService.js';
 *   debugLog('Message', data);
 *
 * Enable/disable:
 *   setDebugEnabled(true);  // Turn on logging for entire app
 *   setDebugEnabled(false); // Turn off logging (default)
 */

/**
 * Global debug flag - controls all logging across MVC stack
 * @type {boolean}
 */
let _debugEnabled = false;

/**
 * Enable or disable debug logging for the entire application
 * @param {boolean} enabled - True to enable logging, false to disable
 */
export function setDebugEnabled(enabled) {
    _debugEnabled = Boolean(enabled);
    if (_debugEnabled) {
        console.log('🔧 Debug logging enabled for MVC stack');
    }
}

/**
 * Check if debug logging is currently enabled
 * @returns {boolean} Current debug state
 */
export function isDebugEnabled() {
    return _debugEnabled;
}

/**
 * Conditional debug logger - only outputs when debug mode is enabled
 * Use this instead of console.log throughout model, view, and controller.
 *
 * @param {...any} args - Arguments to pass to console.log
 */
export function debugLog(...args) {
    if (_debugEnabled) {
        console.log(...args);
    }
}

/**
 * Debug logger with prefix - adds context to log messages
 * Useful for identifying which layer (model/view/controller) produced the log.
 *
 * @param {string} prefix - Prefix to prepend (e.g., '[Model]', '[View]')
 * @param {...any} args - Arguments to pass to console.log
 */
export function debugLogWithPrefix(prefix, ...args) {
    if (_debugEnabled) {
        console.log(prefix, ...args);
    }
}

/**
 * Create a prefixed logger function for a specific module
 * Returns a function that automatically adds the prefix to all log calls.
 *
 * @param {string} prefix - Prefix for this module (e.g., '[Model]')
 * @returns {Function} Logger function that accepts any arguments
 *
 * @example
 * const log = createPrefixedLogger('[Model]');
 * log('Transaction added:', tx);  // Outputs: [Model] Transaction added: {...}
 */
export function createPrefixedLogger(prefix) {
    return (...args) => {
        if (_debugEnabled) {
            console.log(prefix, ...args);
        }
    };
}
