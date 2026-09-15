import mongoose from 'mongoose';
import { config } from './env.js';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/mera_raasta';

export const connectDB = async () => {
  const primaryUri = config.mongoUri;
  const fallbackUri = LOCAL_URI;

  // Try primary (Atlas)
  try {
    console.log('Trying Atlas...');
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, socketTimeoutMS: 15000 });
    console.log('Connected to Atlas:', mongoose.connection.host);
    return;
  } catch (err) {
    console.log('Atlas failed:', err.message.substring(0, 80));
  }

  // Fallback to local
  try {
    console.log('Trying local MongoDB...');
    await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    console.log('Connected to LOCAL MongoDB (fallback)');
    return;
  } catch (err) {
    console.error('Local MongoDB also failed:', err.message);
  }

  console.error('No database available — exiting');
  process.exit(1);
};
