"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const index_routes_1 = __importDefault(require("./routes/index.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const webhooks_controller_1 = require("./controllers/client/webhooks.controller");
//import webhookRoutes from "./routes/clients/index.route"
//import { subscriptionController } from './controllers/client/subscriptionController';
const body_parser_1 = __importDefault(require("body-parser"));
const webhookController = new webhooks_controller_1.WebhookController();
const app = (0, express_1.default)();
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        console.log(`${req.method} ${req.originalUrl} → ${durationMs.toFixed(2)} ms`);
    });
    next();
});
app.post("/api/donation/webhook", body_parser_1.default.raw({ type: "application/json" }), (req, res, next) => webhookController.handleFlutterWaveWebhook(req, res, next));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "*",
    optionsSuccessStatus: 200
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, '/public')));
app.use('/api/', index_routes_1.default);
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
