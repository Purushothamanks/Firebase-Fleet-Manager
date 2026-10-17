/**
 * Firebase Fleet Manager — Universal Client-Side Real-Time Guard
 * 
 * Embed this single script into any web application to enable instant, sub-second
 * maintenance mode toggling from your Firebase Fleet Manager dashboard.
 * 
 * Usage:
 * <script src="https://your-fleet-server.com/guard.js" data-site-id="your-site-id"></script>
 */
(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__FLEET_GUARD_INITIALIZED__) return;
  window.__FLEET_GUARD_INITIALIZED__ = true;

  // Locate the current script tag
  const script = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && (scripts[i].src.includes('guard.js') || scripts[i].src.includes('maintenance-guard'))) {
        return scripts[i];
      }
    }
    return null;
  })();

  // Configuration options
  const siteId = script?.getAttribute('data-site-id') || window.FLEET_SITE_ID || 'aio-universe';
  const apiBase = script?.getAttribute('data-api-url') || (function () {
    if (script && script.src) {
      try {
        const u = new URL(script.src);
        return `${u.protocol}//${u.host}`;
      } catch (e) {}
    }
    return window.FLEET_API_URL || 'http://localhost:4000';
  })();

  const pollInterval = parseInt(script?.getAttribute('data-check-interval') || '5000', 10);
  const bypassParamName = script?.getAttribute('data-bypass-param') || 'bypass';

  // Check URL query parameters for bypass key
  try {
    const params = new URLSearchParams(window.location.search);
    const keyFromUrl = params.get(bypassParamName);
    if (keyFromUrl) {
      sessionStorage.setItem('fleet_bypass_token', keyFromUrl);
    }
  } catch (e) {}

  let isOverlayActive = false;

  // Primary status evaluation
  async function evaluateStatus() {
    try {
      const endpoint = `${apiBase.replace(/\/+$/, '')}/api/status/${encodeURIComponent(siteId)}?_t=${Date.now()}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return; // Fail-open on API errors
      const data = await response.json();

      const storedBypass = sessionStorage.getItem('fleet_bypass_token');
      const isBypassed = storedBypass && data.bypassKey && storedBypass === data.bypassKey;

      if (data.status === 'maintenance' && !isBypassed) {
        renderMaintenanceOverlay(data);
      } else {
        removeMaintenanceOverlay();
      }
    } catch (err) {
      // Network failure: fail-open so visitors are not blocked if monitoring server is unreachable
    }
  }

  function renderMaintenanceOverlay(data) {
    if (isOverlayActive) {
      // Update text in case message changed dynamically
      const msgEl = document.getElementById('fleet-guard-msg');
      if (msgEl && data.maintenanceMsg) msgEl.innerText = data.maintenanceMsg;
      const titleEl = document.getElementById('fleet-guard-title');
      if (titleEl && data.maintenanceTitle) titleEl.innerText = data.maintenanceTitle;
      return;
    }

    isOverlayActive = true;

    // Inject styles
    if (!document.getElementById('fleet-guard-styles')) {
      const style = document.createElement('style');
      style.id = 'fleet-guard-styles';
      style.textContent = `
        @keyframes fleetPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes fleetFadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(20px); }
        }
        #fleet-maintenance-root {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483647 !important;
          background: rgba(7, 10, 19, 0.96) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          color: #f8fafc !important;
          padding: 24px !important;
          box-sizing: border-box !important;
          animation: fleetFadeIn 0.35s ease-out forwards;
        }
        .fleet-card {
          max-width: 540px;
          width: 100%;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 44px 36px;
          text-align: center;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 40px rgba(245, 158, 11, 0.15);
          position: relative;
        }
        .fleet-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fbbf24;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 9999px;
          margin-bottom: 24px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .fleet-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 10px #f59e0b;
          animation: fleetPulse 2s infinite ease-in-out;
        }
        .fleet-icon {
          font-size: 54px;
          line-height: 1;
          margin-bottom: 20px;
          display: inline-block;
          animation: fleetPulse 3s infinite ease-in-out;
        }
        .fleet-title {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 14px 0;
          letter-spacing: -0.02em;
        }
        .fleet-msg {
          font-size: 15px;
          line-height: 1.65;
          color: #94a3b8;
          margin: 0 0 28px 0;
        }
        .fleet-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
        }
        .fleet-footer-link {
          color: #64748b;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .fleet-footer-link:hover {
          color: #cbd5e1;
        }
      `;
      document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.id = 'fleet-maintenance-root';
    overlay.innerHTML = `
      <div class="fleet-card">
        <div class="fleet-badge">
          <span class="fleet-dot"></span>
          Scheduled Maintenance
        </div>
        <div class="fleet-icon">🚧</div>
        <h2 id="fleet-guard-title" class="fleet-title">${escapeHtml(data.maintenanceTitle || 'Under Scheduled Maintenance')}</h2>
        <p id="fleet-guard-msg" class="fleet-msg">${escapeHtml(data.maintenanceMsg || 'We are currently performing routine infrastructure upgrades. Normal service will resume shortly.')}</p>
        
        <div class="fleet-footer">
          <span style="color: #475569;">Fleet Sentinel Guard</span>
          <a class="fleet-footer-link" id="fleet-bypass-action">Administrator Unlock</a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Setup Unlock Modal Trigger
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
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initial trigger once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', evaluateStatus);
  } else {
    evaluateStatus();
  }

  // Periodic heartbeat poll
  setInterval(evaluateStatus, pollInterval);
})();
