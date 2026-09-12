/**
 * Invoice-Gen.net - Privacy-Preserving Global Analytics & Safe Telemetry
 * Compliant with GDPR, CCPA & Strict Zero-PII Policy.
 * 
 * Rules:
 * 1. Never transmit customer names, client details, emails, phones, or addresses.
 * 2. Never transmit invoice line item contents or monetary values.
 * 3. Never transmit payment card details or uploaded file payloads.
 * 4. Only track high-level operational product interaction events.
 */
(function () {
  'use strict';

  const ALLOWED_EVENTS = new Set([
    'tool_view',
    'tool_start',
    'file_upload',
    'conversion_completed',
    'file_download',
    'invoice_created',
    'save_to_cloud',
    'page_view'
  ]);

  const FORBIDDEN_KEYS = [
    'email', 'name', 'client', 'sender', 'address', 'phone', 'card', 'cvv',
    'token', 'items', 'description', 'notes', 'total', 'subtotal', 'balance',
    'amount', 'fileData', 'content', 'payload'
  ];

  let isInitialized = false;
  let measurementId = null;

  function sanitizeParams(params) {
    if (!params || typeof params !== 'object') return {};
    const clean = {};
    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();
      // Drop forbidden PII fields immediately
      if (FORBIDDEN_KEYS.some(f => lowerKey.includes(f))) {
        continue;
      }
      // Only permit safe primitives
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        // Guard against email-like or long strings in values
        if (typeof value === 'string') {
          if (value.includes('@') || value.length > 80) continue;
        }
        clean[key] = value;
      }
    }
    return clean;
  }

  const Analytics = {
    async init() {
      if (isInitialized) return;
      isInitialized = true;

      try {
        const res = await fetch('/api/config/public');
        if (res.ok) {
          const config = await res.json();
          if (config && config.gaMeasurementId) {
            measurementId = config.gaMeasurementId;
            this.injectGtag(measurementId);
          }
        }
      } catch (e) {
        // Fail silently in offline or restricted environments
      }
    },

    injectGtag(id) {
      if (!id || document.getElementById('gtag-script')) return;

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;

      gtag('js', new Date());
      gtag('config', id, {
        anonymize_ip: true,
        restricted_data_processing: true,
        send_page_view: false // We trigger page_view explicitly on seamless routes
      });

      const script = document.createElement('script');
      script.id = 'gtag-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(script);
    },

    track(eventName, rawParams = {}) {
      if (!ALLOWED_EVENTS.has(eventName)) {
        console.warn(`[Analytics] Ignored untracked event: "${eventName}". Must be in allowed telemetry list.`);
        return;
      }

      const cleanParams = sanitizeParams(rawParams);

      if (window.gtag && measurementId) {
        window.gtag('event', eventName, cleanParams);
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Safe development console log
        // console.debug(`[Telemetry Safe Event] ${eventName}`, cleanParams);
      }
    }
  };

  window.Analytics = Analytics;
  window.trackEvent = (name, params) => Analytics.track(name, params);

  // Auto-init on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
  } else {
    Analytics.init();
  }
})();
