# MiniParty — Split Hosting Deployment Guide

> Deploy the frontend and backend as **independent services** for maximum
> flexibility, free-tier eligibility, and zero-ops database management.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SPLIT HOSTING ARCHITECTURE                    │
│                                                                     │
│  ┌─────────────┐        ┌──────────────┐        ┌───────────────┐  │
│  │   Vercel     │  HTTP  │    Render     │  TCP   │    Turso      │  │
│  │  (Frontend)  │───────▶│  (Backend)    │───────▶│  (Database)   │  │
│  │             │        │              │        │               │  │
│  │  React+Vite  │        │  Go+Gin      │        │  libSQL       │  │
│  │  Static CDN  │        │  Docker      │        │  Edge SQLite  │  │
│  └─────────────┘        └──────────────┘        └───────────────┘  │
│                                                                     │
│  miniparty.vercel.app    miniparty-api.onrender.com    [region].turso.io │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Why Split Hosting?](#1-why-split-hosting)
2. [Turso Setup (Database)](#2-turso-setup-database)
3. [Go Code Changes (Backend)](#3-go-code-changes-backend)
4. [Backend Dockerization](#4-backend-dockerization)
5. [Render Setup (Backend Hosting)](#5-render-setup-backend-hosting)
6. [Vercel Setup (Frontend Hosting)](#6-vercel-setup-frontend-hosting)
7. [CI/CD Workflow (Selective Deploys)](#7-cicd-workflow-selective-deploys)
8. [Environment Variable Reference](#8-environment-variable-reference)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Why Split Hosting?

| Concern               | Monolith (single container)                 | Split Hosting (this guide)                           |
|------------------------|---------------------------------------------|------------------------------------------------------|
| **Frontend speed**     | Served by Go — no CDN                       | Vercel's global CDN — sub-50ms worldwide              |
| **Backend scaling**    | One container handles everything             | Backend scales independently                          |
| **Database**           | SQLite on disk — needs persistent volume     | Turso — managed, replicated, zero-ops                 |
| **Free tier**          | Hard to find free Docker hosts               | Vercel free + Render free + Turso free                |
| **Deploy coupling**    | CSS typo fix redeploys the entire backend    | Frontend and backend deploy independently             |
| **Cold starts**        | N/A (always running on VPS)                  | Render free tier sleeps after 15 min inactivity       |

### The SQLite Problem — Solved by Turso

Traditional SQLite is a **single file on disk**. This means:

- Serverless platforms (Lambda, Cloud Run) **destroy it** on every cold start.
- Container platforms without volumes **reset it** on every deploy.
- You can't run multiple replicas — they'd each have their own copy.

**Turso** solves this by hosting SQLite over the network via the **libSQL** protocol.
Your Go code connects to Turso the same way it would connect to PostgreSQL — via a
URL and auth token — but the underlying engine is SQLite. You get:

- Full SQLite compatibility (same SQL syntax, same types)
- Persistent data without managing volumes or backups
- Multi-region read replicas on the edge
- A generous free tier (9 GB storage, 500 databases)

---

## 2. Turso Setup (Database)

### 2.1 Install the Turso CLI

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Verify
turso --version
```

### 2.2 Sign Up and Authenticate

```bash
turso auth signup    # Opens browser — sign up with GitHub
# OR if you already have an account:
turso auth login
```

### 2.3 Create a Database

```bash
# Create the database (choose a region close to your Render backend)
turso db create miniparty --group default

# List databases to confirm
turso db list
```

Output:

```
Name        Region    URL
miniparty   iad       libsql://miniparty-yourname.turso.io
```

### 2.4 Get Your Credentials

You need two values — save them securely:

```bash
# 1. Database URL
turso db show miniparty --url
```

```
libsql://miniparty-yourname.turso.io
```

```bash
# 2. Auth Token
turso db tokens create miniparty
```

```
eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0...
```

### 2.5 Verify the Connection

```bash
# Open an interactive SQL shell to confirm everything works
turso db shell miniparty

# Inside the shell:
.tables
# (Should be empty — Go will create the bookings table on first run)
.quit
```

### 2.6 Credential Summary

| Variable              | Example Value                                | Where It's Used         |
|-----------------------|----------------------------------------------|-------------------------|
| `TURSO_DATABASE_URL`  | `libsql://miniparty-yourname.turso.io`       | Render env vars, `.env` |
| `TURSO_AUTH_TOKEN`    | `eyJhbGciOiJFZDI1NTE5...` (long JWT string) | Render env vars, `.env` |

> **Security:** Never commit these to Git. Add them to `.env` locally and to
> Render's environment variables in production.

---

## 3. Go Code Changes (Backend)

Three files need to change: the driver import, the connection logic, and the SQL
syntax. Below is a precise before/after for each file.

### 3.1 Update `go.mod` — Swap the Driver

Remove the PostgreSQL driver and add the libSQL driver:

```bash
cd backend

# Remove PostgreSQL driver
go get -u github.com/lib/pq@none

# Add the Turso / libSQL driver
go get github.com/tursodatabase/libsql-client-go/libsql
```

Your `go.mod` require block changes from:

```go
// BEFORE
require (
    github.com/gin-contrib/cors v1.7.2
    github.com/gin-gonic/gin v1.10.0
    github.com/lib/pq v1.11.2           // ← PostgreSQL
)
```

To:

```go
// AFTER
require (
    github.com/gin-contrib/cors v1.7.2
    github.com/gin-gonic/gin v1.10.0
    github.com/tursodatabase/libsql-client-go v0.0.0-20240902231107-85af5b9d094d  // ← Turso
)
```

Then tidy:

```bash
go mod tidy
```

### 3.2 Update `backend/db/database.go` — Connection Logic

Replace the entire file:

```go
package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

var DB *sql.DB

func Init() {
	dbURL := os.Getenv("TURSO_DATABASE_URL")
	authToken := os.Getenv("TURSO_AUTH_TOKEN")

	if dbURL == "" || authToken == "" {
		log.Fatal("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required")
	}

	// libSQL connection string format: url?authToken=xxx
	dsn := fmt.Sprintf("%s?authToken=%s", dbURL, authToken)

	var err error
	DB, err = sql.Open("libsql", dsn)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// SQLite-compatible CREATE TABLE (no SERIAL, uses INTEGER PRIMARY KEY)
	createTable := `
	CREATE TABLE IF NOT EXISTS bookings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT NOT NULL,
		phone TEXT NOT NULL,
		date TEXT NOT NULL,
		time TEXT NOT NULL,
		duration INTEGER NOT NULL DEFAULT 2,
		guests INTEGER NOT NULL
	);`

	if _, err = DB.Exec(createTable); err != nil {
		log.Fatal("Failed to create table:", err)
	}

	log.Println("Database initialized (Turso/libSQL)")
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
```

**What changed and why:**

| Change                          | PostgreSQL (before)                       | Turso/libSQL (after)                                 |
|---------------------------------|-------------------------------------------|------------------------------------------------------|
| Import                          | `_ "github.com/lib/pq"`                  | `_ "github.com/tursodatabase/libsql-client-go/libsql"` |
| Env vars                        | `DATABASE_URL`                            | `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`             |
| DSN format                      | `postgres://user:pass@host/db`            | `libsql://db-name.turso.io?authToken=xxx`             |
| Driver name in `sql.Open()`     | `"postgres"`                              | `"libsql"`                                            |
| Primary key                     | `id SERIAL PRIMARY KEY`                   | `id INTEGER PRIMARY KEY AUTOINCREMENT`                |

### 3.3 Update `backend/handlers/booking.go` — SQL Syntax

PostgreSQL uses `$1, $2, ...` placeholders and `RETURNING id`. SQLite uses `?`
placeholders and `LastInsertId()`.

Replace the `CreateBooking` function:

```go
func CreateBooking(c *gin.Context) {
	var booking models.Booking

	if err := c.ShouldBindJSON(&booking); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if errs := validateBooking(&booking); len(errs) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"errors": errs})
		return
	}

	// SQLite uses ? placeholders (not $1, $2, ...) and does not support RETURNING
	result, err := db.DB.Exec(
		"INSERT INTO bookings (name, email, phone, date, time, duration, guests) VALUES (?, ?, ?, ?, ?, ?, ?)",
		booking.Name, booking.Email, booking.Phone, booking.Date, booking.Time, booking.Duration, booking.Guests,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save booking"})
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve booking ID"})
		return
	}
	booking.ID = id

	c.JSON(http.StatusCreated, gin.H{
		"message": "Booking confirmed!",
		"booking": booking,
	})
}
```

**SQL syntax diff:**

```diff
- // PostgreSQL
- err := db.DB.QueryRow(
-     "INSERT INTO bookings (...) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
-     ...
- ).Scan(&booking.ID)

+ // SQLite (Turso)
+ result, err := db.DB.Exec(
+     "INSERT INTO bookings (...) VALUES (?, ?, ?, ?, ?, ?, ?)",
+     ...
+ )
+ id, _ := result.LastInsertId()
+ booking.ID = id
```

The `GetBookings` query in the same file **does not need changes** — `SELECT`
syntax is identical between PostgreSQL and SQLite.

### 3.4 Quick Validation — Does It Compile?

```bash
cd backend
go build ./...
# Should exit 0 with no errors
```

---

## 4. Backend Dockerization

### 4.1 Production Dockerfile (`backend/Dockerfile`)

Since the backend is now API-only (no frontend serving), this is a lean,
backend-only Docker image:

```dockerfile
# ── Stage 1: Build the Go binary ────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /src

# Install build dependencies (git is needed for some Go module fetches)
RUN apk add --no-cache gcc musl-dev git

# Cache module downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /bin/miniparty .

# ── Stage 2: Minimal runtime image ──────────────────────────────
FROM alpine:3.19

# ca-certificates needed for HTTPS calls to Turso
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /bin/miniparty .

# Render injects PORT automatically; default to 8080
ENV PORT=8080
EXPOSE 8080

# Health check for Render
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:${PORT}/book || exit 1

CMD ["./miniparty"]
```

**Design decisions:**

| Choice                          | Reason                                                         |
|---------------------------------|----------------------------------------------------------------|
| `CGO_ENABLED=0`                 | The `libsql-client-go` driver is pure Go — no CGO needed       |
| `-ldflags="-s -w"`              | Strips debug symbols — reduces binary from ~15 MB to ~10 MB    |
| `alpine:3.19` runtime           | ~7 MB base image; smallest viable option                       |
| `ca-certificates`               | Required for TLS connections to `*.turso.io`                   |
| No `VOLUME` or `dist` copy      | No local SQLite file; no frontend to serve                     |
| `HEALTHCHECK`                   | Render uses this to know when the container is ready            |

### 4.2 Backend `.dockerignore` (`backend/.dockerignore`)

```
miniparty
miniparty.db
*.db
.env
.git
README.md
```

### 4.3 Build and Test Locally

```bash
cd backend

# Build the image
docker build -t miniparty-api .

# Run it (supply Turso credentials)
docker run --rm -p 8080:8080 \
  -e TURSO_DATABASE_URL="libsql://miniparty-yourname.turso.io" \
  -e TURSO_AUTH_TOKEN="eyJhbGci..." \
  -e ADMIN_SECRET="test-secret-123" \
  -e CORS_ORIGIN="http://localhost:5173" \
  miniparty-api

# Test the API
curl -X POST http://localhost:8080/book \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"1234567890","date":"2026-03-15","time":"18:00","duration":3,"guests":25}'
```

Expected response:

```json
{
  "message": "Booking confirmed!",
  "booking": { "id": 1, "name": "Test", ... }
}
```

---

## 5. Render Setup (Backend Hosting)

### 5.1 Create a Web Service

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your **miniparty** repository.
4. Configure the service:

| Setting               | Value                                              |
|-----------------------|----------------------------------------------------|
| **Name**              | `miniparty-api`                                    |
| **Region**            | Same region as your Turso DB (e.g., `US East`)     |
| **Branch**            | `main`                                             |
| **Root Directory**    | `backend`                                          |
| **Runtime**           | `Docker`                                           |
| **Dockerfile Path**   | `./Dockerfile`                                     |
| **Instance Type**     | `Free` (or `Starter` for no sleep)                 |

### 5.2 Set Environment Variables

In the Render dashboard, go to **Environment** → **Add Environment Variable**:

| Key                   | Value                                              | Type     |
|-----------------------|----------------------------------------------------|----------|
| `TURSO_DATABASE_URL`  | `libsql://miniparty-yourname.turso.io`             | Secret   |
| `TURSO_AUTH_TOKEN`    | `eyJhbGciOiJFZDI1NTE5...`                         | Secret   |
| `ADMIN_SECRET`        | `your-strong-random-secret`                        | Secret   |
| `CORS_ORIGIN`         | `https://miniparty.vercel.app`                     | Variable |

> `PORT` is **automatically injected** by Render — do not set it manually.

### 5.3 Deploy

Click **Create Web Service**. Render will:

1. Clone your repo
2. Navigate to the `backend` root directory
3. Build the Docker image using `backend/Dockerfile`
4. Start the container

Your API will be live at:

```
https://miniparty-api.onrender.com
```

### 5.4 Handling Free Tier Sleep Mode

Render's free tier spins down your service after **15 minutes of inactivity**.
The first request after sleep takes **30–60 seconds** as the container cold-starts.

**Strategy 1: Show a loading state (recommended for MVP)**

The frontend should handle slow first responses gracefully:

```jsx
// In your fetch calls, set a generous timeout or show a
// "Waking up the server..." message if the request takes > 3 seconds.
```

**Strategy 2: Keep-alive with a cron ping**

Use a free service like [UptimeRobot](https://uptimerobot.com/) or
[cron-job.org](https://cron-job.org) to ping your API every 14 minutes:

```
Monitor URL:  https://miniparty-api.onrender.com/book
Method:       HEAD
Interval:     14 minutes
```

**Strategy 3: Upgrade to Starter ($7/mo)**

The Starter tier runs 24/7 with no sleep mode. This is the simplest fix for
production use.

| Tier    | Monthly Cost | Sleep Behavior                   | RAM   |
|---------|:------------:|----------------------------------|-------|
| Free    | $0           | Sleeps after 15 min inactivity   | 512 MB |
| Starter | $7           | Always on                        | 512 MB |
| Standard| $25          | Always on, auto-scale            | 2 GB   |

---

## 6. Vercel Setup (Frontend Hosting)

### 6.1 Update Frontend API Calls

The frontend currently uses relative paths (`/book`, `/bookings`), which only
work when the backend serves the frontend. For split hosting, all API calls must
point to the Render backend URL.

**Create `frontend/.env` for local development:**

```bash
VITE_API_URL=http://localhost:8080
```

**Create `frontend/.env.production` for production builds:**

```bash
VITE_API_URL=https://miniparty-api.onrender.com
```

**Update `frontend/src/pages/BookingForm.jsx`:**

Change the fetch URL from a relative path to use the env var:

```diff
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)

    try {
-     const res = await fetch('/book', {
+     const res = await fetch(`${import.meta.env.VITE_API_URL}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
```

**Update `frontend/src/pages/AdminDashboard.jsx`:**

```diff
  const fetchBookings = async (adminToken) => {
    setError('')
    setLoading(true)

    try {
-     const res = await fetch('/bookings', {
+     const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        headers: { 'X-Admin-Token': adminToken },
      })
```

> **Why `VITE_` prefix?** Vite only exposes environment variables to the
> client-side bundle if they start with `VITE_`. This is a security feature.

### 6.2 Deploy to Vercel

#### Option A — Vercel Dashboard (no CLI)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project**.
3. Import the **miniparty** repository.
4. Configure:

| Setting               | Value                                    |
|-----------------------|------------------------------------------|
| **Framework Preset**  | `Vite`  (auto-detected)                  |
| **Root Directory**    | `frontend`                               |
| **Build Command**     | `npm run build`                          |
| **Output Directory**  | `dist`                                   |
| **Install Command**   | `npm ci`                                 |

5. Add the environment variable:

| Key                   | Value                                    |
|-----------------------|------------------------------------------|
| `VITE_API_URL`        | `https://miniparty-api.onrender.com`     |

6. Click **Deploy**.

#### Option B — Vercel CLI

```bash
# Install
npm i -g vercel

# Deploy from the frontend directory
cd frontend
vercel

# Follow prompts:
#   Project name:      miniparty
#   Root directory:    ./  (you're already in frontend/)
#   Framework:         Vite
#   Build command:     npm run build
#   Output directory:  dist

# Set the environment variable for production
vercel env add VITE_API_URL production
# Paste: https://miniparty-api.onrender.com

# Deploy to production
vercel --prod
```

Your frontend will be live at:

```
https://miniparty.vercel.app
```

### 6.3 SPA Rewrites for React Router

Vercel needs to know that all routes should serve `index.html` (for React
Router). Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 6.4 Update CORS on the Backend

Make sure the `CORS_ORIGIN` environment variable on Render matches the Vercel
domain **exactly**:

```
CORS_ORIGIN=https://miniparty.vercel.app
```

If you add a custom domain later (e.g., `miniparty.com`), update this to match.

---

## 7. CI/CD Workflow (Selective Deploys)

### The Problem

In a monorepo, a change to `frontend/src/App.jsx` shouldn't rebuild and redeploy
the Go backend. Conversely, a change to `backend/handlers/booking.go` shouldn't
trigger a Vercel redeploy.

### The Solution: Path-Based Triggers

Both Vercel and Render support **auto-deploy on push** with path filtering. The
GitHub Actions workflow below adds a **test gate** that must pass before either
platform deploys.

### 7.1 GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI — Test & Gate Deploys

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ════════════════════════════════════════════════════════════════
  # Detect which parts of the codebase changed
  # ════════════════════════════════════════════════════════════════
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
            frontend:
              - 'frontend/**'

  # ════════════════════════════════════════════════════════════════
  # Test: Go Backend
  # ════════════════════════════════════════════════════════════════
  test-backend:
    name: Test — Go Backend
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.21"

      - name: Download dependencies
        working-directory: ./backend
        run: go mod download

      - name: Run tests
        working-directory: ./backend
        run: go test ./... -v -race

      - name: Verify build
        working-directory: ./backend
        run: go build -o /dev/null .

  # ════════════════════════════════════════════════════════════════
  # Test: React Frontend
  # ════════════════════════════════════════════════════════════════
  test-frontend:
    name: Test — React Frontend
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linter
        working-directory: ./frontend
        run: npm run lint

      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --passWithNoTests

      - name: Verify production build
        working-directory: ./frontend
        run: npm run build

  # ════════════════════════════════════════════════════════════════
  # Deploy: Trigger Render (Backend)
  # ════════════════════════════════════════════════════════════════
  deploy-backend:
    name: Deploy — Render Backend
    needs: [changes, test-backend]
    if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Render deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
        # Render Deploy Hook URL is found in:
        # Render Dashboard → miniparty-api → Settings → Deploy Hook

  # ════════════════════════════════════════════════════════════════
  # Deploy: Trigger Vercel (Frontend)
  # ════════════════════════════════════════════════════════════════
  deploy-frontend:
    name: Deploy — Vercel Frontend
    needs: [changes, test-frontend]
    if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Vercel deploy
        run: |
          curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
        # Vercel Deploy Hook URL is found in:
        # Vercel Dashboard → miniparty → Settings → Git → Deploy Hooks
```

### 7.2 How It Works — Decision Flow

```
Push to main
     │
     ▼
┌──────────────────┐
│  Detect Changes   │
│  (paths-filter)   │
└──┬───────────┬───┘
   │           │
   │ backend/  │ frontend/
   │ changed   │ changed
   ▼           ▼
┌────────┐  ┌──────────┐
│ Go     │  │ React    │
│ Tests  │  │ Tests +  │
│        │  │ Lint +   │
│        │  │ Build    │
└───┬────┘  └────┬─────┘
    │ ✓ pass     │ ✓ pass
    ▼            ▼
┌────────┐  ┌──────────┐
│ Trigger│  │ Trigger  │
│ Render │  │ Vercel   │
│ Deploy │  │ Deploy   │
│ Hook   │  │ Hook     │
└────────┘  └──────────┘
```

| File Changed                 | Backend Tests | Frontend Tests | Render Deploy | Vercel Deploy |
|------------------------------|:-------------:|:--------------:|:-------------:|:-------------:|
| `backend/handlers/booking.go`| Yes           | —              | Yes           | —             |
| `frontend/src/App.jsx`       | —             | Yes            | —             | Yes           |
| `README.md`                  | —             | —              | —             | —             |
| Both directories             | Yes           | Yes            | Yes           | Yes           |

### 7.3 Required GitHub Secrets

| Secret                | Where to Find It                                                 |
|-----------------------|------------------------------------------------------------------|
| `RENDER_DEPLOY_HOOK`  | Render → `miniparty-api` → Settings → Deploy Hook → Copy URL     |
| `VERCEL_DEPLOY_HOOK`  | Vercel → `miniparty` → Settings → Git → Deploy Hooks → Create    |

### 7.4 Alternative: Let Vercel & Render Auto-Deploy

If you prefer zero GitHub Actions config, both platforms can auto-deploy on push
to `main` natively:

**Render:**
- Dashboard → `miniparty-api` → Settings
- Set **Root Directory** to `backend`
- Enable **Auto-Deploy** → `Yes`
- Render will only rebuild when files under `backend/` change

**Vercel:**
- Dashboard → `miniparty` → Settings → General
- Set **Root Directory** to `frontend`
- Vercel's **Ignored Build Step** auto-detects that only `frontend/` changes
  matter

The GitHub Actions approach from 7.1 adds a **test gate** — deploys only happen
if tests pass. The native auto-deploy approach is simpler but skips testing.

---

## 8. Environment Variable Reference

### Backend (Render)

| Variable             | Example                                      | Required | Set By   |
|----------------------|----------------------------------------------|:--------:|----------|
| `PORT`               | `10000`                                      | —        | Render   |
| `TURSO_DATABASE_URL` | `libsql://miniparty-yourname.turso.io`       | Yes      | You      |
| `TURSO_AUTH_TOKEN`   | `eyJhbGciOiJFZDI1NTE5...`                   | Yes      | You      |
| `ADMIN_SECRET`       | `kJ9#mP2$vL5...`                             | Yes      | You      |
| `CORS_ORIGIN`        | `https://miniparty.vercel.app`               | Yes      | You      |

### Frontend (Vercel)

| Variable             | Example                                      | Required | Notes           |
|----------------------|----------------------------------------------|:--------:|-----------------|
| `VITE_API_URL`       | `https://miniparty-api.onrender.com`         | Yes      | Baked into JS bundle at build time |

### Local Development (`.env` in project root)

```bash
# Backend
TURSO_DATABASE_URL=libsql://miniparty-yourname.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZDI1NTE5...
ADMIN_SECRET=dev-secret-123
CORS_ORIGIN=http://localhost:5173

# Frontend (in frontend/.env)
VITE_API_URL=http://localhost:8080
```

---

## 9. Troubleshooting

### CORS Errors in the Browser Console

```
Access to fetch at 'https://miniparty-api.onrender.com/book' from origin
'https://miniparty.vercel.app' has been blocked by CORS policy
```

**Fix:** Ensure `CORS_ORIGIN` on Render matches your Vercel URL **exactly** —
including `https://` and no trailing slash.

```
✓  CORS_ORIGIN=https://miniparty.vercel.app
✗  CORS_ORIGIN=https://miniparty.vercel.app/    ← trailing slash breaks it
✗  CORS_ORIGIN=http://miniparty.vercel.app       ← wrong protocol
```

### Render: "Service is not available"

This is normal on the free tier. The first request after the 15-minute sleep
period takes 30–60 seconds. Solutions:

1. Wait and refresh.
2. Set up a keep-alive ping (see [Section 5.4](#54-handling-free-tier-sleep-mode)).
3. Upgrade to the Starter plan ($7/mo).

### Turso: "Authorization failed"

```
libsql: authorization failed
```

1. Verify the token hasn't expired: `turso db tokens create miniparty`
2. Check for copy-paste issues (whitespace, truncation).
3. Ensure the URL protocol is `libsql://`, not `https://`.

### Docker Build Fails: "go mod download" Errors

```
go: github.com/tursodatabase/libsql-client-go@v0.0.0: reading
https://proxy.golang.org/...: 410 Gone
```

**Fix:** Add `git` to the builder stage's `apk add`:

```dockerfile
RUN apk add --no-cache gcc musl-dev git
```

### Frontend Shows "Could not connect to server"

1. Check the browser's Network tab — is the request going to the right URL?
2. Verify `VITE_API_URL` is set in Vercel's environment variables.
3. Rebuild on Vercel (Vite env vars are baked in at build time — adding them
   after deployment requires a redeploy).

### Vercel: React Router Returns 404 on Refresh

Ensure `frontend/vercel.json` exists with the SPA rewrite rule:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Appendix: Complete File Map

After implementing this guide, your project tree looks like this:

```
miniparty/
├── .github/
│   └── workflows/
│       └── ci.yml                 ← CI/CD pipeline
├── backend/
│   ├── .dockerignore              ← Docker build exclusions
│   ├── Dockerfile                 ← Production Docker image
│   ├── db/
│   │   └── database.go            ← MODIFIED: Turso/libSQL connection
│   ├── handlers/
│   │   └── booking.go             ← MODIFIED: SQLite ? placeholders
│   ├── middleware/
│   │   └── auth.go                  (unchanged)
│   ├── models/
│   │   └── booking.go               (unchanged)
│   ├── main.go                      (unchanged)
│   ├── go.mod                     ← MODIFIED: libsql-client-go
│   └── go.sum                     ← MODIFIED: updated checksums
├── frontend/
│   ├── .env                       ← NEW: local VITE_API_URL
│   ├── .env.production            ← NEW: production VITE_API_URL
│   ├── vercel.json                ← NEW: SPA rewrite rules
│   ├── src/
│   │   └── pages/
│   │       ├── BookingForm.jsx    ← MODIFIED: uses VITE_API_URL
│   │       └── AdminDashboard.jsx ← MODIFIED: uses VITE_API_URL
│   ├── package.json                 (unchanged)
│   └── vite.config.js               (unchanged)
├── .env                           ← NEW: local backend env vars
├── .gitignore                     ← UPDATE: add .env files
├── Dockerfile                       (existing monolith — kept for reference)
├── DEPLOYMENT.md                    (VPS guide — kept for reference)
├── DEPLOYMENT-SPLIT.md              (this document)
└── README.md
```
