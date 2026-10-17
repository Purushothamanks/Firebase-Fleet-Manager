// Firebase Fleet Manager — Frontend Controller
document.addEventListener('DOMContentLoaded', () => {
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

  // Icons map per site
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

  // 1. Load Fleet Data
  async function loadFleet() {
    try {
      const res = await fetch('/api/fleet');
      if (!res.ok) throw new Error("Failed to load fleet registry");
      fleetData = await res.json();
      renderDashboard();
    } catch (err) {
      console.error(err);
      fleetGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; margin-bottom: 12px;"></i>
          <p>Failed to connect to Fleet Sentinel Server. Please ensure <code>server.js</code> is running.</p>
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

    // Filter cards
    const filteredIds = siteIds.filter(id => {
      if (currentFilter === 'live') return fleetData[id].status === 'live';
      if (currentFilter === 'maintenance') return fleetData[id].status === 'maintenance';
      return true;
    });

    fleetGrid.innerHTML = filteredIds.map(id => createCardHTML(id, fleetData[id])).join('');

    // Attach event listeners to card buttons
    attachCardListeners();
  }

  function createCardHTML(id, site) {
    const isMaint = site.status === 'maintenance';
    const iconClass = siteIcons[id] || 'fa-solid fa-globe';
    const bypassUrl = `${site.url}?bypass=${encodeURIComponent(site.bypassKey || 'fleet-admin-secret-2026')}`;

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
            <span class="detail-label">HTTP Latency</span>
            <span class="detail-val" id="latency-${id}">-- ms</span>
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
    // Toggle status button
    document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.onclick = async (e) => {
        const id = btn.getAttribute('data-id');
        const nextStatus = btn.getAttribute('data-next');
        await toggleSiteStatus(id, nextStatus);
      };
    });

    // Ping single site
    document.querySelectorAll('[data-action="ping"]').forEach(btn => {
      btn.onclick = async (e) => {
        const id = btn.getAttribute('data-id');
        await pingSite(id);
      };
    });

    // Edit notice modal
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.onclick = (e) => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      };
    });
  }

  // 3. Toggle Status Action
  async function toggleSiteStatus(siteId, nextStatus) {
    try {
      const res = await fetch('/api/fleet/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, status: nextStatus })
      });

      if (!res.ok) throw new Error("Toggle request failed");
      const result = await res.json();
      fleetData[siteId] = result.site;
      renderDashboard();
      loadLogs();
    } catch (err) {
      alert("Error updating site status: " + err.message);
    }
  }

  // 4. Bulk Status Actions
  document.getElementById('btn-bulk-maint').onclick = async () => {
    if (!confirm("⚠️ Are you sure you want to put ALL 8 managed websites under MAINTENANCE mode?")) return;
    try {
      const res = await fetch('/api/fleet/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'maintenance' })
      });
      const data = await res.json();
      fleetData = data.fleet;
      renderDashboard();
      loadLogs();
    } catch (err) {
      alert("Bulk operation error: " + err.message);
    }
  };

  document.getElementById('btn-bulk-live').onclick = async () => {
    if (!confirm("🟢 Restore ALL 8 managed websites to LIVE operation?")) return;
    try {
      const res = await fetch('/api/fleet/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'live' })
      });
      const data = await res.json();
      fleetData = data.fleet;
      renderDashboard();
      loadLogs();
    } catch (err) {
      alert("Bulk operation error: " + err.message);
    }
  };

  // 5. Ping Latency
  async function pingSite(siteId) {
    const latencyEl = document.getElementById(`latency-${siteId}`);
    if (latencyEl) latencyEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
      const res = await fetch(`/api/ping/${siteId}`);
      const data = await res.json();
      if (latencyEl) {
        if (data.isReachable) {
          latencyEl.innerText = `${data.latencyMs} ms`;
          latencyEl.style.color = data.latencyMs < 500 ? '#34d399' : '#fbbf24';
        } else {
          latencyEl.innerText = `Offline`;
          latencyEl.style.color = '#ef4444';
        }
      }
      return data.latencyMs;
    } catch (e) {
      if (latencyEl) latencyEl.innerText = `Err`;
      return null;
    }
  }

  document.getElementById('btn-ping-all').onclick = async () => {
    const siteIds = Object.keys(fleetData);
    let totalMs = 0;
    let successful = 0;

    for (const id of siteIds) {
      const ms = await pingSite(id);
      if (ms !== null && ms > 0) {
        totalMs += ms;
        successful++;
      }
    }

    if (successful > 0) {
      const avg = Math.round(totalMs / successful);
      statLatency.innerText = `${avg} ms`;
    }
  };

  // 6. Filters
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
    document.getElementById('modal-input-title').value = site.maintenanceTitle || '';
    document.getElementById('modal-input-msg').value = site.maintenanceMsg || '';
    document.getElementById('modal-input-return').value = site.estimatedReturn || '';
    document.getElementById('modal-input-bypass').value = site.bypassKey || 'fleet-admin-secret-2026';

    editModal.classList.add('open');
  }

  document.getElementById('modal-close-btn').onclick = () => editModal.classList.remove('open');
  document.getElementById('modal-cancel-btn').onclick = () => editModal.classList.remove('open');

  editForm.onsubmit = async (e) => {
    e.preventDefault();
    const siteId = document.getElementById('modal-site-id').value;
    const body = {
      siteId,
      maintenanceTitle: document.getElementById('modal-input-title').value,
      maintenanceMsg: document.getElementById('modal-input-msg').value,
      estimatedReturn: document.getElementById('modal-input-return').value,
      bypassKey: document.getElementById('modal-input-bypass').value
    };

    try {
      const res = await fetch('/api/fleet/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      fleetData[siteId] = data.site;
      editModal.classList.remove('open');
      renderDashboard();
      loadLogs();
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
    alert("Copied integration snippet to clipboard!");
  };

  // 8. Logs
  async function loadLogs() {
    try {
      const res = await fetch('/api/logs');
      const logs = await res.json();
      if (!logs || logs.length === 0) {
        logsContainer.innerHTML = '<div style="color: #64748b; font-size: 13px; padding: 12px;">No activity logs recorded yet.</div>';
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
    } catch (e) {}
  }

  document.getElementById('btn-refresh-logs').onclick = loadLogs;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initialization
  loadFleet();
  loadLogs();
});
