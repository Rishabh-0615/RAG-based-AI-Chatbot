import mongoose from "mongoose";

const AIUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    requestCount: {
      type: Number,
      default: 0,
    },

    windowStart: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AIUsage", AIUsageSchema);