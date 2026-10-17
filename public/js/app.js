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
  const logsContainer = document.getElementById('logs-container');

  // Modals
  const editModal = document.getElementById('edit-modal');
  const snippetModal = document.getElementById('snippet-modal');
  const editForm = document.getElementById('edit-notice-form');

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
      fleetGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; margin-bottom: 12px;"></i>
          <p>Failed to connect to Supabase Cloud State store: ${err.message}</p>
        </div>
      `;
    }
  }

  // 2. Render Cards & Stats
  function renderDashboard() {
    const siteIds = Object.keys(fleetData);
    const total = siteIds.length;
    let liveCount = 0;
    let maintCount = 0;

    siteIds.forEach(id => {
      if (fleetData[id].status === 'maintenance') maintCount++;
      else liveCount++;
    });

    statTotal.innerText = total;
    statLive.innerText = liveCount;
    statMaint.innerText = maintCount;
    filterLiveCount.innerText = liveCount;
    filterMaintCount.innerText = maintCount;

    const filteredIds = siteIds.filter(id => {
      if (currentFilter === 'live') return fleetData[id].status === 'live';
      if (currentFilter === 'maintenance') return fleetData[id].status === 'maintenance';
      return true;
    });

    fleetGrid.innerHTML = filteredIds.map(id => createCardHTML(id, fleetData[id])).join('');
    attachCardListeners();
  }

  function createCardHTML(id, site) {
    const isMaint = site.status === 'maintenance';
    const iconClass = siteIcons[id] || 'fa-solid fa-globe';
    const bypassUrl = `${site.url}?bypass=${encodeURIComponent(site.bypass_key || 'fleet-admin-secret-2026')}`;

    return `
      <div class="app-card ${isMaint ? 'card-maintenance' : ''}" id="card-${id}">
        <div class="card-top">
          <div class="app-header">
            <div class="app-icon"><i class="${iconClass}"></i></div>
            <div class="app-titles">
              <h3>${escapeHtml(site.name)}</h3>
              <span class="app-tagline">${escapeHtml(site.tagline || '')}</span>
            </div>
          </div>
          <span class="status-badge ${isMaint ? 'maintenance' : 'live'}">
            <span class="pulse-dot" style="background: ${isMaint ? '#f59e0b' : '#10b981'}; box-shadow: 0 0 8px ${isMaint ? '#f59e0b' : '#10b981'};"></span>
            ${isMaint ? 'Maintenance' : 'Live'}
          </span>
        </div>

        <div class="card-details">
          <div class="detail-row">
            <span class="detail-label">Project ID</span>
            <span class="detail-val">${escapeHtml(id)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Domain</span>
            <span class="detail-val">${escapeHtml(site.url.replace('https://', ''))}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Cloud Sync</span>
            <span class="detail-val" style="color: #34d399;">24/7 Supabase</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="toggle-switch-btn ${isMaint ? 'toggle-to-live' : 'toggle-to-maint'}" 
                  data-action="toggle" 
                  data-id="${id}" 
                  data-next="${isMaint ? 'live' : 'maintenance'}">
            <i class="fa-solid ${isMaint ? 'fa-circle-play' : 'fa-screwdriver-wrench'}"></i>
            ${isMaint ? 'Restore App to Live' : 'Keep Maintenance'}
          </button>

          <div class="card-sub-actions">
            <a href="${site.url}" target="_blank" class="icon-btn" title="Open Public URL">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Site
            </a>
            <a href="${bypassUrl}" target="_blank" class="icon-btn" title="Open with Admin Bypass Passkey">
              <i class="fa-solid fa-key"></i> Bypass View
            </a>
            <button class="icon-btn" data-action="edit" data-id="${id}" title="Edit Announcement">
              <i class="fa-solid fa-pen-to-square"></i> Notice
            </button>
            <button class="icon-btn" data-action="ping" data-id="${id}" title="Ping Latency">
              <i class="fa-solid fa-satellite-dish"></i>
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
  document.getElementById('btn-bulk-maint').onclick = async () => {
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

  document.getElementById('btn-bulk-live').onclick = async () => {
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

  document.getElementById('btn-ping-all').onclick = async () => {
    statLatency.innerText = "Pinging...";
    const siteIds = Object.keys(fleetData);
    let totalMs = 0;
    let success = 0;

    for (const id of siteIds) {
      const start = performance.now();
      try {
        await fetch(fleetData[id].url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        totalMs += Math.round(performance.now() - start);
        success++;
      } catch (e) {}
    }

    if (success > 0) {
      statLatency.innerText = `${Math.round(totalMs / success)} ms`;
    } else {
      statLatency.innerText = "-- ms";
    }
  };

  // 6. Filter Controls
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderDashboard();
    };
  });

  // 7. Modals
  function openEditModal(siteId) {
    const site = fleetData[siteId];
    if (!site) return;

    document.getElementById('modal-site-id').value = siteId;
    document.getElementById('modal-site-title').innerText = `Edit Notice: ${site.name}`;
    document.getElementById('modal-input-title').value = site.maintenance_title || '';
    document.getElementById('modal-input-msg').value = site.maintenance_msg || '';
    document.getElementById('modal-input-return').value = site.estimated_return || '';
    document.getElementById('modal-input-bypass').value = site.bypass_key || 'fleet-admin-secret-2026';

    editModal.classList.add('open');
  }

  document.getElementById('modal-close-btn').onclick = () => editModal.classList.remove('open');
  document.getElementById('modal-cancel-btn').onclick = () => editModal.classList.remove('open');

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

  // Snippet Modal
  document.getElementById('btn-guard-code').onclick = () => snippetModal.classList.add('open');
  document.getElementById('snippet-close-btn').onclick = () => snippetModal.classList.remove('open');
  document.getElementById('btn-copy-snippet').onclick = () => {
    const text = document.getElementById('snippet-code-text').innerText;
    navigator.clipboard.writeText(text);
    alert("Copied 24/7 Cloud Guard snippet to clipboard!");
  };

  // 8. Audit Logs (Persistent via LocalStorage)
  function addAuditLog(action, details) {
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('fleet_audit_logs') || '[]');
    } catch (e) {}

    logs.unshift({
      timestamp: new Date().toISOString(),
      action,
      details
    });

    if (logs.length > 50) logs = logs.slice(0, 50);
    localStorage.setItem('fleet_audit_logs', JSON.stringify(logs));
    renderLogs();
  }

  function renderLogs() {
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('fleet_audit_logs') || '[]');
    } catch (e) {}

    if (logs.length === 0) {
      logsContainer.innerHTML = '<div style="color: #64748b; font-size: 13px; padding: 12px;">No activity logs recorded yet. Toggling maintenance will record events here.</div>';
      return;
    }

    logsContainer.innerHTML = logs.map(l => `
      <div class="log-item ${l.action.includes('MAINT') ? 'maint' : 'live'}">
        <div class="log-details">
          <span class="status-badge ${l.action.includes('MAINT') ? 'maintenance' : 'live'}">${l.action}</span>
          <span>${escapeHtml(l.details)}</span>
        </div>
        <span class="log-time">${new Date(l.timestamp).toLocaleTimeString()}</span>
      </div>
    `).join('');
  }

  document.getElementById('btn-refresh-logs').onclick = renderLogs;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Periodic Auto-Sync from Supabase every 4 seconds
  loadFleet();
  renderLogs();
  setInterval(loadFleet, 4000);
});
