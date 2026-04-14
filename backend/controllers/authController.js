import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, employmentType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      employmentType,
      role: "worker",
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SEC || "secret_key_12345", {
      expiresIn: "30d",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employmentType: user.employmentType,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SEC || "secret_key_12345", {
      expiresIn: "30d",
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employmentType: user.employmentType,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  return res.json({ success: true, user: req.user });
};
