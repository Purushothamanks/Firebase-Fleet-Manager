# Firebase Fleet Manager — Run & Architecture Guide

## 🌐 Active Live URLs & Deployment
- **24/7 Serverless Dashboard**: [https://purushothamanks.github.io/Firebase-Fleet-Manager/](https://purushothamanks.github.io/Firebase-Fleet-Manager/)
- **Permanent Client Guard CDN**: [https://purushothamanks.github.io/Firebase-Fleet-Manager/guard.js](https://purushothamanks.github.io/Firebase-Fleet-Manager/guard.js)
- **GitHub Repository**: [https://github.com/Purushothamanks/Firebase-Fleet-Manager](https://github.com/Purushothamanks/Firebase-Fleet-Manager)
- **Local Application URL (Optional)**: [http://localhost:4000](http://localhost:4000)
- **Local Project Directory**: `/home/purushothaman/Videos/Projects/Firebase-Fleet-Manager`

---

## ⚡ Overview & Purpose
**Firebase Fleet Manager** is a centralized 24/7 mission control platform that monitors and instantly toggles **Maintenance Mode** across all 8 live Firebase web applications.

Unlike traditional CLI deployments (`firebase deploy`) that take 30–60 seconds, this system uses the **Real-Time Cloud Guard** pattern:
- **Instant Response**: Under 50 milliseconds.
- **24/7 Serverless**: Runs directly on GitHub Pages and Supabase Cloud.
- **Zero Sleep / Cold-Starts**: Never goes to sleep or requires credit card renewals.
- **Admin Bypass**: Add `?bypass=fleet-admin-secret-2026` to any live URL to view the live site while users see maintenance.

---

## 📋 Monitored Firebase Fleet Registry (8 Projects)

| # | Project ID | App Name | Local Directory | Live Production URL | Guard Injected? |
|:---:|---|---|---|---|:---:|
| 1 | `aio-universe` | AIO Platform | `Videos/Projects/AIO/Project_file` | https://aio-universe.web.app | ✅ Yes |
| 2 | `department-rpsit` | RPSIT Department Portal | `Videos/Projects/DEPT/Project_file` | https://department-rpsit.web.app | ✅ Yes |
| 3 | `ecofinancies` | FinancePro | `Videos/Projects/ECO-FINANCE/Project_file` | https://ecofinancies.web.app | ✅ Yes |
| 4 | `easy-kart-d6d3a` | Easy Kart | `Videos/Projects/EK/Project_file` | https://easy-kart-d6d3a.web.app | ✅ Yes |
| 5 | `lafsai` | LAF AI Platform | `Videos/Projects/LAF-Rebuild` | https://lafsai.web.app | ✅ Deployed Live |
| 6 | `task-teamtracker` | Team Task Tracker | `Videos/Projects/team-task-tracker` | https://task-teamtracker.web.app | ✅ Yes |
| 7 | `webmarketz` | Web Market | `Videos/Projects/web-market` | https://webmarketz.web.app | ✅ Yes |
| 8 | `mygovthub` | InfraPulse AI | `Videos/Projects/infrapulse-ai` | https://mygovthub.web.app | ✅ Deployed Live |

---

## 🔌 Universal Client Guard Tag
Each of the 8 projects includes this script in its `<head>` tag:
```html
<!-- Firebase Fleet Cloud Guard (24/7 Serverless) -->
<script 
  src="https://purushothamanks.github.io/Firebase-Fleet-Manager/guard.js" 
  data-site-id="aio-universe" 
  data-check-interval="3000">
</script>
```

---

## 🗄️ Supabase Cloud State Table
- **Project**: `mpymsolehyodfyamnpqn.supabase.co`
- **Table**: `public.site_maintenance`
- **Permissions**: Public SELECT and UPDATE enabled via RLS.
- **Realtime**: Replicated via Supabase Realtime publication.

---

## 💻 Optional: Local Run Instructions
If you prefer running a local server on port 4000:
1. Open terminal and navigate to:
   ```bash
   cd /home/purushothaman/Videos/Projects/Firebase-Fleet-Manager
   ```
2. Start server:
   ```bash
   npm start
   ```
3. Open `http://localhost:4000` in your browser.
