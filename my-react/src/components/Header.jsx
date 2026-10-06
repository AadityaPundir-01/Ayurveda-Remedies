import React from "react";
import { Leaf, Stethoscope, Database, ShieldAlert, Sparkles, Activity } from "lucide-react";

export function Header({ activeTab, setActiveTab, healthInfo }) {
  const isHealthy = healthInfo?.status === "healthy";
  const isQdrantConnected = healthInfo?.qdrant?.status === "connected";

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-brand" onClick={() => setActiveTab("sanctuary")} style={{ cursor: "pointer" }}>
          <div className="logo-icon-wrapper">
            <span className="leaf-emoji">🌿</span>
          </div>
          <div>
            <div className="brand-row">
              <h1 className="brand-title">AyurAgent AI</h1>
              <span className="badge-agentic">
                <Sparkles size={12} className="inline mr-1" />
                Vedic RAG AI
              </span>
            </div>
            <p className="brand-tagline">
              Natural Healing Sanctuary & LangGraph Clinical Herbal Prescriptions
            </p>
          </div>
        </div>

        {/* Tab Buttons & Connection Status */}
        <div className="header-actions">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === "sanctuary" ? "active" : ""}`}
              onClick={() => setActiveTab("sanctuary")}
            >
              <Leaf size={16} />
              <span>Natural Sanctuary</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "consult" ? "active" : ""}`}
              onClick={() => setActiveTab("consult")}
            >
              <Stethoscope size={16} />
              <span>AI Vaidya Consult</span>
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
                  {healthInfo.llm_provider?.toUpperCase()} • {healthInfo?.qdrant?.mode === "cloud" ? "Qdrant Cloud" : "Qdrant OK"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
