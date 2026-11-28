import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const users = await mongoose.connection.db.collection('users')
  .find({}, { projection: { email: 1, isEmailVerified: 1, role: 1, createdAt: 1 } })
  .toArray();
console.log('TOTAL USERS:', users.length);
users.forEach((u) => console.log(' -', JSON.stringify(u.email), '| verified:', u.isEmailVerified, '| created:', u.createdAt));
const match = await mongoose.connection.db.collection('users').findOne({ email: 'satishrajput207001+otptest@gmail.com' });
console.log('PLUS ALIAS FOUND:', Boolean(match));
await mongoose.connection.close();
