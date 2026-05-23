import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "../config/db.js";

const AUTH_COOKIE_NAME = "auth_token";

export const authCookieName = AUTH_COOKIE_NAME;

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const users = await getUsersCollection();
    const user = await users.findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { passwordHash: 0, resetToken: 0, resetTokenExpiry: 0 } },
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid session" });
  }
};
