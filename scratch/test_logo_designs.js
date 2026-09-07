const fs = require('fs');

// Design 1: Modern Emerald Squircle App Icon with Crisp Floating Invoice & Paid Badge
const svgSquircle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="squircleBg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00E887" />
      <stop offset="45%" stop-color="#00C06F" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="rimHighlight" x1="4" y1="4" x2="44" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.08" />
    </linearGradient>
    <linearGradient id="sheetGrad" x1="14" y1="9" x2="34" y2="39" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>
    <filter id="softShadow" x="10" y="7" width="28" height="35" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#022c1b" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Base Rounded Squircle with 11px radius and top highlight border -->
  <rect x="3" y="3" width="42" height="42" rx="11" fill="url(#squircleBg)" />
  <rect x="3.5" y="3.5" width="41" height="41" rx="10.5" stroke="url(#rimGrad)" stroke-width="1" />

  <!-- Crisp White Invoice Document -->
  <g filter="url(#softShadow)">
    <path d="M14 11C14 9.89543 14.8954 9 16 9H27L34 16V36C34 37.1046 33.1046 38 32 38H16C14.8954 38 14 37.1046 14 36V11Z" fill="url(#sheetGrad)" />
    <!-- Folded Corner with dual-tone depth -->
    <path d="M27 9V14C27 15.1046 27.8954 16 29 16H34L27 9Z" fill="#CBD5E1" />
  </g>

  <!-- Top Accent Header Bar -->
  <rect x="18" y="14" width="6" height="2.5" rx="1.25" fill="#00B86B" />

  <!-- High-contrast Ledger Rows -->
  <rect x="18" y="20" width="12" height="2.2" rx="1.1" fill="#475569" />
  <rect x="18" y="24.5" width="8" height="2.2" rx="1.1" fill="#94A3B8" />

  <!-- Total Line (Dark Obsidian Bold) -->
  <rect x="18" y="30" width="12" height="2.5" rx="1.25" fill="#0F172A" />
</svg>`;

// Design 2: High-End Geometric Modern FinTech Mark (Standalone Invoice with Emerald Fold & Diamond/Check)
const svgFinTech = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="ftMain" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00E585" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="ftFold" x1="28" y1="4" x2="42" y2="18" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#A7F3D0" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
  </defs>

  <!-- Modern Silhouette with 8px radius and sharp proportional fold -->
  <path d="M9 7C9 5.34315 10.3431 4 12 4H30L41 15V41C41 42.6569 39.6569 44 38 44H12C10.3431 44 9 42.6569 9 41V7Z" fill="url(#ftMain)" />

  <!-- Folded Corner -->
  <path d="M30 4V13C30 14.1046 30.8954 15 32 15H41L30 4Z" fill="url(#ftFold)" />

  <!-- Distinctive Geometric Notch / Ribbon -->
  <rect x="15" y="16" width="9" height="3.5" rx="1.75" fill="#FFFFFF" />
  <rect x="15" y="23" width="18" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.9" />
  <rect x="15" y="29" width="12" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.75" />
  
  <!-- Verified Badge / Checkmark Circle in bottom right -->
  <circle cx="31" cy="34" r="5.5" fill="#FFFFFF" />
  <path d="M28.5 34L30.2 35.7L33.5 32.5" stroke="#047857" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

// Design 3: The Minimalist Linear-Style Emblem (Clean, Bold, Razor Sharp)
const svgLinear = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="linGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00D27F" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <!-- Sleek rounded badge -->
  <rect x="4" y="4" width="40" height="40" rx="10" fill="#0F172A" />
  <!-- Vibrant emerald inner frame -->
  <rect x="4" y="4" width="40" height="40" rx="10" stroke="#1E293B" stroke-width="1.5" />
  <!-- Inner Invoice with emerald glow -->
  <path d="M15 12C15 10.8954 15.8954 10 17 10H26L33 17V36C33 37.1046 32.1046 38 31 38H17C15.8954 38 15 37.1046 15 36V12Z" fill="#1E293B" />
  <path d="M26 10V15C26 16.1046 26.8954 17 28 17H33L26 10Z" fill="#334155" />
  <!-- Vibrant Emerald Ledger Bars & Check -->
  <rect x="19" y="17" width="6" height="2.5" rx="1.25" fill="#00D27F" />
  <rect x="19" y="23" width="10" height="2" rx="1" fill="#E2E8F0" />
  <rect x="19" y="28" width="7" height="2" rx="1" fill="#94A3B8" />
  <!-- Glowing Emerald Dot -->
  <circle cx="28.5" cy="32.5" r="2.5" fill="#00D27F" />
</svg>`;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Logo Variations Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; padding: 40px; }
  .grid { display: flex; gap: 30px; margin-bottom: 40px; }
  .card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; width: 340px; }
  .header-preview { display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-bottom: 1px solid #e2e8f0; }
  .brand-name-1 { font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.035em; }
  .brand-name-1 .accent { display: inline-flex; align-items: center; font-size: 0.72rem; font-weight: 700; color: #00a860; background: rgba(0, 200, 117, 0.08); border: 1px solid rgba(0, 200, 117, 0.22); padding: 2px 7px; border-radius: 6px; margin-left: 6px; letter-spacing: 0.02em; vertical-align: 2px; font-family: 'JetBrains Mono', monospace; text-transform: lowercase; }
  .brand-name-2 { font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.035em; }
  .brand-name-2 .accent { color: #00c875; }
  .dark-tab { background: #1e293b; color: white; padding: 8px 14px; border-radius: 8px 8px 0 0; display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
  .light-tab { background: #e2e8f0; color: #0f172a; padding: 8px 14px; border-radius: 8px 8px 0 0; display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
</style>
</head>
<body>
  <h2>Logo & Header Typography Variations</h2>
  <div class="grid">
    <div class="card">
      <h3>Design 1: Emerald Squircle App Icon + Floating Invoice</h3>
      <div style="margin-bottom: 20px;">
        ${svgSquircle}
      </div>
      <h4>In Header (38px):</h4>
      <div class="header-preview">
        <div style="width:38px;height:38px;">${svgSquircle}</div>
        <div class="brand-name-1">Invoice-Gen<span class="accent">.net</span></div>
      </div>
      <h4>Browser Tab Preview:</h4>
      <div class="light-tab"><div style="width:16px;height:16px;">${svgSquircle}</div> Invoice-Gen.net - Free Online Invoice Generator</div>
      <div class="dark-tab" style="margin-top:8px;"><div style="width:16px;height:16px;">${svgSquircle}</div> Invoice-Gen.net - Free Online Invoice Generator</div>
    </div>

    <div class="card">
      <h3>Design 2: FinTech Emerald Mark + Verified Seal</h3>
      <div style="margin-bottom: 20px;">
        ${svgFinTech}
      </div>
      <h4>In Header (38px):</h4>
      <div class="header-preview">
        <div style="width:38px;height:38px;">${svgFinTech}</div>
        <div class="brand-name-1">Invoice-Gen<span class="accent">.net</span></div>
      </div>
      <h4>Browser Tab Preview:</h4>
      <div class="light-tab"><div style="width:16px;height:16px;">${svgFinTech}</div> Invoice-Gen.net - Free Online Invoice Generator</div>
      <div class="dark-tab" style="margin-top:8px;"><div style="width:16px;height:16px;">${svgFinTech}</div> Invoice-Gen.net - Free Online Invoice Generator</div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('scratch/preview_logos.html', html);
console.log('Saved scratch/preview_logos.html');
