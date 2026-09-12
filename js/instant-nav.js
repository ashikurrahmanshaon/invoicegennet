/**
 * InstantNav & Seamless Layout Router - Invoice-Gen.net
 * Architecture:
 * - Seamless PJAX Client-Side Navigation (Zero full-page reloads, zero white flash)
 * - Persistent Shared Layout (Header & Footer never remount or recreate)
 * - Rock-Solid Font Stability (Loaded fonts remain permanently active in GPU memory)
 * - Active Navigation Link Underline & State Synchronization
 * - Route Guards for Private (Dashboard) & Public Auth (Login/Signup) Routes
 * - Invoice Form Draft Auto-Preservation
 * - Multi-Language In-Place Re-Translation
 * - Speculation Rules & Hover Prefetching Cache
 * - Subtle Micro-Transition: opacity 0.98 -> 1, translateY 3px -> 0, 160ms ease-out
 */
(function () {
  'use strict';

  const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Pin favicons in memory cache so tab icon never blinks
  function pinFavicon() {
    try {
      const ico = new Image();
      ico.src = '/favicon.ico?v=5.0';
      const svg = new Image();
      svg.src = '/assets/icons/favicon.svg?v=5.0';
    } catch (e) {}
  }
  pinFavicon();

  // 2. In-Memory Document Cache (Instantaneous 0ms page swapping)
  const pageCache = new Map();
  const prefetchedUrls = new Set();

  async function prefetchUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.origin !== window.location.origin) return;
      const cleanPath = parsed.pathname;
      if (prefetchedUrls.has(cleanPath)) return;
      prefetchedUrls.add(cleanPath);

      // Fetch and cache HTML in memory
      const res = await fetch(cleanPath, { credentials: 'same-origin' });
      if (res.ok) {
        const text = await res.text();
        pageCache.set(cleanPath, text);
      }
    } catch (e) {}
  }

  // Speculation Rules API for modern browsers (Chrome 109+, Edge 109+)
  function injectSpeculationRules() {
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports('speculationrules')) return;
    try {
      const script = document.createElement('script');
      script.type = 'speculationrules';
      script.textContent = JSON.stringify({
        prefetch: [
          {
            source: 'list',
            urls: [
              'index.html',
              'templates.html',
              'dashboard.html',
              'pricing.html',
              'features.html',
              'blog.html',
              'contact.html',
              'login.html',
              'signup.html'
            ]
          }
        ]
      });
      document.head.appendChild(script);
    } catch (e) {}
  }
  injectSpeculationRules();

  // Pointer & Hover Prefetching
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (a.target && a.target !== '_self') return;
    try {
      const parsed = new URL(href, window.location.href);
      if (parsed.origin === window.location.origin) {
        prefetchUrl(parsed.pathname);
      }
    } catch (err) {}
  }, { passive: true });

  // 3. Close open header dropdowns and drawers cleanly
  function closeHeaderMenus() {
    const dropdownMenu = document.getElementById('toolsDropdownMenu');
    const dropdownBtn = document.getElementById('toolsDropdownBtn');
    if (dropdownMenu) dropdownMenu.classList.remove('active');
    if (dropdownBtn) dropdownBtn.setAttribute('aria-expanded', 'false');

    const drawer = document.getElementById('mobileNavDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    const btnToggle = document.getElementById('btnMobileNavToggle');
    if (drawer) {
      drawer.classList.remove('active');
      drawer.classList.remove('open');
    }
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.classList.remove('open');
    }
    document.body.classList.remove('mobile-drawer-open');
    if (btnToggle) btnToggle.setAttribute('aria-expanded', 'false');

    const userMenu = document.getElementById('userAccountMenu');
    const userToggle = document.getElementById('btnUserAccountToggle');
    if (userMenu) userMenu.classList.remove('active');
    if (userToggle) userToggle.setAttribute('aria-expanded', 'false');
  }

  // 4. Synchronize Header Active Navigation Link (Without remounting header)
  function syncHeaderActiveLinks(pathname) {
    const navLinks = document.querySelectorAll('.nav-link-item, .mobile-nav-link');
    let normalizedPath = pathname.replace(/^\//, '');
    if (!normalizedPath || normalizedPath === 'index.html') normalizedPath = 'index.html';

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      let cleanHref = href.split('#')[0].split('?')[0].replace(/^\//, '');
      if (!cleanHref) cleanHref = 'index.html';

      const isMatch = (cleanHref === normalizedPath) ||
                      (normalizedPath === 'index.html' && (cleanHref === '' || cleanHref === 'index.html')) ||
                      (normalizedPath.includes('dashboard') && cleanHref.includes('dashboard')) ||
                      (normalizedPath.includes('templates') && cleanHref.includes('templates')) ||
                      (normalizedPath.includes('pricing') && cleanHref.includes('pricing')) ||
                      (normalizedPath.includes('features') && cleanHref.includes('features')) ||
                      (normalizedPath.includes('blog') && cleanHref.includes('blog'));

      if (isMatch) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // 5. Universal Invoices Badge Updater
  function updateHeaderInvoicesBadge() {
    try {
      const applyBadgeCount = (count) => {
        const badges = document.querySelectorAll('.nav-count-badge, .mobile-nav-count-badge');
        badges.forEach((b) => {
          if (count > 0) {
            b.textContent = count > 99 ? '99+' : count;
            b.style.display = 'inline-flex';
          } else {
            b.style.display = 'none';
          }
        });
      };

      let count = 0;
      const raw = localStorage.getItem('invoicegen_invoices');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) count = list.length;
      }
      applyBadgeCount(count);

      const fetchFn = (window.Auth && typeof window.Auth.authFetch === 'function') ? window.Auth.authFetch : fetch;
      if (typeof fetchFn === 'function') {
        fetchFn('/api/invoices/stats')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && typeof data.totalInvoices === 'number') {
              applyBadgeCount(data.totalInvoices);
            }
          })
          .catch(() => {});
      }
    } catch (e) {}
  }

  // 6. Seamless Navigation Router Core
  let isNavigating = false;

  async function navigateTo(targetUrl, options = {}) {
    const pushState = options.pushState !== false;

    try {
      const parsed = new URL(targetUrl, window.location.href);
      if (parsed.origin !== window.location.origin) {
        window.location.href = targetUrl;
        return;
      }

      const targetPath = parsed.pathname;
      const fullTarget = parsed.pathname + parsed.search + parsed.hash;

      // Avoid redundant navigation to exact same URL (unless anchor scroll)
      if (window.location.pathname === parsed.pathname && window.location.search === parsed.search && !parsed.hash && !options.force) {
        return;
      }

      // Check Route Guards
      const isAuth = window.Auth && window.Auth.isAuthenticated();
      const isPrivate = targetPath.includes('dashboard') || targetPath.includes('invoice-details');
      const isAuthRoute = targetPath.includes('login') || targetPath.includes('signup');

      if (isPrivate && !isAuth && window.Auth && window.Auth.state === 'UNAUTHENTICATED') {
        navigateTo(`login.html?redirect=${encodeURIComponent(fullTarget)}`, { pushState: true });
        return;
      }

      if (isAuthRoute && isAuth) {
        navigateTo('dashboard.html', { pushState: true });
        return;
      }

      // Preserve active invoice draft if leaving invoice editor
      if (window.invoiceStore && typeof window.invoiceStore.saveToStorage === 'function') {
        try {
          window.invoiceStore.saveToStorage();
        } catch (e) {}
      }

      isNavigating = true;

      // Retrieve HTML text from in-memory cache or network
      let htmlText = pageCache.get(targetPath);
      if (!htmlText) {
        const response = await fetch(parsed.pathname + parsed.search, { credentials: 'same-origin' });
        if (!response.ok) {
          window.location.href = targetUrl;
          return;
        }
        // Handle server-side 302/redirect if redirected
        if (response.redirected) {
          const redirectedUrl = new URL(response.url);
          if (redirectedUrl.pathname !== parsed.pathname) {
            navigateTo(response.url, { pushState: true, force: true });
            return;
          }
        }
        htmlText = await response.text();
        pageCache.set(targetPath, htmlText);
      }

      // Parse incoming HTML
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(htmlText, 'text/html');

      const newMain = newDoc.querySelector('main');
      const currentMain = document.querySelector('main');

      if (!newMain || !currentMain) {
        // Fallback to normal navigation if page has non-standard layout
        window.location.href = targetUrl;
        return;
      }

      // 1. Swap <main> content seamlessly
      currentMain.replaceWith(newMain);

      // 2. Subtle Entrance Micro-Transition (opacity 0.98 -> 1, translateY 3px -> 0, 160ms)
      if (!isReducedMotion()) {
        newMain.classList.remove('page-content-enter');
        void newMain.offsetWidth; // Trigger reflow for animation restart
        newMain.classList.add('page-content-enter');
      }

      // 3. Update Title & History
      document.title = newDoc.title || document.title;
      if (pushState) {
        window.history.pushState({ path: fullTarget }, document.title, fullTarget);
      }

      // 4. Update Header State & Navigation Links
      syncHeaderActiveLinks(parsed.pathname);
      closeHeaderMenus();
      if (window.trackEvent) {
        try { window.trackEvent('page_view', { page_path: parsed.pathname }); } catch (e) {}
      }

      // 5. Re-apply current language in-place
      if (window.i18n && typeof window.i18n.setLanguage === 'function') {
        const currentLang = window.i18n.getLanguage ? window.i18n.getLanguage() : 'en';
        window.i18n.setLanguage(currentLang);
      }

      // 6. Ensure Auth Header is up-to-date
      if (window.Auth && typeof window.Auth.renderHeader === 'function') {
        window.Auth.renderHeader();
      }
      updateHeaderInvoicesBadge();

      // 7. Execute Page Lifecycle Initializers
      executePageScripts(parsed.pathname, newMain, newDoc);

      // 8. Scroll position
      if (parsed.hash) {
        const hashEl = document.querySelector(parsed.hash);
        if (hashEl) {
          hashEl.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth' });
        } else {
          window.scrollTo(0, 0);
        }
      } else {
        window.scrollTo(0, 0);
      }

    } catch (err) {
      console.error('Seamless router notice:', err);
      window.location.href = targetUrl;
    } finally {
      isNavigating = false;
    }
  }

  // 7. Page Lifecycle Hook Executor
  function executePageScripts(pathname, container, newDoc) {
    // 1. Extract and execute inline scripts from newDoc so page controllers are registered
    if (newDoc) {
      const inlineScripts = newDoc.querySelectorAll('body script:not([src])');
      inlineScripts.forEach(oldScript => {
        try {
          const newScript = document.createElement('script');
          newScript.textContent = oldScript.textContent;
          document.body.appendChild(newScript);
          newScript.remove();
        } catch (e) {
          console.error('Page script execution error:', e);
        }
      });
    }

    const cleanPath = pathname.toLowerCase();

    // 2. Execute Dashboard Controller
    if (cleanPath.includes('dashboard') && typeof window.initDashboardPage === 'function') {
      try { window.initDashboardPage(); } catch (e) { console.error('Dashboard init error:', e); }
    }
    // 3. Execute Invoice Editor Controller
    else if ((cleanPath.includes('index') || cleanPath === '/' || cleanPath.includes('pdf-invoice') || cleanPath.includes('free-invoice')) && typeof window.initInvoiceEditorPage === 'function') {
      try { window.initInvoiceEditorPage(); } catch (e) { console.error('Invoice editor init error:', e); }
    }
    // 4. Execute Login Controller
    else if (cleanPath.includes('login') && typeof window.initLoginPage === 'function') {
      try { window.initLoginPage(); } catch (e) { console.error('Login init error:', e); }
    }
    // 5. Execute Signup Controller
    else if (cleanPath.includes('signup') && typeof window.initSignupPage === 'function') {
      try { window.initSignupPage(); } catch (e) { console.error('Signup init error:', e); }
    }
    // 6. Execute Templates Controller
    else if (cleanPath.includes('templates') && typeof window.initTemplatesPage === 'function') {
      try { window.initTemplatesPage(); } catch (e) { console.error('Templates init error:', e); }
    }
    // 7. Execute Tools Engine Controller
    else if ((cleanPath.includes('gst') || cleanPath.includes('invoice-number') || cleanPath.includes('freelancer') || cleanPath.includes('payments')) && typeof window.initToolsEngine === 'function') {
      try { window.initToolsEngine(); } catch (e) { console.error('Tools init error:', e); }
    }

    // Also execute any inline scripts found inside the new container
    if (container) {
      const scripts = container.querySelectorAll('script');
      scripts.forEach(oldScript => {
        try {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          newScript.textContent = oldScript.textContent;
          oldScript.replaceWith(newScript);
        } catch (e) {}
      });
    }
  }

  // 8. Navigation Click Interceptor
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;

    // Ignore modified clicks or secondary button clicks
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    // Smooth scroll for hash links on the current page
    if (href.startsWith('#')) {
      const targetId = href.slice(1);
      if (targetId) {
        const targetEl = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth' });
          if (history.pushState) history.pushState(null, '', href);
        }
      }
      return;
    }

    // Ignore downloads and new tab links
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;

    try {
      const parsed = new URL(href, window.location.href);
      // Only intercept same-origin internal links
      if (parsed.origin === window.location.origin) {
        e.preventDefault();
        navigateTo(href, { pushState: true });
      }
    } catch (err) {}
  }, { passive: false });

  // 9. Popstate Listener for Browser Back/Forward Buttons
  window.addEventListener('popstate', () => {
    navigateTo(window.location.href, { pushState: false });
  });

  // 10. Tools Dropdown Handler
  function initToolsDropdown() {
    const dropdownWrap = document.querySelector('.nav-dropdown-item-wrap');
    const dropdownBtn = document.getElementById('toolsDropdownBtn');
    const dropdownMenu = document.getElementById('toolsDropdownMenu');
    if (!dropdownWrap || !dropdownBtn || !dropdownMenu) return;

    dropdownBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.toggle('active');
      dropdownBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    document.addEventListener('click', (e) => {
      if (!dropdownWrap.contains(e.target)) {
        dropdownMenu.classList.remove('active');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdownMenu.classList.contains('active')) {
        dropdownMenu.classList.remove('active');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 11. Universal Mobile Navigation Drawer Handler
  function initMobileNav() {
    const btnToggle = document.getElementById('btnMobileNavToggle');
    const drawer = document.getElementById('mobileNavDrawer');
    if (!btnToggle || !drawer) return;

    // Ensure drawer is on root body to guarantee it sits above backdrop stacking context
    if (drawer.parentElement !== document.body) {
      document.body.appendChild(drawer);
    }

    // Ensure backdrop exists in DOM
    let backdrop = document.getElementById('mobileDrawerBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobileDrawerBackdrop';
      backdrop.className = 'mobile-drawer-backdrop';
      document.body.appendChild(backdrop);
    }

    // Ensure header with close button inside drawer
    let drawerHeader = drawer.querySelector('.mobile-drawer-header');
    if (!drawerHeader) {
      drawerHeader = document.createElement('div');
      drawerHeader.className = 'mobile-drawer-header';
      drawerHeader.innerHTML = `
        <a href="index.html" class="mobile-drawer-brand">
          <img src="/assets/icons/logo.svg" alt="Invoice-Gen.net Logo" width="28" height="28">
          <span style="font-size: 1.15rem; font-weight: 800; color: #0f172a; font-family: var(--font-sans);">Invoice-Gen<span style="color: #059669;">.net</span></span>
        </a>
        <button type="button" class="btn-drawer-close" id="btnDrawerClose" aria-label="Close navigation menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      drawer.prepend(drawerHeader);
    }

    const btnClose = drawer.querySelector('#btnDrawerClose');

    function openDrawer() {
      drawer.classList.add('active');
      drawer.classList.add('open');
      backdrop.classList.add('active');
      backdrop.classList.add('open');
      document.body.classList.add('mobile-drawer-open');
      btnToggle.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      drawer.classList.remove('active');
      drawer.classList.remove('open');
      backdrop.classList.remove('active');
      backdrop.classList.remove('open');
      document.body.classList.remove('mobile-drawer-open');
      btnToggle.setAttribute('aria-expanded', 'false');
    }

    btnToggle.onclick = (e) => {
      e.stopPropagation();
      if (drawer.classList.contains('active') || drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    };

    if (btnClose) {
      btnClose.onclick = (e) => {
        e.stopPropagation();
        closeDrawer();
      };
    }

    backdrop.onclick = closeDrawer;

    // Close when tapping any link inside the drawer
    drawer.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) {
        closeDrawer();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (drawer.classList.contains('active') || drawer.classList.contains('open'))) {
        closeDrawer();
      }
    });
  }

  // Expose Router API Globally
  window.router = {
    navigate: navigateTo,
    prefetch: prefetchUrl,
    cache: pageCache
  };

  function initAll() {
    syncHeaderActiveLinks(window.location.pathname);
    initMobileNav();
    initToolsDropdown();
    updateHeaderInvoicesBadge();

    // Cache current page HTML
    try {
      pageCache.set(window.location.pathname, document.documentElement.outerHTML);
    } catch (e) {}
  }

  window.addEventListener('storage', updateHeaderInvoicesBadge);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
