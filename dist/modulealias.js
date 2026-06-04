"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const module_alias_1 = __importDefault(require("module-alias"));
const path_1 = __importDefault(require("path"));
module_alias_1.default.addAliases({
    '@': path_1.default.resolve(__dirname),
    '@/config': path_1.default.resolve(__dirname, 'config'),
    '@/controllers': path_1.default.resolve(__dirname, 'controllers'),
    '@/middleware': path_1.default.resolve(__dirname, 'middleware'),
    '@/models': path_1.default.resolve(__dirname, 'models'),
    '@/routes': path_1.default.resolve(__dirname, 'routes'),
    '@/services': path_1.default.resolve(__dirname, 'services'),
    '@/repositories': path_1.default.resolve(__dirname, 'repositories'),
    '@/types': path_1.default.resolve(__dirname, 'types'),
    '@/utils': path_1.default.resolve(__dirname, 'utils'),
    '@/validations': path_1.default.resolve(__dirname, 'validations'),
});
