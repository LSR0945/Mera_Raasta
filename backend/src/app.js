import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const allowedOrigins = [
  ...(config.corsOrigin || '').split(','),
  ...(config.clientUrl || '').split(','),
]
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : '';
    // Development me localhost/local IP allow karo, production me CORS_ORIGIN aur CLIENT_URL allow karo
    if (!origin || config.nodeEnv === 'development' || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: config.nodeEnv === 'development' ? 1000 : 200, standardHeaders: true, legacyHeaders: false }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Serverless cold-start par DB connection ensure karo
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/', (req, res) => res.status(200).json({ success: true, message: 'Mera Raasta API is running' }));
app.get('/health', (req, res) => res.status(200).json({ success: true, message: 'API is running', timestamp: new Date().toISOString() }));
app.use('/api/v1', apiRoutes);
app.use('/api/chat', chatRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
