const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Health check to verify FastAPI and Qdrant DB connectivity.
 */
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Health check failed:", err);
    return {
      status: "offline",
      qdrant: { status: "disconnected" },
      error: err.message
    };
  }
}

/**
 * Submit user symptoms and patient profile to the LangGraph Agent.
 */
export async function consultRemedyAgent(query, patientProfile = {}) {
  const payload = {
    query,
    patient_profile: {
      age: patientProfile.age ? parseInt(patientProfile.age, 10) : null,
      is_pregnant: Boolean(patientProfile.is_pregnant),
      is_breastfeeding: Boolean(patientProfile.is_breastfeeding),
      known_allergies: patientProfile.known_allergies || [],
      chronic_conditions: patientProfile.chronic_conditions || [],
      current_medications: patientProfile.current_medications || []
    }
  };

  const res = await fetch(`${API_BASE_URL}/api/consult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Agent request failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Admin: Fetch list of remedies currently indexed in Qdrant.
 */
export async function fetchRemediesList(limit = 50) {
  const res = await fetch(`${API_BASE_URL}/api/admin/remedies?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch remedies list");
  return await res.json();
}

/**
 * Admin: Ingest a new home remedy into Qdrant vector database.
 */
export async function addRemedyToDB(remedyData) {
  const res = await fetch(`${API_BASE_URL}/api/admin/remedies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(remedyData)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to add remedy to vector database");
  }

  return await res.json();
}

/**
 * Admin: Upload a medical document (PDF/Excel/TXT/JSON) to Qdrant.
 * Uses multipart/form-data with the file and admin_password fields.
 */
export async function uploadMedicalDocument(file, adminPassword) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("admin_password", adminPassword);

  const res = await fetch(`${API_BASE_URL}/api/admin/remedies/upload-document`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser sets it automatically with boundary for multipart
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }

  return await res.json();
}
