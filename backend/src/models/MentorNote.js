import mongoose from 'mongoose';

// Mentor apne student ke liye notes likh sakta hai — MentorStudentDetailPage me dikhte hain
const mentorNoteSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

mentorNoteSchema.index({ mentor: 1, student: 1, createdAt: -1 });

export default mongoose.model('MentorNote', mentorNoteSchema);
