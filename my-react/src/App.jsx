import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Consultation } from "./components/Consultation";
import { AdminPanel } from "./components/AdminPanel";
import { fetchHealth } from "./api/medicalApi";

export const App = () => {
  const [activeTab, setActiveTab] = useState("consult");
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

  return (
    <div className="app-root">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthInfo={healthInfo} 
      />

      <main className="main-content">
        {activeTab === "consult" ? (
          <Consultation />
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

export default App;
