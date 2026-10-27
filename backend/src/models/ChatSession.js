import mongoose from 'mongoose';

// ChatGPT jaisa multi-chat: har conversation alag document.
// User ke paas bahut saari chats ho sakti hain — sidebar me list dikhti hain.
const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Chat' },
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
  },
  { timestamps: true }
);

// Sidebar query: user ki chats, latest pehle
chatSessionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('ChatSession', chatSessionSchema);
