const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 4000;
const STATE_FILE = path.join(__dirname, 'fleet-state.json');
const LOGS_FILE = path.join(__dirname, 'fleet-logs.json');

// Enable CORS for all origins so live Firebase apps can query status without restriction
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/client', express.static(path.join(__dirname, 'client')));

// Serve the client guard directly at root for convenience
app.get('/guard.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'maintenance-guard.js'));
});
app.get('/maintenance-guard.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'maintenance-guard.js'));
});

// Default initial state for the 8 managed Firebase projects
const INITIAL_FLEET = {
  "aio-universe": {
    name: "AIO Platform",
    tagline: "AI Tools Directory & Aggregator",
    url: "https://aio-universe.web.app",
    altUrl: "https://aio-universe.firebaseapp.com",
    status: "live",
    maintenanceTitle: "Scheduled Maintenance",
    maintenanceMsg: "We are currently optimizing our AI tools directory and indexers. Please check back shortly.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  },
  "department-rpsit": {
    name: "RPSIT Department Portal",
    tagline: "Multi-Department Academic Portal",
    url: "https://department-rpsit.web.app",
    altUrl: "https://department-rpsit.firebaseapp.com",
    status: "live",
    maintenanceTitle: "Academic Portal Maintenance",
    maintenanceMsg: "The student & faculty portal is undergoing scheduled database upgrades. Services will resume soon.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  },
  "ecofinancies": {
    name: "FinancePro",
    tagline: "Business Finance & Accounting Suite",
    url: "https://ecofinancies.web.app",
    altUrl: "https://ecofinancies.firebaseapp.com",
    status: "live",
    maintenanceTitle: "System Reconciliation in Progress",
    maintenanceMsg: "FinancePro is currently executing routine financial ledger and security updates. Back shortly.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  },
  "easy-kart-d6d3a": {
    name: "Easy Kart",
    tagline: "Multi-Store E-Commerce Platform",
    url: "https://easy-kart-d6d3a.web.app",
    altUrl: "https://easy-kart-d6d3a.firebaseapp.com",
    status: "live",
    maintenanceTitle: "Storefront Upgrade Notice",
    maintenanceMsg: "Easy Kart catalog and inventory search algorithms are being enhanced. Thank you for your patience.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  },
  "lafsai": {
    name: "LAF AI Platform",
    tagline: "Autonomous Multimodal AI Engine",
    url: "https://lafsai.web.app",
    altUrl: "https://lafsai.firebaseapp.com",
    status: "live",
    maintenanceTitle: "AI Model Pipeline Sync",
    maintenanceMsg: "LAF AI neural dispatch engines and runtime models are undergoing scheduled maintenance.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  },
  "task-teamtracker": {
    name: "Team Task Tracker",
    tagline: "Agile Project & Sprint Tracker",
    url: "https://task-teamtracker.web.app",
    altUrl: "https://task-teamtracker.firebaseapp.com",
    status: "live",
    maintenanceTitle: "Database Maintenance",
    maintenanceMsg: "Task and Kanban synchronizers are pausing briefly for infrastructure scaling. Back online soon.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  },
  "webmarketz": {
    name: "Web Market",
    tagline: "Tailwind UI Marketplace & Studio",
    url: "https://webmarketz.web.app",
    altUrl: "https://webmarketz.firebaseapp.com",
    status: "live",
    maintenanceTitle: "Marketplace Updates",
    maintenanceMsg: "We are publishing new UI component assets and AI studio templates. Please check back shortly.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  },
  "mygovthub": {
    name: "InfraPulse AI",
    tagline: "Civic Infrastructure Copilot",
    url: "https://mygovthub.web.app",
    altUrl: "https://mygovthub.firebaseapp.com",
    status: "live",
    maintenanceTitle: "Civic Grid Maintenance",
    maintenanceMsg: "Municipal triage GIS feeds and grievance pipelines are syncing with municipal servers.",
    estimatedReturn: "",
    bypassKey: "fleet-admin-secret-2026",
    lastChanged: new Date().toISOString()
  }
};

function getFleetState() {
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(INITIAL_FLEET, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch (err) {
    console.error("Error reading state file, resetting to default:", err);
    return INITIAL_FLEET;
  }
}

function saveFleetState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function logAuditEvent(action, siteId, details) {
  let logs = [];
  if (fs.existsSync(LOGS_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    } catch (e) {
      logs = [];
    }
  }
  const event = {
    id: 'evt_' + Date.now(),
    timestamp: new Date().toISOString(),
    action,
    siteId,
    details
  };
  logs.unshift(event);
  if (logs.length > 100) logs = logs.slice(0, 100);
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  return event;
}

// -----------------------------------------------------------------------------
// PUBLIC CLIENT API (Queried by the live websites' guard script)
// -----------------------------------------------------------------------------
app.get('/api/status/:siteId', (req, res) => {
  const { siteId } = req.params;
  const fleet = getFleetState();
  const site = fleet[siteId];

  if (!site) {
    return res.status(404).json({
      error: "Site identifier not found in Fleet registry",
      siteId,
      status: "unknown"
    });
  }

  // Set aggressive no-cache headers so status changes take effect immediately
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });

  res.json({
    siteId,
    name: site.name,
    status: site.status, // "live" or "maintenance"
    maintenanceTitle: site.maintenanceTitle || "Platform Under Scheduled Maintenance",
    maintenanceMsg: site.maintenanceMsg || "We are currently updating our systems. Please check back shortly.",
    estimatedReturn: site.estimatedReturn || null,
    bypassKey: site.bypassKey || "fleet-admin-secret-2026",
    lastChanged: site.lastChanged,
    serverTime: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// DASHBOARD FLEET MANAGEMENT ENDPOINTS
// -----------------------------------------------------------------------------

// Get full state of all 8 sites
app.get('/api/fleet', (req, res) => {
  res.json(getFleetState());
});

// Toggle individual site status
app.post('/api/fleet/toggle', (req, res) => {
  const { siteId, status } = req.body;
  if (!['live', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'live' or 'maintenance'." });
  }

  const fleet = getFleetState();
  if (!fleet[siteId]) {
    return res.status(404).json({ error: `Site ${siteId} not registered.` });
  }

  const previous = fleet[siteId].status;
  fleet[siteId].status = status;
  fleet[siteId].lastChanged = new Date().toISOString();
  saveFleetState(fleet);

  logAuditEvent(
    status === 'maintenance' ? 'SET_MAINTENANCE' : 'RESTORE_LIVE',
    siteId,
    `Status changed from ${previous.toUpperCase()} to ${status.toUpperCase()} for ${fleet[siteId].name}`
  );

  res.json({ success: true, site: fleet[siteId] });
});

// Bulk status change (Emergency All Maintenance / All Live)
app.post('/api/fleet/bulk', (req, res) => {
  const { status } = req.body;
  if (!['live', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const fleet = getFleetState();
  Object.keys(fleet).forEach(id => {
    fleet[id].status = status;
    fleet[id].lastChanged = new Date().toISOString();
  });
  saveFleetState(fleet);

  logAuditEvent(
    'BULK_STATUS_CHANGE',
    'ALL',
    `All 8 fleet projects set to ${status.toUpperCase()}`
  );

  res.json({ success: true, status, fleet });
});

// Update site maintenance message & settings
app.post('/api/fleet/update', (req, res) => {
  const { siteId, maintenanceTitle, maintenanceMsg, estimatedReturn, bypassKey } = req.body;
  const fleet = getFleetState();

  if (!fleet[siteId]) {
    return res.status(404).json({ error: `Site ${siteId} not registered.` });
  }

  if (maintenanceTitle) fleet[siteId].maintenanceTitle = maintenanceTitle;
  if (maintenanceMsg) fleet[siteId].maintenanceMsg = maintenanceMsg;
  if (estimatedReturn !== undefined) fleet[siteId].estimatedReturn = estimatedReturn;
  if (bypassKey) fleet[siteId].bypassKey = bypassKey;
  fleet[siteId].lastChanged = new Date().toISOString();

  saveFleetState(fleet);
  logAuditEvent('CONFIG_UPDATE', siteId, `Updated maintenance details for ${fleet[siteId].name}`);

  res.json({ success: true, site: fleet[siteId] });
});

// Ping live website to check HTTP status and latency
app.get('/api/ping/:siteId', (req, res) => {
  const { siteId } = req.params;
  const fleet = getFleetState();
  const site = fleet[siteId];

  if (!site) {
    return res.status(404).json({ error: "Site not found" });
  }

  const targetUrl = new URL(site.url);
  const client = targetUrl.protocol === 'https:' ? https : http;
  const startTime = Date.now();

  const pingReq = client.get(targetUrl, {
    headers: { 'User-Agent': 'FirebaseFleetSentinel/1.0' },
    timeout: 8000
  }, (resp) => {
    const latency = Date.now() - startTime;
    res.json({
      siteId,
      url: site.url,
      statusCode: resp.statusCode,
      latencyMs: latency,
      isReachable: resp.statusCode >= 200 && resp.statusCode < 400,
      timestamp: new Date().toISOString()
    });
    // Consume response to free up socket
    resp.resume();
  });

  pingReq.on('error', (err) => {
    res.json({
      siteId,
      url: site.url,
      statusCode: 0,
      latencyMs: 0,
      isReachable: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  });

  pingReq.on('timeout', () => {
    pingReq.destroy();
    res.json({
      siteId,
      url: site.url,
      statusCode: 408,
      latencyMs: 8000,
      isReachable: false,
      error: "Connection Timed Out",
      timestamp: new Date().toISOString()
    });
  });
});

// Get Audit Logs
app.get('/api/logs', (req, res) => {
  let logs = [];
  if (fs.existsSync(LOGS_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    } catch (e) {
      logs = [];
    }
  }
  res.json(logs);
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ Firebase Fleet Manager running at http://localhost:${PORT}`);
  console.log(`🌐 Public Guard API endpoint: http://localhost:${PORT}/api/status/:siteId`);
  console.log(`🛡️ Client Guard script available at: http://localhost:${PORT}/guard.js`);
  console.log(`=======================================================`);
});
