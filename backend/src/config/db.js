import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './env.js';
import User from '../models/User.js';
import { seedGovtData, seedCollegeData } from '../utils/seedLocations.js';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/mera_raasta';

const DEMO_ACCOUNTS = [
  { name: 'Rahul Kumar', email: 'rahul@student.com', password: 'password123', role: 'student' },
  { name: 'Priya Sharma', email: 'priya@parent.com', password: 'password123', role: 'parent' },
  { name: 'Amit Singh', email: 'amit@mentor.com', password: 'password123', role: 'mentor' },
];

async function seedDemoAccounts() {
  try {
    for (const acc of DEMO_ACCOUNTS) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        await User.create(acc);
        console.log(`  Created demo: ${acc.email} (${acc.role})`);
      }
    }
    console.log('  Demo accounts ready');
  } catch (err) {
    console.log('  Seed skipped:', err.message);
  }
}

export const connectDB = async () => {
  const primaryUri = config.mongoUri;

  // Try primary (Atlas)
  try {
    console.log('Trying Atlas...');
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, socketTimeoutMS: 15000 });
    console.log('Connected to Atlas:', mongoose.connection.host);
    await seedDemoAccounts();
    await seedGovtData();   // Government data auto-seed
    await seedCollegeData(); // College data auto-seed
    return;
  } catch (err) {
    console.log('Atlas failed:', err.message.substring(0, 80));
  }

  // Fallback to local
  try {
    console.log('Trying local MongoDB...');
    await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    console.log('Connected to LOCAL MongoDB (fallback)');
    await seedDemoAccounts();
    await seedGovtData();   // Government data auto-seed
    await seedCollegeData(); // College data auto-seed
    return;
  } catch (err) {
    console.error('Local MongoDB also failed:', err.message);
  }

  console.error('No database available — exiting');
  process.exit(1);
};
