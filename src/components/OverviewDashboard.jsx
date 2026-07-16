import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ThreatSkeleton } from "./SkeletonLoader";
import ErrorMessage from "./ErrorMessage";
import {
  FiShield,
  FiCloud,
  FiGlobe,
  FiActivity,
  FiCheckCircle,
  FiExternalLink,
  FiArrowRight,
  FiLoader,
  FiAlertTriangle,
  FiRefreshCw,
  FiWifi,
  FiThermometer,
  FiWind,
} from "react-icons/fi";

// ─── API Config ────────────────────────────────────────────────────────────────
const CVE_URL = "https://cve.circl.lu/api/last";
const NEWS_URL = "https://api.spaceflightnewsapi.net/v4/articles/?limit=6";
const offices = [
  { id: "sf",     label: "San Francisco", lat: 37.7749,  lon: -122.4194 },
  { id: "london", label: "London",        lat: 51.5074,  lon: -0.1278   },
  { id: "tokyo",  label: "Tokyo",         lat: 35.6762,  lon: 139.6503  },
  { id: "sydney", label: "Sydney",        lat: -33.8688, lon: 151.2093  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseCvssScore(item) {
  if (item.cvss != null && !isNaN(parseFloat(item.cvss))) return parseFloat(item.cvss);
  if (item.severity?.[0]?.score) {
    const m = item.severity[0].score.match(/\/([0-9.]+)$/);
    if (m) return parseFloat(m[1]);
  }
  if (item.document?.aggregate_severity?.text) {
    const t = item.document.aggregate_severity.text.toLowerCase();
    if (t.includes("critical") || t.includes("important")) return 8.5;
    if (t.includes("moderate")) return 5.5;
    return 3.0;
  }
  return 5.0;
}

function severityBadge(score) {
  if (score >= 9.0) return { label: "CRIT", cls: "bg-red-500/10 text-red-400 border-red-500/20",     dot: "bg-red-500"    };
  if (score >= 7.0) return { label: "HIGH", cls: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-500" };
  if (score >= 4.0) return { label: "MED",  cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",  dot: "bg-amber-500"  };
  return               { label: "LOW",  cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" };
}

function wmoLabel(code) {
  if (code === 0) return "Clear Sky";
  if ([1,2,3].includes(code)) return "Partly Cloudy";
  if ([45,48].includes(code)) return "Foggy";
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return "Rainy";
  if ([71,73,75,77,85,86].includes(code)) return "Snowy";
  if ([95,96,99].includes(code)) return "Thunderstorm";
  return "Cloudy";
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, subValue, icon: Icon, iconBg, iconColor, onClick, loading, pulse }) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      onClick={onClick}
      className={`bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors hover:border-zinc-700/80 shadow-sm ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="min-w-0">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{label}</span>
        <p className="text-xl font-bold text-zinc-100 mt-1 truncate flex items-center gap-2">
          {pulse && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />}
          {loading ? <FiLoader className="w-5 h-5 text-zinc-600 animate-spin" /> : value}
        </p>
        {subValue && !loading && (
          <p className="text-[11px] text-zinc-500 mt-0.5">{subValue}</p>
        )}
      </div>
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, iconColor, title, action, onAction }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h3>
      {onAction && (
        <button
          onClick={onAction}
          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
        >
          {action} <FiArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}



// ─── CVE Chart ─────────────────────────────────────────────────────────────────
function CveChart({ stats }) {
  const bars = [
    { key: "critical", label: "Critical", color: "#ef4444", glow: "#f87171", gradId: "crit" },
    { key: "high",     label: "High",     color: "#f97316", glow: "#fb923c", gradId: "high" },
    { key: "medium",   label: "Medium",   color: "#f59e0b", glow: "#fbbf24", gradId: "med"  },
    { key: "low",      label: "Low",      color: "#10b981", glow: "#34d399", gradId: "low"  },
  ];
  const maxVal = Math.max(...bars.map(b => stats[b.key]), 1);
  const maxH = 110;

  return (
    <svg className="w-full h-full" viewBox="0 0 400 170" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {bars.map(b => (
          <linearGradient key={b.gradId} id={`grad-${b.gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={b.glow}  stopOpacity="0.85" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.15" />
          </linearGradient>
        ))}
      </defs>

      {/* Grid lines */}
      {[20, 55, 90, 130].map(y => (
        <line key={y} x1="40" y1={y} x2="385" y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="4 3" />
      ))}
      <line x1="40" y1="130" x2="385" y2="130" stroke="#3f3f46" strokeWidth="1.5" />

      {/* Y-axis labels */}
      {[["100%", 24], ["75%", 59], ["50%", 94], ["0%", 134]].map(([lbl, y]) => (
        <text key={lbl} x="35" y={y} fill="#52525b" fontSize="8.5" textAnchor="end">{lbl}</text>
      ))}

      {/* Bars */}
      {bars.map((b, i) => {
        const h = Math.max((stats[b.key] / maxVal) * maxH, 2);
        const x = 75 + i * 80;
        const y = 130 - h;
        return (
          <g key={b.key}>
            <rect x={x} y={y} width="42" height={h} fill={`url(#grad-${b.gradId})`}
              stroke={b.color} strokeWidth="1" rx="5" />
            <text x={x + 21} y="148" fill="#71717a" fontSize="9" fontWeight="600" textAnchor="middle">{b.label.toUpperCase()}</text>
            {stats[b.key] > 0 && (
              <text x={x + 21} y={y - 5} fill={b.glow} fontSize="11" fontWeight="bold" textAnchor="middle">
                {stats[b.key]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OverviewDashboard({ setActiveTab }) {
  const [cves,    setCves]    = useState([]);
  const [news,    setNews]    = useState([]);
  const [weather, setWeather] = useState({});     // { sf: data, london: data, ... }
  const [status,  setStatus]  = useState({ cve: "loading", news: "loading", weather: "loading" });
  const [errors,  setErrors]  = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);

  // ── Fetchers ────────────────────────────────────────────────────────────────
  async function fetchCves() {
    setStatus(s => ({ ...s, cve: "loading" }));
    try {
      const { data } = await axios.get(CVE_URL);
      if (!Array.isArray(data)) throw new Error("Unexpected CVE response");
      setCves(data);
      setStatus(s => ({ ...s, cve: "online" }));
      setErrors(e => { const n = { ...e }; delete n.cve; return n; });
    } catch (err) {
      setStatus(s => ({ ...s, cve: "offline" }));
      setErrors(e => ({ ...e, cve: err.message }));
    }
  }

  async function fetchNews() {
    setStatus(s => ({ ...s, news: "loading" }));
    try {
      const { data } = await axios.get(NEWS_URL);
      if (!Array.isArray(data?.results)) throw new Error("Unexpected news response");
      setNews(data.results);
      setStatus(s => ({ ...s, news: "online" }));
      setErrors(e => { const n = { ...e }; delete n.news; return n; });
    } catch (err) {
      setStatus(s => ({ ...s, news: "offline" }));
      setErrors(e => ({ ...e, news: err.message }));
    }
  }

  async function fetchWeather() {
    setStatus(s => ({ ...s, weather: "loading" }));
    try {
      const results = await Promise.all(
        offices.map(o =>
          axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${o.lat}&longitude=${o.lon}` +
            `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
          ).then(r => ({ id: o.id, data: r.data }))
        )
      );
      const map = {};
      results.forEach(({ id, data }) => { map[id] = data; });
      setWeather(map);
      setStatus(s => ({ ...s, weather: "online" }));
      setErrors(e => { const n = { ...e }; delete n.weather; return n; });
    } catch (err) {
      setStatus(s => ({ ...s, weather: "offline" }));
      setErrors(e => ({ ...e, weather: err.message }));
    }
  }

  async function refreshAll() {
    await Promise.all([fetchCves(), fetchNews(), fetchWeather()]);
    setLastRefresh(new Date());
  }

  useEffect(() => { refreshAll(); }, []);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const cveStats = (() => {
    let critical = 0, high = 0, medium = 0, low = 0;
    cves.forEach(item => {
      const s = parseCvssScore(item);
      if (s >= 9) critical++;
      else if (s >= 7) high++;
      else if (s >= 4) medium++;
      else low++;
    });
    return { total: cves.length, critical, high, medium, low };
  })();

  const topCves  = cves.slice(0, 4);
  const topNews  = news.slice(0, 4);
  const cveLoading  = status.cve  === "loading";
  const newsLoading = status.news === "loading";
  const wxLoading   = status.weather === "loading";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-50 tracking-tight">Command Overview</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time intelligence from live external APIs · {" "}
            {lastRefresh
              ? `Last synced ${lastRefresh.toLocaleTimeString()}`
              : "Synchronising feeds…"}
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${Object.values(status).includes("loading") ? "animate-spin text-indigo-400" : "text-zinc-400"}`} />
          Refresh All Feeds
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gateway Status"
          value="Fully Operational"
          subValue="All nodes reachable"
          icon={FiCheckCircle}
          iconBg="bg-emerald-500/10 border border-emerald-500/20"
          iconColor="text-emerald-400"
          pulse
        />
        <StatCard
          label="CVE Threat Alerts"
          value={cveStats.total ? `${cveStats.total} Monitored` : "—"}
          subValue={cveStats.critical ? `${cveStats.critical} critical · ${cveStats.high} high` : "Loading…"}
          icon={FiShield}
          iconBg="bg-orange-500/10 border border-orange-500/20"
          iconColor="text-orange-400"
          onClick={() => setActiveTab("security")}
          loading={cveLoading}
        />
        <StatCard
          label="Corporate Climate"
          value={weather.sf?.current?.temperature_2m != null
            ? `${weather.sf.current.temperature_2m.toFixed(0)}°C (HQ)`
            : "—"}
          subValue={wmoLabel(weather.sf?.current?.weather_code ?? 999)}
          icon={FiCloud}
          iconBg="bg-blue-500/10 border border-blue-500/20"
          iconColor="text-blue-400"
          onClick={() => setActiveTab("weather")}
          loading={wxLoading}
        />
        <StatCard
          label="Tech Bulletins"
          value={news.length ? `${news.length} Articles` : "—"}
          subValue="Space & technology feed"
          icon={FiGlobe}
          iconBg="bg-indigo-500/10 border border-indigo-500/20"
          iconColor="text-indigo-400"
          onClick={() => setActiveTab("tech-news")}
          loading={newsLoading}
        />
      </div>

      {/* ── Chart + Weather ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CVE Chart */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 min-h-[22rem]">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-indigo-400" />
              Cybersecurity Severity Distribution
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Live CVE-V3 vulnerability breakdown — hover bars for detail</p>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-0">
            {cveLoading ? (
              <div className="flex flex-col items-center gap-2 text-zinc-600">
                <FiLoader className="w-7 h-7 text-indigo-500 animate-spin" />
                <span className="text-xs">Loading threat data…</span>
              </div>
            ) : errors.cve ? (
              <ErrorMessage
                title="Severity Feed Degraded"
                message={errors.cve}
                retryAction={fetchCves}
              />
            ) : (
              <CveChart stats={cveStats} />
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 bg-zinc-950/60 border border-zinc-800/50 rounded-xl px-4 py-2">
            <span>Source: CIRCL Vulnerability-Lookup · No API key required</span>
            <span className="font-mono">
              {cveLoading ? "Polling…" : `${cveStats.total} entries`}
            </span>
          </div>
        </div>

        {/* Weather Hub */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[22rem]">
          <SectionHeader
            icon={FiCloud}
            iconColor="text-blue-400"
            title="Office Weather Hubs"
            action="Full Forecast"
            onAction={() => setActiveTab("weather")}
          />

          <div className="flex-1 flex flex-col justify-center gap-3 my-4">
            {wxLoading ? (
              <ThreatSkeleton count={3} />
            ) : errors.weather ? (
              <ErrorMessage
                title="Weather Stations Offline"
                message={errors.weather}
                retryAction={fetchWeather}
              />
            ) : (
              offices.map(o => {
                const cur = weather[o.id]?.current;
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700/60 rounded-xl px-4 py-3 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{o.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{cur ? wmoLabel(cur.weather_code) : "Offline"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-zinc-100">
                        {cur ? `${cur.temperature_2m.toFixed(0)}°C` : "—"}
                      </p>
                      {cur && (
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                          <FiWind className="w-2.5 h-2.5" />
                          {cur.wind_speed_10m} km/h
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-[10px] text-zinc-600 text-center">Open-Meteo API · No key required</p>
        </div>
      </div>

      {/* ── CVE Feed + News Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent CVEs */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <SectionHeader
            icon={FiShield}
            iconColor="text-orange-400"
            title="Recent Vulnerability Alerts"
            action="Full Threat Log"
            onAction={() => setActiveTab("security")}
          />

          <div className="space-y-2.5">
            {cveLoading ? (
              <ThreatSkeleton count={3} />
            ) : errors.cve ? (
              <ErrorMessage
                title="Vulnerability Log Offline"
                message={errors.cve}
                retryAction={fetchCves}
              />
            ) : topCves.length === 0 ? (
              <p className="text-center text-xs text-zinc-600 py-6">No CVE data available.</p>
            ) : (
              topCves.map((cve, i) => {
                const score = parseCvssScore(cve);
                const badge = severityBadge(score);
                const desc  = cve.details || cve.document?.notes?.[1]?.text || "No description.";
                return (
                  <motion.div
                    key={cve.id ?? i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700/60 rounded-xl p-3.5 transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${badge.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold font-mono text-zinc-200">{cve.id ?? "CVE-UNKNOWN"}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${badge.cls}`}>{badge.label}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">{score.toFixed(1)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent News */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <SectionHeader
            icon={FiGlobe}
            iconColor="text-indigo-400"
            title="Tech & Space Intelligence"
            action="Open Feed"
            onAction={() => setActiveTab("tech-news")}
          />

          <div className="space-y-2.5">
            {newsLoading ? (
              <ThreatSkeleton count={3} />
            ) : errors.news ? (
              <ErrorMessage
                title="Intel Bulletin Offline"
                message={errors.news}
                retryAction={fetchNews}
              />
            ) : topNews.length === 0 ? (
              <p className="text-center text-xs text-zinc-600 py-6">No articles available.</p>
            ) : (
              topNews.map((article, i) => {
                const date = article.published_at
                  ? new Date(article.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : "";
                return (
                  <motion.a
                    key={article.id ?? i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700/60 rounded-xl p-3.5 transition-all group cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt=""
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          onError={e => { e.target.style.display = "none"; }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-wider">
                          {article.news_site}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono">{date}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                        {article.title}
                      </p>
                    </div>
                    <FiExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                  </motion.a>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Footer Strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl px-5 py-3 text-[10px] text-zinc-500">
        <div className="flex items-center gap-4">
          {[
            { key: "cve",     label: "CVE Feed"     },
            { key: "weather", label: "Weather"      },
            { key: "news",    label: "News Feed"    },
          ].map(({ key, label }) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status[key] === "online" ? "bg-emerald-500" : status[key] === "loading" ? "bg-blue-400 animate-pulse" : "bg-red-500"}`} />
              {label}: <span className="font-semibold text-zinc-400">{status[key]}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <FiWifi className="w-3 h-3" />
          Node: Apexium-HQ-01
        </div>
      </div>

    </div>
  );
}
