# 🤖 AI PDF Chat

A full-stack AI-powered application that lets you upload PDF documents and chat with them using natural language. Built with a Node.js/TypeScript backend and a modern frontend, leveraging RAG (Retrieval-Augmented Generation) for accurate, context-aware answers.

---

## ✨ Features

- 📄 **PDF Upload & Processing** — Upload one or more PDF files for ingestion
- 🧠 **RAG Pipeline** — Chunks, embeds, and stores document content in a vector database
- 💬 **Conversational Chat** — Ask questions and receive answers grounded in your documents
- ⚙️ **Async Job Processing** — Background workers handle PDF processing via BullMQ queues
- 🗄️ **Vector Search** — Semantic search powered by Qdrant vector store
- ☁️ **Cloud Storage** — PDF files stored securely via Cloudinary
- 🐳 **Docker Support** — Full Docker Compose setup for easy local development

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| AI Orchestration | LangChain.js |
| LLM | Ollama (local) |
| Vector Store | Qdrant |
| Job Queue | BullMQ + Redis |
| File Storage | Cloudinary |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React (TypeScript) |
| Styling | CSS / Tailwind |
| Build Tool | Vite |

---

## 📁 Project Structure

```
Ai-chat/
├── ai-pdf-chat-backend/     # Node.js TypeScript backend
│   ├── src/
│   │   ├── routes/          # Express API routes
│   │   ├── workers/         # BullMQ job workers
│   │   ├── services/        # RAG pipeline, vector store logic
│   │   └── config/          # App configuration
│   └── package.json
├── ai-pdf-chat-frontend/    # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   └── pages/           # App pages
│   └── package.json
└── docker-compose.yml       # Docker orchestration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) & Docker Compose
- [Ollama](https://ollama.ai/) running locally with a model pulled (e.g. `llama3`)
- A [Cloudinary](https://cloudinary.com/) account

### 1. Clone the repository

```bash
git clone https://github.com/mHasan1037/Ai-chat.git
cd Ai-chat
```

### 2. Start infrastructure services

Start Qdrant and Redis via Docker Compose:

```bash
docker-compose up -d
```

### 3. Set up the Backend

```bash
cd ai-pdf-chat-backend
cp .env.example .env
```

Fill in your `.env` file:

```env
PORT=5000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Qdrant
QDRANT_URL=http://localhost:6333

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

Install dependencies and start the server:

```bash
npm install
npm run dev
```

### 4. Set up the Frontend

```bash
cd ../ai-pdf-chat-frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🔄 How It Works

```
User uploads PDF
      │
      ▼
Backend stores file → Cloudinary
      │
      ▼
Job pushed → BullMQ Queue
      │
      ▼
Worker processes job:
  ├─ Extract text from PDF
  ├─ Split into chunks
  ├─ Generate embeddings (Ollama)
  └─ Store vectors → Qdrant
      │
      ▼
User asks a question
      │
      ▼
Backend retrieves relevant chunks → Qdrant
      │
      ▼
LLM generates answer (Ollama) using retrieved context
      │
      ▼
Response streamed back to user
```

---

## 🐳 Docker Compose Services

| Service | Port | Description |
|---|---|---|
| Qdrant | 6333 | Vector database |
| Redis | 6379 | Queue store for BullMQ |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a PDF file |
| `POST` | `/api/chat` | Send a message and receive an answer |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Mahmudul Hasan**

- GitHub: [@mHasan1037](https://github.com/mHasan1037)
