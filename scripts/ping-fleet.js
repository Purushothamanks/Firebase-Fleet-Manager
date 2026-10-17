#!/usr/bin/env node

/**
 * CLI Health Ping Utility for Firebase Fleet
 * Usage: npm run ping
 */

const https = require('https');

const FLEET = [
  { id: 'aio-universe', name: 'AIO Platform', url: 'https://aio-universe.web.app' },
  { id: 'department-rpsit', name: 'RPSIT Portal', url: 'https://department-rpsit.web.app' },
  { id: 'ecofinancies', name: 'FinancePro', url: 'https://ecofinancies.web.app' },
  { id: 'easy-kart-d6d3a', name: 'Easy Kart', url: 'https://easy-kart-d6d3a.web.app' },
  { id: 'lafsai', name: 'LAF AI Platform', url: 'https://lafsai.web.app' },
  { id: 'task-teamtracker', name: 'Team Task Tracker', url: 'https://task-teamtracker.web.app' },
  { id: 'webmarketz', name: 'Web Market', url: 'https://webmarketz.web.app' },
  { id: 'mygovthub', name: 'InfraPulse AI', url: 'https://mygovthub.web.app' }
];

function pingUrl(target) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(target.url, { timeout: 6000 }, (res) => {
      const latency = Date.now() - start;
      res.resume();
      resolve({ ...target, status: res.statusCode, latency, alive: res.statusCode >= 200 && res.statusCode < 400 });
    });

    req.on('error', (err) => {
      resolve({ ...target, status: 'ERR', latency: 0, alive: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ...target, status: 'TIMEOUT', latency: 6000, alive: false });
    });
  });
}

async function run() {
  console.log('\n🛰️  Pinging Firebase Fleet Projects...\n');
  const results = await Promise.all(FLEET.map(pingUrl));

  console.table(results.map(r => ({
    'Project ID': r.id,
    'App Name': r.name,
    'HTTP Status': r.status,
    'Latency': `${r.latency} ms`,
    'Operational': r.alive ? '🟢 LIVE' : '🔴 DOWN'
  })));
  console.log('\n✅ Ping check complete.\n');
}

run();
