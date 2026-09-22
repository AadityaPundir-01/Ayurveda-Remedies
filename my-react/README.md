# 🌿 AyurAgent AI — React Frontend

A modern, responsive user interface for the **Agentic AI Home Remedies & Medical Advisor** system, built with **React**, **Vite**, and **Lucide Icons**.

---

## 🌟 Key Features

1. **Symptom Consultation Interface**:
   - Natural language symptom input with quick-select pills.
   - Optional Patient Profile inputs (age, pregnancy, breastfeeding, allergies, chronic conditions, medications) for personalized precaution matching.
   - Multi-step animated agent workflow tracker (Extraction ➔ Vector Retrieval ➔ Formulation ➔ Precaution Guardrail).
   - Structured advice display:
     - **Prominent Contraindication Banner (Who Must Avoid)**.
     - Direct patient warnings for active risk factors.
     - Natural prescription cards with exact measurements and step-by-step preparation.
     - Dosage, frequency, and herbal benefits.
     - Critical safe usage rules & emergency red flags.

2. **Admin Knowledge Management Tab**:
   - Browse currently indexed remedies in the local Qdrant Vector Database.
   - Ingest new home remedies with symptoms, dynamic ingredients list, preparation, dosage, and mandatory contraindications.

3. **Live Health & Connection Pill**:
   - Real-time indicator showing backend connectivity, active LLM provider (Groq / Gemini), and Qdrant database status.

---

## 🚀 Running the Frontend

Ensure the FastAPI backend is running on `http://localhost:8000`.

Then in this directory:
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
