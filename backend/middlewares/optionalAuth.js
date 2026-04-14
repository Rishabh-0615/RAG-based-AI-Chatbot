import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SEC || "secret_key_12345");
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
    }

    return next();
  } catch (_error) {
    // Auth is optional for chat, so invalid tokens are ignored.
    return next();
  }
};
