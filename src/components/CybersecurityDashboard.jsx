import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiSearch,
  FiFilter,
  FiX,
  FiExternalLink,
  FiClock,
  FiLoader,
  FiAlertTriangle,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiTerminal,
  FiCpu,
  FiPackage,
  FiLink,
  FiInfo,
  FiAlertOctagon,
  FiCheckCircle,
} from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────────────────────────
const CVE_URL = "https://cve.circl.lu/api/last";

const SEVERITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseCvssScore(item) {
  if (item.cvss != null && !isNaN(parseFloat(item.cvss))) return parseFloat(item.cvss);
  if (item.severity?.[0]?.score) {
    const m = item.severity[0].score.match(/\/([0-9.]+)$/);
    if (m) return parseFloat(m[1]);
    if (!isNaN(parseFloat(item.severity[0].score))) return parseFloat(item.severity[0].score);
  }
  if (item.document?.aggregate_severity?.text) {
    const t = item.document.aggregate_severity.text.toLowerCase();
    if (t.includes("critical") || t.includes("important")) return 8.5;
    if (t.includes("moderate")) return 5.5;
    return 3.0;
  }
  return 5.0;
}

function getSeverity(score) {
  if (score >= 9.0) return {
    label: "Critical", short: "CRIT",
    ring:  "ring-red-500/30",
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
    bar:   "bg-red-500",
    dot:   "bg-red-500",
    text:  "text-red-400",
    glow:  "shadow-red-500/10",
    icon:  <FiAlertOctagon className="w-3.5 h-3.5" />,
  };
  if (score >= 7.0) return {
    label: "High", short: "HIGH",
    ring:  "ring-orange-500/30",
    badge: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    bar:   "bg-orange-500",
    dot:   "bg-orange-500",
    text:  "text-orange-400",
    glow:  "shadow-orange-500/10",
    icon:  <FiAlertTriangle className="w-3.5 h-3.5" />,
  };
  if (score >= 4.0) return {
    label: "Medium", short: "MED",
    ring:  "ring-amber-500/30",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    bar:   "bg-amber-500",
    dot:   "bg-amber-500",
    text:  "text-amber-400",
    glow:  "shadow-amber-500/10",
    icon:  <FiInfo className="w-3.5 h-3.5" />,
  };
  return {
    label: "Low", short: "LOW",
    ring:  "ring-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    bar:   "bg-emerald-500",
    dot:   "bg-emerald-500",
    text:  "text-emerald-400",
    glow:  "shadow-emerald-500/10",
    icon:  <FiCheckCircle className="w-3.5 h-3.5" />,
  };
}

