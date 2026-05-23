import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getUsersCollection } from "../config/db.js";
import { authCookieName } from "../middleware/authMiddleware.js";

const PASSWORD_MIN_LENGTH = 8;
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const publicUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  createdAt: user.createdAt,
});

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }

  return process.env.JWT_SECRET;
};

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

const cookieOptions = () => ({
  ...baseCookieOptions(),
  maxAge: TOKEN_MAX_AGE_MS,
});

const issueSession = (res, user) => {
  const token = jwt.sign({ userId: user._id.toString() }, getJwtSecret(), {
    expiresIn: "7d",
  });

  res.cookie(authCookieName, token, cookieOptions());
};

export const signup = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res
        .status(400)
        .json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
    }

    const users = await getUsersCollection();
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await users.insertOne({
      email,
      passwordHash,
      createdAt: now,
    });

    const user = {
      _id: result.insertedId,
      email,
      createdAt: now,
    };

    issueSession(res, user);

    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    issueSession(res, user);

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const logout = (_req, res) => {
  res.clearCookie(authCookieName, baseCookieOptions());

  return res.json({ message: "Logged out" });
};

export const me = (req, res) => {
  return res.json({ user: req.user });
};

export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const users = await getUsersCollection();

    await users.updateOne(
      { email },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        },
      },
    );

    return res.json({
      message: "If an account exists, a password reset email would be sent.",
      resetToken:
        process.env.NODE_ENV === "production" ? undefined : resetToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: error.message });
  }
};
