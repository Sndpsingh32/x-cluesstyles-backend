import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.options('*', cors()); // handle preflight for all routes
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static('uploads'));
app.use(pinoHttp());
app.use(env.API_PREFIX, apiRouter);
app.use(notFound);
app.use(errorHandler);

export { app };
