import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiShield, 
  FiCloud, 
  FiGlobe, 
  FiActivity, 
  FiWifi, 
  FiMenu, 
  FiX, 
  FiChevronDown,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiLoader
} from "react-icons/fi";

const navItems = [
  { id: "dashboard", label: "Overview", icon: FiActivity },
  { id: "security", label: "Cybersecurity", icon: FiShield },
  { id: "weather", label: "Weather Feed", icon: FiCloud },
  { id: "tech-news", label: "Tech & Business", icon: FiGlobe },
];

export default function HeaderNavbar({ activeTab, setActiveTab, apiStatuses = {} }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close status popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsStatusPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine overall status
  const getOverallStatus = () => {
    const statuses = Object.values(apiStatuses);
    if (statuses.length === 0 || statuses.some(s => s === "loading")) return "loading";
    if (statuses.every(s => s === "online")) return "online";
    if (statuses.every(s => s === "offline")) return "offline";
    return "warning"; // Mixed states
  };

  const overallStatus = getOverallStatus();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/75 backdrop-blur-xl border-b border-zinc-800/80 text-zinc-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand/Logo & Environment Badge */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => setActiveTab("dashboard")} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            {/* <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div> */}
            <div className="w-35">
              <img src="/apexium logo.png" alt="Apexium technologies" />
            </div>
            {/* <span className="text-xl font-bold bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 bg-clip-text text-transparent tracking-tight font-sans">
              Apexium
            </span> */}
          </div>

          {/* Connected Badges with Dropdown Trigger */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsStatusPopoverOpen(!isStatusPopoverOpen)}
              className="hidden md:inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-all cursor-pointer select-none"
            >
              {overallStatus === "online" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>APIs Connected</span>
                </>
              )}
              {overallStatus === "loading" && (
                <>
                  <FiLoader className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span>Checking APIs...</span>
                </>
              )}
              {overallStatus === "warning" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Degraded Feeds</span>
                </>
              )}
              {overallStatus === "offline" && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Feeds Offline</span>
                </>
              )}
              <FiChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isStatusPopoverOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Status Dropdown Popover */}
            <AnimatePresence>
              {isStatusPopoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2.5 w-64 bg-zinc-900/95 border border-zinc-800/90 backdrop-blur-2xl rounded-2xl shadow-xl p-4 text-zinc-300 z-50"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center justify-between">
                    <span>External Services</span>
                    <FiWifi className="w-3.5 h-3.5 text-zinc-400" />
                  </h4>
                  <div className="space-y-2.5">
                    {/* Security API */}
                    <div className="flex items-center justify-between text-sm py-0.5">
                      <span className="flex items-center space-x-2 text-zinc-300">
                        <FiShield className="w-4 h-4 text-zinc-400" />
                        <span>Cybersecurity Feed</span>
                      </span>
                      {apiStatuses.cve === "online" ? (
                        <FiCheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                      ) : apiStatuses.cve === "loading" ? (
                        <FiLoader className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <FiXCircle className="w-4.5 h-4.5 text-rose-500" />
                      )}
                    </div>
                    
                    {/* Weather API */}
                    <div className="flex items-center justify-between text-sm py-0.5">
                      <span className="flex items-center space-x-2 text-zinc-300">
                        <FiCloud className="w-4 h-4 text-zinc-400" />
                        <span>Weather Station</span>
                      </span>
                      {apiStatuses.weather === "online" ? (
                        <FiCheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                      ) : apiStatuses.weather === "loading" ? (
                        <FiLoader className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <FiXCircle className="w-4.5 h-4.5 text-rose-500" />
                      )}
                    </div>

                    {/* Tech News API */}
                    <div className="flex items-center justify-between text-sm py-0.5">
                      <span className="flex items-center space-x-2 text-zinc-300">
                        <FiGlobe className="w-4 h-4 text-zinc-400" />
                        <span>Tech Intel Feed</span>
                      </span>
                      {apiStatuses.news === "online" ? (
                        <FiCheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                      ) : apiStatuses.news === "loading" ? (
                        <FiLoader className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <FiXCircle className="w-4.5 h-4.5 text-rose-500" />
                      )}
                    </div>
                  </div>
                  <div className="border-t border-zinc-800/80 mt-3 pt-2.5 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Update cycle: On tab reload</span>
                    <span className="text-zinc-400 font-mono">v1.0.0</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Interactive Nav Menu */}
        <div className="hidden md:flex items-center space-x-1.5 h-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-250 rounded-xl flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 cursor-pointer ${
                  isActive
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {/* Active link glass pill slider animation */}
                {isActive && (
                  <motion.span
                    layoutId="activePill"
                    className="absolute inset-0 bg-zinc-900 border border-zinc-800/80 rounded-xl -z-10 shadow-inner shadow-black/40"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right-Side Controls */}
        {/* <div className="hidden md:flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-tight">Terminal Node</p>
            <p className="text-xs font-semibold text-zinc-300">Apexium-HQ-01</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-50 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md ring-2 ring-indigo-500/20">
            AP
          </div>
        </div> */}

        {/* Mobile Toggle Button */}
        <div className="md:hidden flex items-center space-x-3">
          {/* Simple status dot on mobile */}
          <span className={`w-2 h-2 rounded-full ${
            overallStatus === "online" ? "bg-emerald-500" : 
            overallStatus === "warning" ? "bg-amber-500" : 
            overallStatus === "loading" ? "bg-blue-400 animate-pulse" : "bg-rose-500"
          }`}></span>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors focus:outline-none"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">Toggle menu</span>
            {isMobileMenuOpen ? <FiX className="h-5.5 w-5.5" /> : <FiMenu className="h-5.5 w-5.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Collapsible) */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden bg-zinc-950 border-b border-zinc-800 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-5 space-y-1.5 border-t border-zinc-900">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? "bg-zinc-900/90 text-white border-l-3 border-indigo-500"
                        : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile Info Widget */}
              {/* <div className="pt-4 border-t border-zinc-900 px-4 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center space-x-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    overallStatus === "online" ? "bg-emerald-500" : 
                    overallStatus === "warning" ? "bg-amber-500" : 
                    overallStatus === "loading" ? "bg-blue-400 animate-pulse" : "bg-rose-500"
                  }`}></span>
                  <span>Feeds: {overallStatus}</span>
                </span>
                <span className="font-mono">Node: Apexium-HQ-01</span>
              </div> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
