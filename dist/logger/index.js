"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const development_1 = require("./development");
const production_1 = require("./production");
const env = process.env.NODE_ENV || 'development';
// Export the appropriate logger based on environment
const logger = env === 'production' ? production_1.productionLogger : development_1.developmentLogger;
exports.default = logger;
