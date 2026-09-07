# Deploying Korean Hive to cPanel

## This deployment, concretely

| | |
|---|---|
| cPanel user | `auroravi` |
| Application root | `/home/auroravi/koreanhive` |
| Node.js | 22.23.2, Application mode **Production** |
| Startup file | `server.js` |
| URL | `https://cosmicworld.koreanhive.com` |
| Repository | `github.com/Webasif1/koreanhive-ecommerce`, branch `main` |
| Virtualenv (if you ever get SSH) | `source /home/auroravi/nodevenv/koreanhive/22/bin/activate && cd /home/auroravi/koreanhive` |

## Read this first

This application is **not** a static site. It uses Server Components, Server
Actions, cookie-backed carts, ISR and a database. There is no "upload HTML to
`public_html`" path — it needs a live Node.js process.

That makes shared cPanel a demanding target. Three things have to be true. The first is already confirmed; the other two
you still need to check, and **if either is false the app cannot run there.**

---

## Pre-flight: three checks, in this order

### 1. Node.js version — ✅ PASSED

Next.js 16 requires **Node 20.9 or newer**.

Your panel offers **22.22.3 (recommended)**, which is the current LTS. Select
it. (The version the form defaults to on first load was 10.24.1 — Node 10 has
been end-of-life since April 2021 and the app will not start on it. Make sure
22.22.3 is the one selected before you click Create.)

### 2. Outbound access to MongoDB Atlas

The app connects to Atlas on **port 27017** (or 27015–27017 for SRV). A great
many shared hosts block all outbound TCP except 80/443.

Ask support: *"Does my account allow outbound TCP connections to external
hosts on port 27017? I need to reach MongoDB Atlas."*

If the answer is no, the app cannot reach its database, and nothing else in
this guide matters.

Also add the server's outbound IP to your **Atlas Network Access** allowlist.
cPanel shows it under *Server Information → Shared IP Address*, but the
outbound address can differ — ask support to confirm.

### 3. Memory (and one change that helps)

`next build` needs 1–2 GB. Most shared plans cap a process well below that.

**We work around this: the build never runs on the server.** GitHub Actions
builds it and you deploy the finished output. But the *running* app still needs
roughly 200–400 MB resident. If your plan caps at 256 MB, expect restarts under
load.

To reduce that, `next/image` no longer optimizes anything on the server. It
used to resize and re-encode every image in-process with **`sharp`**, a native
binary — the most common native-dependency failure on shared hosting, and CPU
and memory hungry on exactly the resource your plan caps. Every product image
already lives on ImageKit, which is a transformation CDN, so
`src/lib/image-loader.ts` hands the resizing to it.

Verified against the running app: images load from
`ik.imagekit.io/...?tr=w-828,q-80,c-at_max`, nothing goes through
`/_next/image`, and the local logo is passed through untouched. To revert,
delete the `loader` and `loaderFile` lines in `next.config.ts`.

---

## If all three pass: the setup

### Step 1 — Create the application

In **cPanel → Node.js → Create Application**:

| Field | Value |
|---|---|
| Node.js version | **22.22.3** |
| Application mode | **Production** — the screenshot showed Development; change it |
| Application root | `koreanhive` (a folder in your home directory, *not* inside `public_html`) |
| Application URL | `cosmicworld.koreanhive.com`, or whichever domain you are launching on |
| Application startup file | `server.js` |

