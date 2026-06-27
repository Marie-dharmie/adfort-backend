import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import routes from './routes';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { simpleRateLimit } from './middleware/rate-limit.middleware';

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(simpleRateLimit());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'ADFORT API is running'
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'ADFORT backend is live'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);