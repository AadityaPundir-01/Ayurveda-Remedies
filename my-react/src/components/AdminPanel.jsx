import React, { useState, useEffect, useRef } from "react";
import { 
  Database, PlusCircle, RefreshCw, CheckCircle2, 
  AlertCircle, Trash2, ShieldAlert, Tag, Clock, Layers,
  Upload, FileText, FileSpreadsheet, File, Lock, Unlock,
  CloudUpload, X, CheckCircle
} from "lucide-react";
import { fetchRemediesList, addRemedyToDB, uploadMedicalDocument } from "../api/medicalApi";

// ─── File type config ───────────────────────────────────────────────────────
const FILE_TYPE_CONFIG = {
  pdf:  { label: "PDF",   color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", icon: FileText },
  xlsx: { label: "Excel", color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: FileSpreadsheet },
  xls:  { label: "Excel", color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: FileSpreadsheet },
  txt:  { label: "Text",  color: "#0284c7", bg: "#eff6ff", border: "#93c5fd", icon: FileText },
  json: { label: "JSON",  color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", icon: File },
};

function getFileExtension(filename) {
  return filename ? filename.rsplit?.(".", 1)?.[1]?.toLowerCase() ?? filename.split(".").pop().toLowerCase() : "";
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Upload Zone Sub-Component ───────────────────────────────────────────────
function DocumentUploadSection() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [storedPassword, setStoredPassword] = useState("");
  const fileInputRef = useRef(null);

  const ALLOWED_EXTS = ["pdf", "xlsx", "xls", "txt", "json"];

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError("Please enter the admin password.");
      return;
    }
    // We'll validate against the backend on first upload attempt.
    // Store locally for use in the upload request.
    setStoredPassword(passwordInput.trim());
    setIsUnlocked(true);
    setPasswordError("");
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPasswordInput("");
    setStoredPassword("");
    setSelectedFile(null);
    setUploadResult(null);
    setUploadError(null);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setUploadError(`File type ".${ext}" is not supported. Please upload a PDF, Excel, TXT, or JSON file.`);
      setSelectedFile(null);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File is too large. Maximum allowed size is 20 MB.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
    setUploadError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files[0]);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const result = await uploadMedicalDocument(selectedFile, storedPassword);
      setUploadResult(result);
      setSelectedFile(null);
    } catch (err) {
      if (err.message?.includes("Invalid admin password") || err.message?.includes("Access denied")) {
        setUploadError("❌ Wrong admin password. Please lock and re-enter the correct password.");
        handleLock();
      } else {
        setUploadError(err.message || "Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadError(null);
  };

  const fileExt = selectedFile ? selectedFile.name.split(".").pop().toLowerCase() : null;
  const fileConfig = fileExt ? FILE_TYPE_CONFIG[fileExt] : null;
  const FileIcon = fileConfig?.icon ?? File;

  return (
    <section className="upload-section glass-panel">
      {/* Section Header */}
      <div className="upload-section-header">
        <div className="upload-title-group">
          <div className="card-badge upload-badge">
            <CloudUpload size={14} />
            <span>Document Ingestion</span>
          </div>
          <h3 className="upload-title">Upload Medical Document</h3>
          <p className="upload-subtitle">
            Ingest PDF, Excel, TXT, or JSON files directly into the Qdrant vector knowledge base.
            Uploaded content becomes available to the LangGraph agent for better symptom matching.
          </p>
        </div>
        {/* Lock/Unlock indicator */}
        <div className={`lock-badge ${isUnlocked ? "lock-badge--unlocked" : "lock-badge--locked"}`}>
          {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
          <span>{isUnlocked ? "Admin Unlocked" : "Admin Locked"}</span>
        </div>
      </div>

      {/* Supported file types */}
      <div className="supported-types-row">
        <span className="supported-label">Supported formats:</span>
        {Object.entries(FILE_TYPE_CONFIG).filter(([k]) => k !== "xls").map(([ext, cfg]) => (
          <span
            key={ext}
            className="file-type-badge"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            .{ext}
          </span>
        ))}
        <span className="file-type-badge" style={{ color: "#16a34a", background: "#f0fdf4", border: "1px solid #86efac" }}>.xls</span>
      </div>

      {/* ── Password Gate ── */}
      {!isUnlocked ? (
        <form className="password-gate" onSubmit={handleUnlock}>
          <div className="password-gate-inner">
            <div className="password-gate-icon">
              <Lock size={28} />
            </div>
            <div className="password-gate-content">
              <h4 className="password-gate-title">Admin Authentication Required</h4>
              <p className="password-gate-desc">
                Enter your admin password to enable medical document uploads.
              </p>
              <div className="password-input-row">
                <input
                  type="password"
                  className="password-input"
                  placeholder="Enter admin password..."
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
                  autoComplete="current-password"
                  id="admin-password-input"
                />
                <button type="submit" className="unlock-btn">
                  <Unlock size={15} />
                  <span>Unlock</span>
                </button>
              </div>
              {passwordError && (
                <p className="password-error">
                  <AlertCircle size={13} /> {passwordError}
                </p>
              )}
            </div>
          </div>
        </form>
      ) : (
        /* ── Upload Zone (shown after unlock) ── */
        <div className="upload-unlocked-area">
          {/* Lock button */}
          <button className="relock-btn" onClick={handleLock} title="Lock admin access">
            <Lock size={13} />
            <span>Lock</span>
          </button>

          {/* Drag & Drop Zone */}
          {!selectedFile && (
            <div
              className={`upload-drop-zone ${isDragOver ? "drag-over" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.txt,.json"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="doc-file-input"
              />
              <div className="drop-zone-icon">
                <Upload size={36} />
              </div>
              <p className="drop-zone-title">
                {isDragOver ? "Drop file here to upload" : "Drag & drop a file here"}
              </p>
              <p className="drop-zone-subtitle">or click to browse files</p>
              <p className="drop-zone-limit">Max file size: 20 MB</p>
            </div>
          )}

          {/* Selected File Preview */}
          {selectedFile && !uploadResult && (
            <div className="selected-file-card">
              <div className="selected-file-icon" style={{ background: fileConfig?.bg, border: `1px solid ${fileConfig?.border}` }}>
                <FileIcon size={24} style={{ color: fileConfig?.color }} />
              </div>
              <div className="selected-file-info">
                <p className="selected-file-name">{selectedFile.name}</p>
                <div className="selected-file-meta">
                  <span
                    className="file-type-badge"
                    style={{ color: fileConfig?.color, background: fileConfig?.bg, border: `1px solid ${fileConfig?.border}` }}
                  >
                    .{fileExt}
                  </span>
                  <span className="file-size-text">{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
              <div className="selected-file-actions">
                <button
                  className="upload-confirm-btn"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={15} className="spin-icon" />
                      <span>Indexing...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload size={15} />
                      <span>Ingest to Qdrant</span>
                    </>
                  )}
                </button>
                <button className="clear-file-btn" onClick={clearFile} disabled={uploading} title="Remove file">
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress-bar-container">
              <div className="upload-progress-bar upload-progress-animate" />
              <p className="upload-progress-label">
                Parsing document, generating embeddings, and indexing chunks into Qdrant...
              </p>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="upload-result-card upload-result--success">
              <div className="upload-result-icon">
                <CheckCircle size={24} />
              </div>
              <div className="upload-result-body">
                <p className="upload-result-title">Document Successfully Indexed! 🎉</p>
                <p className="upload-result-file">{uploadResult.source_file}</p>
                <div className="upload-result-stats">
                  <div className="stat-chip">
                    <span className="stat-label">Chunks Indexed</span>
                    <span className="stat-value">{uploadResult.chunks_indexed}</span>
                  </div>
                  <div className="stat-chip">
                    <span className="stat-label">Characters</span>
                    <span className="stat-value">{uploadResult.characters_extracted?.toLocaleString()}</span>
                  </div>
                  <div className="stat-chip">
                    <span className="stat-label">File Type</span>
                    <span className="stat-value">.{uploadResult.file_type}</span>
                  </div>
                  <div className="stat-chip">
                    <span className="stat-label">File Size</span>
                    <span className="stat-value">{uploadResult.file_size_mb} MB</span>
                  </div>
                </div>
                <p className="upload-result-note">
                  The agent will now use this document's knowledge when matching user symptoms.
                </p>
              </div>
              <button className="upload-another-btn" onClick={clearFile}>
                <Upload size={14} />
                <span>Upload Another</span>
              </button>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="upload-result-card upload-result--error">
              <AlertCircle size={20} />
              <div>
                <p className="upload-result-title">Upload Failed</p>
                <p className="upload-result-error-msg">{uploadError}</p>
              </div>
              <button className="upload-another-btn upload-retry-btn" onClick={() => setUploadError(null)}>
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}


// ─── Main AdminPanel Component ───────────────────────────────────────────────
export function AdminPanel() {
  const [remedies, setRemedies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [ingredients, setIngredients] = useState([
    { name: "", amount: "", notes: "" }
  ]);
  const [prepSteps, setPrepSteps] = useState("");
  const [dosage, setDosage] = useState("");
  const [precautions, setPrecautions] = useState("");
  const [whoAvoid, setWhoAvoid] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadRemedies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRemediesList(50);
      setRemedies(data.remedies || []);
    } catch (err) {
      console.error(err);
      setError("Could not load remedies from vector store: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRemedies();
  }, []);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "", notes: "" }]);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleCreateRemedy = async (e) => {
    e.preventDefault();
    if (!name.trim() || !symptoms.trim() || !dosage.trim() || !whoAvoid.trim()) {
      alert("Please fill in the Remedy Name, Symptoms, Dosage, and Who Should Avoid fields.");
      return;
    }

    const payload = {
      name: name.trim(),
      applicable_symptoms: symptoms.split(",").map(s => s.trim()).filter(Boolean),
      ingredients: ingredients.filter(i => i.name.trim() !== ""),
      preparation_steps: prepSteps.split("\n").map(s => s.trim()).filter(Boolean),
      dosage_and_frequency: dosage.trim(),
      precautions_and_contraindications: precautions.split("\n").map(s => s.trim()).filter(Boolean),
      who_should_avoid: whoAvoid.split("\n").map(s => s.trim()).filter(Boolean),
      possible_side_effects: [],
      tags: tags.split(",").map(s => s.trim()).filter(Boolean)
    };

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await addRemedyToDB(payload);
      setSuccessMsg(`Successfully indexed '${name}' into Qdrant Vector DB!`);
      // Reset form
      setName("");
      setSymptoms("");
      setIngredients([{ name: "", amount: "", notes: "" }]);
      setPrepSteps("");
      setDosage("");
      setPrecautions("");
      setWhoAvoid("");
      setTags("");
      setShowAddForm(false);
      loadRemedies();
    } catch (err) {
      setError(err.message || "Failed to index remedy");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-view">
      {/* ── Document Upload Section ── */}
      <DocumentUploadSection />

      {/* ── Divider ── */}
      <div className="admin-section-divider">
        <span>Manual Remedy Entry</span>
      </div>

      {/* ── Remedy Header + Actions ── */}
      <div className="admin-header-row">
        <div>
          <div className="card-badge">
            <Database size={16} />
            <span>Admin Knowledge Management</span>
          </div>
          <h2 className="section-heading">Vector Database Remedies</h2>
          <p className="section-sub">
            Ingest and manage verified medical and natural remedies. Every remedy added here is embedded
            with local Hugging Face embeddings and stored in Qdrant for RAG matching.
          </p>
        </div>

        <div className="admin-actions">
          <button
            className="refresh-btn"
            onClick={loadRemedies}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          <button
            className="add-remedy-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <PlusCircle size={16} />
            <span>{showAddForm ? "Cancel" : "Add New Remedy"}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Add Remedy Modal / Form */}
      {showAddForm && (
        <section className="add-remedy-card glass-panel">
          <h3 className="form-title">🌿 Ingest New Home Remedy</h3>
          <p className="form-sub">
            Add detailed instructions, ingredients, and mandatory contraindications to expand the Agent's knowledge base.
          </p>

          <form onSubmit={handleCreateRemedy} className="remedy-ingest-form">
            <div className="form-grid">
              <div className="form-field full-width">
                <label>Remedy Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Licorice & Cinnamon Soothing Infusion"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field full-width">
                <label>Applicable Symptoms (Comma separated) *</label>
                <input
                  type="text"
                  placeholder="e.g. dry cough, heartburn, acid reflux, throat tickle"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                />
              </div>

              {/* Dynamic Ingredients List */}
              <div className="form-field full-width">
                <div className="ingredients-header">
                  <label>Ingredients & Dosages *</label>
                  <button
                    type="button"
                    className="add-ing-btn"
                    onClick={handleAddIngredient}
                  >
                    + Add Ingredient
                  </button>
                </div>
                <div className="ingredients-inputs-list">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="ingredient-row">
                      <input
                        type="text"
                        placeholder="Ingredient Name (e.g. Licorice Root)"
                        value={ing.name}
                        onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Amount (e.g. 1 teaspoon dried)"
                        value={ing.amount}
                        onChange={(e) => handleIngredientChange(idx, "amount", e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Notes (Optional)"
                        value={ing.notes}
                        onChange={(e) => handleIngredientChange(idx, "notes", e.target.value)}
                      />
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          className="delete-ing-btn"
                          onClick={() => handleRemoveIngredient(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-field full-width">
                <label>Preparation Steps (One per line) *</label>
                <textarea
                  rows={3}
                  placeholder="Boil 1.5 cups of water in a saucepan.&#10;Add licorice and simmer for 5 minutes.&#10;Strain into a cup and sip warm."
                  value={prepSteps}
                  onChange={(e) => setPrepSteps(e.target.value)}
                  required
                />
              </div>

              <div className="form-field full-width">
                <label>Recommended Dosage & Frequency *</label>
                <input
                  type="text"
                  placeholder="e.g. Drink 1 cup warm 2 times daily for up to 5 days."
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  required
                />
              </div>

              <div className="form-field full-width danger-input-field">
                <label>
                  <ShieldAlert size={16} className="inline text-red-500 mr-1" />
                  Who Must Avoid This Remedy (One per line) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Infants under 12 months&#10;Individuals with Hypertension / High BP&#10;Pregnant women&#10;Patients with chronic kidney disease"
                  value={whoAvoid}
                  onChange={(e) => setWhoAvoid(e.target.value)}
                  required
                />
              </div>

              <div className="form-field full-width">
                <label>Precautions & Interaction Warnings (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="Do not consume for more than 7 consecutive days.&#10;May interact with blood pressure medications."
                  value={precautions}
                  onChange={(e) => setPrecautions(e.target.value)}
                />
              </div>

              <div className="form-field full-width">
                <label>Categorization Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. respiratory, throat, digestion, soothing"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div className="form-submit-row">
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Indexing Vector in Qdrant...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    <span>Embed & Ingest Remedy</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Indexed Remedies Cards Grid */}
      <div className="remedies-grid">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spin-icon" />
            <p>Fetching remedies from Qdrant vector database...</p>
          </div>
        ) : remedies.length === 0 ? (
          <div className="empty-state">
            <Database size={32} />
            <p>No remedies found in the database. Add your first remedy above!</p>
          </div>
        ) : (
          remedies.map((rem) => (
            <div key={rem.id} className="admin-remedy-card glass-panel">
              <div className="card-top">
                <h4 className="card-rem-name">{rem.name}</h4>
                <span className="card-rem-id">ID: {rem.id?.substring(0, 8)}...</span>
              </div>

              <div className="symptoms-sublist">
                <strong>Symptoms:</strong>
                <div className="sublist-pills">
                  {rem.applicable_symptoms?.map((s, idx) => (
                    <span key={idx} className="mini-pill">{s}</span>
                  ))}
                </div>
              </div>

              <div className="dosage-snippet">
                <Clock size={14} />
                <span>{rem.dosage_and_frequency || "Standard herbal dose"}</span>
              </div>

              {rem.who_should_avoid && rem.who_should_avoid.length > 0 && (
                <div className="avoid-box">
                  <div className="avoid-title">
                    <ShieldAlert size={14} />
                    <span>Who Must Avoid:</span>
                  </div>
                  <ul className="avoid-list">
                    {rem.who_should_avoid.slice(0, 3).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {rem.who_should_avoid.length > 3 && (
                      <li className="more-text">+{rem.who_should_avoid.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
