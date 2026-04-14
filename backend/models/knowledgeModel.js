import mongoose from "mongoose";

const KnowledgeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "credit_norms",
        "lending_policies",
        "risk_model",
        "insurance",
        "tax",
      ],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
      index: false, 
    },

    version: {
      type: String,
      default: "v1.0",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Knowledge", KnowledgeSchema);