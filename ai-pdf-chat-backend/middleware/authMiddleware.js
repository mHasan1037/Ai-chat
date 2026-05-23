import { ObjectId } from "mongodb";
import { getUsersCollection } from "../config/db.js";
import { verifyToken } from "../utils/tokens.js";

const getBearerToken = (req) => {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  return scheme?.toLowerCase() === "bearer" && token ? token : null;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = verifyToken(token);

    if (payload.type !== "access" || !ObjectId.isValid(payload.userId)) {
      return res.status(401).json({ error: "Invalid access token" });
    }

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
    return res.status(401).json({ error: "Invalid access token" });
  }
};
