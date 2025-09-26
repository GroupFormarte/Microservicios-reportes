"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = void 0;
const config_1 = require("../utils/config");
const errorHandler_1 = require("./errorHandler");
const apiKeyAuth = (req, res, next) => {
    // Skip auth in development if no API key is set
    if (config_1.config.nodeEnv === 'development' && !config_1.config.apiKey) {
        return next();
    }
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (!apiKey) {
        throw (0, errorHandler_1.createError)('API key is required', 401);
    }
    if (apiKey !== config_1.config.apiKey) {
        throw (0, errorHandler_1.createError)('Invalid API key', 401);
    }
    next();
};
exports.apiKeyAuth = apiKeyAuth;
