# Apexium Intern Data Dashboard

A premium, interactive, dark-themed real-time data dashboard built using React, Vite, and Tailwind CSS (v4). The interface combines cybersecurity alerts, global weather monitoring, and the latest science/tech news into a unified, responsive client application.

🔗 **Live Deployment**: [https://data-dashboard-dsdigitalz.vercel.app/](https://data-dashboard-dsdigitalz.vercel.app/)

---

## 🚀 Key Features

*   **Unified Overview**: A consolidated command-center home screen featuring high-level threat updates, weather summaries across global offices, and recent articles.
*   **Cybersecurity Dashboard**: Tracks and filters real-time Common Vulnerabilities and Exposures (CVE) from the CIRCL API, parsing CVSS scores and visual severity tiers.
*   **Weather Dashboard**: Real-time meteorological data and 7-day forecasts for global office locations (San Francisco HQ, London, Tokyo, and Sydney) using the Open-Meteo API.
*   **Tech & Space News**: A curated feed of aerospace and tech journalism powered by the Spaceflight News API, supporting live searching, source filtering, and detailed reading modals.
*   **System Status Bar**: Integrated API monitoring in the navigation bar displaying live connection statuses (Online, Loading, or Offline/Error).

---

## 📂 Project File Structure

```
data-dashboard/
├── public/
│   └── apexium logo.png          # Project logo assets
├── src/
│   ├── components/
│   │   ├── CybersecurityDashboard.jsx # Real-time CVE feed with severity & CVSS parsing
│   │   ├── ErrorMessage.jsx           # Clean, animated dynamic error screens
│   │   ├── Navbar.jsx                 # Top nav with active tabs and live API status lights
│   │   ├── OverviewDashboard.jsx      # Consolidated widgets screen
│   │   ├── SkeletonLoader.jsx         # Custom Framer Motion content skeleton loaders
│   │   ├── TechNewsDashboard.jsx      # Articles feed with search & site filters
│   │   └── WeatherDashboard.jsx       # Global office forecasts via Open-Meteo
│   ├── App.css                        # Global custom app styles
│   ├── App.jsx                        # Main layout coordinator and state controller
│   ├── index.css                      # Tailwind imports, Manrope font, and theme definitions
│   └── main.jsx                       # Application entry point
├── eslint.config.js                   # Code linting configuration
├── index.html                         # Root HTML template
├── package.json                       # Project metadata and dependencies
└── vite.config.js                     # Vite build and plugin configurations
```

---

## 🛠️ Tech Stack & Design

*   **Core**: React 19, Vite, and Axios
*   **Styling & UI**: Tailwind CSS (v4) with custom **Manrope** typography
*   **Animations**: Framer Motion for smooth tab transitions and responsive drawers/modals
*   **Icons**: React Icons (Lucide/Feather icons via `react-icons/fi`)

---

## 🔌 API Sources

*   **CVE Threat Intelligence**: [CIRCL CVE API](https://cve.circl.lu/)
*   **Weather Forecasts**: [Open-Meteo API](https://open-meteo.com/)
*   **Tech & Space News**: [Spaceflight News API (v4)](https://spaceflightnewsapi.net/)

---

## 📜 Commit History

*   `79fc2a6` - feat: added the TechNews dashboard
*   `fd5cd3c` - feat: added the Weather dashboard
*   `c9dd7a2` - feat: added the Cybersecurity dashboard
*   `3d44977` - feat: added the Overview dashboard
*   `fddbfd4` - feat: scaffold folder structure

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```
