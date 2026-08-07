# SocialPulse

A social media analytics workspace built with Next.js 16, React 19, Tailwind v4 and Recharts.

Connect Instagram and Facebook through Meta's official login to track reach, engagement
and growth across channels, with AI-generated insights, forecasting and exportable reports.

**The app runs and deploys with zero configuration** — every external service is optional
and degrades to clearly-labelled sample data rather than an error screen.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Open <http://localhost:3000>. Click **Explore the live demo** on the login screen to get in
without configuring anything.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Framework detection picks up
   Next.js automatically; leave the build settings alone.
3. Add the environment variables you want (all optional — see the table below) under
   **Settings → Environment Variables**.
4. Deploy.

> Environment variables only take effect on the **next** deployment after you add them.
> Use **Deployments → ⋯ → Redeploy** after changing any of them.

### Environment variables

| Variable | Required | What it enables |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | The public origin, used to build the Meta OAuth redirect URI. e.g. `https://your-app.vercel.app` |
| `AUTH_SECRET` | Recommended | Signs session cookies and encrypts stored Meta tokens. Generate with `openssl rand -base64 32` |
| `META_APP_ID` | For IG/FB | Instagram + Facebook account connection |
| `META_APP_SECRET` | For IG/FB | Instagram + Facebook account connection |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Real user accounts and stored posts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Real user accounts and stored posts |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side admin access. **Never** prefix with `NEXT_PUBLIC_` |
| `GROQ_API_KEY` | Optional | The **Ask AI** page ([free key](https://console.groq.com/keys)) |
| `YOUTUBE_API_KEY` | Optional | YouTube channel statistics endpoint |
| `META_API_VERSION` | Optional | Pin the Graph API version. Defaults to `v23.0` |

Without `AUTH_SECRET`, sessions are signed with a publicly known development key. The
**System status** page will flag this. Set it before sharing a deployment.

---

## Connecting Instagram and Facebook

### Why there is no "enter your username and password" option

This comes up constantly, so to be explicit:

- **Meta publishes no API that accepts a username and password.** There is no endpoint to
  call. The only supported way in is OAuth.
- **Sending social credentials to a third-party app violates Meta's Platform Terms**, and
  can get both the user's account and your app permanently banned.
- **It would not work anyway.** Two-factor authentication, login checkpoints, new-device
  challenges and CAPTCHAs all break password-based automation within days.
- Libraries that scrape Instagram with a username and password exist, but they log in from
  your server's IP address, which Instagram treats as suspicious activity. Accounts using
  them get rate-limited, flagged, or disabled.

Instead, this app uses **Facebook Login** — the same "Continue with Facebook" flow you have
used on other sites. The user authenticates on Meta's own domain, approves a specific set
of read-only permissions, and your app receives a scoped token it can revoke at any time.
Your app never sees the password.

### Setting up your Meta app

1. Go to <https://developers.facebook.com/apps> → **Create App** → type **Business**.
2. Add the **Facebook Login** and **Instagram Graph API** products.
3. Under **Facebook Login → Settings**, set **Valid OAuth Redirect URIs** to exactly:
   ```
   https://your-app.vercel.app/api/auth/meta/callback
   ```
   Add `http://localhost:3000/api/auth/meta/callback` too if you want to test locally.
4. Copy the **App ID** and **App Secret** from **Settings → Basic** into `META_APP_ID` and
   `META_APP_SECRET`.
5. Redeploy, then open **/connections** and click **Continue with Facebook**.

### Permissions requested

| Scope | Why |
| --- | --- |
| `public_profile` | Basic identity |
| `pages_show_list` | List the Pages the user administers |
| `pages_read_engagement` | Read likes, comments and shares on Page posts |
| `read_insights` | Read reach and impressions |
| `instagram_basic` | Read the linked Instagram Business account and its media |
| `instagram_manage_insights` | Read Instagram reach and saves |

All are read-only. The app cannot post, delete, or send messages.

### Requirements for the end user

- An Instagram **Business** or **Creator** account (Settings → Account type). Personal
  accounts cannot expose insights through any API — this is a Meta restriction, not an app
  limitation.
- That account **linked to a Facebook Page** they administer.

### App Review

While your Meta app is in *Development* mode, only accounts listed under
**App Roles → Roles** can connect — which is fine for testing and for your own accounts.
To let the general public connect, submit the scopes above for **App Review**. Meta
requires a screencast of the flow, a privacy policy URL, and a data deletion callback.

---

## Supabase (optional)

The old project referenced in this repository no longer exists — its hostname does not
resolve. To use a database:

1. Create a free project at <https://supabase.com/dashboard>.
2. **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql), run it.
   It creates the `posts` and `insights` tables **with Row Level Security enabled**.
3. Copy **Project Settings → API → Project URL** and the **anon/publishable key** into
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Without these the app serves generated sample data and says so in the UI.

---

## Project structure

```
app/
  api/
    ai/                  Groq-backed assistant for the Ask AI page
    auth/login|logout|session   Cookie session endpoints
    auth/meta/start|callback    Facebook Login OAuth flow
    meta/accounts|media|disconnect  Graph API data
    status/              Live health checks for every dependency
    youtube/             Optional YouTube channel statistics
  dashboard  content  compare      Overview pages
  ai-insights  ask-ai  predictions Intelligence pages
  reports  connections  system-status
components/
  AppShell.tsx   Sidebar, top bar, mobile drawer
  ui.tsx         Card, Badge, StatTile, AnimatedNumber, EmptyState…
  charts.tsx     Themed Recharts tooltip and axis presets
lib/
  analytics.ts   Engagement maths — the single source of truth
  meta.ts        Graph API client
  crypto.ts      Web Crypto signing and AES-GCM encryption
  session.ts     Signed cookie sessions
  data.ts        Live → Supabase → sample-data resolution
  demo-data.ts   Deterministic, seeded sample dataset
proxy.ts         Route protection (Next 16's middleware convention)
supabase/schema.sql
```

---

## How engagement is calculated

```
weighted engagement = likes x 1 + comments x 2 + shares x 3
engagement rate     = weighted engagement / reach x 100
```

Interactions are weighted because they differ in cost to the viewer: a like is one tap, a
comment takes thought, and a share puts the viewer's own reputation behind the post.

The 0–100 health score maps that rate through a saturating curve
(`100 × (1 − e^(−rate/4.5))`) so a single viral post cannot peg the gauge permanently.
Scores above 60 correspond to a rate industry benchmarks call strong.

This logic lives in exactly one place, [`lib/analytics.ts`](lib/analytics.ts).

---

## Security notes

- Routes are protected in [`proxy.ts`](proxy.ts) with an HMAC-signed, httpOnly cookie.
  Unauthenticated requests never receive protected pages.
- Meta access tokens are encrypted with AES-GCM before being stored in a cookie.
- The Supabase service role key is read only in server code and never sent to the browser.
- `.env*` is gitignored. If a key has ever been committed or shared, rotate it — for
  Supabase that means **Settings → API → rotate**, and for Meta **Settings → Basic → reset
  app secret**.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
