import React, { useState } from "react";
import { 
  Send, Sparkles, AlertCircle, ChevronDown, ChevronUp, 
  ShieldCheck, HeartPulse, User, RefreshCw, CheckCircle2 
} from "lucide-react";
import { consultRemedyAgent } from "../api/medicalApi";
import { ConsultationResult } from "./ConsultationResult";

const QUICK_SUGGESTIONS = [
  "Dry cough and scratchy sore throat",
  "Indigestion, stomach bloating, and flatulence",
  "Joint pain, mild fever recovery, and body aches",
  "Difficulty falling asleep and stress headache",
  "Throat irritation and mild congestion"
];

export function Consultation() {
  const [query, setQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  
  // Patient Profile state
  const [age, setAge] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [medications, setMedications] = useState("");

  // Request state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const handleQuickSelect = (text) => {
    setQuery(text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(1);

    // Simulate progressive step animation for user experience
    const stepTimer1 = setTimeout(() => setActiveStep(2), 700);
    const stepTimer2 = setTimeout(() => setActiveStep(3), 1400);
    const stepTimer3 = setTimeout(() => setActiveStep(4), 2100);

    const profileData = {
      age: age ? parseInt(age, 10) : null,
      is_pregnant: isPregnant,
      is_breastfeeding: isBreastfeeding,
      known_allergies: allergies ? allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
      chronic_conditions: chronicConditions ? chronicConditions.split(",").map(s => s.trim()).filter(Boolean) : [],
      current_medications: medications ? medications.split(",").map(s => s.trim()).filter(Boolean) : []
    };

    try {
      const response = await consultRemedyAgent(query, profileData);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to obtain remedy advice from the AI agent.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setLoading(false);
      setActiveStep(0);
    }
  };

  return (
    <div className="consultation-view">
      {/* Consultation Input Section */}
      <section className="consultation-card glass-panel">
        <div className="card-header">
          <div className="card-badge">
            <HeartPulse size={16} />
            <span>Symptom Intake & RAG Matcher</span>
          </div>
          <h2 className="card-title">What symptoms are you experiencing?</h2>
          <p className="card-desc">
            Describe your ailments. Our LangGraph agent will match your symptoms against the vector database,
            formulate a natural remedy with exact dosages, and enforce strict precaution checks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="consultation-form">
          <div className="input-group">
            <textarea
              className="query-textarea"
              rows={3}
              placeholder="e.g. I have a dry tickling cough, painful sore throat, and mild congestion for 2 days..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>

          {/* Quick Symptoms Suggestions */}
          <div className="quick-tags-container">
            <span className="quick-tags-label">Quick Suggestions:</span>
            <div className="quick-tags-list">
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="pill-btn"
                  onClick={() => handleQuickSelect(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Patient Profile for Tailored Safety Check */}
          <div className="profile-accordion">
            <button
              type="button"
              className="accordion-toggle"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="toggle-left">
                <User size={16} />
                <span>Patient Health Profile (Optional for Personalized Safety Warnings)</span>
              </div>
              {showProfile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showProfile && (
              <div className="accordion-content">
                <p className="accordion-hint">
                  Providing these details allows the <strong>Safety & Precaution Guardrail</strong> to verify contraindications specifically for you.
                </p>

                <div className="profile-grid">
                  <div className="form-field">
                    <label>Patient Age (Years)</label>
                    <input
                      type="number"
                      placeholder="e.g. 28 or 0.8 for infant"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>

                  <div className="form-field checkbox-field">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={isPregnant}
                        onChange={(e) => setIsPregnant(e.target.checked)}
                      />
                      <span>Currently Pregnant</span>
                    </label>
                  </div>

                  <div className="form-field checkbox-field">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={isBreastfeeding}
                        onChange={(e) => setIsBreastfeeding(e.target.checked)}
                      />
                      <span>Currently Breastfeeding</span>
                    </label>
                  </div>

                  <div className="form-field full-width">
                    <label>Known Allergies (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Honey, Ragweed, Pollen, Daisy family"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Chronic Medical Conditions (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Hypertension, Gallbladder stones, GERD, Diabetes, Peptic ulcer"
                      value={chronicConditions}
                      onChange={(e) => setChronicConditions(e.target.value)}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Current Prescription Medications (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Blood thinners (Warfarin, Aspirin), Sedatives, BP medications"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  <span>Agent Reasoning in Progress...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Consult Agentic AI</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading Step Flow Tracker */}
        {loading && (
          <div className="agent-tracker">
            <h4 className="tracker-title">Agent Workflow Execution:</h4>
            <div className="tracker-steps">
              <div className={`step-item ${activeStep >= 1 ? "step-active" : ""}`}>
                <div className="step-number">1</div>
                <span>Symptom & Profile Extraction</span>
              </div>
              <div className={`step-divider ${activeStep >= 2 ? "active" : ""}`} />
              <div className={`step-item ${activeStep >= 2 ? "step-active" : ""}`}>
                <div className="step-number">2</div>
                <span>Qdrant Vector Retrieval</span>
              </div>
              <div className={`step-divider ${activeStep >= 3 ? "active" : ""}`} />
              <div className={`step-item ${activeStep >= 3 ? "step-active" : ""}`}>
                <div className="step-number">3</div>
                <span>Prescription Formulation</span>
              </div>
              <div className={`step-divider ${activeStep >= 4 ? "active" : ""}`} />
              <div className={`step-item ${activeStep >= 4 ? "step-active" : ""}`}>
                <div className="step-number">4</div>
                <span>Precaution Guardrail</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <div className="error-text">
              <strong>Consultation Error:</strong> {error}
            </div>
          </div>
        )}
      </section>

      {/* Consultation Result Display */}
      {result && <ConsultationResult result={result} />}
    </div>
  );
}
