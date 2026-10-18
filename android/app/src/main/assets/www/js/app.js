// Firebase Fleet Manager — 24/7 Serverless GitHub Pages Controller
// Powered by Supabase Cloud Realtime REST API
document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://mpymsolehyodfyamnpqn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weW1zb2xlaHlvZGZ5YW1ucHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTc1MjMsImV4cCI6MjEwNzQ3MzUyM30.LOwTKgp5lXKZc1lrLFfsWCINxrYVth1WZbbs97PbkxI';

  let fleetData = {};
  let currentFilter = 'all';

  // Elements
  const fleetGrid = document.getElementById('fleet-grid');
  const statTotal = document.getElementById('stat-total');
  const statLive = document.getElementById('stat-live');
  const statMaint = document.getElementById('stat-maint');
  const statLatency = document.getElementById('stat-latency');
  const filterLiveCount = document.getElementById('filter-live-count');
  const filterMaintCount = document.getElementById('filter-maint-count');

  // Modal
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-notice-form');

  // Theme Manager (Dark / Light Mode)
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');

  function getPreferredTheme() {
    const saved = localStorage.getItem('fleet_theme');
    if (saved) return saved;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fleet_theme', theme);
    if (themeToggleIcon) {
      if (theme === 'light') {
        themeToggleIcon.className = 'fa-solid fa-sun';
        themeToggleIcon.style.color = '#f59e0b';
      } else {
        themeToggleIcon.className = 'fa-solid fa-moon';
        themeToggleIcon.style.color = '';
      }
    }
  }

  // Initialize theme
  applyTheme(getPreferredTheme());

  if (themeToggleBtn) {
    themeToggleBtn.onclick = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    };
  }

  const siteIcons = {
    'aio-universe': 'fa-solid fa-robot',
    'department-rpsit': 'fa-solid fa-graduation-cap',
    'ecofinancies': 'fa-solid fa-chart-line',
    'easy-kart-d6d3a': 'fa-solid fa-cart-shopping',
    'lafsai': 'fa-solid fa-brain',
    'task-teamtracker': 'fa-solid fa-list-check',
    'webmarketz': 'fa-solid fa-store',
    'mygovthub': 'fa-solid fa-city'
  };

  // 1. Load Fleet from Supabase Cloud
  async function loadFleet() {
    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/site_maintenance?select=*&order=site_id.asc`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch fleet from Supabase");
      const list = await res.json();
      
      fleetData = {};
      list.forEach(item => {
        fleetData[item.site_id] = item;
      });

      renderDashboard();
    } catch (err) {
      console.error(err);
      if (fleetGrid && Object.keys(fleetData).length === 0) {
        fleetGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; margin-bottom: 12px;"></i>
            <h3>Unable to connect to Supabase Cloud</h3>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 6px;">Check internet connection or Supabase API keys.</p>
          </div>
        `;
      }
    }
  }

  // 2. Render Cards & Metrics
  function renderDashboard() {
    const sites = Object.values(fleetData);
    if (sites.length === 0) return;

    // Calculate metrics
    const totalCount = sites.length;
    const maintCount = sites.filter(s => s.status === 'maintenance').length;
    const liveCount = totalCount - maintCount;

    if (statTotal) statTotal.innerText = totalCount;
    if (statLive) statLive.innerText = liveCount;
    if (statMaint) statMaint.innerText = maintCount;
    if (filterLiveCount) filterLiveCount.innerText = liveCount;
    if (filterMaintCount) filterMaintCount.innerText = maintCount;

    // Filter cards
    const filteredSites = sites.filter(s => {
      if (currentFilter === 'live') return s.status !== 'maintenance';
      if (currentFilter === 'maintenance') return s.status === 'maintenance';
      return true;
    });

    if (fleetGrid) {
      fleetGrid.innerHTML = filteredSites.map(site => createCardHTML(site)).join('');
      attachCardListeners();
    }
  }

  function createCardHTML(site) {
    const isMaint = site.status === 'maintenance';
    const id = site.site_id;
    const iconClass = siteIcons[id] || 'fa-solid fa-globe';

    return `
      <div class="app-card ${isMaint ? 'card-maintenance' : ''}" id="card-${id}">
        <div class="card-top">
          <div class="app-header">
            <div class="app-icon">
              <i class="${iconClass}"></i>
            </div>
            <div class="app-titles">
              <h3>${escapeHtml(site.name || id)}</h3>
              <div class="app-tagline">${escapeHtml(site.tagline || 'Firebase Project')}</div>
            </div>
          </div>
          <span class="status-badge ${isMaint ? 'maintenance' : 'live'}">
            <i class="fa-solid ${isMaint ? 'fa-screwdriver-wrench' : 'fa-circle-check'}"></i>
            ${isMaint ? 'Maintenance' : 'Live'}
          </span>
        </div>

        <div class="card-details">
          <div class="detail-row">
            <span class="detail-label">Project ID:</span>
            <span class="detail-val"><code>${escapeHtml(id)}</code></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Domain:</span>
            <span class="detail-val">${escapeHtml(site.url ? site.url.replace('https://', '') : '')}</span>
          </div>
          ${site.estimated_return ? `
            <div class="detail-row">
              <span class="detail-label">Est. Return:</span>
              <span class="detail-val" style="color: #f59e0b;">${escapeHtml(site.estimated_return)}</span>
            </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Cloud State:</span>
            <span class="detail-val" style="color: #10b981;">Synced</span>
          </div>
        </div>

        <div class="card-actions">
          <button 
            class="toggle-switch-btn ${isMaint ? 'toggle-to-live' : 'toggle-to-maint'}"
            data-action="toggle"
            data-id="${id}"
            data-next="${isMaint ? 'live' : 'maintenance'}"
          >
            <i class="fa-solid ${isMaint ? 'fa-circle-play' : 'fa-screwdriver-wrench'}"></i>
            ${isMaint ? 'Restore App to Live' : 'Keep Maintenance'}
          </button>

          <div class="card-sub-actions">
            <button class="icon-btn" data-action="edit" data-id="${id}" title="Edit Announcement Notice">
              <i class="fa-solid fa-pen-to-square"></i> Notice
            </button>
            <a href="${site.url}" target="_blank" class="icon-btn" title="Open Live Web App">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit
            </a>
            <button class="icon-btn" data-action="ping" data-id="${id}" title="Ping Latency">
              <i class="fa-solid fa-satellite-dish"></i> Ping
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function attachCardListeners() {
    document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const nextStatus = btn.getAttribute('data-next');
        await toggleSiteStatus(id, nextStatus);
      };
    });

    document.querySelectorAll('[data-action="ping"]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        await pingSite(id);
      };
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      };
    });
  }

  // 3. Toggle Status Action via Supabase
  async function toggleSiteStatus(siteId, nextStatus) {
    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/site_maintenance?site_id=eq.${encodeURIComponent(siteId)}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ 
          status: nextStatus,
          last_changed: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error("Supabase status update failed");
      const updated = await res.json();
      fleetData[siteId] = updated[0];
      
      addAuditLog(
        nextStatus === 'maintenance' ? 'SET_MAINTENANCE' : 'RESTORE_LIVE',
        `Switched ${fleetData[siteId].name} to ${nextStatus.toUpperCase()}`
      );

      renderDashboard();
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  }

  // 4. Bulk Operations
  const bulkMaintBtn = document.getElementById('btn-bulk-maint');
  if (bulkMaintBtn) {
    bulkMaintBtn.onclick = async () => {
      if (!confirm("⚠️ Put ALL 8 managed websites under MAINTENANCE mode?")) return;
      try {
        const endpoint = `${SUPABASE_URL}/rest/v1/site_maintenance?site_id=neq.none`;
        await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: 'maintenance',
            last_changed: new Date().toISOString()
          })
        });

        addAuditLog('BULK_MAINTENANCE', 'Put ALL 8 projects under maintenance mode');
        await loadFleet();
      } catch (err) {
        alert("Bulk error: " + err.message);
      }
    };
  }

  const bulkLiveBtn = document.getElementById('btn-bulk-live');
  if (bulkLiveBtn) {
    bulkLiveBtn.onclick = async () => {
      if (!confirm("🟢 Restore ALL 8 managed websites to LIVE operation?")) return;
      try {
        const endpoint = `${SUPABASE_URL}/rest/v1/site_maintenance?site_id=neq.none`;
        await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: 'live',
            last_changed: new Date().toISOString()
          })
        });

        addAuditLog('BULK_RESTORE_LIVE', 'Restored ALL 8 projects to LIVE mode');
        await loadFleet();
      } catch (err) {
        alert("Bulk error: " + err.message);
      }
    };
  }

  // 5. Ping Latency (Browser Fetch)
  async function pingSite(siteId) {
    const site = fleetData[siteId];
    if (!site) return null;

    const start = performance.now();
    try {
      await fetch(site.url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
      const latency = Math.round(performance.now() - start);
      alert(`🛰️ Ping ${site.name}: ${latency} ms (Live & Reachable)`);
      return latency;
    } catch (e) {
      alert(`⚠️ Ping ${site.name}: Offline or unreachable`);
      return null;
    }
  }

  // Ping All Fleet
  const pingAllBtn = document.getElementById('btn-ping-all');
  if (pingAllBtn) {
    pingAllBtn.onclick = async () => {
      const icon = pingAllBtn.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      
      const start = performance.now();
      await loadFleet();
      const latency = Math.round(performance.now() - start);
      
      if (statLatency) statLatency.innerText = `${latency} ms`;
      if (icon) icon.classList.remove('fa-spin');
    };
  }

  // 6. Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderDashboard();
    };
  });

  // 7. Edit Notice Modal
  function openEditModal(siteId) {
    const site = fleetData[siteId];
    if (!site) return;

    document.getElementById('modal-site-id').value = siteId;
    document.getElementById('modal-site-title').innerText = `Edit Notice: ${site.name}`;
    document.getElementById('modal-input-title').value = site.maintenance_title || 'Website under maintenance';
    document.getElementById('modal-input-msg').value = site.maintenance_msg || 'This website is currently undergoing scheduled maintenance. We should be back shortly.';
    document.getElementById('modal-input-return').value = site.estimated_return || '';
    document.getElementById('modal-input-bypass').value = site.bypass_key || 'fleet-admin-secret-2026';

    editModal.classList.add('open');
  }

  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) {
    modalCloseBtn.onclick = () => editModal.classList.remove('open');
  }
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  if (modalCancelBtn) {
    modalCancelBtn.onclick = () => editModal.classList.remove('open');
  }

  editForm.onsubmit = async (e) => {
    e.preventDefault();
    const siteId = document.getElementById('modal-site-id').value;

    const updatePayload = {
      maintenance_title: document.getElementById('modal-input-title').value,
      maintenance_msg: document.getElementById('modal-input-msg').value,
      estimated_return: document.getElementById('modal-input-return').value,
      bypass_key: document.getElementById('modal-input-bypass').value,
      last_changed: new Date().toISOString()
    };

    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/site_maintenance?site_id=eq.${encodeURIComponent(siteId)}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) throw new Error("Failed to save notice to Supabase");
      const updated = await res.json();
      fleetData[siteId] = updated[0];
      editModal.classList.remove('open');
      addAuditLog('CONFIG_UPDATE', `Updated announcement notice for ${fleetData[siteId].name}`);
      renderDashboard();
    } catch (err) {
      alert("Error saving notice: " + err.message);
    }
  };

  // Safe Audit Log persistence
  function addAuditLog(action, details) {
    try {
      let logs = JSON.parse(localStorage.getItem('fleet_audit_logs') || '[]');
      logs.unshift({
        timestamp: new Date().toISOString(),
        action,
        details
      });
      if (logs.length > 50) logs = logs.slice(0, 50);
      localStorage.setItem('fleet_audit_logs', JSON.stringify(logs));
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Register ServiceWorker for Android PWA Installation
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('PWA ServiceWorker registered with scope:', reg.scope);
      }).catch((err) => {
        console.warn('PWA ServiceWorker registration skipped:', err);
      });
    });
  }

  // Periodic Auto-Sync from Supabase every 4 seconds
  loadFleet();
  setInterval(loadFleet, 4000);
});
