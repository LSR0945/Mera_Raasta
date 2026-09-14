import { connectDB } from '../config/db.js';
import { seedCareers } from './seedCareers.js';
import { seedEducationData } from './seedEducation.js';
import { seedAllModules } from './seedModules.js';

const run = async () => {
  await connectDB();
  await seedCareers();
  await seedEducationData();
  await seedAllModules();
  console.log('All seed data inserted!');
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
