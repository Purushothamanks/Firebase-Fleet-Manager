// React / Vite Integration Example (e.g. index.html or App.jsx)

// Option A: In index.html (Recommended)
// Add the <script src="https://your-fleet-server.com/guard.js" data-site-id="task-teamtracker"></script> in index.html

// Option B: React Component Hook (if dynamic loading is preferred)
import { useEffect } from 'react';

export function useFleetGuard(siteId = 'task-teamtracker', apiUrl = 'http://localhost:4000') {
  useEffect(() => {
    if (document.getElementById('fleet-guard-script')) return;

    const script = document.createElement('script');
    script.id = 'fleet-guard-script';
    script.src = `${apiUrl}/guard.js`;
    script.setAttribute('data-site-id', siteId);
    script.setAttribute('data-api-url', apiUrl);
    script.setAttribute('data-check-interval', '5000');
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('fleet-guard-script');
      if (existing) existing.remove();
    };
  }, [siteId, apiUrl]);
}
