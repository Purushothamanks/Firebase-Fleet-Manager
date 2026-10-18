/**
 * Firebase Fleet Manager — 24/7 Universal Client Guard
 * Powered by Supabase Cloud Realtime State
 * 
 * Embed this script into any web project for instant, sub-second maintenance mode toggles.
 * 
 * Usage:
 * <script 
 *   src="https://purushothamanks.github.io/Firebase-Fleet-Manager/guard.js" 
 *   data-site-id="aio-universe" 
 *   data-check-interval="3000">
 * </script>
 */
(function () {
  'use strict';

  if (window.__FLEET_GUARD_INITIALIZED__) return;
  window.__FLEET_GUARD_INITIALIZED__ = true;

  const script = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && (scripts[i].src.includes('guard.js') || scripts[i].src.includes('maintenance-guard'))) {
        return scripts[i];
      }
    }
    return null;
  })();

  const siteId = script?.getAttribute('data-site-id') || window.FLEET_SITE_ID || 'aio-universe';
  const pollInterval = parseInt(script?.getAttribute('data-check-interval') || '3000', 10);
  const bypassParamName = script?.getAttribute('data-bypass-param') || 'bypass';

  // Supabase 24/7 Cloud Configuration
  const SUPABASE_URL = script?.getAttribute('data-supabase-url') || window.FLEET_SUPABASE_URL || 'https://mpymsolehyodfyamnpqn.supabase.co';
  const SUPABASE_KEY = script?.getAttribute('data-supabase-key') || window.FLEET_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weW1zb2xlaHlvZGZ5YW1ucHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTc1MjMsImV4cCI6MjEwNzQ3MzUyM30.LOwTKgp5lXKZc1lrLFfsWCINxrYVth1WZbbs97PbkxI';

  // Check URL query parameters for bypass key
  try {
    const params = new URLSearchParams(window.location.search);
    const bypassVal = params.get(bypassParamName);
    if (bypassVal) {
      sessionStorage.setItem('fleet_bypass_token', bypassVal.trim());
    }
  } catch (e) {}

  let isOverlayActive = false;

  async function evaluateStatus() {
    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/site_maintenance?site_id=eq.${encodeURIComponent(siteId)}&select=*`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) return;
      const records = await response.json();
      if (!records || records.length === 0) return;

      const data = records[0];
      const storedBypass = sessionStorage.getItem('fleet_bypass_token');
      const isBypassed = storedBypass && data.bypass_key && storedBypass === data.bypass_key;

      if (data.status === 'maintenance' && !isBypassed) {
        renderMaintenanceOverlay(data);
      } else {
        removeMaintenanceOverlay();
      }
    } catch (err) {
      // Fail-open so visitors are not blocked if network drops
    }
  }

  function renderMaintenanceOverlay(data) {
    if (isOverlayActive) {
      const msgEl = document.getElementById('fleet-guard-msg');
      if (msgEl && data.maintenance_msg) msgEl.innerText = data.maintenance_msg;
      const titleEl = document.getElementById('fleet-guard-title');
      if (titleEl && data.maintenance_title) titleEl.innerText = data.maintenance_title;
      return;
    }

    isOverlayActive = true;

    // Load Inter Font if not already present
    if (!document.getElementById('fleet-inter-font')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'fleet-inter-font';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      document.head.appendChild(fontLink);
    }

    if (!document.getElementById('fleet-guard-styles')) {
      const style = document.createElement('style');
      style.id = 'fleet-guard-styles';
      style.textContent = `
        @keyframes fleetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        #fleet-maintenance-root {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 2147483647 !important;
          background-color: #ffffff !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 24px !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #1f2937 !important;
          overflow: auto !important;
          animation: fleetFadeIn 0.25s ease-out forwards;
        }
        #fleet-maintenance-root * {
          box-sizing: border-box !important;
        }
        .fleet-maint-wrapper {
          width: 100% !important;
          max-width: 32rem !important;
          margin-left: auto !important;
          margin-right: auto !important;
          text-align: center !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .fleet-illustration-box {
          width: 100% !important;
          max-width: 380px !important;
          margin-bottom: 2rem !important;
        }
        .fleet-illustration-svg {
          width: 100% !important;
          height: auto !important;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05)) !important;
        }
        .fleet-maint-title {
          font-size: clamp(1.5rem, 3.5vw, 1.875rem) !important;
          font-weight: 700 !important;
          color: #111827 !important;
          letter-spacing: -0.025em !important;
          margin: 0 0 0.75rem 0 !important;
          line-height: 1.25 !important;
          text-align: center !important;
        }
        .fleet-maint-desc {
          color: #6b7280 !important;
          font-size: clamp(0.875rem, 2vw, 1rem) !important;
          line-height: 1.625 !important;
          max-width: 28rem !important;
          margin: 0 auto !important;
          text-align: center !important;
        }
        .fleet-maint-bypass {
          margin-top: 2rem !important;
        }
        .fleet-maint-bypass-link {
          font-size: 11px !important;
          color: #9ca3af !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: color 0.15s ease !important;
        }
        .fleet-maint-bypass-link:hover {
          color: #4b5563 !important;
        }
      `;
      document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.id = 'fleet-maintenance-root';
    overlay.innerHTML = `
      <div class="fleet-maint-wrapper">
        <!-- Custom Vector Illustration Matching the Reference Image -->
        <div class="fleet-illustration-box">
          <svg viewBox="0 0 450 320" fill="none" xmlns="http://www.w3.org/2000/svg" class="fleet-illustration-svg">
            <!-- Ground Line -->
            <path d="M40 290H410" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/>
            
            <!-- Scaffolding Support Structure -->
            <g id="scaffolding">
              <!-- Platform Top -->
              <rect x="120" y="235" width="210" height="8" rx="2" fill="#6b7280"/>
              <rect x="135" y="140" width="180" height="95" fill="#f3f4f6" stroke="#9ca3af" stroke-width="3"/>
              
              <!-- Grid Layout inside the screen mockup -->
              <rect x="150" y="160" width="45" height="18" rx="2" fill="#2563eb"/>
              <rect x="205" y="160" width="30" height="18" rx="2" fill="#e5e7eb"/>
              <rect x="245" y="160" width="30" height="18" rx="2" fill="#e5e7eb"/>
              <rect x="285" y="160" width="15" height="18" rx="2" fill="#e5e7eb"/>

              <rect x="150" y="188" width="55" height="8" rx="1" fill="#d1d5db"/>
              <rect x="150" y="202" width="40" height="8" rx="1" fill="#d1d5db"/>

              <rect x="205" y="188" width="30" height="22" rx="2" fill="#e5e7eb"/>
              <rect x="245" y="188" width="30" height="22" rx="2" fill="#e5e7eb"/>
              <rect x="285" y="188" width="15" height="22" rx="2" fill="#f97316"/> <!-- Active block -->

              <!-- Scaffolding Cross Beams -->
              <path d="M140 243V286" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/>
              <path d="M300 243V286" stroke="#9ca3af" stroke-width="4" stroke-linecap="round"/>
              <path d="M142 245L298 285" stroke="#d1d5db" stroke-width="3"/>
              <path d="M298 245L142 285" stroke="#d1d5db" stroke-width="3"/>
              <rect x="130" y="282" width="160" height="4" fill="#9ca3af"/>
            </g>

            <!-- Crane and Truck Mechanism -->
            <g id="crane-truck">
              <!-- Truck Base Chassis -->
              <rect x="220" y="260" width="105" height="25" rx="4" fill="#4b5563"/>
              <rect x="215" y="250" width="40" height="20" rx="3" fill="#e5e7eb"/>
              <!-- Windshield / Cabin -->
              <path d="M235 250H250V270H225V258C225 253.5 229.5 250 235 250Z" fill="#d1d5db"/>
              <rect x="238" y="253" width="10" height="10" rx="1" fill="#93c5fd"/>
              <rect x="223" y="268" width="8" height="4" rx="1" fill="#f59e0b"/> <!-- Headlight -->

              <!-- Wheels -->
              <circle cx="240" cy="285" r="12" fill="#1f2937"/>
              <circle cx="240" cy="285" r="5" fill="#9ca3af"/>

              <circle cx="295" cy="285" r="12" fill="#1f2937"/>
              <circle cx="295" cy="285" r="5" fill="#9ca3af"/>

              <!-- Crane Boom / Arm -->
              <path d="M300 250L300 130L200 40L195 48L290 135L290 250Z" fill="#9ca3af"/>
              <!-- Crane Cable and Hook lifting interface -->
              <line x1="198" y1="44" x2="198" y2="70" stroke="#4b5563" stroke-width="3"/>
              <rect x="180" y="70" width="35" height="6" rx="2" fill="#2563eb"/>
              <circle cx="198" cy="44" r="3" fill="#1f2937"/>

              <!-- Crane Operator Cab -->
              <rect x="275" y="235" width="35" height="25" rx="3" fill="#6b7280"/>
              <path d="M280 235H305V250H280V235Z" fill="#e5e7eb"/>
              <rect x="285" y="239" width="15" height="8" rx="1" fill="#93c5fd"/>
            </g>
          </svg>
        </div>

        <!-- Typography matching the reference design -->
        <h1 id="fleet-guard-title" class="fleet-maint-title">${escapeHtml(data.maintenance_title || 'Website under maintenance')}</h1>
        <p id="fleet-guard-msg" class="fleet-maint-desc">${escapeHtml(data.maintenance_msg || 'This website is currently undergoing scheduled maintenance. We should be back shortly.')}</p>

        <div class="fleet-maint-bypass">
          <a class="fleet-maint-bypass-link" id="fleet-bypass-action">Admin Access</a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const bypassBtn = document.getElementById('fleet-bypass-action');
    if (bypassBtn) {
      bypassBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const code = prompt("Enter Administrator Bypass Passkey:");
        if (code) {
          sessionStorage.setItem('fleet_bypass_token', code.trim());
          evaluateStatus();
        }
      });
    }
  }

  function removeMaintenanceOverlay() {
    if (!isOverlayActive) return;
    const el = document.getElementById('fleet-maintenance-root');
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s ease-out';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    }
    isOverlayActive = false;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', evaluateStatus);
  } else {
    evaluateStatus();
  }

  setInterval(evaluateStatus, pollInterval);
})();
