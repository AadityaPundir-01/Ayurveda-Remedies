import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { NaturalSanctuary } from "./components/NaturalSanctuary";
import { Consultation } from "./components/Consultation";
import { AdminPanel } from "./components/AdminPanel";
import { fetchHealth } from "./api/medicalApi";

export const App = () => {
  const [activeTab, setActiveTab] = useState("sanctuary");
  const [prefilledQuery, setPrefilledQuery] = useState("");
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    // Initial health check
    fetchHealth().then(setHealthInfo);

    // Periodically refresh health status every 30 seconds
    const interval = setInterval(() => {
      fetchHealth().then(setHealthInfo);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleStartConsultation = (query = "") => {
    if (query) {
      setPrefilledQuery(query);
    }
    setActiveTab("consult");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-root">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthInfo={healthInfo} 
      />

      <main className="main-content">
        {activeTab === "sanctuary" && (
          <NaturalSanctuary onStartConsultation={handleStartConsultation} />
        )}

        {activeTab === "consult" && (
          <Consultation 
            initialQuery={prefilledQuery}
            onBackToSanctuary={() => {
              setActiveTab("sanctuary");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {activeTab === "admin" && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

export default App;
