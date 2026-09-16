import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mera_raasta';

const demoAccounts = [
  { name: 'Rahul Kumar', email: 'rahul@student.com', password: 'password123', role: 'student' },
  { name: 'Priya Sharma', email: 'priya@parent.com', password: 'password123', role: 'parent' },
  { name: 'Amit Singh', email: 'amit@mentor.com', password: 'password123', role: 'mentor' },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const acc of demoAccounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        const user = await User.create(acc);
        console.log(`Created: ${acc.email} (${acc.role})`);
      } else {
        console.log(`Exists: ${acc.email}`);
      }
    }

    console.log('Done!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();