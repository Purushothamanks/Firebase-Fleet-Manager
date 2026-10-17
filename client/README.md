# Universal Client-Side Guard (`maintenance-guard.js`)

The **Universal Client Guard** is an ultra-lightweight (~1.8 KB), zero-dependency JavaScript snippet that can be dropped into any web application or static site.

---

## ⚡ Quick Start

Add the following `<script>` tag into the `<head>` of your application's `index.html` or main root template:

```html
<script 
  src="https://your-fleet-server.com/guard.js" 
  data-site-id="aio-universe" 
  data-check-interval="5000">
</script>
```

---

## ⚙️ Configuration Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-site-id` | `string` | *required* | The unique project identifier (e.g. `aio-universe`, `department-rpsit`, `mygovthub`). |
| `data-api-url` | `string` | Origin of the script | The base URL of your Fleet Sentinel server. Automatically inferred if hosted on the same origin. |
| `data-check-interval` | `number` | `5000` | Heartbeat check interval in milliseconds (default: 5 seconds). |
| `data-bypass-param` | `string` | `bypass` | URL query parameter name used to unlock the site for administrators. |

---

## 🔑 Administrator Bypass Modes

When a site is placed under maintenance, administrators can bypass the maintenance screen in two ways:

1. **URL Secret Parameter:**
   Append `?bypass=YOUR_SECRET_KEY` to the URL.
   ```
   https://aio-universe.web.app/?bypass=fleet-admin-secret-2026
   ```
   The guard securely stores the verified bypass token in `sessionStorage` so you can freely navigate between pages.

2. **On-Screen Unlock Dialog:**
   Click **"Administrator Unlock"** at the bottom of the maintenance card and enter your bypass passkey.

---

## 🛡️ Reliability & Fail-Open Design

- **Fail-Open Strategy:** If the Fleet Manager server is offline or unreachable due to network disruptions, the guard will **never** lock users out of the website.
- **Dynamic DOM Injection:** The maintenance screen is rendered as a top-level overlay without destroying existing DOM nodes. When maintenance is turned off from the dashboard, the overlay smoothly fades out and normal user interaction resumes immediately without page reload.
