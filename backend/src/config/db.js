import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 15000,
      });
      logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.db.databaseName}`);
      return;
    } catch (err) {
      logger.error(`MongoDB attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 3000));
    }
  }
  logger.error('MongoDB connection failed — exiting');
  process.exit(1);
};
