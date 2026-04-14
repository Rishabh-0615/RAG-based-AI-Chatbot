import mongoose from "mongoose";

const ChatLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },

    question: {
      type: String,
      required: true,
    },

    retrievedKnowledgeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Knowledge",
      },
    ],

    similarityScore: {
      type: Number,
    },

    response: {
      type: String,
      required: true,
    },

    confidence: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatLog", ChatLogSchema);