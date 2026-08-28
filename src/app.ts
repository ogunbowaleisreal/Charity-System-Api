import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import bodyParser from 'body-parser';
import * as Sentry from '@sentry/node';
import allRoutes from './routes/index.routes';
import { errorHandler } from './middleware/errorHandler';
import { WebhookController } from './controllers/client/webhooks.controller';

const webhookController = new WebhookController();

const app = express();

app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        console.log(`${req.method} ${req.originalUrl} → ${durationMs.toFixed(2)} ms`);
    });
    next();
});

app.post(
    "/api/donation/webhook",
    bodyParser.raw({ type: "application/json" }),
    (req, res, next) => webhookController.handleFlutterWaveWebhook(req, res, next)
);

app.use(helmet());
app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

app.use('/api/', allRoutes);

app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});

// Captures errors passed to next(err) and attaches them to Sentry.
// Must come after routes, before any other error-handling middleware.
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

export default app;


// import express, { Request, Response } from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import helmet from 'helmet';
// import path from 'path';
// import bodyParser from 'body-parser';
// import allRoutes from './routes/index.routes';
// import { errorHandler } from './middleware/errorHandler';
// import { WebhookController } from './controllers/client/webhooks.controller';
// //import webhookRoutes from "./routes/clients/index.route"
// //import { subscriptionController } from './controllers/client/subscriptionController';

// const webhookController = new WebhookController();

// const app = express();

// app.use((req, res, next) => {
//     const start = process.hrtime.bigint();

//     res.on('finish', () => {
//         const end = process.hrtime.bigint();
//         const durationMs = Number(end - start) / 1e6;

//         console.log(
//             `${req.method} ${req.originalUrl} → ${durationMs.toFixed(2)} ms`
//         );
//     });

//     next();
// });

// // NOTE: registered before helmet/cors intentionally — needs raw body for
// // signature verification and is a server-to-server webhook, not a browser request.
// app.post(
//     "/api/donation/webhook",
//     bodyParser.raw({ type: "application/json" }),
//     (req, res, next) => webhookController.handleFlutterWaveWebhook(req, res, next)
// );

// app.use(helmet());

// app.use(cors({
//     origin: "*",
//     optionsSuccessStatus: 200
// }));
// app.use(cookieParser());

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, '/public')));

// app.use('/api/', allRoutes);

// app.use("*", (req: Request, res: Response) => {
//     res.status(404).json({
//         success: false,
//         message: "Route not found",
//         path: req.originalUrl,
//     });
// });

// app.use(errorHandler);

// export default app;
