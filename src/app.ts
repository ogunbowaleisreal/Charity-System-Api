import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import allRoutes from './routes/index.routes';
import { errorHandler } from './middleware/errorHandler';
import { WebhookController } from './controllers/client/webhooks.controller';
//import webhookRoutes from "./routes/clients/index.route"
//import { subscriptionController } from './controllers/client/subscriptionController';
import bodyParser from "body-parser"

const webhookController = new WebhookController()

const app = express()

app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;

        console.log(
            `${req.method} ${req.originalUrl} → ${durationMs.toFixed(2)} ms`
        );
    });

    next();
});


app.post(
    "/api/donation/webhook",
    bodyParser.raw({ type: "application/json" }),
    (req, res, next) => webhookController.handleFlutterWaveWebhook(req, res, next)
);


app.use(helmet())

app.use(cors({
    origin: "*",
    optionsSuccessStatus: 200
}))
app.use(cookieParser())


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')))

app.use('/api/', allRoutes)

app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    })
}
)

app.use(errorHandler)


export default app