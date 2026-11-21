import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './env.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { seedGovtData, seedCollegeData } from '../utils/seedLocations.js';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/mera_raasta';

const DEMO_ACCOUNTS = [
  { name: 'Rahul Kumar', email: 'rahul@student.com', password: 'password123', role: 'student' },
  { name: 'Priya Sharma', email: 'priya@parent.com', password: 'password123', role: 'parent' },
  { name: 'Amit Singh', email: 'amit@mentor.com', password: 'password123', role: 'mentor' },
];

async function seedDemoAccounts() {
  try {
    const users = {};
    for (const acc of DEMO_ACCOUNTS) {
      let u = await User.findOne({ email: acc.email });
      if (!u) {
        u = await User.create(acc);
        console.log(`  Created demo: ${acc.email} (${acc.role})`);
      }
      users[acc.role] = u;
    }

    // Demo relationships — taaki parent/mentor dashboards khaali na dikhein
    const { student, parent, mentor } = users;
    if (student) {
      const hasProfile = await StudentProfile.exists({ user: student._id });
      if (!hasProfile) {
        await StudentProfile.create({
          user: student._id,
          educationLevel: '10th',
          board: 'CBSE',
          stream: 'Science',
          interests: ['Physics', 'Chemistry', 'Biology'],
          skills: [
            { name: 'Programming', level: 'beginner' },
            { name: 'Web Development', level: 'beginner' },
          ],
          budget: 'high',
          location: { city: 'Delhi', state: 'Delhi', country: 'India' },
          studyHoursPerDay: 4,
          preferredLanguage: 'Hinglish',
          careerGoals: {
            shortTerm: 'Choose PCB stream in class 11',
            longTerm: 'Become a doctor (MBBS)',
            dreamJob: 'Doctor',
          },
          onboardingCompleted: true,
          completedSteps: ['education', 'interests', 'skills', 'budget', 'location', 'goals'],
        });
        console.log('  Demo student profile created');
      }

      const updates = {};
      if (parent && !student.parent) updates.parent = parent._id;
      if (mentor && !student.mentor) updates.mentor = mentor._id;
      if (Object.keys(updates).length) {
        await User.updateOne({ _id: student._id }, { $set: updates });
      }
      if (parent) {
        await User.updateOne({ _id: parent._id }, { $addToSet: { children: student._id } });
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
    // Seed ko background mein chalao — server block mat karo
    seedGovtData().catch(err => console.log('Govt seed (background):', err.message));
    // College seed disable — causes memory crash during city fetching
    // seedCollegeData().catch(err => console.log('College seed (background):', err.message));
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
    seedGovtData().catch(err => console.log('Govt seed (background):', err.message));
    // College seed disable — causes memory crash during city fetching
    // seedCollegeData().catch(err => console.log('College seed (background):', err.message));
    return;
  } catch (err) {
    console.error('Local MongoDB also failed:', err.message);
  }

  console.error('No database available — exiting');
  process.exit(1);
};
