/**
 * Demo / dummy data cleanup script.
 *
 * Kya karta hai:
 *  - Demo accounts (rahul / priya / amit) ko delete karta hai
 *  - Unse juda saara data bhi delete karta hai (profile, roadmap, chats,
 *    activities, recommendations, mentor notes, password resets)
 *  - Content (careers / courses / colleges etc.) ko chhodta hai taaki app kaam kare
 *
 * Usage:
 *   npm run cleanup:demo                  -> sirf demo accounts + unka data
 *   npm run cleanup:demo -- --content     -> demo content bhi delete (isDemo: true)
 *   npm run cleanup:demo -- --all-users   -> demo ke alawa baaki users bhi delete
 *   npm run cleanup:demo -- --all-users --keep=satishrajput207001@gmail.com
 *
 * NOTE: Ye script .env ke MONGO_URI (Atlas) par chalti hai — local DB par nahi.
 */
import mongoose from 'mongoose';
import { config } from '../config/env.js';

const DEMO_EMAILS = ['rahul@student.com', 'priya@parent.com', 'amit@mentor.com'];

// Content collections jinme demo entries `isDemo: true` se mark hain
const DEMO_CONTENT_COLLECTIONS = [
  'courses',
  'colleges',
  'scholarships',
  'governments',
  'projects',
  'internships',
  'jobs',
  'interviews',
  'lmscourses',
  'quizzes',
  'careers',
];

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback = '') => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};

const ALL_USERS = flag('all-users');
const WITH_CONTENT = flag('content');
const KEEP_EMAIL = value('keep').trim().toLowerCase();

const run = async () => {
  if (!config.mongoUri) {
    console.error('MONGO_URI missing in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log('Connected:', mongoose.connection.host);

  // ── 1. Target users ───────────────────────────────────────────────
  let userFilter;
  if (ALL_USERS) {
    userFilter = KEEP_EMAIL ? { email: { $ne: KEEP_EMAIL } } : {};
  } else {
    userFilter = { email: { $in: DEMO_EMAILS } };
  }

  const targets = await db.collection('users').find(userFilter).project({ _id: 1, email: 1, role: 1 }).toArray();
  if (!targets.length) {
    console.log('No matching users found. Nothing to delete.');
  } else {
    console.log(`\nDeleting ${targets.length} user(s):`);
    targets.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
  }

  const ids = targets.map((u) => u._id);
  const idStrings = ids.map((id) => String(id));

  // Har collection me user reference ka field alag hai
  const userScoped = {
    studentprofiles: [{ user: { $in: ids } }],
    roadmaps: [{ student: { $in: ids } }],
    careerrecommendations: [{ student: { $in: ids } }],
    nextbestactions: [{ student: { $in: ids } }],
    activities: [{ user: { $in: ids } }],
    mentornotes: [{ mentor: { $in: ids } }, { student: { $in: ids } }],
    passwordresets: [{ user: { $in: ids } }],
    chatsessions: [{ userId: { $in: idStrings } }, { userId: { $in: ids } }],
    chathistories: [{ userId: { $in: idStrings } }, { userId: { $in: ids } }],
  };

  console.log('\nDeleting linked data:');
  for (const [collection, filters] of Object.entries(userScoped)) {
    let removed = 0;
    for (const filter of filters) {
      const r = await db.collection(collection).deleteMany(filter).catch(() => ({ deletedCount: 0 }));
      removed += r.deletedCount || 0;
    }
    if (removed) console.log(`  ${collection}: ${removed}`);
  }

  if (ids.length) {
    const r = await db.collection('users').deleteMany({ _id: { $in: ids } });
    console.log(`  users: ${r.deletedCount}`);
  }

  // ── 2. Optional: demo content ────────────────────────────────────
  if (WITH_CONTENT) {
    console.log('\nDeleting demo content (isDemo: true):');
    for (const collection of DEMO_CONTENT_COLLECTIONS) {
      const r = await db.collection(collection).deleteMany({ isDemo: true }).catch(() => ({ deletedCount: 0 }));
      if (r.deletedCount) console.log(`  ${collection}: ${r.deletedCount}`);
    }
  }

  // ── 3. Summary ───────────────────────────────────────────────────
  const left = await db.collection('users').countDocuments();
  console.log(`\nDone. Users left in DB: ${left}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('Cleanup failed:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
