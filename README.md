# 🌾 AgriPulse AI — Smart Agricultural Intelligence & Loss Prevention Platform

AgriPulse is a real-time agricultural intelligence, smart decision support, and emergency distress loss-prevention platform connecting Indian farmers directly with verified buyers, APMC Mandis, and live market intelligence.

---

## 🌟 Core Modules & Key Features

### 👨‍🌾 Farmer Ecosystem
- **Rescue Radar (Emergency Loss Prevention)**: Real-time risk detection engine calculating crop perishability, age, humidity, temperature, APMC price decline trends, and safe liquidation windows with ranking by **Net Realized Recovery**.
- **AI Decision Center**: Multi-crop dynamic analysis recommending the optimal sell timing (`HARVEST` → `DISPATCH` → `SETTLE`) and channel comparisons.
- **My Farm & Crop Lifecycle Tracker**: Real-time stage monitoring from sowing to harvest readiness with NPK fertilization and irrigation tracking.
- **Marketplace Listings**: Post harvest lots with verified quality grades and direct buyer bidding.
- **Settlement & Escrow System**: Secure digital trade records and trade history.

### 🏢 Buyer Ecosystem
- **Procurement Demands**: Post bulk crop procurement requirements with delivery specifications.
- **Smart Crop Search**: Discover nearby farmer listings with distance and grade filtering.
- **Proposals & Counter-Bidding**: Negotiate price, pickup options, and logistics terms directly.
- **Orders & Tracking**: Milestone-based purchase order tracking with live statuses.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, Recharts, Custom Tailwind / Glassmorphism CSS design system.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io (Live websockets), JWT Authentication.
- **APIs**: Live Weather via Open-Meteo API, APMC Mandi AGMARKNET Market Feeds.
- **AI / ML Service**: Python FastAPI microservice for yield and price trend forecasting.

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Community Server or MongoDB Atlas URI)
- Python (v3.9+ for AI service, optional)

### 2. Clone the Repository
```bash
git run clone https://github.com/sanjaitechdev/AgriPulse.git
cd AgriPulse
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Start development server
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
# Start Vite development server
npm run dev
```

### 5. Seed Production Demo Data
```bash
cd ../backend
node src/scripts/seed_production_demo.js
```

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **👨‍🌾 Farmer** | `farmer@demo.com` | `demo1234` | Full Farmer Dashboard, Rescue Radar, Crop Cycles |
| **🏢 Buyer** | `buyer@demo.com` | `demo1234` | Buyer Dashboard, Demands, Proposals, Orders |
| **🛡️ Admin** | `admin@demo.com` | `demo1234` | System Monitoring, Audits, Risk Alerts |

---

## 🌐 Live Deployment Guide

### Deploying Frontend on Vercel
1. Link your GitHub repository `sanjaitechdev/AgriPulse` on [Vercel](https://vercel.com).
2. Set Root Directory: `frontend`.
3. Set Environment Variable: `VITE_API_BASE_URL` to your live backend URL (e.g. `https://agripulse-api.onrender.com/api`).
4. Build Command: `npm run build`, Output Directory: `dist`.

### Deploying Backend on Render / Railway
1. Connect your repository to [Render](https://render.com) (Web Service) or [Railway](https://railway.app).
2. Set Root Directory: `backend`.
3. Set Build Command: `npm install`, Start Command: `npm start`.
4. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random 32+ character string.
   - `CLIENT_URL`: Your Vercel frontend live URL.
