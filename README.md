# Engr Mudi Website — Standalone Build

> **About the two repos:** this repo holds the editable **source code**.
> The live site (https://extraordinary-gingersnap-0db317.netlify.app)
> currently deploys from the built files in the `engr-mudi-website` repo.
> When the source changes, rebuild (`npm run build`) and publish the new
> build there — or point Netlify at this repo with build command
> `npm run build` and publish directory `dist` (plus the two env vars below).

A single app with two parts:

- **Public site** — the portfolio site: hero, stack, projects, coaching, books,
  hire/contact. Anyone can open it.
- **Admin panel** — go to `#/admin` on the live site (there is no public link
  to it, by design).
  Sign in and you can add, edit, update, delete, and reorder content in
  every section. Saves go to Supabase, and the public site reads from
  Supabase, so an admin save updates the public site over the internet.

Stack: React + Vite + Supabase (Postgres + Auth + Storage).
Hosting: Netlify free tier. Database: Supabase free tier. Cost: ₦0.

**No secrets live in this code.** The app connects with two environment
variables only: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
The anon key is safe to expose in a frontend build: Row Level Security
allows everyone to read, but only logged-in users can write.

## Project layout

```
website-standalone/
├── index.html                 # page shell
├── netlify.toml               # Netlify build settings + SPA redirect
├── package.json
├── public/
│   ├── _redirects             # SPA fallback for Netlify
│   └── assets/                # logo, training photos, project screenshots,
│                              # weighing "coming soon" placeholder
├── src/
│   ├── main.jsx               # entry
│   ├── App.jsx                # loads content, switches public/admin views
│   ├── PublicSite.jsx         # the public site
│   ├── AdminPanel.jsx         # login + editors for every section
│   ├── supabaseClient.js      # client from env vars (null when unset)
│   ├── seedData.js            # starter content shown before Supabase connects
│   └── styles.css
├── supabase/
│   ├── schema.sql             # tables + Row Level Security + Storage policies
│   └── seed.sql               # the exact starting content
└── README.md
```

## Deploy, step by step

### 1. Create a free Supabase project

1. Go to https://supabase.com and create a free account.
2. **New project** → pick any name (e.g. `engr-mudi-website`), a database
   password (save it somewhere safe — it is only for the database, not the site),
   and the closest region. Wait for the project to finish building.
3. Open **Project Settings → API** and copy two values:
   - **Project URL** → this becomes `VITE_SUPABASE_URL`
   - **anon public key** → this becomes `VITE_SUPABASE_ANON_KEY`
   - Never use the `service_role` key in this app.

### 2. Create the tables and seed content

1. In Supabase, open the **SQL Editor** → **New query**.
2. Paste the whole contents of `supabase/schema.sql` and click **Run**.
   (This also creates the public `site-images` Storage bucket and its policies.
   If the bucket part errors, create the bucket by hand instead: **Storage →
   New bucket**, name `site-images`, toggle it **public**, then re-run just the
   two `storage.objects` policy statements from schema.sql.)
3. Open a second new query, paste `supabase/seed.sql`, and click **Run**.
4. Check **Table Editor**: you should see the hero row, 15 stack items,
   3 projects, coaching text + 7 topics + 2 photos, 6 books, 1 service, 4 social links,
   and the hire text.

### 3. Create the admin user (only you can sign in)

1. In Supabase, open **Authentication → Users** → **Add user**.
2. Enter your email and a strong password. If there is an **Auto Confirm User**
   option, turn it on (otherwise the account needs an email confirmation click).
3. That email/password is the admin login. Nobody else can sign in unless
   you create an account for them.

### 4. Build the site

On your own computer, in this folder:

```bash
npm install
npm run build
```

This creates a `dist/` folder. (For local testing instead: create a `.env`
file with the two `VITE_` variables, then run `npm run dev`.)

### 5. Deploy free on Netlify

**Option A — drag and drop (fastest, no Git needed):**

1. Go to https://app.netlify.com/drop and drag the `dist/` folder onto it.
2. Open the new site → **Site configuration → Environment variables** →
   **Add a variable**, and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
3. **Deploys → Trigger deploy → Deploy site** again. (This step matters:
   the variables are baked in at build time, so the site must rebuild after
   you add them.)
4. Open the site URL. It should show your content from Supabase.

**Option B — from Git (auto-redeploy on every push):**

1. Push this folder to a GitHub/GitLab repo.
2. Netlify → **Add new site → Import an existing project** → pick the repo.
   Build command `npm run build`, publish directory `dist`.
3. Add the same two environment variables before the first deploy.

### 6. Verify it works end to end

1. Open the public site — hero, stack, projects, coaching, books, hire
   sections should all show.
2. Click **Manage** (top right) → sign in with the admin user from step 3.
3. Change something small (e.g. a book price), click **Save**, wait for
   **Saved ✓**, then open **View site** — the change should be live.
4. If the public site ever shows the amber "starter content" banner, the
   Supabase variables are missing or wrong — check step 5.

## Using the admin panel

- **Manage** (top right of the site) opens the panel. Sign in once per browser.
- Every section has its own editor: **Hero, Stack, Projects, Coaching,
  Books, Hire me services, Hire text, Contact links**.
- **Save** writes that item to Supabase. **↑ / ↓** reorders. **Delete**
  asks for confirmation first.
- **Images:** paste an image URL, or use the file picker to upload to the
  `site-images` Storage bucket — the uploaded URL fills in automatically.
  The Weighing Software card uses the built-in "COMING SOON" placeholder
  until a real screenshot is uploaded.
- To add a future book that is not a cheat sheet, use **+ Add book** —
  the section heading stays plain "Books", so any book fits.

## Connecting a custom domain later

1. Buy the domain from any registrar.
2. Netlify → your site → **Domain management → Add a domain** → enter it.
3. At the registrar, point the domain to Netlify using the DNS records
   Netlify shows you (an A record or a CNAME — Netlify tells you which).
4. Netlify issues HTTPS automatically. Nothing in the code changes.

## Troubleshooting

- **"Supabase is not connected yet" in the panel** — the two `VITE_`
  environment variables are missing on Netlify. Add them and redeploy.
- **Login fails** — the admin user was not created, or the email was not
  confirmed. Recreate it in Supabase Auth with auto-confirm on.
- **Edits save but the public site looks unchanged** — hard-refresh the
  public page, and confirm you are looking at the Netlify URL (not a
  preview of the old static site).
- **Image upload fails** — the `site-images` bucket or its policies are
  missing. Re-run the Storage section of `schema.sql`.
