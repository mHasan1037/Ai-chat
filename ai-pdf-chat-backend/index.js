import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); 

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AI PDF Chat Backend' });
});

app.use('/api', uploadRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
