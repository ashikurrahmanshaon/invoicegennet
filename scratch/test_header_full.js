const fs = require('fs');

const svgFinal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none">
  <defs>
    <linearGradient id="backSheet" x1="6" y1="4" x2="34" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F172A" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.28" />
    </linearGradient>
    <linearGradient id="mainSheet" x1="11" y1="3" x2="41" y2="43" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00F59B" />
      <stop offset="45%" stop-color="#00C472" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="flapGrad" x1="29" y1="3" x2="41" y2="15" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E6FDF3" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
    <filter id="cardShadow" x="5" y="2" width="41" height="45" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#043825" flood-opacity="0.26" />
    </filter>
  </defs>

  <!-- Back Layer: Secondary Depth Sheet -->
  <path d="M7 9C7 7.34315 8.34315 6 10 6H26L34 14V36C34 37.6569 32.6569 39 31 39H10C8.34315 39 7 37.6569 7 36V9Z" fill="url(#backSheet)" />

  <!-- Front Layer: Primary Luminous Emerald Sheet -->
  <g filter="url(#cardShadow)">
    <path d="M12 5C12 3.34315 13.3431 2 15 2H30L41 13V39C41 40.6569 39.6569 42 38 42H15C13.3431 42 12 40.6569 12 39V5Z" fill="url(#mainSheet)" />
    <!-- Folded Corner Flap -->
    <path d="M30 2V11C30 12.1046 30.8954 13 32 13H41L30 2Z" fill="url(#flapGrad)" />
  </g>

  <!-- Inside Document: High-Contrast White Ledger Lines -->
  <!-- Header / Meta Bar -->
  <rect x="17" y="14" width="7" height="3" rx="1.5" fill="#FFFFFF" />
  
  <!-- Line Items -->
  <rect x="17" y="20" width="16" height="2.5" rx="1.25" fill="#FFFFFF" fill-opacity="0.95" />
  <rect x="17" y="25" width="11" height="2.5" rx="1.25" fill="#FFFFFF" fill-opacity="0.8" />

  <!-- Verified Paid Checkmark Seal Badge (Bottom Right) -->
  <circle cx="31.5" cy="33.5" r="5.5" fill="#FFFFFF" />
  <path d="M29 33.5L30.8 35.3L34.2 31.8" stroke="#047857" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Header Full Fidelity Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f8fafc;
    color: #0f172a;
    min-height: 100vh;
  }

  /* 70px Premium Header */
  .navbar-saas {
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
    height: 70px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(226, 232, 240, 0.85);
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
  }

  .navbar-saas .container {
    max-width: 1240px;
    height: 100%;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Brand Logo & Name (44px) */
  .brand-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    transition: opacity 0.15s ease;
  }
  .brand-wrapper:hover {
    opacity: 0.94;
  }

  .brand-logo-frame {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .brand-icon-svg {
    width: 44px !important;
    height: 44px !important;
    display: block !important;
    flex-shrink: 0 !important;
    transform: translateZ(0);
  }

  .brand-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.45rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.04em;
    line-height: 1;
    display: inline-flex;
    align-items: center;
  }

  .brand-name .accent {
    display: inline-flex;
    align-items: center;
    font-size: 0.72rem;
    font-weight: 800;
    font-family: 'JetBrains Mono', monospace;
    color: #047857;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid #a7f3d0;
    padding: 3px 8px;
    border-radius: 999px;
    margin-left: 8px;
    letter-spacing: 0.02em;
    line-height: 1.2;
    text-transform: lowercase;
    box-shadow: 0 1px 3px rgba(16, 185, 129, 0.12);
  }

  /* Segmented Nav Dock */
  .nav-center-links {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(241, 245, 249, 0.75);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid rgba(226, 232, 240, 0.8);
  }

  .nav-link-item {
    padding: 6px 16px;
    border-radius: 7px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .nav-link-item:hover {
    color: #0f172a;
    background: rgba(255, 255, 255, 0.7);
  }

  .nav-link-item.active {
    color: #0f172a;
    background: #ffffff;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }

  /* Right Actions */
  .nav-actions-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-login {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.15s ease;
  }
  .btn-login:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .btn-signup-free {
    height: 38px;
    padding: 0 18px;
    font-size: 0.875rem;
    font-weight: 700;
    background: #0f172a;
    color: #ffffff;
    border-radius: 8px;
    border: 1px solid #1e293b;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1), 0 2px 6px -1px rgba(15, 23, 42, 0.15);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.15s ease;
  }
  .btn-signup-free:hover {
    background: #1e293b;
    box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.2);
  }

  .hero-mock {
    max-width: 800px;
    margin: 80px auto;
    text-align: center;
    padding: 0 20px;
  }
  .hero-mock h1 { font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 16px; }
  .hero-mock p { font-size: 1.25rem; color: #64748b; line-height: 1.6; }
</style>
</head>
<body>

  <header class="navbar-saas">
    <div class="container">
      <a href="#" class="brand-wrapper">
        <div class="brand-logo-frame">
          ${svgFinal}
        </div>
        <div class="brand-name">
          Invoice-Gen<span class="accent">.net</span>
        </div>
      </a>

      <nav class="nav-center-links">
        <a href="#" class="nav-link-item active">Invoice Generator</a>
        <a href="#" class="nav-link-item">Templates</a>
        <a href="#" class="nav-link-item">Features</a>
        <a href="#" class="nav-link-item">Pricing</a>
      </nav>

      <div class="nav-actions-wrap">
        <a href="#" class="btn-login">Log In</a>
        <a href="#" class="btn-signup-free">Sign Up Free</a>
      </div>
    </div>
  </header>

  <div class="hero-mock">
    <h1>The Modern Invoicing Platform</h1>
    <p>Look at the header above: 44px bold layered emerald ledger, capsule .net pill badge, segmented floating dock navigation, and obsidian CTA.</p>
  </div>

</body>
</html>`;

fs.writeFileSync('scratch/header_preview_live.html', html);
console.log('Saved scratch/header_preview_live.html');
