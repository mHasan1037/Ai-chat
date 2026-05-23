import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRoutes from "./routes/chatroute.js";
import authRoutes from "./routes/authroute.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = (process.env.FRONTEND_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('uploads')); 

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AI PDF Chat Backend' });
});

app.use('/auth', authRoutes);
app.use('/api', chatRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
