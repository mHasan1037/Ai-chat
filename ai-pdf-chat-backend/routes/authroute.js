import express from "express";
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  signup,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/forgot-password", forgotPassword);

export default router;
