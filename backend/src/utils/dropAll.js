import mongoose from 'mongoose';
import { config } from '../config/env.js';

const run = async () => {
  await mongoose.connect(config.mongoUri);
  const db = mongoose.connection.db;
  
  // Show all collections
  const collections = await db.listCollections().toArray();
  console.log('\n=== Current Collections ===');
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} documents`);
  }
  
  // Drop ALL collections
  console.log('\n=== Dropping All Collections ===');
  for (const col of collections) {
    await db.dropCollection(col.name);
    console.log(`  Dropped: ${col.name}`);
  }
  
  console.log(`\nDone! ${collections.length} collections dropped. Database is clean.`);
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });
