import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://satishrajput207001_db_user:Esrt0sHFtIkp50c1@ac-vie7ewu-shard-00-00.qwt7dup.mongodb.net:27017,ac-vie7ewu-shard-00-01.qwt7dup.mongodb.net:27017,ac-vie7ewu-shard-00-02.qwt7dup.mongodb.net:27017/mera_raasta?ssl=true&retryWrites=true&w=majority&authSource=admin';

try {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Drop old roadmaps collection entirely (old schema)
  const collections = await mongoose.connection.db.listCollections().toArray();
  const roadmapCol = collections.find(c => c.name === 'roadmaps');
  
  if (roadmapCol) {
    await mongoose.connection.db.dropCollection('roadmaps');
    console.log('Dropped old roadmaps collection');
  } else {
    console.log('No roadmaps collection found');
  }

  // Also drop old indexes if any
  console.log('Cleanup done! Roadmap will work fresh now.');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await mongoose.disconnect();
}
