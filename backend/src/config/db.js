import mongoose from 'mongoose';
import { config } from './env.js';
import { seedGovtData } from '../utils/seedLocations.js';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/mera_raasta';

// NOTE: Demo accounts ab auto-create NAHI hote.
// Pehle har server start par Rahul/Priya/Amit dobara ban jaate the — isi se
// "dummy data delete nahi hota" lagta tha. Ab demo data sirf manually:
//   npm run seed:demo        (demo accounts + profile)
//   npm run cleanup:demo     (demo accounts + unka data delete)
// Chahiye to backend/src/utils/seedDemo.js chalao.

let connectionPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const primaryUri = config.mongoUri;

    // Try primary (Atlas)
    try {
      console.log('Trying Atlas...');
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, socketTimeoutMS: 15000 });
      console.log('Connected to Atlas:', mongoose.connection.host);
      // Real government location data (LGD/AISHE) — background me, server block nahi hota
      seedGovtData().catch((err) => console.log('Govt seed (background):', err.message));
      return;
    } catch (err) {
      console.log('Atlas failed:', err.message.substring(0, 80));
    }

    // Fallback to local (development only)
    if (!process.env.VERCEL) {
      try {
        console.log('Trying local MongoDB...');
        await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
        console.log('Connected to LOCAL MongoDB (fallback)');
        seedGovtData().catch((err) => console.log('Govt seed (background):', err.message));
        return;
      } catch (err) {
        console.error('Local MongoDB also failed:', err.message);
      }
    }

    connectionPromise = null;
    const error = new Error('No database available');
    if (process.env.VERCEL) throw error;
    console.error('No database available - exiting');
    process.exit(1);
  })();

  return connectionPromise;
};
