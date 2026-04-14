import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["worker", "lender"],
      default: "worker",
    },
    employmentType: {
      type: String,
      enum: ["delivery", "driver", "freelancer", "service_provider"],
      default: "freelancer",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
