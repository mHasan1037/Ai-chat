import express from "express";
import {
  chatWithPdf,
  createChat,
  deleteChat,
  getChats,
  saveMessages,
  updateChat,
  uploadPdf,
} from "../controllers/chatController.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/chats", getChats);
router.post("/chats", createChat);
router.patch("/chats/:chatId", updateChat);
router.put("/chats/:chatId/messages", saveMessages);
router.post("/upload", upload.single("pdf"), uploadPdf);
router.get("/chat", chatWithPdf);
router.delete("/chats/:chatId", deleteChat);

export default router;
