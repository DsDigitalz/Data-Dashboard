import React, { useState } from "react";
import { FiAlertOctagon, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";

export default function ErrorMessage({
  title = "Telemetry Connection Failed",
  message = "Unable to establish secure telemetry connection with external gateway.",
  retryAction,
  diagnostics,
}) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!retryAction) return;
    setRetrying(true);
    try {
      await retryAction();
    } catch (e) {
      console.error("Retry handler failed", e);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="bg-zinc-950/80 border border-red-500/10 hover:border-red-500/20 rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background decoration glow */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-600/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-red-600/5 rounded-full blur-xl pointer-events-none" />

      {/* Warning Circle */}
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
        <FiAlertOctagon className="w-6 h-6 text-red-400" />
      </div>

      {/* Main Title */}
      <h3 className="text-base font-bold text-zinc-100 tracking-tight mb-2">
        {title}
      </h3>

      {/* Description Message */}
      <p className="text-xs text-zinc-400 leading-relaxed mb-5 max-w-sm mx-auto">
        {message}
      </p>

      {/* Diagnostics Logs Box */}
      {diagnostics && (
        <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl px-4 py-2.5 mb-6 text-left text-[10px] font-mono text-zinc-500 space-y-1 overflow-x-auto max-h-24">
          <p className="font-semibold text-zinc-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
            <FiAlertTriangle className="w-3.5 h-3.5 text-red-500/60" /> Diagnostics
          </p>
          <p className="leading-snug text-red-400/70 whitespace-pre-wrap">{diagnostics}</p>
        </div>
      )}

      {/* Action CTA */}
      {retryAction && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-5 py-2 bg-red-600/90 hover:bg-red-500 border border-red-500/30 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-65 disabled:cursor-not-allowed select-none"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Reconnecting..." : "Retry Connection"}
        </button>
      )}
    </div>
  );
}
