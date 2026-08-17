# ⚡ Pokemon Living Dex Tracker (PWA & PostgreSQL)

A high-performance Progressive Web Application (PWA) for tracking a **Pokemon Living Dex** with custom origin-region challenge rules, featuring **Username Authentication** and real-time **PostgreSQL Database Syncing**.

![Version](https://img.shields.io/badge/version-1.6.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-red.svg)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)

---

## 🎯 Challenge Rules Supported

1. **1 Pokemon per National Dex Number**: Complete National Pokedex coverage from **#0001 Bulbasaur** to **#1025 Pecharunt**. Forms, genders, and costumes are ignored.
2. **Original Region Rule**: Each Pokemon must be caught in its original debut region or an official remake set in that same home region (e.g., Sentret can be caught in *Gold, Silver, Crystal, HeartGold, or SoulSilver*).

---

## ✨ Features

- **👤 Username Authentication (No Password Required)**: Simply enter a trainer username (e.g., `@ash_ketchum`) to load or create a profile.
- **🐘 PostgreSQL Database Sync**: Automatically syncs caught statuses, notes, origin games, and timestamps to a PostgreSQL backend.
- **⚡ Batch Edit & Bulk Selection**: Select multiple Pokemon at once to mark them as caught/uncaught or set origin games (e.g. *Pokemon Blue*) in bulk.
- **🗺️ Interactive Game & Location Finder**: Click any game title in a Pokemon's details modal to view exact routes, encounter methods (*Tall Grass, Surfing, Fishing*), level ranges, and percentage rates, or evolution/gift requirements.
- **🎨 Greyscale vs. Vibrant Sprites**: Uncaught Pokemon appear greyed out; caught Pokemon glow in full vibrant color.
- **🖼️ Sprite Style Switcher**: Toggle between **Official Artwork**, **Pokemon HOME 3D Models**, and **Classic Pixel Sprites**.
- **💾 Hybrid Offline PWA & JSON Backup**: Works offline with `localStorage` caching, retaining 1-click **Export / Import JSON Backup** features. Importing a JSON backup auto-populates the PostgreSQL database.
- **🐳 1-Command Docker Compose**: Complete stack deployment (`PostgreSQL + Express API + React Web PWA`).

---

## 🚀 Quick Start with Docker Compose

Run the entire application stack (PostgreSQL + API Server + Web App) with one command:

```bash
docker compose up --build -d
```
- **Web App**: [http://localhost](http://localhost)
- **Express API**: [http://localhost:5000](http://localhost:5000)
- **PostgreSQL**: `localhost:5432`

---

## 🛠️ Local Development

### 1. Start Express Backend
```bash
cd server
npm install
npm run dev
```

### 2. Start Vite Frontend
```bash
# In the project root
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License

Distributed under the MIT License.


