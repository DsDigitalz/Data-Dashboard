import React, { useState } from "react";
import Navbar from "./components/Navbar";
import OverviewDashboard from "./components/OverviewDashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // API statuses are managed inside each dashboard — Navbar shows a static "online" for now
  const [apiStatuses] = useState({ cve: "online", weather: "online", news: "online" });

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

        {activeTab !== "dashboard" && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zinc-300 mb-1 capitalize">
              {activeTab === "security" ? "Cybersecurity Monitor" : activeTab === "weather" ? "Weather Telemetry" : "Tech & Business"} — Coming Soon
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm">
              This section is being built next. Return to{" "}
              <button
                onClick={() => setActiveTab("dashboard")}
                className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Overview
              </button>{" "}
              to see the live dashboard.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
