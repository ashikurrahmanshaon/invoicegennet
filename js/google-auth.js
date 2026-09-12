/**
 * Invoice-Gen.net - Unified SaaS Authentication & Session Manager
 * Powered by SQLite relational session management & Google Identity Services (GIS)
 * Standardized across all 28 pages.
 */
const GOOGLE_CLIENT_ID = '1029331875701-7km83lfkd6norbl85o6f68qi2u4apt9u.apps.googleusercontent.com';

(function () {
  'use strict';

  // Read initial cached state synchronously to prevent any layout/button flickering
  let initialUser = null;
  let initialSessionId = null;
  try {
    const rawUser = localStorage.getItem('invoicegen_user');
    initialSessionId = localStorage.getItem('invoicegen_session_id');
    if (rawUser && initialSessionId) {
      const parsed = JSON.parse(rawUser);
      if (parsed && (parsed.id || parsed.email)) {
        initialUser = parsed;
      }
    }
  } catch (e) {}

  // Synchronous pre-auth lock on document element
  if (initialUser && initialSessionId) {
    try {
      document.documentElement.classList.add('user-logged-in');
      document.documentElement.classList.remove('auth-loading');
    } catch (e) {}
  } else {
    try {
      document.documentElement.classList.remove('user-logged-in');
      document.documentElement.classList.add('auth-loading');
    } catch (e) {}
  }

  let tokenClient = null;

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  const Auth = {
    // 3 Strict States: 'AUTH_LOADING', 'AUTHENTICATED', 'UNAUTHENTICATED'
    state: (initialUser && initialSessionId) ? 'AUTHENTICATED' : 'AUTH_LOADING',
    user: initialUser,
    sessionId: initialSessionId,
    _listeners: [],
    _subscribers: [],

    getUser: function () {
      return this.user;
    },

    getSessionId: function () {
      return this.sessionId;
    },

    isAuthenticated: function () {
      return this.state === 'AUTHENTICATED';
    },

    onReady: function (callback) {
      if (typeof callback !== 'function') return;
      if (this.state !== 'AUTH_LOADING') {
        try { callback(this.state, this.user); } catch (e) {}
      } else {
        this._listeners.push(callback);
      }
    },

    onStateChange: function (callback) {
      if (typeof callback !== 'function') return;
      this._subscribers.push(callback);
      try { callback(this.state, this.user); } catch (e) {}
    },

    _notify: function () {
      const callbacks = [...this._listeners];
      this._listeners = [];
      callbacks.forEach(cb => {
        try { cb(this.state, this.user); } catch (e) {}
      });
      this._subscribers.forEach(cb => {
        try { cb(this.state, this.user); } catch (e) {}
      });
    },

    // Universal fetch wrapper attaching session token and credentials
    authFetch: function (url, options = {}) {
      const headers = Object.assign({}, options.headers || {});
      if (this.sessionId && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${this.sessionId}`;
      }
      return fetch(url, Object.assign({}, options, {
        headers,
        credentials: 'same-origin'
      }));
    },

    // Set authenticated session in storage & memory
    setSession: function (user, sessionId) {
      this.user = user;
      if (sessionId) {
        this.sessionId = sessionId;
        try { localStorage.setItem('invoicegen_session_id', sessionId); } catch (e) {}
      }
      try { localStorage.setItem('invoicegen_user', JSON.stringify(user)); } catch (e) {}
      this.state = 'AUTHENTICATED';
      try {
        document.documentElement.classList.remove('auth-loading');
        document.documentElement.classList.add('user-logged-in');
      } catch (e) {}
      this.renderHeader();
      this._notify();
    },

    // Clear session and restore clean public state
    clearSession: function () {
      this.user = null;
      this.sessionId = null;
      this.state = 'UNAUTHENTICATED';
      try {
        localStorage.removeItem('invoicegen_user');
        localStorage.removeItem('invoicegen_session_id');
        localStorage.removeItem('invoicegen_business_profile');
        document.documentElement.classList.remove('auth-loading');
        document.documentElement.classList.remove('user-logged-in');
      } catch (e) {}
      this.renderHeader();
      this._notify();
    },

    // Centralized login
    login: async function (email, password, rememberMe = true) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe }),
          credentials: 'same-origin'
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          this.setSession(data.user, data.sessionId);
          return { success: true, user: data.user, sessionId: data.sessionId };
        } else {
          return { success: false, error: data.error || 'Invalid email or password.' };
        }
      } catch (e) {
        return { success: false, error: 'Connection error. Please try again.' };
      }
    },

    // Centralized signup
    signup: async function (name, email, password) {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
          credentials: 'same-origin'
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          this.setSession(data.user, data.sessionId);
          return { success: true, user: data.user, sessionId: data.sessionId };
        } else {
          return { success: false, error: data.error || 'Registration failed. Please try again.' };
        }
      } catch (e) {
        return { success: false, error: 'Connection error. Please try again.' };
      }
    },

    // Centralized logout
    logout: async function () {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (e) {}
      this.clearSession();
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        try { google.accounts.id.disableAutoSelect(); } catch (e) {}
      }
      if (window.showToast) {
        window.showToast('Signed out successfully', 'info');
      }
      if (window.router && typeof window.router.navigate === 'function') {
        window.router.navigate('index.html');
      } else {
        window.location.replace('index.html');
      }
    },

    // Handle Google successful auth by persisting to backend session
    handleGoogleSuccess: async function (profile) {
      try {
        const name = profile.name || (profile.given_name ? `${profile.given_name} ${profile.family_name || ''}`.trim() : 'Google User');
        const email = profile.email;
        const avatar = profile.picture || '';

        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, avatar }),
          credentials: 'same-origin'
        });
        const data = await res.json();

        if (res.ok && data.success && data.user) {
          this.setSession(data.user, data.sessionId);
          if (window.showToast) {
            window.showToast(`Welcome back, ${data.user.name}!`, 'success');
          }
          const pendingTpl = sessionStorage.getItem('pending_template');
          const targetUrl = pendingTpl ? `index.html?template=${pendingTpl}` : 'dashboard.html';
          if (pendingTpl) sessionStorage.removeItem('pending_template');
          if (window.router && typeof window.router.navigate === 'function') {
            window.router.navigate(targetUrl);
          } else {
            window.location.replace(targetUrl);
          }
        } else {
          if (window.showToast) {
            window.showToast(data.error || 'Google login failed.', 'warning');
          }
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast('Google authentication error. Please try again.', 'warning');
        }
      }
    },

    // Header Renderer (Strictly zero layout shift & consistent sizing)
    renderHeader: function () {
      const btnLogin = document.getElementById('btnHeaderLogin');
      const btnSignup = document.getElementById('btnHeaderSignup');
      let btnDashboard = document.getElementById('btnHeaderDashboard');
      let accountDropdown = document.getElementById('headerUserAccountDropdown');
      let searchBtn = document.getElementById('btnHeaderSearch');
      let notifWrapper = document.getElementById('headerNotifWrapper');

      if (this.state === 'AUTHENTICATED' && this.user) {
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnSignup) btnSignup.style.display = 'none';

        // 1. Search button
        if (!searchBtn && btnSignup && btnSignup.parentNode) {
          const searchDiv = document.createElement('div');
          searchDiv.innerHTML = `
            <button type="button" class="btn-header-search" id="btnHeaderSearch" aria-label="Global search (Ctrl+K)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>Search...</span>
              <span class="kbd-shortcut">⌘K</span>
            </button>
          `;
          searchBtn = searchDiv.firstElementChild;
          btnSignup.parentNode.insertBefore(searchBtn, btnSignup);
          searchBtn.onclick = () => window.openGlobalSearch();
        } else if (searchBtn) {
          searchBtn.style.display = 'inline-flex';
        }

        // 2. Notifications button & popover
        if (!notifWrapper && btnSignup && btnSignup.parentNode) {
          const notifDiv = document.createElement('div');
          notifDiv.id = 'headerNotifWrapper';
          notifDiv.style.position = 'relative';
          notifDiv.innerHTML = `
            <button type="button" class="btn-header-notif" id="btnHeaderNotif" aria-label="Notifications" title="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span class="notif-badge-pill" id="headerNotifBadge" style="display: none;">0</span>
            </button>
            <div class="notif-popover" id="headerNotifPopover">
              <div class="notif-header">
                <span class="notif-header-title">Notifications</span>
                <button type="button" class="notif-header-action" id="btnMarkAllNotifsRead">Mark all read</button>
              </div>
              <div class="notif-list" id="headerNotifList">
                <div class="notif-empty">Loading notifications...</div>
              </div>
            </div>
          `;
          notifWrapper = notifDiv;
          btnSignup.parentNode.insertBefore(notifWrapper, btnSignup);

          const notifBtn = document.getElementById('btnHeaderNotif');
          const popover = document.getElementById('headerNotifPopover');
          if (notifBtn && popover) {
            notifBtn.onclick = (e) => {
              e.stopPropagation();
              const isOpen = popover.classList.toggle('active');
              if (isOpen) window.loadHeaderNotifications();
            };
          }

          const btnMarkAll = document.getElementById('btnMarkAllNotifsRead');
          if (btnMarkAll) {
            btnMarkAll.onclick = async (e) => {
              e.stopPropagation();
              await fetch('/api/notifications/read-all', { method: 'POST' });
              window.loadHeaderNotifications();
            };
          }
        } else if (notifWrapper) {
          notifWrapper.style.display = 'block';
        }

        // 3. Dashboard Link
        if (!btnDashboard) {
          btnDashboard = document.createElement('a');
          btnDashboard.id = 'btnHeaderDashboard';
          btnDashboard.href = 'dashboard.html';
          btnDashboard.className = 'header-auth-dashboard';
          btnDashboard.textContent = 'Dashboard';
          if (btnSignup && btnSignup.parentNode) {
            btnSignup.parentNode.insertBefore(btnDashboard, btnSignup);
          }
        } else {
          btnDashboard.style.display = 'inline-flex';
        }

        // 4. User Avatar & Account Menu
        const firstName = this.user.name ? this.user.name.split(' ')[0] : 'User';
        const initial = (firstName || 'U').charAt(0).toUpperCase();
        const avatarHtml = this.user.avatar
          ? `<img src="${this.user.avatar}" alt="${this.user.name}" class="user-avatar-img">`
          : `<span class="user-avatar-placeholder">${initial}</span>`;

        const dropdownHtml = `
          <div class="user-account-dropdown" id="headerUserAccountDropdown">
            <button type="button" class="btn-user-avatar" id="btnUserAccountToggle" aria-expanded="false" title="Account: ${this.user.name || ''} (${this.user.email || ''})">
              ${avatarHtml}
              <svg class="avatar-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="user-account-menu" id="userAccountMenu" role="menu">
              <div class="user-menu-header">
                <div class="user-menu-name">${this.user.name || 'User'}</div>
                <div class="user-menu-email">${this.user.email || ''}</div>
              </div>
              <a href="dashboard.html#dashboard" class="user-menu-link" role="menuitem">
                <span>Dashboard Overview</span>
              </a>
              <a href="dashboard.html#invoices" class="user-menu-link" role="menuitem">
                <span>My Invoices</span>
              </a>
              <a href="dashboard.html#clients" class="user-menu-link" role="menuitem">
                <span>Clients Directory</span>
              </a>
              <a href="dashboard.html#business" class="user-menu-link" role="menuitem">
                <span>Business Profile</span>
              </a>
              <a href="dashboard.html#billing" class="user-menu-link" role="menuitem">
                <span>Billing &amp; Subscription</span>
              </a>
              <a href="dashboard.html#settings" class="user-menu-link" role="menuitem">
                <span>Account Settings</span>
              </a>
              <a href="dashboard.html#security" class="user-menu-link" role="menuitem">
                <span>Security &amp; Password</span>
              </a>
              <a href="dashboard.html#help" class="user-menu-link" role="menuitem">
                <span>Help &amp; Support</span>
              </a>
              <div class="user-menu-divider"></div>
              <button type="button" class="user-menu-link user-menu-logout" id="btnLogoutHeader" role="menuitem">
                <span>Log out</span>
              </button>
            </div>
          </div>
        `;

        if (accountDropdown) {
          accountDropdown.outerHTML = dropdownHtml;
        } else if (btnSignup && btnSignup.parentNode) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = dropdownHtml.trim();
          btnSignup.parentNode.insertBefore(tempDiv.firstChild, btnSignup.nextSibling);
        }

        const toggleBtn = document.getElementById('btnUserAccountToggle');
        const menu = document.getElementById('userAccountMenu');
        if (toggleBtn && menu) {
          toggleBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.toggle('active');
            toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          };
        }

        const btnLogout = document.getElementById('btnLogoutHeader');
        if (btnLogout) {
          btnLogout.onclick = (e) => {
            e.preventDefault();
            Auth.logout();
          };
        }

        // Mobile Nav sync
        const mobileAuth = document.querySelector('.mobile-nav-auth');
        if (mobileAuth) {
          mobileAuth.innerHTML = `
            <div style="padding: 12px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; width:100%; box-sizing:border-box;">
              <div style="display:flex; align-items:center; gap:10px; padding-bottom:8px; border-bottom:1px solid #e2e8f0;">
                <div style="width:34px; height:34px; border-radius:50%; background:#10b981; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.875rem;">${initial}</div>
                <div style="overflow:hidden;">
                  <div style="font-weight:700; font-size:0.875rem; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.user.name || 'User'}</div>
                  <div style="font-size:0.75rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.user.email || ''}</div>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; margin-top:10px;">
                <a href="dashboard.html#dashboard" class="user-menu-link" style="padding:6px 8px; border-radius:6px; font-weight:600; color:#0f172a;">Dashboard Overview</a>
                <a href="dashboard.html#invoices" class="user-menu-link" style="padding:6px 8px; border-radius:6px; font-weight:600; color:#0f172a;">My Invoices</a>
                <a href="dashboard.html#clients" class="user-menu-link" style="padding:6px 8px; border-radius:6px; font-weight:600; color:#0f172a;">Clients</a>
                <a href="dashboard.html#business" class="user-menu-link" style="padding:6px 8px; border-radius:6px; font-weight:600; color:#0f172a;">Business Profile</a>
                <a href="dashboard.html#billing" class="user-menu-link" style="padding:6px 8px; border-radius:6px; font-weight:600; color:#0f172a;">Billing &amp; Subscription</a>
                <a href="dashboard.html#settings" class="user-menu-link" style="padding:6px 8px; border-radius:6px; font-weight:600; color:#0f172a;">Account Settings</a>
                <button type="button" class="btn-danger" id="btnMobileLogout" style="height:34px; font-size:0.8125rem; width:100%; justify-content:center; margin-top:4px;">Log out</button>
              </div>
            </div>
          `;
          const btnMobileLogout = document.getElementById('btnMobileLogout');
          if (btnMobileLogout) {
            btnMobileLogout.onclick = () => Auth.logout();
          }
        }

        // Trigger notifications count
        window.loadHeaderNotifications();
      } else if (this.state === 'UNAUTHENTICATED') {
        if (btnDashboard) btnDashboard.style.display = 'none';
        if (accountDropdown) accountDropdown.remove();
        if (searchBtn) searchBtn.style.display = 'none';
        if (notifWrapper) notifWrapper.style.display = 'none';
        if (btnLogin) btnLogin.style.display = 'inline-flex';
        if (btnSignup) btnSignup.style.display = 'inline-flex';

        const mobileAuth = document.querySelector('.mobile-nav-auth');
        if (mobileAuth) {
          mobileAuth.innerHTML = `
            <a href="login.html" class="btn-login" id="btnMobileLogin" style="width:100%; text-align:center;">Log In</a>
            <a href="signup.html" class="btn-signup-free" id="btnMobileSignup" style="width:100%; text-align:center;">Sign Up Free</a>
          `;
        }
      }
    },

    // Verify session asynchronously with SQLite backend
    verify: async function () {
      try {
        const res = await this.authFetch('/api/auth/me');
        const data = await res.json();
        if (data && data.authenticated && data.user) {
          this.setSession(data.user, this.sessionId);
        } else {
          this.clearSession();
          const isProtected = window.location.pathname.includes('dashboard') || window.location.pathname.includes('invoice-details');
          if (isProtected) {
            if (window.router && typeof window.router.navigate === 'function') {
              window.router.navigate('login.html?redirect=' + encodeURIComponent(window.location.pathname));
            } else {
              window.location.replace('login.html?redirect=' + encodeURIComponent(window.location.pathname));
            }
          }
        }
      } catch (e) {
        if (this.user) {
          this.state = 'AUTHENTICATED';
          try {
            document.documentElement.classList.remove('auth-loading');
            document.documentElement.classList.add('user-logged-in');
          } catch (e2) {}
          this.renderHeader();
          this._notify();
        } else {
          this.clearSession();
        }
      }
    }
  };

  window.Auth = Auth;
  window.logoutUser = () => Auth.logout();
  window.syncNavbarAuth = () => Auth.renderHeader();

  // Close dropdown on outside click or escape
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('headerUserAccountDropdown');
    const menu = document.getElementById('userAccountMenu');
    const toggle = document.getElementById('btnUserAccountToggle');
    if (dropdown && menu && !dropdown.contains(e.target)) {
      menu.classList.remove('active');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const menu = document.getElementById('userAccountMenu');
      const toggle = document.getElementById('btnUserAccountToggle');
      if (menu && menu.classList.contains('active')) {
        menu.classList.remove('active');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Initialize Google Identity Services
  function initGIS() {
    if (typeof google === 'undefined' || !google.accounts) return;

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response && response.credential) {
            const payload = parseJwt(response.credential);
            if (payload && payload.email) {
              Auth.handleGoogleSuccess(payload);
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
    } catch (e) {
      console.warn('Google Identity initialization notice:', e);
    }

    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await res.json();
              if (profile && profile.email) {
                Auth.handleGoogleSuccess(profile);
              }
            } catch (err) {
              console.error('Error retrieving Google userinfo:', err);
            }
          }
        }
      });
    } catch (e) {
      console.warn('Google OAuth TokenClient notice:', e);
    }
  }

  window.triggerGoogleLogin = function () {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } else if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.prompt();
    } else {
      if (window.showToast) {
        window.showToast('Google OAuth is initializing. Please configure your Client ID or use Email/Password to sign in.', 'warning');
      } else {
        alert('Google OAuth is initializing. Please configure your Client ID or use Email/Password to sign in.');
      }
    }
  };

  function bindAuthButtons() {
    const ids = [
      'socialGoogleBtn',
      'signupSocialGoogle',
      'btnGoogleWideLogin',
      'btnGoogleWideSignup',
      'btnGoogleAuth'
    ];

    ids.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          window.triggerGoogleLogin();
        });
      }
    });

    Auth.renderHeader();
  }

  // Pre-render header synchronously and verify session
  Auth.renderHeader();
  Auth.verify();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindAuthButtons();
      if (window.google && window.google.accounts) initGIS();
    });
  } else {
    bindAuthButtons();
    if (window.google && window.google.accounts) initGIS();
  }

  window.addEventListener('load', () => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google && window.google.accounts) {
        clearInterval(interval);
        initGIS();
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 150);
  });

  // ---------------------------------------------------------------------------
  // GLOBAL SEARCH MODAL (Ctrl/Cmd + K)
  // ---------------------------------------------------------------------------
  let searchDebounce = null;

  function ensureSearchModal() {
    let modal = document.getElementById('globalSearchModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'globalSearchModal';
    modal.className = 'search-modal-backdrop';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="search-modal-box" role="dialog" aria-modal="true" aria-label="Global Search">
        <div class="search-input-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="search-input-field" id="globalSearchInput" placeholder="Search invoices, clients, tools, or templates..." autocomplete="off">
          <span class="kbd-shortcut">ESC</span>
        </div>
        <div class="search-results-body" id="globalSearchResults">
          <div style="padding: 24px 18px; text-align: center; color: #64748b; font-size: 0.84rem;">
            Type to search across your invoices, clients, templates, and tools.
          </div>
        </div>
        <div class="search-footer-info">
          <span>Navigate with <strong style="color:#0f172a;">↑ ↓</strong> and press <strong style="color:#0f172a;">↵</strong> to open</span>
          <span>Invoice-Gen.net</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.onclick = (e) => {
      if (e.target === modal) window.closeGlobalSearch();
    };

    const input = document.getElementById('globalSearchInput');
    if (input) {
      input.oninput = () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => executeGlobalSearch(input.value), 200);
      };
    }

    return modal;
  }

  async function executeGlobalSearch(q) {
    const resultsContainer = document.getElementById('globalSearchResults');
    if (!resultsContainer) return;
    if (!q || !q.trim()) {
      resultsContainer.innerHTML = `<div style="padding: 24px 18px; text-align: center; color: #64748b; font-size: 0.84rem;">Type to search across your invoices, clients, templates, and tools.</div>`;
      return;
    }

    resultsContainer.innerHTML = `<div style="padding: 20px 18px; text-align: center; color: #94a3b8; font-size: 0.84rem;">Searching...</div>`;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!data || !data.success || !data.results) {
        resultsContainer.innerHTML = `<div style="padding: 20px 18px; text-align: center; color: #64748b;">No results found for "${q}".</div>`;
        return;
      }

      const { invoices, clients, templates, tools } = data.results;
      const totalMatches = (invoices?.length || 0) + (clients?.length || 0) + (templates?.length || 0) + (tools?.length || 0);

      if (totalMatches === 0) {
        resultsContainer.innerHTML = `<div style="padding: 24px 18px; text-align: center; color: #64748b; font-size: 0.84rem;">No matching documents, clients, or tools found.</div>`;
        return;
      }

      let html = '';

      if (invoices && invoices.length > 0) {
        html += `<div class="search-category-title">Invoices (${invoices.length})</div>`;
        invoices.forEach(inv => {
          html += `
            <a href="index.html?id=${inv.id}" class="search-row-item" onclick="window.closeGlobalSearch();">
              <div class="search-row-main">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                <div>
                  <div class="search-row-title">#${inv.number} &bull; ${inv.clientName || 'Client'}</div>
                  <div class="search-row-sub">${inv.date || 'No date'} &bull; $${Number(inv.total || 0).toFixed(2)}</div>
                </div>
              </div>
              <span class="status-badge badge-${inv.status || 'draft'}" style="font-size: 0.6875rem; text-transform: uppercase;">${inv.status || 'draft'}</span>
            </a>
          `;
        });
      }

      if (clients && clients.length > 0) {
        html += `<div class="search-category-title">Clients (${clients.length})</div>`;
        clients.forEach(c => {
          html += `
            <a href="dashboard.html#clients" class="search-row-item" onclick="window.closeGlobalSearch();">
              <div class="search-row-main">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <div>
                  <div class="search-row-title">${c.name} ${c.company ? `(${c.company})` : ''}</div>
                  <div class="search-row-sub">${c.email || c.phone || 'Client directory'}</div>
                </div>
              </div>
              <span style="font-size: 0.75rem; color: #64748b;">Client &rarr;</span>
            </a>
          `;
        });
      }

      if (templates && templates.length > 0) {
        html += `<div class="search-category-title">Templates (${templates.length})</div>`;
        templates.forEach(t => {
          html += `
            <a href="${t.url}" class="search-row-item" onclick="window.closeGlobalSearch();">
              <div class="search-row-main">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
                <div>
                  <div class="search-row-title">${t.name}</div>
                  <div class="search-row-sub">${t.desc}</div>
                </div>
              </div>
              <span style="font-size: 0.75rem; color: #64748b;">Template &rarr;</span>
            </a>
          `;
        });
      }

      if (tools && tools.length > 0) {
        html += `<div class="search-category-title">Tools (${tools.length})</div>`;
        tools.forEach(tl => {
          html += `
            <a href="${tl.url}" class="search-row-item" onclick="window.closeGlobalSearch();">
              <div class="search-row-main">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                <div>
                  <div class="search-row-title">${tl.name}</div>
                  <div class="search-row-sub">${tl.desc}</div>
                </div>
              </div>
              <span style="font-size: 0.75rem; color: #64748b;">Tool &rarr;</span>
            </a>
          `;
        });
      }

      resultsContainer.innerHTML = html;
    } catch (e) {
      resultsContainer.innerHTML = `<div style="padding: 20px 18px; text-align: center; color: #ef4444;">Search request error.</div>`;
    }
  }

  window.openGlobalSearch = function () {
    const modal = ensureSearchModal();
    modal.style.display = 'flex';
    const input = document.getElementById('globalSearchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    executeGlobalSearch('');
  };

  window.closeGlobalSearch = function () {
    const modal = document.getElementById('globalSearchModal');
    if (modal) modal.style.display = 'none';
  };

  // Listen for Ctrl+K or Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      const modal = document.getElementById('globalSearchModal');
      if (modal && modal.style.display === 'flex') {
        window.closeGlobalSearch();
      } else {
        window.openGlobalSearch();
      }
    } else if (e.key === 'Escape') {
      window.closeGlobalSearch();
      const popover = document.getElementById('headerNotifPopover');
      if (popover) popover.classList.remove('active');
    }
  });

  // Close notifications popover on click outside
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('headerNotifWrapper');
    const popover = document.getElementById('headerNotifPopover');
    if (wrapper && popover && !wrapper.contains(e.target)) {
      popover.classList.remove('active');
    }
  });

  // ---------------------------------------------------------------------------
  // HEADER NOTIFICATIONS LOADER
  // ---------------------------------------------------------------------------
  window.loadHeaderNotifications = async function () {
    const badge = document.getElementById('headerNotifBadge');
    const list = document.getElementById('headerNotifList');
    if (!Auth.isAuthenticated()) return;

    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data && data.success) {
        const count = data.unreadCount || 0;
        if (badge) {
          if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }

        if (list) {
          if (!data.items || data.items.length === 0) {
            list.innerHTML = `<div class="notif-empty">All caught up! No notifications.</div>`;
          } else {
            list.innerHTML = data.items.map(it => `
              <a href="${it.link || '#'}" class="notif-item ${it.is_read ? '' : 'unread'}" onclick="fetch('/api/notifications/${it.id}/read', { method: 'PATCH' });">
                <div class="notif-dot" style="${it.is_read ? 'background: #cbd5e1;' : 'background: #059669;'}"></div>
                <div>
                  <div class="notif-item-title">${it.title}</div>
                  <div class="notif-item-msg">${it.message}</div>
                  <div class="notif-item-time">${new Date(it.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </a>
            `).join('');
          }
        }
      }
    } catch (e) {}
  };

  // Universal Global Toast Notification Function
  window.showToast = function (message, type = 'success') {
    let toast = document.getElementById('toastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotice';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    let icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    if (type === 'info') {
      icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    } else if (type === 'warning') {
      icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else if (type === 'error') {
      icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }
    toast.innerHTML = `<span class="toast-icon-badge">${icon}</span><span class="toast-text">${message}</span>`;
    toast.onclick = () => toast.classList.remove('show');
    toast.className = `toast-notice toast-${type} show`;
    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };
})();
