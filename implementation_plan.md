# Admin File Upload — Medical Data Ingestion into Qdrant

## Background & Flow Understanding

### Agent Flow (LangGraph 5-Node Pipeline)
```
User Query + Patient Profile
        ↓
[Node 1] analyze_symptoms_node
  → LLM extracts symptoms + risk factors from user text
        ↓
[Node 2] retrieve_remedies_node
  → Semantic similarity search in Qdrant vector DB
  → Uses HuggingFace sentence-transformers embeddings
  → Returns top-4 matching remedy Documents
        ↓
[Node 3] formulate_prescription_node
  → LLM formulates remedy ingredients + prep steps
  → Uses retrieved Qdrant docs as RAG context
        ↓
[Node 4] precaution_guard_node
  → LLM checks safety, contraindications from DB metadata
  → Produces safety_evaluation JSON
        ↓
[Node 5] synthesize_response_node
  → LLM synthesizes full Markdown report
  → Includes precautions, red flags, dosages
```

**Key insight**: Everything the agent retrieves in Node 2 comes from Qdrant. More rich documents = better suggestions. Uploading PDFs/Excel/TXT/JSON will populate Qdrant with more knowledge → better RAG results.

> [!IMPORTANT]
> Currently there is NO admin authentication. We will add a simple **admin PIN/password** (env-based) to protect the file upload endpoint. The UI will show a password gate before showing the Admin tab.

---

## Proposed Changes

### Backend — Python (FastAPI)

#### [MODIFY] [`ingestion.py`](file:///c:/Users/aadit/OneDrive/Desktop/backendofAi/app/services/ingestion.py)
Add new functions to parse uploaded files and chunk them into Qdrant Documents:
- `parse_pdf(file_bytes)` → text using `PyMuPDF (fitz)`
- `parse_excel(file_bytes)` → text from rows using `openpyxl`
- `parse_txt(file_bytes)` → plain text decode
- `parse_json(file_bytes)` → JSON → text (handles list of remedies or free-form)
- `ingest_document_chunks(text, source_filename)` → splits text into chunks, embeds each, stores in Qdrant with metadata

#### [MODIFY] [`admin.py`](file:///c:/Users/aadit/OneDrive/Desktop/backendofAi/app/routers/admin.py)
Add new endpoint:
```
POST /api/admin/upload-document
  - Accepts: multipart/form-data with `file` + `admin_password`
  - Validates password against env var ADMIN_PASSWORD
  - Detects file type by extension (.pdf/.xlsx/.xls/.txt/.json)
  - Calls appropriate parser → text
  - Chunks text → embeds → stores in Qdrant
  - Returns: { chunks_indexed, source_filename, status }
```

#### [NEW] Add to `requirements.txt`:
- `pymupdf` — PDF parsing (PyMuPDF, imported as `fitz`)
- `openpyxl` — Excel (.xlsx) parsing
- `python-multipart` — FastAPI file upload support

#### [MODIFY] [`config.py`](file:///c:/Users/aadit/OneDrive/Desktop/backendofAi/app/config.py)
Add:
```python
ADMIN_PASSWORD: str = "admin123"  # Override in .env
```

#### [MODIFY] [`.env`](file:///c:/Users/aadit/OneDrive/Desktop/backendofAi/.env)
Add: `ADMIN_PASSWORD=your_secure_password`

---

### Frontend — React (my-react)

#### [MODIFY] [`medicalApi.js`](file:///c:/Users/aadit/OneDrive/Desktop/backendofAi/my-react/src/api/medicalApi.js)
Add `uploadMedicalDocument(file, adminPassword)` — sends multipart FormData to new endpoint.

#### [MODIFY] [`AdminPanel.jsx`](file:///c:/Users/aadit/OneDrive/Desktop/backendofAi/my-react/src/components/AdminPanel.jsx)
Add a new **"Upload Medical Document"** section with:
- Password gate (input field + unlock button) shown first
- Drag-and-drop / file picker supporting `.pdf`, `.xlsx`, `.xls`, `.txt`, `.json`
- File type badge + file size display
- Upload progress indicator (spinner)
- Success/error result with chunk count
- Beautiful UI matching existing glassmorphism design

#### [MODIFY] [`index.css`](file:///c:/Users/aadit/OneDrive/Desktop/backendofAi/my-react/src/index.css)
Add CSS classes for:
- `.upload-zone` — dashed drag-drop area
- `.upload-zone.drag-over` — highlight state
- `.file-type-badge` — colored badge per file type
- `.password-gate` — styled password input section
- `.upload-result-card` — success/error result card

---

## Verification Plan

### Automated Tests
- `uvicorn` server stays running (no crash on import of new libs)
- POST `/api/admin/upload-document` returns 201 with correct chunk count

### Manual Verification
1. Upload a `.txt` file with remedy info → check Qdrant dashboard for new vectors
2. Upload a `.json` file (array of remedies) → verify indexed
3. Upload a `.pdf` → verify text extracted and stored
4. Upload a `.xlsx` → verify row data ingested
5. Consult the agent with a symptom from the uploaded data → verify improved suggestion
6. Try upload with wrong password → verify 403 Forbidden
