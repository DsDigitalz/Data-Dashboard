import React, { useState } from "react";
import Navbar from "./components/Navbar";
import OverviewDashboard from "./components/OverviewDashboard";
import CybersecurityDashboard from "./components/CybersecurityDashboard";
import WeatherDashboard from "./components/WeatherDashboard";
import TechNewsDashboard from "./components/TechNewsDashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // API statuses are managed dynamically
  const [apiStatuses, setApiStatuses] = useState({ cve: "online", weather: "loading", news: "online" });

  const updateApiStatus = (key, status) => {
    setApiStatuses(prev => ({ ...prev, [key]: status }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Subtle radial glow behind the page */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiStatuses={apiStatuses} />

      {/* Main content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {activeTab === "dashboard" && (
          <OverviewDashboard setActiveTab={setActiveTab} />
        )}

        {activeTab === "security" && <CybersecurityDashboard />}

        {activeTab === "weather" && (
          <WeatherDashboard onStatusChange={updateApiStatus} />
        )}

        {activeTab === "tech-news" && (
          <TechNewsDashboard onStatusChange={updateApiStatus} />
        )}
      </main>
    </div>
  );
}
