import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing.");
  }

  return process.env.JWT_SECRET;
};

const issueToken = (userId, type, expiresIn) =>
  jwt.sign({ userId: userId.toString(), type }, getJwtSecret(), {
    expiresIn,
  });

export const issueAccessToken = (userId) =>
  issueToken(userId, "access", ACCESS_TOKEN_EXPIRES_IN);

export const issueRefreshToken = (userId) =>
  issueToken(userId, "refresh", REFRESH_TOKEN_EXPIRES_IN);

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());

const refreshTokenCookieBaseOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/auth/refresh",
});

export const refreshTokenCookieOptions = () => ({
  ...refreshTokenCookieBaseOptions(),
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
});

export const clearRefreshTokenCookieOptions = () =>
  refreshTokenCookieBaseOptions();
