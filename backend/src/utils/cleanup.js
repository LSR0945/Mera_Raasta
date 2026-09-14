import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://satishrajput207001_db_user:Esrt0sHFtIkp50c1@ac-vie7ewu-shard-00-00.qwt7dup.mongodb.net:27017,ac-vie7ewu-shard-00-01.qwt7dup.mongodb.net:27017,ac-vie7ewu-shard-00-02.qwt7dup.mongodb.net:27017/mera_raasta?ssl=true&retryWrites=true&w=majority&authSource=admin';

await mongoose.connect(MONGO_URI);

const keep = ['rahul@student.com', 'priya@parent.com', 'amit@mentor.com'];
const r = await mongoose.connection.db.collection('users').deleteMany({ email: { $nin: keep } });
console.log(`Deleted ${r.deletedCount} test users`);

const users = await mongoose.connection.db.collection('users').find({}).toArray();
console.log(`Remaining: ${users.length} users`);
users.forEach(u => console.log(`  - ${u.email} (${u.role})`));

await mongoose.disconnect();