Then **Add Variable** for each of these:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string |
| `AUTH_SECRET` | A long random string (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `SHEET_CSV_URL` | Your Google Sheet link |
| `TRUSTED_PROXY_HOPS` | `1` — cPanel puts Apache in front of the app. **Not optional**; see the QA report §4 |
| `NODE_ENV` | `production` |

`NEXT_PUBLIC_SITE_URL` is inlined into the client bundle **at build time**, so
it must also be set in CI (as a repository *variable*, not a secret). Setting it
only here is not enough.

### Step 2 — Point CI at the server

In your GitHub repository, **Settings → Secrets and variables → Actions**:

**Secrets**

| Name | Value |
|---|---|
| `MONGODB_URI` | Atlas connection string (the build prerenders six routes that query it) |
| `AUTH_SECRET` | Same value as on the server |
| `FTP_SERVER` | e.g. `ftp.yourdomain.com` |
| `FTP_USERNAME` | An FTP account scoped to the app directory |
| `FTP_PASSWORD` | That account's password |

**Variables**

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `CPANEL_APP_PATH` | `/` if you create a dedicated FTP account rooted at `/home/auroravi/koreanhive` (recommended), or `/koreanhive/` if you use the main cPanel FTP login, whose home is `/home/auroravi` |

Atlas must accept connections from GitHub's runners, whose IPs are dynamic. The
usual answer is to allow `0.0.0.0/0` in Network Access and rely on the
credentials and TLS, which are the real control. If that is not acceptable, run
the build locally and upload by hand instead.

### Step 2b — Two cPanel footguns, before the first deploy

**Do not click "Run NPM Install".** Ever. The whole design here is that the
`node_modules` Next traced into the standalone output arrives by FTP,
pre-built and correct. Running NPM Install on the server will try to install
511 MB of dependencies with the memory of a shared plan, and will replace what
you deployed.

**Check for a `node_modules` symlink.** When cPanel creates a Node application
it often puts a `node_modules` symlink in the application root pointing into
its own virtual environment. If that symlink is there, the deploy writes into
the venv instead of the app. In **File Manager**, enable *Show Hidden Files*,
open the application root, and if `node_modules` shows as a symlink, delete it
before the first deploy. The upload creates a real directory in its place.

### Step 2c — If the site returns 503 after a successful deploy

Apache's 503 page means Passenger could not start the Node process. The reason
is always in `stderr.log` in the application root — open it in File Manager
(*Show Hidden Files* on) and read the last lines.

Two causes have actually happened here:

**`Could not find a production build in the './.next' directory`.** The `.next`
folder never reached the server. `actions/upload-artifact` has excluded every
path beginning with a dot since v4.4, silently, so the artifact contained
`server.js`, `package.json`, `public/` and `node_modules/` but none of the
build output. The workflow now passes `include-hidden-files: true` and verifies
`.next/BUILD_ID`, `.next/server` and `.next/static` on both sides of the
artifact round-trip, so a package that cannot boot fails in CI instead.

**Auth.js or Mongoose throwing on import.** The environment variables are not
set on the server. cPanel → Node.js → your app → *Environment variables* has to
list `MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL` and
`TRUSTED_PROXY_HOPS`; `NODE_ENV` comes from the Application mode dropdown.
Paste values without surrounding quotes — the field is stored literally, and a
quoted connection string fails to parse.

### Step 3 — Restarting after a deploy

With no SSH, the restart happens by touching a file. Passenger watches
`tmp/restart.txt` inside the application root and restarts on any change to it.
The deploy workflow writes it on every run.

If a deploy ever seems not to take effect, **cPanel → Node.js → your app →
Restart** does the same thing by hand.

---

## Two operational notes

**Passenger may run more than one process.** The rate limiters hold their
counters in process memory, so with N processes each caller effectively gets N
times the budget. That is documented in `docs/PROJECT.md`, and it is a reason
to keep the application to a single process on this host if the panel lets you
choose. Move to a shared store (Redis) before scaling out.

**ISR needs a writable `.next/cache`.** Next writes revalidated pages there at
runtime. Passenger runs as your cPanel user, so it has permission — but if you
ever see stale pages that never refresh, that directory is the first thing to
check.

## Why the build happens in CI, not on the server

Three reasons, any one of which is sufficient:

1. Shared hosting rarely has the memory for `next build`.
2. Without SSH there is no reliable way to run a long build at all.
3. `next build` needs the database, and the server may not be able to reach it.

The `output: "standalone"` setting in `next.config.ts` is what makes this work:
the build emits `server.js` plus only the `node_modules` Next actually traced as
reachable — a fraction of the 511 MB in the full install — so **no `npm install`
ever has to run on the server.**

---

## The honest assessment

This will work if the three pre-flight checks pass. But for a shop taking real
cash-on-delivery orders, shared cPanel is a fragile home for a Node
application: no root, a Node version you do not control, memory limits you
cannot raise, and a restart mechanism that is a file touch.

Worth weighing before you commit:

| Option | Cost | Fit |
|---|---|---|
| **Shared cPanel** | Already paid | Node 22 confirmed available. Workable if the remaining two checks pass. |
| **VPS with cPanel/WHM** | ~$15–25/mo | Root access, a Node version you choose, and a real process manager instead of a file touch. Keeps cPanel for email and DNS. |
| **Plain VPS** (Hetzner, DigitalOcean, Contabo) | ~$5–7/mo | Cheapest solid option. Node plus a process manager such as pm2 or a systemd unit; the same CI pipeline deploys over SSH instead of FTPS. |
| **Vercel** | Free tier, then $20/mo | The native target for Next.js. Zero configuration, global CDN, automatic ISR. |

A common middle path: keep cPanel for the domain, email and DNS, and point an
`A` record at a cheap VPS running the app. You lose nothing you are using
cPanel for today.
