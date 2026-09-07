# Invoice-Gen.net - Modern Vector Invoicing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Vanilla%20JS%20%7C%20Node.js-blue.svg)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-00c875.svg)]()

> A lightning-fast, privacy-first, 100% client-side invoice generator built for freelancers, contractors, and growing businesses worldwide.

---

## ✨ Features

- **⚡ Instant 0ms Vector PDF Generation:** Assemble crisp vector invoices in seconds with client-side rendering.
- **🔒 Privacy-First Architecture:** Invoices are stored in your browser's local sandbox memory (`localStorage`).
- **🎨 6 Pro Design Templates:** Clean Classic, Minimalist Emerald, Corporate Slate, Modern Violet, Creative Amber, and Ocean Blue.
- **🌍 Multi-Currency Support:** Full real-time support for USD ($), EUR (€), GBP (£), BDT (৳), INR (₹), CAD ($), AUD ($), JPY (¥), and AED (د.إ).
- **🌐 Multilingual i18n:** Built-in instant translation for English, Bengali, Spanish, Hindi, German, and French.
- **🔑 Google Identity Services (GIS):** Seamless Google OAuth authentication with real profile synchronization.
- **🚀 Native Cross-Document View Transitions:** Smooth SPA-like page transitions without white flashes.

---

## 🛠️ Tech Stack

- **Frontend:** Pure Vanilla HTML5, CSS3 (Design System with View Transitions), Modern JavaScript (ES6+).
- **Backend / Server:** Native Node.js HTTP Server (`server.js`) with Server Storage REST API.
- **Authentication:** Google Identity Services (OAuth 2.0).
- **Export Engine:** Client-Side Vector PDF Engine (`html2pdf.js` / Canvas).

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/ashikurrahmanshaon/invoicegennet.git
cd invoicegennet
```

### 2. Start the local server
```bash
node server.js
```

### 3. Open in browser
Navigate to `http://localhost:57784` in your web browser.

---

## 🌐 Deploy to Production

### Deploy with Vercel
1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import `ashikurrahmanshaon/invoicegennet`.
3. Vercel will automatically detect `vercel.json` and deploy with instant global CDN caching and clean URLs.

### Deploy with Netlify
1. Go to [Netlify](https://app.netlify.com/start) and link your GitHub repository.
2. Build command: leave blank (or `npm run test`).
3. Publish directory: `.` (root directory, configured via `netlify.toml`).
4. Click **Deploy Site**.

### Deploy on Node.js / VPS / Render / Railway
```bash
npm install
npm start
```

---

## 📄 License

This project is licensed under the MIT License.

