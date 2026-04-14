import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // optional: store embeddings of messages
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["worker", "lender"],
      required: true,
    },

    messages: [MessageSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);