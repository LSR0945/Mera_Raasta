import mongoose from 'mongoose';

// Persistent chat history — bilkul real AI (ChatGPT/Gemini) jaisa.
// Server restart ya page refresh ke baad bhi purani chat wapas milti hai.
const chatHistorySchema = new mongoose.Schema(
  {
    // userId STRING me — controller ki memory Map ke saath same key format
    userId: { type: String, required: true, unique: true },
    messages: {
      type: [
        {
          _id: false,
          role: { type: String, enum: ['user', 'assistant'], required: true },
          content: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('ChatHistory', chatHistorySchema);
