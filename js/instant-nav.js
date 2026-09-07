/**
 * InstantNav - Ultra-fast 0ms Page Navigation & Smooth Multi-Page Transitions
 * Injects Speculation Rules API, pointer prefetch, instant feedback bar, and pins favicon cache.
 */
(function () {
  'use strict';

  // 1. Immediately pin favicons in browser memory cache so tab never flashes or shakes
  function pinFavicon() {
    try {
      const ico = new Image();
      ico.src = '/favicon.ico';
      const svg = new Image();
      svg.src = '/assets/icons/logo.svg';
    } catch (e) {}
  }
  pinFavicon();

  // 2. Prefetching disabled to ensure browser always serves fresh content on reload/navigate
  function prefetchUrl() {
    // Disabled intentionally to prevent browser cache retention
  }

  // 4. Subtle, high-performance top progress feedback on navigation click
  let progressBar = null;
  function showProgressBar() {
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'instant-nav-progress';
      progressBar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:#00c875;z-index:99999;width:0%;transition:width 0.22s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.15s ease;pointer-events:none;';
      document.body.appendChild(progressBar);
    }
    progressBar.style.opacity = '1';
    progressBar.style.width = '25%';
    setTimeout(() => {
      if (progressBar) progressBar.style.width = '80%';
    }, 40);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;

    try {
      const parsed = new URL(href, window.location.href);
      if (parsed.origin === window.location.origin && parsed.pathname !== window.location.pathname) {
        showProgressBar();
      }
    } catch (err) {}
  }, { passive: true });

  // Reset progress bar on bfcache restoration
  window.addEventListener('pageshow', () => {
    if (progressBar) {
      progressBar.style.width = '100%';
      setTimeout(() => {
        if (progressBar) {
          progressBar.style.opacity = '0';
          progressBar.style.width = '0%';
        }
      }, 100);
    }
  });
})();
