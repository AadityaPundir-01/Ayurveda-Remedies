import React from "react";
import { Stethoscope, Database, ShieldAlert, Sparkles, Activity } from "lucide-react";

export function Header({ activeTab, setActiveTab, healthInfo }) {
  const isHealthy = healthInfo?.status === "healthy";
  const isQdrantConnected = healthInfo?.qdrant?.status === "connected";

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-brand">
          <div className="logo-icon-wrapper">
            <span className="leaf-emoji">🌿</span>
          </div>
          <div>
            <div className="brand-row">
              <h1 className="brand-title">AyurAgent AI</h1>
              <span className="badge-agentic">
                <Sparkles size={12} className="inline mr-1" />
                LangGraph RAG
              </span>
            </div>
            <p className="brand-tagline">
              Agentic Home Remedy Prescriptions with Mandatory Precaution Guardrails
            </p>
          </div>
        </div>

        {/* Tab Buttons & Connection Status */}
        <div className="header-actions">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === "consult" ? "active" : ""}`}
              onClick={() => setActiveTab("consult")}
            >
              <Stethoscope size={16} />
              <span>Consultation</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              <Database size={16} />
              <span>Admin Knowledge Base</span>
            </button>
          </div>

          {/* Health status pill */}
          <div className={`status-pill ${isHealthy && isQdrantConnected ? "status-ok" : "status-err"}`}>
            <Activity size={14} className="pulse-dot" />
            <div className="status-text">
              <span className="status-label">
                {isHealthy && isQdrantConnected ? "Backend Active" : "Backend Offline"}
              </span>
              {isHealthy && (
                <span className="status-meta">
                  {healthInfo.llm_provider?.toUpperCase()} • Qdrant OK
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
