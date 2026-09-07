const fs = require('fs');

// CONCEPT 1: The Layered Emerald Ledger (Standalone, Dynamic Overlapping Cards, No Box)
// Dual-layered invoice sheets with vibrant emerald gradient, folded flap, and crisp financial cuts.
const logoConcept1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="c1Back" x1="6" y1="4" x2="34" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.3" />
    </linearGradient>
    <linearGradient id="c1Front" x1="10" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F090" />
      <stop offset="50%" stop-color="#00C472" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="c1Fold" x1="28" y1="4" x2="40" y2="16" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#D1FAE5" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
    <filter id="c1Drop" x="4" y="2" width="42" height="46" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#043825" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Back Layer: Secondary Document in Dark Slate -->
  <path d="M7 10C7 8.34315 8.34315 7 10 7H26L34 15V37C34 38.6569 32.6569 40 31 40H10C8.34315 40 7 38.6569 7 37V10Z" fill="url(#c1Back)" />

  <!-- Front Layer: Primary Vibrant Emerald Invoice Sheet with Depth -->
  <g filter="url(#c1Drop)">
    <path d="M12 6C12 4.34315 13.3431 3 15 3H31L41 13V39C41 40.6569 39.6569 42 38 42H15C13.3431 42 12 40.6569 12 39V6Z" fill="url(#c1Front)" />
    <!-- Crisp Folded Corner -->
    <path d="M31 3V11C31 12.1046 31.8954 13 33 13H41L31 3Z" fill="url(#c1Fold)" />
  </g>

  <!-- Inside Content: Sleek White Ledger & Checkmark -->
  <rect x="18" y="15" width="8" height="3" rx="1.5" fill="#FFFFFF" />
  <rect x="18" y="21" width="16" height="2.5" rx="1.25" fill="#FFFFFF" fill-opacity="0.9" />
  <rect x="18" y="26" width="11" height="2.5" rx="1.25" fill="#FFFFFF" fill-opacity="0.75" />

  <!-- Bottom Accent: Crisp Paid Checkmark Seal Badge -->
  <circle cx="31.5" cy="33.5" r="5.5" fill="#FFFFFF" />
  <path d="M29 33.5L30.8 35.3L34.2 31.8" stroke="#047857" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

// CONCEPT 2: Modern FinTech Geometric Monogram (Sleek "I" + Receipt Silhouette + Dynamic Emerald Cut)
// Ultra-clean, iconic, tech-forward emblem like Stripe or Linear
const logoConcept2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="c2Grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F59B" />
      <stop offset="60%" stop-color="#00C875" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="c2Accent" x1="18" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <filter id="c2Glow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00C875" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Modern Geometric Invoice Frame: Clean Chamfered/Curved Silhouette -->
  <g filter="url(#c2Glow)">
    <rect x="6" y="5" width="36" height="38" rx="10" fill="url(#c2Grad)" />
  </g>

  <!-- Clean Contrast Core: Stylized Document Shape with Cutout Lines -->
  <!-- Top Status Pill -->
  <rect x="14" y="12" width="8" height="3.5" rx="1.75" fill="#FFFFFF" />
  <circle cx="31" cy="13.75" r="2.25" fill="#FFFFFF" />

  <!-- Ledger Rows (Crisp negative space cuts & geometric lines) -->
  <rect x="14" y="19" width="20" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.95" />
  <rect x="14" y="25" width="14" height="3" rx="1.5" fill="#FFFFFF" fill-opacity="0.75" />
  
  <!-- Total Summary Bar with Distinct Arrow / Check Angle -->
  <rect x="14" y="31" width="20" height="4" rx="2" fill="#0F172A" />
  <rect x="16" y="32.25" width="6" height="1.5" rx="0.75" fill="#00F59B" />
