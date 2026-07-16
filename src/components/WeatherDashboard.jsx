import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCloud,
  FiSun,
  FiCloudRain,
  FiCloudSnow,
  FiCloudLightning,
  FiWind,
  FiDroplet,
  FiThermometer,
  FiCompass,
  FiSearch,
  FiMapPin,
  FiRefreshCw,
  FiChevronRight,
  FiChevronLeft,
  FiLoader,
  FiAlertTriangle,
  FiCpu,
  FiClock,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────────────────────────
const offices = [
  { id: "sf",     label: "San Francisco", lat: 37.7749,  lon: -122.4194, isHq: true },
  { id: "london", label: "London",        lat: 51.5074,  lon: -0.1278,   isHq: false },
  { id: "tokyo",  label: "Tokyo",         lat: 35.6762,  lon: 139.6503,  isHq: false },
  { id: "sydney", label: "Sydney",        lat: -33.8688, lon: 151.2093,  isHq: false },
];

// ─── Helper: WMO Weather Code to Label & Icon ──────────────────────────────────
function getWeatherState(code) {
  if (code === 0) {
    return {
      label: "Clear Sky",
      icon: <FiSun className="w-8 h-8 text-amber-400" />,
      smallIcon: <FiSun className="w-5 h-5 text-amber-400" />,
      color: "text-amber-400",
      bgGradient: "from-amber-500/10 to-zinc-950",
      borderColor: "border-amber-500/20",
    };
  }
  if ([1, 2, 3].includes(code)) {
    return {
      label: "Partly Cloudy",
      icon: <FiCloud className="w-8 h-8 text-blue-300" />,
      smallIcon: <FiCloud className="w-5 h-5 text-blue-300" />,
      color: "text-blue-300",
      bgGradient: "from-blue-500/10 to-zinc-950",
      borderColor: "border-blue-500/20",
    };
  }
  if ([45, 48].includes(code)) {
    return {
      label: "Foggy Weather",
      icon: <FiWind className="w-8 h-8 text-zinc-400" />,
      smallIcon: <FiWind className="w-5 h-5 text-zinc-400" />,
      color: "text-zinc-400",
      bgGradient: "from-zinc-500/10 to-zinc-950",
      borderColor: "border-zinc-500/20",
    };
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) {
    return {
      label: "Rain & Showers",
      icon: <FiCloudRain className="w-8 h-8 text-indigo-400" />,
      smallIcon: <FiCloudRain className="w-5 h-5 text-indigo-400" />,
      color: "text-indigo-400",
      bgGradient: "from-indigo-500/10 to-zinc-950",
      borderColor: "border-indigo-500/20",
    };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      label: "Snowfall",
      icon: <FiCloudSnow className="w-8 h-8 text-sky-300" />,
      smallIcon: <FiCloudSnow className="w-5 h-5 text-sky-300" />,
      color: "text-sky-300",
      bgGradient: "from-sky-500/10 to-zinc-950",
      borderColor: "border-sky-500/20",
    };
  }
  if ([95, 96, 99].includes(code)) {
    return {
      label: "Thunderstorm",
      icon: <FiCloudLightning className="w-8 h-8 text-violet-400" />,
      smallIcon: <FiCloudLightning className="w-5 h-5 text-violet-400" />,
      color: "text-violet-400",
      bgGradient: "from-violet-500/10 to-zinc-950",
      borderColor: "border-violet-500/20",
    };
  }
  return {
    label: "Overcast",
    icon: <FiCloud className="w-8 h-8 text-zinc-300" />,
    smallIcon: <FiCloud className="w-5 h-5 text-zinc-300" />,
    color: "text-zinc-300",
    bgGradient: "from-zinc-500/5 to-zinc-950",
    borderColor: "border-zinc-800",
  };
}

// Get Compass Cardinal Direction
function getWindDirection(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return directions[index];
}

