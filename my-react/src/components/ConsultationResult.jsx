import React from "react";
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, 
  Clock, Flame, HeartHandshake, Info, ShieldX 
} from "lucide-react";

export function ConsultationResult({ result }) {
  const {
    identified_symptoms = [],
    patient_warnings = [],
    recommended_remedies = [],
    critical_precautions = [],
    who_should_avoid = [],
    when_to_seek_doctor = [],
    full_advice_markdown = "",
    disclaimer = ""
  } = result;

  return (
    <div className="result-container">
      {/* 1. Header & Matched Symptoms */}
      <div className="result-header glass-panel">
        <div className="result-title-row">
          <div className="result-badge">
            <CheckCircle2 size={16} />
            <span>Agent Consultation Report</span>
          </div>
          <span className="timestamp">Verified by Precaution Guardrail</span>
        </div>

        <div className="symptoms-matched-box">
          <span className="symptoms-label">Target Symptoms Addressed:</span>
          <div className="symptoms-pills">
            {identified_symptoms.length > 0 ? (
              identified_symptoms.map((sym, idx) => (
                <span key={idx} className="symptom-tag">{sym}</span>
              ))
            ) : (
              <span className="symptom-tag">General Discomfort</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. HIGH PRIORITY: Patient Specific Alert (if triggered) */}
      {patient_warnings.length > 0 && (
        <div className="alert-card patient-danger-alert">
          <div className="alert-header">
            <AlertTriangle size={24} className="alert-icon" />
            <div>
              <h3 className="alert-title">Direct Patient Warning</h3>
              <p className="alert-sub">Based on your submitted health profile, observe these immediate alerts:</p>
            </div>
          </div>
          <ul className="alert-list">
            {patient_warnings.map((warn, idx) => (
              <li key={idx}><strong>{warn}</strong></li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. MANDATORY PRECAUTIONS & WHO MUST AVOID (Core requirement) */}
      <div className="alert-card contraindication-card">
        <div className="alert-header">
          <ShieldX size={24} className="contra-icon" />
          <div>
            <h3 className="contra-title">⚠️ Who Must Avoid This (Contraindications)</h3>
            <p className="contra-sub">
              Do NOT take these remedies or ingredient combinations if you belong to any of the following groups:
            </p>
          </div>
        </div>

        <div className="contra-content">
          <ul className="contra-list">
            {who_should_avoid.map((group, idx) => (
              <li key={idx} className="contra-item">
                <span className="bullet-cross">✕</span>
                <span>{group}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. Formulated Remedy Cards */}
      <div className="remedies-section">
        <h3 className="section-title">
          <span>🍵 Recommended Natural Formulation & Dosage</span>
        </h3>

        {recommended_remedies.map((remedy, idx) => (
          <div key={idx} className="remedy-card glass-panel">
            <div className="remedy-header">
              <h4 className="remedy-name">{remedy.remedy_name}</h4>
              <span className="remedy-badge">Natural Prescription</span>
            </div>

            {/* Ingredients */}
            <div className="remedy-block">
              <h5 className="block-title">Required Ingredients & Exact Measurements:</h5>
              <div className="ingredients-grid">
                {remedy.ingredients.map((ing, i) => (
                  <div key={i} className="ingredient-item">
                    <span className="ingredient-dot">•</span>
                    <span className="ingredient-text">{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Steps */}
            <div className="remedy-block">
              <h5 className="block-title">Step-by-Step Preparation:</h5>
              <p className="prep-text">{remedy.preparation}</p>
            </div>

            {/* Dosage & Schedule */}
            <div className="remedy-block dosage-block">
              <div className="dosage-icon-wrapper">
                <Clock size={18} />
              </div>
              <div>
                <h5 className="block-title">Dosage & Frequency:</h5>
                <p className="dosage-text">{remedy.dosage}</p>
              </div>
            </div>

            {/* Scientific / Herbal Benefits */}
            {remedy.benefits && (
              <div className="remedy-block benefits-block">
                <h5 className="block-title">Why This Remedy Helps:</h5>
                <p className="benefits-text">{remedy.benefits}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Safe Usage Rules & Daily Limits */}
      {critical_precautions.length > 0 && (
        <div className="precautions-card glass-panel">
          <div className="precautions-header">
            <ShieldAlert size={20} className="shield-icon" />
            <h4>Critical Precautions & Safe Usage Rules</h4>
          </div>
          <ul className="precautions-list">
            {critical_precautions.map((prec, idx) => (
              <li key={idx}>{prec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Emergency Red Flags (When to See a Doctor) */}
      {when_to_seek_doctor.length > 0 && (
        <div className="doctor-warning-card">
          <div className="doc-header">
            <AlertTriangle size={20} />
            <h4>When to Stop Home Remedies and Seek Immediate Medical Care</h4>
          </div>
          <ul className="doc-list">
            {when_to_seek_doctor.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Medical Disclaimer */}
      <footer className="disclaimer-footer">
        <Info size={16} />
        <p>{disclaimer}</p>
      </footer>
    </div>
  );
}
