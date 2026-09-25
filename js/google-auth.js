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

  // Clear any auth locks immediately
  try {
    document.documentElement.classList.remove('auth-loading');
    document.documentElement.classList.remove('user-logged-in');
  } catch (e) {}

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
    // 3 Strict States: 'INITIALIZING', 'AUTHENTICATED', 'UNAUTHENTICATED'
    state: (initialUser && initialSessionId) ? 'AUTHENTICATED' : 'INITIALIZING',
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
      if (this.state !== 'INITIALIZING' && this.state !== 'AUTH_LOADING') {
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

    // Universal resilient fetch with cross-port dev fallback
    _resilientFetch: async function (urlPath, options = {}) {
      if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
        return fetch(urlPath, options);
      }

      const port = window.location.port;
      const candidates = ['']; // 1. Current origin
      if (port && ['5500', '5501', '5502', '5173', '8080'].includes(port)) {
        candidates.unshift('http://localhost:3000', 'http://localhost:3001');
      } else {
        candidates.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:57784');
      }

      let lastError = null;
      for (const base of candidates) {
        try {
          const fullUrl = base ? `${base}${urlPath}` : urlPath;
          const res = await fetch(fullUrl, options);
          if (res.ok || res.status < 500) {
            return res;
          }
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error('Network connection failed');
    },

    // Universal fetch wrapper attaching session token and credentials
    authFetch: function (url, options = {}) {
      const headers = Object.assign({}, options.headers || {});
      const token = this.sessionId || localStorage.getItem('invoicegen_session_id');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return this._resilientFetch(url, Object.assign({}, options, {
        headers,
        credentials: 'include'
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
        const res = await this._resilientFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe }),
          credentials: 'include'
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
        const res = await this._resilientFetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
          credentials: 'include'
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
        window.router.navigate('/');
      } else {
        window.location.replace('/');
      }
    },

    // Handle Google successful auth by persisting to backend session
    handleGoogleSuccess: async function (profile) {
      try {
        const name = profile.name || (profile.given_name ? `${profile.given_name} ${profile.family_name || ''}`.trim() : 'Google User');
        const email = profile.email;
        const avatar = profile.picture || '';

        const res = await this._resilientFetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, avatar }),
          credentials: 'include'
        });
        const data = await res.json();

        if (res.ok && data.success && data.user) {
          this.setSession(data.user, data.sessionId);
          if (window.showToast) {
            window.showToast(`Welcome back, ${data.user.name}!`, 'success');
          }
          if (sessionStorage.getItem('pending_template')) sessionStorage.removeItem('pending_template');
          if (window.router && typeof window.router.clearCache === 'function') {
            window.router.clearCache();
          }
          window.location.href = '/dashboard';
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

    // Header Renderer - Sign up, login, dashboard completely removed from site
    renderHeader: function () {
      const toRemove = [
        'btnHeaderLogin',
        'btnHeaderSignup',
        'btnHeaderDashboard',
        'headerUserAccountDropdown',
        'headerNotifWrapper',
        'headerNotifPopover',
        'userAuthBanner',
        'btnHeaderSearch',
        'mobileNavAuthArea',
        'mobileHeaderAvatarBtn',
        'mobNavLogout',
        'btnMobileLogin',
        'btnMobileSignup'
      ];
      toRemove.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });

      document.querySelectorAll('.mobile-nav-auth').forEach(el => el.remove());
      document.querySelectorAll('.user-account-dropdown').forEach(el => el.remove());
      document.querySelectorAll('#headerNotifWrapper').forEach(el => el.remove());
      document.querySelectorAll('.user-logged-in-banner').forEach(el => el.remove());

      try {
        document.documentElement.classList.remove('auth-loading');
        document.documentElement.classList.remove('user-logged-in');
      } catch (e) {}
    },

    // Verify session asynchronously with SQLite backend without redirecting
    verify: async function () {
      try {
        const res = await this.authFetch('/api/auth/me');
        const data = await res.json();
        if (data && data.authenticated && data.user) {
          this.setSession(data.user, data.user.session_id || this.sessionId);
        } else {
          this.clearSession();
        }
      } catch (e) {
        this.clearSession();
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
      // Direct server-side Google OAuth 2.0 flow
      window.location.href = '/api/auth/google/login';
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
  // Global search modal removed per user requirement
  // ---------------------------------------------------------------------------
  window.openGlobalSearch = function () {};
  window.closeGlobalSearch = function () {
    const modal = document.getElementById('globalSearchModal');
    if (modal) modal.remove();
  };

  // Close notifications popover on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
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
