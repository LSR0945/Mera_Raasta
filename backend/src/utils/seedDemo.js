import mongoose from 'mongoose';
import { config } from '../config/env.js';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';

// Demo accounts — sirf manual run ke liye (`npm run seed:demo`).
// Server start par ye auto-create NAHI hote.

const demoAccounts = [
  { name: 'Rahul Kumar', email: 'rahul@student.com', password: 'password123', role: 'student' },
  { name: 'Priya Sharma', email: 'priya@parent.com', password: 'password123', role: 'parent' },
  { name: 'Amit Singh', email: 'amit@mentor.com', password: 'password123', role: 'mentor' },
];

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected:', mongoose.connection.host);

    const users = {};
    for (const acc of demoAccounts) {
      let user = await User.findOne({ email: acc.email });
      if (!user) {
        user = await User.create({ ...acc, isEmailVerified: true });
        console.log(`Created: ${acc.email} (${acc.role})`);
      } else {
        if (!user.isEmailVerified) await User.updateOne({ _id: user._id }, { $set: { isEmailVerified: true } });
        console.log(`Exists: ${acc.email}`);
      }
      users[acc.role] = user;
    }

    // Demo relationships + profile
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
        console.log('Student profile created');
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

    console.log('Done!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
};

seed();
