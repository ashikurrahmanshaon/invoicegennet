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
              '/',
              '/templates',
              '/dashboard',
              '/pricing',
              '/features',
              '/blog',
              '/contact',
              '/login',
              '/signup'
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
    if (!normalizedPath || normalizedPath === 'index.html') normalizedPath = '';

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      let cleanHref = href.split('#')[0].split('?')[0].replace(/^\//, '');
      if (cleanHref === 'index.html') cleanHref = '';

      const isMatch = (cleanHref === normalizedPath) ||
                      (normalizedPath === '' && (cleanHref === '' || cleanHref === '/')) ||
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
        navigateTo(`/login?redirect=${encodeURIComponent(fullTarget)}`, { pushState: true });
        return;
      }

      if (isAuthRoute && isAuth) {
        navigateTo('/dashboard', { pushState: true });
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
    const header = document.querySelector('.navbar-saas');
    const navbarContainer = document.querySelector('.navbar-container');
    let btnToggle = document.getElementById('btnMobileNavToggle');
    let drawer = document.getElementById('mobileNavDrawer');
    const actionsWrap = header ? header.querySelector('.nav-actions-wrap') : null;

    // Ensure toggle button exists inside navbar container as first item
    if (!btnToggle && navbarContainer) {
      btnToggle = document.createElement('button');
      btnToggle.type = 'button';
      btnToggle.className = 'btn-mobile-nav-toggle';
      btnToggle.id = 'btnMobileNavToggle';
      btnToggle.setAttribute('aria-label', 'Toggle navigation menu');
      btnToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      navbarContainer.prepend(btnToggle);
    } else if (btnToggle && navbarContainer && btnToggle.parentElement !== navbarContainer) {
      navbarContainer.prepend(btnToggle);
    }

    // Ensure mobile avatar button exists on right for [Hamburger] [Logo] [Avatar] hierarchy
    if (actionsWrap && !document.getElementById('mobileHeaderAvatarBtn')) {
      const mobAvatar = document.createElement('a');
      mobAvatar.id = 'mobileHeaderAvatarBtn';
      mobAvatar.className = 'btn-mobile-avatar';
      mobAvatar.href = (window.Auth && window.Auth.isAuthenticated()) ? '/dashboard#settings' : '/login';
      mobAvatar.setAttribute('aria-label', 'Account profile');
      mobAvatar.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      actionsWrap.appendChild(mobAvatar);
    }

    // Ensure mobile drawer exists
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'mobileNavDrawer';
      drawer.className = 'mobile-nav-drawer';
      document.body.appendChild(drawer);
    }

    // Populate drawer with the exact 9 standard items
    drawer.innerHTML = `
      <div class="mobile-drawer-header">
        <a href="/" class="mobile-drawer-brand" title="Invoice-Gen.net Home">
          <img src="/assets/icons/logo.svg" alt="Invoice-Gen.net Logo" width="28" height="28">
          <span style="font-size: 1.15rem; font-weight: 800; color: #0f172a; font-family: var(--font-sans);">Invoice-Gen<span style="color: #059669;">.net</span></span>
        </a>
        <button type="button" class="btn-drawer-close" id="btnDrawerClose" aria-label="Close navigation menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="mobile-nav-links">
        <button type="button" class="btn-mobile-drawer-search" id="btnMobileDrawerSearch" aria-label="Search invoices, clients, tools..." style="width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; min-height: 44px; height: 44px; border-radius: 8px; background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; font-size: 0.875rem; margin-bottom: 8px; cursor: pointer; font-family: inherit; font-weight: 500; text-align: left; box-sizing: border-box;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Search invoices, tools...</span>
          <span style="margin-left: auto; font-size: 0.6875rem; background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">⌘K</span>
        </button>
        <a href="/dashboard" class="mobile-nav-link" id="mobNavDashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Dashboard</span>
        </a>
        <a href="/dashboard#invoices" class="mobile-nav-link" id="mobNavInvoices">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span>Invoices</span>
          <span class="mobile-nav-count-badge" id="mobInvoicesCountBadge" style="display: none; margin-left: auto; font-size: 0.72rem; padding: 2px 7px; border-radius: 99px; background: #ecfdf5; color: #059669; font-weight: 700;"></span>
        </a>
        <a href="/dashboard#clients" class="mobile-nav-link" id="mobNavClients">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Clients</span>
        </a>
        <a href="/templates" class="mobile-nav-link" id="mobNavTemplates">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          <span>Templates</span>
        </a>
        <a href="/tools" class="mobile-nav-link" id="mobNavTools">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>Tools</span>
        </a>
        <a href="/dashboard#payments" class="mobile-nav-link" id="mobNavPayments">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          <span>Payments</span>
        </a>
        <a href="/dashboard#files" class="mobile-nav-link" id="mobNavFiles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
          <span>Files</span>
        </a>
        <a href="/pricing" class="mobile-nav-link" id="mobNavPricing">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          <span>Pricing</span>
        </a>
        <a href="/dashboard#settings" class="mobile-nav-link" id="mobNavSettings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Settings</span>
        </a>
        <a href="/dashboard#help" class="mobile-nav-link" id="mobNavHelp">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>Help</span>
        </a>
        <button type="button" class="mobile-nav-link mobile-nav-logout-btn" id="mobNavLogout" style="display: none; width: 100%; border: none; background: transparent; cursor: pointer; text-align: left; color: #ef4444; font-family: inherit;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Logout</span>
        </button>
      </div>
      <div class="mobile-nav-auth" id="mobileNavAuthArea">
        <a href="/login" class="btn btn-secondary" id="btnMobileLogin" style="width:100%; text-align:center; min-height:44px; height:44px; justify-content:center; border-radius:8px;">Log In</a>
        <a href="/signup" class="btn btn-primary" id="btnMobileSignup" style="width:100%; text-align:center; min-height:44px; height:44px; justify-content:center; border-radius:8px;">Sign Up Free</a>
      </div>
    `;

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

    const btnClose = drawer.querySelector('#btnDrawerClose');

    function openDrawer() {
      drawer.classList.add('active', 'open');
      backdrop.classList.add('active', 'open');
      document.body.classList.add('mobile-drawer-open');
      btnToggle.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      drawer.classList.remove('active', 'open');
      backdrop.classList.remove('active', 'open');
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

    const btnDrawerSearch = drawer.querySelector('#btnMobileDrawerSearch');
    if (btnDrawerSearch) {
      btnDrawerSearch.onclick = (e) => {
        e.stopPropagation();
        closeDrawer();
        if (typeof window.openGlobalSearch === 'function') {
          window.openGlobalSearch();
        }
      };
    }

    backdrop.onclick = closeDrawer;

    const btnMobLogout = drawer.querySelector('#mobNavLogout');
    if (btnMobLogout) {
      btnMobLogout.onclick = (e) => {
        e.preventDefault();
        closeDrawer();
        if (window.Auth && typeof window.Auth.logout === 'function') {
          window.Auth.logout();
        } else {
          window.location.assign('/login');
        }
      };
    }

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

    // Sync auth state into mobile header and drawer if Auth is initialized
    if (window.Auth && typeof window.Auth.renderHeader === 'function') {
      window.Auth.renderHeader();
    }
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
