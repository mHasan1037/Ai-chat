import bcrypt from "bcrypt";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "../config/db.js";
import {
  normalizeEmail,
  PASSWORD_MIN_LENGTH,
  publicUser,
} from "../utils/helpers.js";
import {
  clearRefreshTokenCookieOptions,
  issueAccessToken,
  issueRefreshToken,
  refreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
  verifyToken,
} from "../utils/tokens.js";

const issueAuthTokens = (res, user) => {
  const userId = user._id.toString();
  const accessToken = issueAccessToken(userId);
  const refreshToken = issueRefreshToken(userId);

  res.cookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    refreshTokenCookieOptions(),
  );

  return accessToken;
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
        .json({
          error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        });
    }

    const users = await getUsersCollection();
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
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

    const accessToken = issueAuthTokens(res, user);

    return res.status(201).json({ user: publicUser(user), accessToken });
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

    const accessToken = issueAuthTokens(res, user);

    return res.json({ user: publicUser(user), accessToken });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const logout = (_req, res) => {
  res.clearCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    clearRefreshTokenCookieOptions(),
  );

  return res.json({ message: "Logged out" });
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const payload = verifyToken(token);

    if (payload.type !== "refresh" || !ObjectId.isValid(payload.userId)) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessToken = issueAccessToken(payload.userId);

    return res.json({ accessToken });
  } catch (_error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
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
    const resetTokenExpiry = new Date(
      Date.now() + 60 * 60 * 1000,
    ).toISOString();
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
