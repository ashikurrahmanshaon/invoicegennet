/**
 * Invoice-Gen.net - Google Authentication Module
 * Powered by Google Identity Services (GIS)
 * Client ID: 1029331875701-7km83lfkd6norbl85o6f68qi2u4apt9u.apps.googleusercontent.com
 */
const GOOGLE_CLIENT_ID = '1029331875701-7km83lfkd6norbl85o6f68qi2u4apt9u.apps.googleusercontent.com';

(function () {
  'use strict';

  let tokenClient = null;

  // Safely parse JWT token returned by Google One-Tap / ID Services
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

  // Handle successful Google authentication
  function handleGoogleSuccess(profile) {
    const userData = {
      name: profile.name || (profile.given_name ? `${profile.given_name} ${profile.family_name || ''}`.trim() : 'Google User'),
      email: profile.email,
      avatar: profile.picture || '',
      provider: 'google',
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('invoicegen_user', JSON.stringify(userData));

    if (window.showToast) {
      window.showToast(`Welcome back, ${userData.name}!`, 'success');
    }

    // Refresh UI immediately
    syncNavbarAuth();

    // Smooth redirect
    setTimeout(() => {
      const pendingTpl = sessionStorage.getItem('pending_template');
      if (pendingTpl) {
        sessionStorage.removeItem('pending_template');
        window.location.href = `index.html?template=${pendingTpl}`;
      } else if (window.location.pathname.includes('login') || window.location.pathname.includes('signup')) {
        window.location.href = 'dashboard.html';
      }
    }, 600);
  }

  // Synchronize top navbar authentication state
  function syncNavbarAuth() {
    try {
      const raw = localStorage.getItem('invoicegen_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      if (!user || !user.email) return;

      const firstName = user.name ? user.name.split(' ')[0] : 'User';
      const avatarHtml = user.avatar
        ? `<img src="${user.avatar}" alt="${user.name}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;margin-right:6px;display:inline-block;vertical-align:middle;">`
        : '';

      // Desktop navbar elements
      const btnLogin = document.getElementById('btnHeaderLogin') || document.querySelector('.btn-login');
      const btnSignup = document.getElementById('btnHeaderSignup') || document.querySelector('.btn-signup-free');
      if (btnLogin) {
        btnLogin.innerHTML = `${avatarHtml}<span>Dashboard (${firstName})</span>`;
        btnLogin.href = 'dashboard.html';
        btnLogin.title = `Signed in as ${user.email} (Open Dashboard)`;
        btnLogin.onclick = null;
      }
      if (btnSignup) btnSignup.style.display = 'none';

      // Mobile drawer elements
      const btnMobileLogin = document.getElementById('btnMobileLogin');
      const btnMobileSignup = document.getElementById('btnMobileSignup');
      if (btnMobileLogin) {
        btnMobileLogin.innerHTML = `${avatarHtml}<span>Dashboard (${firstName})</span>`;
        btnMobileLogin.href = 'dashboard.html';
        btnMobileLogin.onclick = null;
      }
      if (btnMobileSignup) btnMobileSignup.style.display = 'none';
    } catch (e) {}
  }

  // Initialize Google Identity Services
  function initGIS() {
    if (typeof google === 'undefined' || !google.accounts) return;

    // 1. Google One-Tap & ID Token Listener
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response && response.credential) {
            const payload = parseJwt(response.credential);
            if (payload && payload.email) {
              handleGoogleSuccess(payload);
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Trigger One-Tap prompt on login or signup pages if user is not already logged in
      const stored = localStorage.getItem('invoicegen_user');
      if (!stored && (window.location.pathname.includes('login') || window.location.pathname.includes('signup'))) {
        google.accounts.id.prompt();
      }
    } catch (e) {
      console.warn('Google Identity initialization notice:', e);
    }

    // 2. Google OAuth2 Token Client for Popup Button Clicks
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
                handleGoogleSuccess(profile);
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

  // Trigger Google Login popup on button click
  window.triggerGoogleLogin = function () {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } else if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.prompt();
    } else {
      alert('Google authentication service is initializing. Please try again in a moment.');
    }
  };

  // Bind all Google sign in buttons
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

    syncNavbarAuth();
  }

  // Polling check for Google script ready
  if (window.google && window.google.accounts) {
    initGIS();
    bindAuthButtons();
  } else {
    window.addEventListener('load', () => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google && window.google.accounts) {
          clearInterval(interval);
          initGIS();
          bindAuthButtons();
        } else if (attempts > 30) {
          clearInterval(interval);
        }
      }, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAuthButtons);
  } else {
    bindAuthButtons();
  }
})();
