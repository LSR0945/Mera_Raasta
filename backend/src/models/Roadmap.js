import mongoose from 'mongoose';

// ═══ Resource Schema ═══
// Har step ke andar kuch resources hote hain (jaise YouTube link, website, book)
// Ye schema un resources ko store karta hai
const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },       // Resource ka naam, jaise "freeCodeCamp"
  url: { type: String, default: '' },            // Resource ka link (website URL)
  type: { type: String, enum: ['free', 'paid', 'youtube', 'article', 'book', 'platform'], default: 'free' },
  // Type batata hai ye free hai ya paid hai — user ko dikhane ke liye
}, { _id: false });

// ═══ Node Schema ═══
// Roadmap ka har step ek "node" hai — jaise "Learn Python", "Build Project" etc.
// Har node ke andar uski details hoti hain
const NodeSchema = new mongoose.Schema({
  title: { type: String, required: true },       // Step ka naam, jaise "Learn JavaScript"
  description: { type: String, default: '' },    // Step ki detail — kya karna hai
  type: { type: String, default: 'general' },    // Type — education, project, skill, interview etc.
  category: { type: String, enum: ['learning', 'project', 'practice', 'interview', 'application', 'milestone'], default: 'learning' },
  // Category — ye step kis category ka hai (seekhna, project karna, practice etc.)
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  // Status — ye step abhi pending hai, chalu hai, ya ho gaya
  progress: { type: Number, default: 0 },        // Kitna progress hua (0 se 100 tak)
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  // Difficulty — ye step kitna mushkil hai
  estimatedDuration: { type: String, default: '' },  // Kitna time lagega, jaise "2 months"
  resources: [ResourceSchema],                    // Is step ke liye useful resources (links)
  tips: { type: String, default: '' },           // Pro tips — kaise karein ye step best tarike se
  whyThis: { type: String, default: '' },        // Kyu zaroori hai ye step — motivation ke liye
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },  // Extra data (kuch bhi ho sakta hai)
  order: { type: Number, default: 0 },           // Step number — pehla, doosra, teesra etc.
}, { _id: true });

// ═══ Milestone Schema ═══
// Milestone = checkpoints — jaise 25% complete, 50% complete etc.
// Ye user ko celebrate karne ke liye hai
const MilestoneSchema = new mongoose.Schema({
  percent: { type: Number, required: true },     // Kitne percent pe milestone hai (25, 50, 75, 100)
  reached: { type: Boolean, default: false },    // Kya ye milestone pahunch gaya?
  reachedAt: { type: Date },                     // Kab pahuncha — date time store hota hai
}, { _id: false });

// ═══ Main Roadmap Schema ═══
// Ye poora roadmap ka structure hai — ek student ka ek roadmap hoga
const RoadmapSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  // Student — kaunsa user hai jiska roadmap hai (har user ka ek hi roadmap)
  career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', default: null },
  // Career — kis career ke liye roadmap hai (Software Engineer, Doctor etc.)
  title: { type: String, required: true },       // Roadmap ka title, jaise "Path to Software Engineer"
  description: { type: String, default: '' },    // Roadmap ki description
  nodes: { type: [NodeSchema], default: [] },    // Saare steps — array of nodes
  milestones: { type: [MilestoneSchema], default: [] },  // Milestones — 25%, 50%, 75%, 100%
  overallProgress: { type: Number, default: 0 }, // Total progress kitna hua (0-100%)
  userProfile: {                                 // Roadmap banate waqt user ka profile kaisa tha
    educationLevel: String,                      // Education level — 10th, 12th, UG, PG
    skills: [String],                            // User ki skills — JavaScript, Python etc.
    interests: [String],                         // User ki interests — Technology, Science etc.
    budget: String,                              // Budget — low, medium, high
  },
}, { timestamps: true });  // createdAt aur automatic save hoga

export default mongoose.models.Roadmap || mongoose.model('Roadmap', RoadmapSchema);