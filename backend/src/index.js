import app from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;
let server;

const start = async () => {
  try {
    await connectDB();

    // Fix old roadmap schema — drop corrupted collection
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const hasOldRoadmaps = collections.find(c => c.name === 'roadmaps');
      if (hasOldRoadmaps) {
        const sample = await mongoose.connection.db.collection('roadmaps').findOne();
        if (sample && sample.nodes && sample.nodes.length > 0 && typeof sample.nodes[0] === 'string') {
          await mongoose.connection.db.dropCollection('roadmaps');
          console.log('Dropped old roadmaps collection (schema mismatch)');
        }
      }
    } catch (fixErr) {
      console.log('Roadmap cleanup skipped:', fixErr.message);
    }

    server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    server.on('error', (err) => { console.error('Server listen error:', err.message); process.exit(1); });
  } catch (err) {
    console.error('Failed to start server:', err.message || err);
    process.exit(1);
  }
};

process.on('SIGINT', () => { if (server) server.close(() => process.exit(0)); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); if (server) server.close(() => process.exit(1)); else process.exit(1); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err.message, err.stack); process.exit(1); });

start();
