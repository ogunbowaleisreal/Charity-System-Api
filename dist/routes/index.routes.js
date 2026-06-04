"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_route_1 = __importDefault(require("./admin/index.route"));
const index_route_2 = __importDefault(require("./clients/index.route"));
const media_1 = __importDefault(require("./media"));
const router = (0, express_1.Router)();
router.use('/admin', index_route_1.default);
router.use('/client', index_route_2.default);
router.use('/media', media_1.default);
exports.default = router;