</svg>`;

// CONCEPT 3: The Ultra-Premium FinTech Crest (The "Vault Card" - Crisp, High-Status, Architectural)
// Used by high-end financial tools like Ramp, Brex, Mercury
const logoConcept3 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="c3Bg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
    <linearGradient id="c3Border" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F59B" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="c3Em" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F59B" />
      <stop offset="100%" stop-color="#00B86B" />
    </linearGradient>
  </defs>

  <!-- Dark Obsidian Base with Emerald Border -->
  <rect x="4" y="4" width="40" height="40" rx="11" fill="url(#c3Bg)" stroke="url(#c3Border)" stroke-width="1.5" />

  <!-- Stylized Floating Invoice Sheet inside with Emerald Gradient -->
  <path d="M14 12C14 10.8954 14.8954 10 16 10H27L34 17V36C34 37.1046 33.1046 38 32 38H16C14.8954 38 14 37.1046 14 36V12Z" fill="url(#c3Em)" />
  <path d="M27 10V15C27 16.1046 27.8954 17 29 17H34L27 10Z" fill="#D1FAE5" />

  <!-- Clean White Architectural Elements inside Document -->
  <rect x="18" y="17" width="6" height="2.5" rx="1.25" fill="#FFFFFF" />
  <rect x="18" y="23" width="12" height="2" rx="1" fill="#FFFFFF" fill-opacity="0.9" />
  <rect x="18" y="28" width="8" height="2" rx="1" fill="#FFFFFF" fill-opacity="0.7" />
  <circle cx="28.5" cy="32.5" r="2.5" fill="#0F172A" />
</svg>`;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Logo & Header Variations</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0f172a; color: white; padding: 40px; }
  .grid { display: flex; flex-direction: column; gap: 30px; max-width: 900px; margin: 0 auto; }
  .card { background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155; }
  .header-preview-light { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: rgba(255, 255, 255, 0.95); border: 1px solid #e2e8f0; border-radius: 12px; margin-top: 16px; }
  .brand-wrap { display: flex; align-items: center; gap: 14px; }
  .brand-title { font-size: 1.45rem; font-weight: 800; color: #0f172a; letter-spacing: -0.04em; display: flex; align-items: center; }
  .tld-pill { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 800; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 999px; margin-left: 8px; letter-spacing: 0.02em; }
  .nav-preview { display: flex; gap: 20px; font-size: 14px; font-weight: 600; color: #475569; align-items: center; }
  .btn-preview { background: #0f172a; color: white; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 14px; }
</style>
</head>
<body>
  <div class="grid">
    <h1>New Logo & Header Stylings (44px Logo)</h1>

    <div class="card">
      <h3>Option 1: The Layered Emerald Ledger (Standalone Vector Document + Paid Seal)</h3>
      <p style="color:#94a3b8;">Natural, elegant, not trapped in a box. Bold 44px presence, dual-sheet depth, folded flap, and verified paid checkmark.</p>
      <div class="header-preview-light">
        <div class="brand-wrap">
          <div style="width:44px;height:44px;">${logoConcept1}</div>
          <div class="brand-title">Invoice-Gen<span class="tld-pill">.net</span></div>
        </div>
        <div class="nav-preview">
          <span style="color:#00874e;font-weight:700;">Invoice Generator</span>
          <span>Templates</span>
          <span>Features</span>
          <span>Pricing</span>
        </div>
        <div>
          <span style="color:#334155;font-weight:600;margin-right:16px;">Log In</span>
          <span class="btn-preview">Sign Up Free</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Option 2: Modern FinTech Emerald Vault (Clean Rounded Emblem + Obsidian Total Bar)</h3>
      <p style="color:#94a3b8;">High-contrast modern fintech app mark with vibrant gradient, ledger lines, and bold obsidian total summary bar.</p>
      <div class="header-preview-light">
        <div class="brand-wrap">
          <div style="width:44px;height:44px;">${logoConcept2}</div>
          <div class="brand-title">Invoice-Gen<span class="tld-pill">.net</span></div>
        </div>
        <div class="nav-preview">
          <span style="color:#00874e;font-weight:700;">Invoice Generator</span>
          <span>Templates</span>
          <span>Features</span>
          <span>Pricing</span>
        </div>
        <div>
          <span style="color:#334155;font-weight:600;margin-right:16px;">Log In</span>
          <span class="btn-preview">Sign Up Free</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('scratch/compare_logos.html', html);
console.log('Saved scratch/compare_logos.html');
