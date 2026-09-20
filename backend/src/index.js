import app from './app.js';
import { connectDB } from './config/db.js';
import { execSync } from 'child_process';

const PORT = process.env.PORT || 5000;
let server;

const start = async () => {
  try {
    await connectDB();

    // Fix old roadmap schema
    try {
      const mongoose = (await import('mongoose')).default;
      const collections = await mongoose.connection.db.listCollections().toArray();
      const hasOldRoadmaps = collections.find(c => c.name === 'roadmaps');
      if (hasOldRoadmaps) {
        const sample = await mongoose.connection.db.collection('roadmaps').findOne();
        if (sample && sample.nodes && sample.nodes.length > 0 && typeof sample.nodes[0] === 'string') {
          await mongoose.connection.db.dropCollection('roadmaps');
          console.log('Dropped old roadmaps collection');
        }
      }
    } catch {}

    server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} busy — killing old process...`);
        try {
          if (process.platform === 'win32') {
            try {
              const result = execSync(`cmd /c "for /f \\"tokens=5\\" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /PID %a /F"`, { stdio: 'pipe' }).toString();
            } catch {}
          } else {
            execSync(`fuser -k ${PORT}/tcp`, { stdio: 'ignore' });
          }
          setTimeout(() => { server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); }, 2000);
        } catch {
          console.error(`Cannot free port ${PORT}. Retrying in 3s...`);
          setTimeout(() => { server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); }, 3000);
        }
      } else {
        console.error('Server error:', err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Failed to start:', err.message || err);
    process.exit(1);
  }
};

process.on('SIGINT', () => { if (server) server.close(() => process.exit(0)); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); if (server) server.close(() => process.exit(1)); else process.exit(1); });

start();
