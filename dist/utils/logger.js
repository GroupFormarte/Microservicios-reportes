"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
const config_1 = require("./config");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.logLevel = this.getLogLevel(config_1.config.logLevel);
    }
    getLogLevel(level) {
        switch (level.toLowerCase()) {
            case 'error':
                return LogLevel.ERROR;
            case 'warn':
                return LogLevel.WARN;
            case 'info':
                return LogLevel.INFO;
            case 'debug':
                return LogLevel.DEBUG;
            default:
                return LogLevel.INFO;
        }
    }
    shouldLog(level) {
        return level <= this.logLevel;
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }
    error(message, meta) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('error', message, meta));
        }
    }
    warn(message, meta) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }
    info(message, meta) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatMessage('info', message, meta));
        }
    }
    debug(message, meta) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }
}
exports.logger = new Logger();
