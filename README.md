# Root — Federated RAG Intelligence Platform

A privacy-preserving federated RAG platform that enables AI across distributed data sources.

## Project Structure

```
Root/
├── frontend/          # Vite + React (TypeScript) frontend
│   ├── app/           # App-level components, pages, hooks
│   ├── components/    # Shared UI components
│   ├── pages/         # Marketing/landing pages
│   └── ...
├── backend/           # FastAPI (Python) backend
│   ├── app/
│   │   ├── routers/   # API route handlers
│   │   ├── models/    # Database models
│   │   ├── services/  # Business logic (RAG, vector store, etc.)
│   │   └── config.py  # App configuration
│   └── requirements.txt
└── README.md
```

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # Runs on http://localhost:8000
```

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, GSAP
- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL, Google Gemini AI
- **Search**: FAISS vector store for semantic search
