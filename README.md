# ⚡ Pokemon Living Dex Tracker (PWA)

A high-performance Progressive Web Application (PWA) for tracking a **Pokemon Living Dex** with custom origin-region challenge rules.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-red.svg)

---

## 🎯 Challenge Rules Supported

1. **1 Pokemon per National Dex Number**: Complete National Pokedex coverage from **#0001 Bulbasaur** to **#1025 Pecharunt**. Forms, genders, and costumes are ignored.
2. **Original Region Rule**: Each Pokemon must be caught in its original debut region or an official remake set in that same home region (e.g., Sentret can be caught in *Gold, Silver, Crystal, HeartGold, or SoulSilver*).

---

## ✨ Features

- **🎨 Greyscale vs. Vibrant Sprites**: Uncaught Pokemon appear greyed out; marking a Pokemon as caught illuminates it in full vibrant color with a glowing border.
- **🗺️ Interactive Game & Location Finder**: Click any game title in a Pokemon's details modal to view exact routes, encounter methods (*Tall Grass, Surfing, Fishing*), level ranges, and percentage rates, or evolution/gift requirements.
- **📊 Region Tabs & Live Metrics**: View progress meters and percentages for the total National Dex and each of the 9 region tabs (*Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Paldea*).
- **🔎 Instant Search & Filtering**: Search by Pokemon name or # ID, filter by status (*Caught / Uncaught*), or filter by elemental type (*Fire, Water, Grass, Dragon, etc.*).
- **🖼️ Sprite Style Switcher**: Toggle between **Official Artwork**, **Pokemon HOME 3D Models**, and **Classic Pixel Sprites**.
- **💾 Offline PWA & Data Safety**: Installable web app with Service Worker offline caching, `localStorage` persistence, and 1-click **Export / Import JSON Backup**.
- **🐳 Docker & GitHub CI**: Includes multi-stage Nginx Dockerfile and GitHub Actions workflow for automated container deployment to GHCR.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Icons**: Lucide React
- **Styling**: Modern Vanilla CSS (Glassmorphism design system, CSS Variables, Dark Mode)
- **Containerization**: Docker (Nginx Alpine runner)
- **CI/CD**: GitHub Actions (`docker-ci.yml`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Local Development
```bash
# Clone the repository
git clone https://github.com/alltopafi/pokemon-living-dex-tracker.git
cd pokemon-living-dex-tracker

# Install dependencies
npm install

# Run dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```

---

## 🐳 Docker Deployment

### Run with Docker locally:
```bash
# Build Docker image
docker build -t pokemon-living-dex-tracker:1.0.0 .

# Run container
docker run -d -p 8080:80 pokemon-living-dex-tracker:1.0.0
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 💾 Data Backup & Restore

Your caught progress is automatically saved to your browser's `localStorage`. You can also create offsite backups at any time:
1. Click **Export** in the top navigation bar to download a `.json` backup file.
2. Click **Import** on any device to restore your saved Living Dex progress.

---

## 📄 License

Distributed under the MIT License.