function formatDate(str) {
  if (!str) return "N/A";
  return new Date(str).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function getCveTitle(item) {
  return item.id || item.document?.tracking?.id || "CVE-UNKNOWN";
}

function getCveDesc(item) {
  return (
    item.details ||
    item.document?.notes?.find(n => n.category === "description")?.text ||
    item.document?.notes?.[1]?.text ||
    "No description available."
  );
}

function decodeCvssVector(vectorStr) {
  if (!vectorStr || !vectorStr.includes("CVSS:")) return null;
  const map = {
    AV: { N: "Network (Remote)", A: "Adjacent Network", L: "Local", P: "Physical" },
    AC: { L: "Low (Exploitable easily)", H: "High (Complex conditions)" },
    PR: { N: "None (No auth)", L: "Low (User-level)", H: "High (Admin)" },
    UI: { N: "None (No user action)", R: "Required (Social engineering)" },
    S:  { U: "Unchanged (App scope)", C: "Changed (Host/System scope)" },
    C:  { H: "High (Full read)", L: "Low (Partial read)", N: "None" },
    I:  { H: "High (Full write)", L: "Low (Partial write)", N: "None" },
    A:  { H: "High (Total DoS)", L: "Low (Partial DoS)", N: "None" },
  };
  const labels = { AV: "Attack Vector", AC: "Attack Complexity", PR: "Privileges Required",
    UI: "User Interaction", S: "Scope", C: "Confidentiality", I: "Integrity", A: "Availability" };
  const parts = vectorStr.split("/").slice(1); // skip "CVSS:3.x"
  const result = [];
  parts.forEach(part => {
    const [k, v] = part.split(":");
    if (map[k] && map[k][v]) {
      result.push({ metric: labels[k] || k, value: map[k][v] });
    }
  });
  return result.length ? result : null;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-5 flex items-center gap-4 animate-pulse" style={{ opacity: 1 - i * 0.1 }}>
          <div className="w-2 h-10 rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-36 bg-zinc-800 rounded" />
              <div className="h-4 w-16 bg-zinc-800 rounded-full" />
              <div className="h-4 w-20 bg-zinc-800 rounded" />
            </div>
            <div className="h-3 w-4/5 bg-zinc-800/70 rounded" />
            <div className="h-3 w-3/5 bg-zinc-800/50 rounded" />
          </div>
          <div className="h-8 w-24 bg-zinc-800 rounded-xl flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ThreatModal({ cve, onClose }) {
  const score     = parseCvssScore(cve);
  const sev       = getSeverity(score);
  const title     = getCveTitle(cve);
  const desc      = getCveDesc(cve);
  const published = formatDate(cve.published);
  const modified  = formatDate(cve.modified || cve.updated);
  const vectorStr = cve.severity?.[0]?.score || "";
  const decoded   = decodeCvssVector(vectorStr);
  const affected  = cve.affected || [];
  const refs      = cve.references || [];

  // Trap focus inside modal with Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950/80 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl bg-zinc-900 border border-zinc-800 ${sev.text}`}>
              <FiShield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-zinc-100 font-mono tracking-wide text-base truncate">{title}</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Vulnerability Advisory Report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all cursor-pointer flex-shrink-0 ml-3"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Score + Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CVSS Score card */}
            <div className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br ${
              score >= 9 ? "from-red-900/40 to-zinc-900 border border-red-800/40" :
              score >= 7 ? "from-orange-900/40 to-zinc-900 border border-orange-800/40" :
              score >= 4 ? "from-amber-900/40 to-zinc-900 border border-amber-800/40" :
                           "from-emerald-900/40 to-zinc-900 border border-emerald-800/40"
            }`}>
              <div className={`text-4xl font-extrabold font-mono leading-none ${sev.text}`}>
                {score.toFixed(1)}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${sev.text}`}>{sev.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">CVSS v3 Score</p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <FiClock className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Published</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5">{published}</p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <FiRefreshCw className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Last Modified</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5">{modified}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <FiInfo className="w-3.5 h-3.5" /> Vulnerability Description
            </h4>
            <p className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-300 leading-relaxed">
              {desc}
            </p>
          </div>

          {/* CVSS Vector breakdown */}
          {decoded && (
            <div className="space-y-2">
              <h4 className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <FiCpu className="w-3.5 h-3.5 text-indigo-400" /> CVSS Attack Vector Decoded
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {decoded.map(({ metric, value }) => (
                  <div key={metric} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{metric}</p>
                    <p className="text-[11px] font-semibold text-zinc-200 mt-1 leading-snug">{value}</p>
                  </div>
                ))}
              </div>
              <div className="font-mono text-[10px] text-zinc-500 bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2">
                Raw vector: {vectorStr}
              </div>
            </div>
          )}

          {/* Affected packages */}
          {affected.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <FiPackage className="w-3.5 h-3.5 text-amber-400" /> Affected Components
              </h4>
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/60 max-h-40 overflow-y-auto">
                {affected.map((aff, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                      {aff.package?.name ?? "unknown"}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono uppercase">
                        {aff.package?.ecosystem ?? "N/A"}
                      </span>
                      {aff.ranges?.[0]?.events?.[1]?.fixed && (
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                          ✓ Fixed: {aff.ranges[0].events[1].fixed}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References */}
          {refs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <FiLink className="w-3.5 h-3.5 text-blue-400" /> References & Advisories
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {refs.slice(0, 8).map((ref, i) => (
                  <li key={i}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3.5 py-3 text-zinc-400 hover:text-indigo-400 transition-all group"
                    >
                      <span className="truncate text-xs font-mono pr-3">{ref.url}</span>
                      <FiExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover:text-indigo-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
            <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Apply patches promptly — unmitigated vulnerabilities pose systemic risk.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CybersecurityDashboard() {
  const [cves,         setCves]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [sevFilter,    setSevFilter]    = useState("All");
  const [activeCve,    setActiveCve]    = useState(null);
  const [expanded,     setExpanded]     = useState(null);   // row quick-expand id
  const [lastRefresh,  setLastRefresh]  = useState(null);
  const searchRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  async function fetchCves() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(CVE_URL);
      if (!Array.isArray(data)) throw new Error("Unexpected response format from CVE API.");
      setCves(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || "Failed to connect to vulnerability database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCves(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = (() => {
    let critical = 0, high = 0, medium = 0, low = 0;
    cves.forEach(item => {
      const s = parseCvssScore(item);
      if (s >= 9) critical++; else if (s >= 7) high++;
      else if (s >= 4) medium++; else low++;
    });
    return { total: cves.length, critical, high, medium, low };
  })();

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = cves.filter(item => {
    const sev  = getSeverity(parseCvssScore(item));
    const q    = search.toLowerCase();
    const matchSearch = !q ||
      getCveTitle(item).toLowerCase().includes(q) ||
      getCveDesc(item).toLowerCase().includes(q) ||
      JSON.stringify(item.affected ?? []).toLowerCase().includes(q);
    const matchSev = sevFilter === "All" || sev.label === sevFilter;
    return matchSearch && matchSev;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-50 tracking-tight flex items-center gap-2">
            <FiShield className="w-6 h-6 text-orange-400" />
            Cybersecurity Monitor
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Live vulnerability intelligence from CIRCL CVE Search ·{" "}
            {lastRefresh ? `Synced ${lastRefresh.toLocaleTimeString()}` : "Synchronising…"}
          </p>
        </div>
        <button
          onClick={fetchCves}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : "text-zinc-400"}`} />
          Refresh Feed
        </button>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Monitored",  value: stats.total,    cls: "text-zinc-100",   bg: "bg-zinc-900/60    border-zinc-800/80"   },
          { label: "Critical",   value: stats.critical, cls: "text-red-400",    bg: "bg-red-500/5      border-red-500/15"    },
          { label: "High",       value: stats.high,     cls: "text-orange-400", bg: "bg-orange-500/5   border-orange-500/15" },
          { label: "Medium",     value: stats.medium,   cls: "text-amber-400",  bg: "bg-amber-500/5    border-amber-500/15"  },
          { label: "Low",        value: stats.low,      cls: "text-emerald-400",bg: "bg-emerald-500/5  border-emerald-500/15"},
        ].map(({ label, value, cls, bg }) => (
          <div key={label} className={`border rounded-2xl p-4 ${bg}`}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{label}</p>
            {loading
              ? <div className="h-8 w-12 bg-zinc-800 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-extrabold font-mono mt-1 ${cls}`}>{value}</p>
            }
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search CVE ID, packages, description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500/60 rounded-xl py-2.5 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity pills */}
        <div className="flex items-center gap-2 flex-wrap justify-start w-full md:w-auto">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-semibold uppercase tracking-wider flex-shrink-0">
            <FiFilter className="w-3.5 h-3.5" /> Severity:
          </span>
          {SEVERITY_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setSevFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                sevFilter === f
                  ? "bg-zinc-100 border-zinc-100 text-zinc-900"
                  : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-[10px] text-zinc-500 ml-auto whitespace-nowrap flex-shrink-0 font-mono">
            {filtered.length} / {stats.total} entries
          </p>
        )}
      </div>

      {/* ── Feed ── */}
      {loading ? (
        <RowSkeleton />
      ) : error ? (
        <div className="bg-zinc-950/80 border border-red-500/20 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <FiAlertOctagon className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-100 mb-2">CVE Feed Unreachable</h3>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <button
            onClick={fetchCves}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <FiRefreshCw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-zinc-800/50 border-dashed rounded-2xl py-16 text-center text-zinc-500">
          <FiShield className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm font-medium">No vulnerabilities match your query.</p>
          <button onClick={() => { setSearch(""); setSevFilter("All"); }} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item, idx) => {
            const score    = parseCvssScore(item);
            const sev      = getSeverity(score);
            const title    = getCveTitle(item);
            const desc     = getCveDesc(item);
            const date     = formatDate(item.published);
            const isExpand = expanded === title;

            return (
              <motion.div
                key={title + idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.025, 0.3) }}
                className={`bg-zinc-900/50 border rounded-xl transition-all duration-200 overflow-hidden ${
                  isExpand ? "border-zinc-700/80 shadow-md" : "border-zinc-800/70 hover:border-zinc-700/60"
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  {/* Severity bar */}
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${sev.bar}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100 font-mono tracking-wide">{title}</span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${sev.badge}`}>
                        {sev.icon} {sev.short} {score.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                        <FiClock className="w-3 h-3" /> {date}
                      </span>
                    </div>
                    <p className={`text-xs text-zinc-400 leading-relaxed ${isExpand ? "" : "line-clamp-2"}`}>{desc}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(isExpand ? null : title)}
                      className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all cursor-pointer"
                      title={isExpand ? "Collapse" : "Expand"}
                    >
                      <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpand ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      onClick={() => setActiveCve(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 hover:border-zinc-600 text-zinc-200 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      <FiTerminal className="w-3.5 h-3.5 text-indigo-400" />
                      Inspect
                    </button>
                  </div>
                </div>

                {/* Expanded quick-info panel */}
                <AnimatePresence initial={false}>
                  {isExpand && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-zinc-800/60"
                    >
                      <div className="px-5 py-4 bg-zinc-950/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        {/* Aliases */}
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Aliases / CVEs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(item.aliases ?? [title]).slice(0, 4).map(a => (
                              <span key={a} className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{a}</span>
                            ))}
                            {!item.aliases?.length && <span className="text-zinc-600 text-[10px]">—</span>}
                          </div>
                        </div>

                        {/* Affected packages */}
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Affected Packages</p>
                          <div className="space-y-1">
                            {(item.affected ?? []).slice(0, 3).map((aff, i) => (
                              <span key={i} className="block font-mono text-[10px] text-zinc-300">
                                {aff.package?.name ?? "unknown"}{" "}
                                <span className="text-zinc-500">({aff.package?.ecosystem})</span>
                              </span>
                            ))}
                            {!item.affected?.length && <span className="text-zinc-600 text-[10px]">No package data</span>}
                          </div>
                        </div>

                        {/* Quick links */}
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Quick References</p>
                          <div className="space-y-1">
                            {(item.references ?? []).slice(0, 3).map((r, i) => (
                              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-mono truncate"
                              >
                                <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{r.url}</span>
                              </a>
                            ))}
                            {!item.references?.length && <span className="text-zinc-600 text-[10px]">No references</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Threat Inspector Modal ── */}
      <AnimatePresence>
        {activeCve && <ThreatModal cve={activeCve} onClose={() => setActiveCve(null)} />}
      </AnimatePresence>
    </div>
  );
}