// ─── SVG Interactive Hourly Chart ───────────────────────────────────────────────
function HourlyForecastChart({ hourly }) {
  const [chartType, setChartType] = useState("temp"); // "temp" | "precip"
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!hourly?.time || !hourly?.temperature_2m) return null;

  // We show 24 hours of forecast, filtered to every hour or every two hours
  const hoursLimit = 24;
  const rawTimes = hourly.time.slice(0, hoursLimit);
  const rawTemps = hourly.temperature_2m.slice(0, hoursLimit);
  const rawPrecip = hourly.precipitation_probability.slice(0, hoursLimit);

  const times = rawTimes.map(t => {
    const d = new Date(t);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  });

  const chartData = chartType === "temp" ? rawTemps : rawPrecip;
  const unit = chartType === "temp" ? "°C" : "%";

  const minVal = Math.min(...chartData);
  const maxVal = Math.max(...chartData);
  const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  // SVG Coordinates mapping
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 30;

  const getX = (index) => paddingX + (index * (width - paddingX * 2)) / (hoursLimit - 1);
  const getY = (value) => {
    const norm = (value - minVal) / valRange;
    return height - paddingY - norm * (height - paddingY * 2);
  };

  // Build path string
  let pathStr = "";
  if (chartData.length > 0) {
    pathStr = `M ${getX(0)} ${getY(chartData[0])}`;
    for (let i = 1; i < chartData.length; i++) {
      pathStr += ` L ${getX(i)} ${getY(chartData[i])}`;
    }
  }

  // Build fill area path string (for gradient overlay)
  const fillPathStr = pathStr ? `${pathStr} L ${getX(chartData.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z` : "";

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4 text-blue-400" />
            Hourly Forecast Trends
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            24-hour diagnostic charts — hover nodes for precise telemetry
          </p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex items-center bg-zinc-950/60 border border-zinc-800 p-0.5 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { setChartType("temp"); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              chartType === "temp"
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Temperature
          </button>
          <button
            type="button"
            onClick={() => { setChartType("precip"); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              chartType === "precip"
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Precipitation %
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto min-h-[190px] flex items-center justify-center">
        <svg
          className="w-full min-w-[580px] h-[190px]"
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="chart-grad-temp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chart-grad-precip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const yVal = minVal + ratio * valRange;
            const yPos = getY(yVal);
            return (
              <g key={index}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={width - paddingX}
                  y2={yPos}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <text
                  x={paddingX - 10}
                  y={yPos + 3}
                  fill="#52525b"
                  fontSize="8.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {yVal.toFixed(0)}{unit}
                </text>
              </g>
            );
          })}

          {/* Fill Area */}
          {fillPathStr && (
            <path
              d={fillPathStr}
              fill={chartType === "temp" ? "url(#chart-grad-temp)" : "url(#chart-grad-precip)"}
            />
          )}

          {/* Polyline Curve */}
          {pathStr && (
            <path
              d={pathStr}
              fill="none"
              stroke={chartType === "temp" ? "#3b82f6" : "#818cf8"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interaction nodes */}
          {chartData.map((val, idx) => {
            const x = getX(idx);
            const y = getY(val);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Thin vertical tracker line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#52525b"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                )}
                {/* Visual node */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 3.5}
                  fill={chartType === "temp" ? "#1e293b" : "#1e1b4b"}
                  stroke={chartType === "temp" ? "#3b82f6" : "#818cf8"}
                  strokeWidth={isHovered ? 3.5 : 2}
                  style={{ transition: "all 0.15s ease" }}
                />
              </g>
            );
          })}

          {/* Bottom time labels (every 3 hours to avoid overlap) */}
          {times.map((time, idx) => {
            if (idx % 3 !== 0) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                fill="#52525b"
                fontSize="8"
                textAnchor="middle"
                fontWeight="500"
              >
                {time.replace(":00", "")}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Tooltip UI Overlay */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute left-1/2 bottom-5 -translate-x-1/2 bg-zinc-950/90 border border-zinc-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-4 text-xs z-20 backdrop-blur-md"
          >
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Hourly Interval</p>
              <p className="text-zinc-300 font-bold font-mono mt-0.5">{times[hoveredIndex]}</p>
            </div>
            <div className="w-[1px] h-6 bg-zinc-800" />
            <div>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                {chartType === "temp" ? "Temperature" : "Rain Chance"}
              </p>
              <p className={`font-extrabold font-mono mt-0.5 ${chartType === "temp" ? "text-blue-400" : "text-indigo-400"}`}>
                {chartData[hoveredIndex].toFixed(1)}{unit}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Weather Dashboard Component ───────────────────────────────────────────────
export default function WeatherDashboard({ onStatusChange }) {
  const [selectedOffice, setSelectedOffice] = useState("sf");
  const [customLocations, setCustomLocations] = useState([]);
  const [currentCity, setCurrentCity] = useState(offices[0]); // Starts as San Francisco

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Search States
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Fetch Telemetry ────────────────────────────────────────────────────────
  async function fetchWeather(city) {
    setLoading(true);
    setError(null);
    if (onStatusChange) onStatusChange("weather", "loading");

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index,visibility` +
        `&hourly=temperature_2m,precipitation_probability,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&timezone=auto`;

      const { data } = await axios.get(url);
      if (!data?.current) throw new Error("Telemetry response missing required nodes.");

      setWeatherData(data);
      setLastRefresh(new Date());
      if (onStatusChange) onStatusChange("weather", "online");
    } catch (err) {
      setError(err.message || "Failed to establish telemetry connection to weather station.");
      if (onStatusChange) onStatusChange("weather", "offline");
    } finally {
      setLoading(false);
    }
  }

  // Fetch when active city changes
  useEffect(() => {
    fetchWeather(currentCity);
  }, [currentCity]);

  // ── Handle Location Change ──────────────────────────────────────────────────
  const selectOffice = (off) => {
    setSelectedOffice(off.id);
    setCurrentCity(off);
    setShowSearchDropdown(false);
  };

  const selectCustom = (loc) => {
    setSelectedOffice(loc.id);
    setCurrentCity(loc);
    setShowSearchDropdown(false);
  };

  // ── Geocoding Search ───────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setIsSearching(true);
    setShowSearchDropdown(true);
    try {
      const { data } = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=5&language=en&format=json`
      );
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Geocoding failed", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addCustomLocation = (result) => {
    const newLoc = {
      id: `custom-${result.id}`,
      label: `${result.name}, ${result.country_code?.toUpperCase() ?? result.country ?? ""}`,
      lat: result.latitude,
      lon: result.longitude,
      isHq: false,
    };

    // Prevent duplicates
    if (!customLocations.some(l => l.id === newLoc.id)) {
      setCustomLocations(prev => [...prev, newLoc]);
    }

    setSearch("");
    selectCustom(newLoc);
  };

  const removeCustomLocation = (id, e) => {
    e.stopPropagation();
    setCustomLocations(prev => prev.filter(l => l.id !== id));
    // If the removed one was selected, fall back to San Francisco (HQ)
    if (selectedOffice === id) {
      selectOffice(offices[0]);
    }
  };

  // derived layout states
  const current = weatherData?.current;
  const hourly = weatherData?.hourly;
  const daily = weatherData?.daily;
  const wxState = currentCity ? getWeatherState(current?.weather_code ?? 999) : getWeatherState(999);

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-50 tracking-tight flex items-center gap-2">
            <FiCloud className="w-6 h-6 text-blue-400" />
            Weather Telemetry
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Diagnostic meteorological feed for global nodes ·{" "}
            {lastRefresh ? `Synced ${lastRefresh.toLocaleTimeString()}` : "Synchronising…"}
          </p>
        </div>
        <button
          onClick={() => fetchWeather(currentCity)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : "text-zinc-400"}`} />
          Refresh Stations
        </button>
      </div>

      {/* ── Control Console (Pills + Geocoding Search) ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Office & Search Pills Selector */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-bold uppercase tracking-wider mr-2">
            <FiMapPin className="w-3.5 h-3.5 text-zinc-500" /> Station Node:
          </span>

          {/* Standard Offices */}
          {offices.map(o => (
            <button
              key={o.id}
              onClick={() => selectOffice(o)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedOffice === o.id
                  ? "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/25"
                  : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {o.label} {o.isHq && <span className="text-[8px] bg-blue-900/60 text-blue-200 border border-blue-500/30 px-1 rounded-sm ml-1 font-mono">HQ</span>}
            </button>
          ))}

          {/* Custom Locations added via Search */}
          {customLocations.map(l => (
            <div
              key={l.id}
              onClick={() => selectCustom(l)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedOffice === l.id
                  ? "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/25"
                  : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <span className="truncate max-w-[90px]">{l.label.split(",")[0]}</span>
              <button
                type="button"
                onClick={(e) => removeCustomLocation(l.id, e)}
                className="hover:text-red-400 p-0.5 rounded transition-colors text-zinc-500 cursor-pointer"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Geocoding Search Bar */}
        <div ref={searchContainerRef} className="relative w-full lg:w-80">
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search custom location…"
              value={search}
              onChange={e => { setSearch(e.target.value); if (!e.target.value) setShowSearchDropdown(false); }}
              className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-blue-500/60 rounded-xl py-2.5 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
            />
            {isSearching && (
              <FiLoader className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 animate-spin w-4 h-4" />
            )}
          </form>

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearchDropdown && search.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-zinc-800/60"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <FiLoader className="w-4 h-4 animate-spin text-blue-400" /> Connecting to Geocoder…
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No matching location nodes found.
                  </div>
                ) : (
                  searchResults.map(res => (
                    <button
                      key={res.id}
                      onClick={() => addCustomLocation(res)}
                      className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 flex flex-col gap-0.5 transition-colors cursor-pointer"
                    >
                      <span className="font-bold">{res.name}</span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {res.admin1 ? `${res.admin1}, ` : ""}{res.country ?? "Unknown Nation"} ({res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°)
                      </span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main Dashboard Layout ── */}
      {loading && !weatherData ? (
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl p-24 text-center flex flex-col items-center justify-center gap-3">
          <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold text-zinc-400">Connecting to Meteorological Stations…</p>
        </div>
      ) : error ? (
        <div className="bg-zinc-950/80 border border-red-500/20 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-100 mb-2">Station Offline</h3>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => fetchWeather(currentCity)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <FiRefreshCw className="w-4 h-4" /> Reconnect Station
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Main Telemetry Display */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Glowing Climate Card */}
            <div className={`relative bg-gradient-to-b ${wxState.bgGradient} border ${wxState.borderColor} rounded-2xl p-6 shadow-md overflow-hidden flex flex-col justify-between min-h-[17.5rem]`}>
              
              {/* HQ Badge & Lat Long info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold font-mono tracking-widest">
                    LOC: {currentCity.lat.toFixed(3)}°, {currentCity.lon.toFixed(3)}°
                  </p>
                </div>
                {currentCity.isHq && (
                  <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    HQ Gateway
                  </span>
                )}
              </div>

              {/* Main weather visualizer */}
              <div className="my-6 flex items-center gap-5">
                <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl shadow-inner">
                  {wxState.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-zinc-100 truncate max-w-[170px] leading-tight">
                    {currentCity.label.split(",")[0]}
                  </h2>
                  <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${wxState.color}`}>
                    {wxState.label}
                  </p>
                </div>
              </div>

              {/* Temp details block */}
              <div className="flex items-end justify-between mt-auto">
                <div>
                  <h3 className="text-6xl font-extrabold font-mono text-zinc-100 leading-none">
                    {current?.temperature_2m != null ? `${current.temperature_2m.toFixed(0)}°` : "—"}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 font-semibold uppercase tracking-wider">
                    Feels like: {current?.apparent_temperature != null ? `${current.apparent_temperature.toFixed(0)}°C` : "—"}
                  </p>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Today Bounds</p>
                  <p className="text-sm font-bold font-mono text-zinc-300">
                    {daily?.temperature_2m_max?.[0] != null ? `${daily.temperature_2m_max[0].toFixed(0)}°` : "—"}
                    <span className="text-zinc-600 font-normal mx-1">/</span>
                    <span className="text-zinc-500">
                      {daily?.temperature_2m_min?.[0] != null ? `${daily.temperature_2m_min[0].toFixed(0)}°` : "—"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Weather Diagnostics Strip */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Wind Speed",
                  value: current?.wind_speed_10m != null ? `${current.wind_speed_10m.toFixed(1)} km/h` : "—",
                  sub: current?.wind_direction_10m != null ? `Heading ${getWindDirection(current.wind_direction_10m)} (${current.wind_direction_10m}°)` : "—",
                  icon: FiWind,
                  color: "text-teal-400",
                  bg: "bg-teal-500/5 border-teal-500/10",
                },
                {
                  label: "Relative Humidity",
                  value: current?.relative_humidity_2m != null ? `${current.relative_humidity_2m}%` : "—",
                  sub: "Moisture content",
                  icon: FiDroplet,
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/5 border-indigo-500/10",
                },
                {
                  label: "Solar UV Index",
                  value: current?.uv_index != null ? `${current.uv_index.toFixed(1)}` : "—",
                  sub: current?.uv_index >= 6 ? "High exposure" : current?.uv_index >= 3 ? "Moderate exposure" : "Low exposure",
                  icon: FiSun,
                  color: "text-amber-400",
                  bg: "bg-amber-500/5 border-amber-500/10",
                },
                {
                  label: "Surface Pressure",
                  value: current?.pressure_msl != null ? `${current.pressure_msl.toFixed(0)} hPa` : "—",
                  sub: "Atmospheric index",
                  icon: FiCompass,
                  color: "text-rose-400",
                  bg: "bg-rose-500/5 border-rose-500/10",
                },
              ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                <div key={label} className={`border rounded-2xl p-4 flex flex-col justify-between min-h-[95px] ${bg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{label}</span>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="mt-2">
                    <p className="text-base font-extrabold font-mono text-zinc-200">{value}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MIDDLE COLUMN: Interactive SVGs and detailed forecast */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* SVG Interactive hourly trends chart */}
            <HourlyForecastChart hourly={hourly} />

            {/* 7-Day Forecast Grid */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-indigo-400" />
                  7-Day Station Forecast
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Long-range microclimate diagnostics
                </p>
              </div>

              <div className="mt-4 divide-y divide-zinc-800/50">
                {daily?.time?.map((timeStr, idx) => {
                  if (idx === 0) return null; // Skip today, show 6 upcoming days

                  const date = new Date(timeStr);
                  const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
                  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                  
                  const code = daily.weather_code[idx];
                  const state = getWeatherState(code);
                  const maxTemp = daily.temperature_2m_max[idx];
                  const minTemp = daily.temperature_2m_min[idx];
                  const rainChance = daily.precipitation_sum[idx];

                  return (
                    <div
                      key={timeStr}
                      className="flex items-center justify-between py-3.5 gap-4"
                    >
                      <div className="min-w-0 w-24">
                        <p className="text-xs font-bold text-zinc-100">{dayName}</p>
                        <p className="text-[9px] text-zinc-500 font-medium font-mono">{dateLabel}</p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg">
                          {state.smallIcon}
                        </div>
                        <p className="text-xs font-semibold text-zinc-300 truncate">{state.label}</p>
                      </div>

                      {/* Rain Sum Outlook */}
                      <div className="w-20 text-right">
                        {rainChance > 0 ? (
                          <span className="text-[9px] text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded font-mono">
                            {rainChance.toFixed(1)} mm
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-600 font-mono">
                            0.0 mm
                          </span>
                        )}
                      </div>

                      {/* Day bounds */}
                      <div className="w-20 text-right">
                        <p className="text-xs font-bold font-mono text-zinc-200">
                          {maxTemp.toFixed(0)}°{" "}
                          <span className="text-zinc-500 font-normal">/ {minTemp.toFixed(0)}°</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── Footer Strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl px-5 py-3 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <FiCpu className="w-3.5 h-3.5 text-zinc-400" />
          Station Network: <span className="font-semibold text-zinc-400">Open-Meteo Gateway</span>
        </span>
        <span className="font-mono">
          Last Check: {lastRefresh ? lastRefresh.toLocaleTimeString() : "N/A"}
        </span>
      </div>

    </div>
  );
}
