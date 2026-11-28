import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const start = Date.now();
await mongoose.connect(process.env.MONGO_URI);
const user = await mongoose.connection.db.collection('users').findOne({ email: 'test+otp+1234567890@gmail.com' });
const end = Date.now();
console.log('DB connect time:', (end - start) / 1000, 's');

if (!user) {
  const userData = {
    name: 'OTP Test User',
    email: 'test+otp+1234567890@gmail.com',
    password: 'Test@1234567890',
    role: 'student',
    isEmailVerified: false,
  };
  const createStart = Date.now();
  const userCreated = await mongoose.connection.db.collection('users').insertOne(userData);
  const createEnd = Date.now();
  console.log('User create time:', (createEnd - createStart) / 1000, 's');
  await mongoose.connection.close();
} else {
  console.log('User already exists');
  await mongoose.connection.close();
}