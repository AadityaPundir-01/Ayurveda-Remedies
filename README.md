# 🌿 Agentic AI Home Remedies & Medical Advisor Backend

An intelligent, safety-first Agentic AI system built with **FastAPI**, **LangChain**, **LangGraph**, and **Qdrant Vector Database** (running locally via Docker).

This system allows administrators to ingest structured home remedy knowledge, and enables users to consult an intelligent agent that matches symptoms against the vector database, formulates precise ingredient combinations and dosages, and enforces **strict safety and precaution guardrails** (specifying who must avoid the remedy, such as infants, pregnant individuals, or patients on medications).

---

## 🚀 Key Features

1. **Admin Knowledge Ingestion**:
   - Add single or bulk home remedies via REST endpoints (`POST /api/admin/remedies`, `POST /api/admin/remedies/bulk`).
   - Automatically converted into high-density semantic embeddings and indexed in Qdrant with full metadata.

2. **Agentic RAG Consultation Workflow (LangGraph)**:
   - **Symptom Analyzer Node**: Extracts symptoms and patient risk factors from user prompt.
   - **RAG Retrieval Node**: Queries the local Qdrant vector database for matching vetted remedies.
   - **Formulation Node**: Formulates precise ingredient combinations, step-by-step preparation, and dosage schedules.
   - **Safety & Precaution Guardrail Node**: Rigorously evaluates every ingredient against contraindications (e.g., Honey for infants under 1 year, Ginger with blood thinners, Turmeric with gallstones).
   - **Synthesizer Node**: Outputs structured, compassionate medical advice with prominent precaution callouts and emergency red flags.

3. **Dual LLM Provider Support (Groq & Google Gemini)**:
   - Easily switch between **Groq** (`llama-3.3-70b-versatile`) and **Google Gemini** (`gemini-1.5-flash`) in `.env`.

4. **100% Free Local Embeddings**:
   - Uses Hugging Face's `sentence-transformers/all-MiniLM-L6-v2` locally on CPU. No rate limits, no API token costs.

5. **Local Vector Database with Web UI**:
   - Qdrant runs in Docker Desktop with an interactive dashboard at `http://localhost:6333/dashboard`.

---

## 🛠️ Project Structure

```
backendofAi/
├── docker-compose.yml          # Docker Compose configuration for Qdrant Vector DB
├── requirements.txt            # Python dependencies
├── .env.example                # Configuration template
├── .env                        # Active environment variables
├── seed_data.py                # Database population script
├── data/
│   └── sample_remedies.json    # Initial vetted home remedies dataset
└── app/
    ├── main.py                 # FastAPI application & CORS config
    ├── config.py               # Pydantic settings
    ├── schemas/                # Pydantic models
    │   ├── remedy.py           # Admin remedy data schemas
    │   └── consult.py          # User consultation schemas
    ├── services/               # Vector DB & Embeddings
    │   ├── vector_store.py     # Qdrant client & HuggingFace embedding singleton
    │   └── ingestion.py        # Semantic chunking and vector indexing
    ├── agent/                  # LangGraph Agent Workflow
    │   ├── llm_factory.py      # Dynamic Groq / Gemini provider factory
    │   ├── state.py            # LangGraph AgentState
    │   ├── prompts.py          # Clinical & safety system prompts
    │   ├── nodes.py            # Workflow nodes (Analyze -> Retrieve -> Formulate -> Safety -> Synthesize)
    │   └── graph.py            # Compiled LangGraph workflow
    └── routers/                # FastAPI Controllers
        ├── health.py           # Healthcheck & Qdrant status
        ├── admin.py            # Admin data ingestion endpoints
        └── consult.py          # User symptom consultation endpoint
```

---

## 🏁 Quick Start Guide

### Step 1: Start Qdrant Vector Database (Docker Desktop)
Make sure **Docker Desktop** is open and running, then start the Qdrant container:

```powershell
docker compose up -d
```

- Verify Qdrant Web Dashboard: Open [http://localhost:6333/dashboard](http://localhost:6333/dashboard) in your browser.

---

### Step 2: Configure Environment Variables
Edit your `.env` file and configure your preferred LLM provider:

```env
# Choose 'groq' or 'gemini'
LLM_PROVIDER=groq

# If using Groq (Free key: https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# If using Google Gemini (Free key: https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Qdrant Settings
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=medical_home_remedies
```

---

### Step 3: Activate Virtual Environment & Seed Data

Activate the virtual environment:
```powershell
.\.venv\Scripts\Activate.ps1
```

Populate the local vector database with vetted home remedies:
```powershell
python seed_data.py
```

---

### Step 4: Run the FastAPI Server

```powershell
uvicorn app.main:app --reload --port 8000
```

- Interactive API Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 📡 API Endpoints

### 1. User Consultation (`POST /api/consult`)
Request body:
```json
{
  "query": "I have had a bad dry cough and a painful sore throat for two days.",
  "patient_profile": {
    "age": 30,
    "is_pregnant": false,
    "known_allergies": [],
    "chronic_conditions": [],
    "current_medications": []
  }
}
```

Response includes:
- Identified symptoms
- Formulated remedies with ingredient measurements & preparation
- **Critical precautions & contraindications** (who must avoid this combination)
- When to seek immediate medical attention (red flags)
- Complete markdown consultation report

### 2. Admin Add Remedy (`POST /api/admin/remedies`)
Allows administrators to ingest new medical/home remedy data into the vector database.

### 3. Admin Bulk Add Remedies (`POST /api/admin/remedies/bulk`)
Allows batch uploading remedies via JSON.

### 4. Admin List Remedies (`GET /api/admin/remedies`)
View currently indexed remedies in the Qdrant vector database.
