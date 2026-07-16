import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGlobe,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiClock,
  FiBookOpen,
  FiInfo,
  FiCalendar,
} from "react-icons/fi";
import { NewsSkeleton } from "./SkeletonLoader";
import ErrorMessage from "./ErrorMessage";

const NEWS_LIMIT = 12;
const BASE_NEWS_URL = "https://api.spaceflightnewsapi.net/v4/articles/";

export default function TechNewsDashboard({ onStatusChange }) {
  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
                                                                                            
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBuffer, setSearchBuffer] = useState(""); // Input text state
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSite, setSelectedSite] = useState("All");
  
  // Inspector Modal States
  const [activeArticle, setActiveArticle] = useState(null);
  
  const searchInputRef = useRef(null);

  // ── Fetch News ─────────────────────────────────────────────────────────────
  async function fetchNews() {
    setLoading(true);
    setError(null);
    if (onStatusChange) onStatusChange("news", "loading");

    try {
      const offset = (currentPage - 1) * NEWS_LIMIT;
      let url = `${BASE_NEWS_URL}?limit=${NEWS_LIMIT}&offset=${offset}`;
      
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const { data } = await axios.get(url);
      if (!data || !Array.isArray(data.results)) {
        throw new Error("News feed returned an invalid results data payload.");
      }

      setArticles(data.results);
      setTotalCount(data.count || 0);
      if (onStatusChange) onStatusChange("news", "online");
    } catch (err) {
      setError(err.message || "Failed to retrieve breaking tech bulletins.");
      if (onStatusChange) onStatusChange("news", "offline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, [currentPage, searchQuery]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSelectedSite("All");
    setSearchQuery(searchBuffer);
  };

  const handleClearSearch = () => {
    setSearchBuffer("");
    setSearchQuery("");
    setCurrentPage(1);
    setSelectedSite("All");
    searchInputRef.current?.focus();
  };

  // Derive unique news sites from current dataset for the filter bar
  const newsSites = ["All", ...new Set(articles.map(a => a.news_site))];

  // Filter current list based on local news site selection
  const filteredArticles = selectedSite === "All"
    ? articles
    : articles.filter(a => a.news_site === selectedSite);

  // Pagination calculation
  const totalPages = Math.ceil(totalCount / NEWS_LIMIT) || 1;

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-50 tracking-tight flex items-center gap-2">
            <FiGlobe className="w-6 h-6 text-indigo-400" />
            Tech & Space Intel
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Breaking spaceflight and technical updates from global science terminals
          </p>
        </div>
      </div>

      {/* ── Search and Filter Controls ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search news keyword (press Enter)..."
            value={searchBuffer}
            onChange={e => setSearchBuffer(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500/60 rounded-xl py-2.5 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {searchBuffer && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Source Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none justify-start">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap mr-1">
            Site Filter:
          </span>
          {newsSites.map(site => (
            <button
              key={site}
              type="button"
              onClick={() => setSelectedSite(site)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                selectedSite === site
                  ? "bg-zinc-100 border-zinc-100 text-zinc-900 shadow-md"
                  : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {site}
            </button>
          ))}
        </div>
      </div>

      {/* ── News Articles Grid ── */}
      {loading ? (
        <NewsSkeleton count={NEWS_LIMIT} />
      ) : error ? (
        <div className="py-12">
          <ErrorMessage
            title="News Stream Offline"
            message={error}
            retryAction={fetchNews}
            diagnostics={`Endpoint: ${BASE_NEWS_URL}\nPage: ${currentPage}\nQuery: ${searchQuery}`}
          />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="border border-zinc-800/50 border-dashed rounded-2xl py-20 text-center text-zinc-500 max-w-md mx-auto">
          <FiBookOpen className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm font-medium">No bulletins match your active filters.</p>
          {(searchQuery || selectedSite !== "All") && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer underline"
            >
              Clear all parameters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredArticles.map((art, idx) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                onClick={() => setActiveArticle(art)}
                className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/70 hover:border-zinc-700/80 rounded-2xl p-4 flex flex-col justify-between min-h-[360px] cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                {/* Article Image Container */}
                <div className="aspect-video w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-3 relative">
                  {art.image_url ? (
                    <img
                      src={art.image_url}
                      alt={art.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-103 transition-all duration-300"
                      loading="lazy"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <FiGlobe className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Info and Titles */}
                <div className="space-y-2 flex-1 flex flex-col justify-start">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] bg-zinc-950 border border-zinc-800 text-indigo-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      {art.news_site}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                      <FiCalendar className="w-2.5 h-2.5" /> {formatDate(art.published_at)}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors pt-1">
                    {art.title}
                  </h3>

                  <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                    {art.summary || "No summary text is available for this bulletin."}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-zinc-800/60 pt-3 mt-4 flex items-center justify-between text-[10px] text-zinc-500 select-none">
                  <span className="font-semibold uppercase tracking-wider group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                    <FiBookOpen className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                    Inspect Details
                  </span>
                  <FiChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Server Pagination Bar ── */}
          {totalPages > 1 && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              <span className="text-[10px] text-zinc-500 font-mono">
                Showing {filteredArticles.length} of {totalCount} total articles
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous Page"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-[10px] font-bold text-zinc-300 font-mono px-3">
                  PAGE {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next Page"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Inspector Modal/Overlay ── */}
      <AnimatePresence>
        {activeArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setActiveArticle(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Cover Image */}
              {activeArticle.image_url && (
                <div className="h-56 bg-zinc-950 w-full relative overflow-hidden border-b border-zinc-800 flex-shrink-0">
                  <img
                    src={activeArticle.image_url}
                    alt=""
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  
                  {/* Floating Source Tag */}
                  <span className="absolute top-4 left-4 text-[9px] bg-indigo-600 border border-indigo-400/40 text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    {activeArticle.news_site}
                  </span>
                </div>
              )}

              {/* Title Area */}
              <div className="px-6 pt-5 pb-3 border-b border-zinc-800 bg-zinc-950/20 flex-shrink-0">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mb-2">
                  <FiClock className="w-3.5 h-3.5" /> Published {formatDate(activeArticle.published_at)}
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-zinc-100 leading-snug">
                  {activeArticle.title}
                </h2>
              </div>

              {/* Summary Description content */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-zinc-300">
                <h4 className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <FiInfo className="w-3.5 h-3.5 text-indigo-400" /> Bulletin Summary
                </h4>
                <p className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
                  {activeArticle.summary || "No extended summary text is currently available for this bulletin entry."}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between flex-shrink-0">
                <a
                  href={activeArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 uppercase tracking-wider font-bold cursor-pointer"
                >
                  Read full article on web <FiExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Close Bulletin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
