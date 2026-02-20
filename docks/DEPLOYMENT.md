# MiniParty — Deployment & CI/CD Guide

> A production deployment playbook for the MiniParty party-booking application
> (React + Vite frontend, Go + Gin backend, SQLite database).

---

## Table of Contents

1. [Project Context Recap](#1-project-context-recap)
2. [Hosting Strategy — The "Where"](#2-hosting-strategy--the-where)
3. [Implementation Tasks — The "How"](#3-implementation-tasks--the-how)
4. [CI/CD Pipeline — The "Automation"](#4-cicd-pipeline--the-automation)
5. [Post-Deployment Checklist](#5-post-deployment-checklist)

---

## 1. Project Context Recap

| Layer      | Technology              | Notes                                          |
|------------|-------------------------|-------------------------------------------------|
| Frontend   | React 19, Vite 7, Tailwind CSS 4 | SPA with React Router; built to static files |
| Backend    | Go 1.21, Gin framework  | Serves the API **and** the built frontend        |
| Database   | SQLite (file: `miniparty.db`) | Single-file, zero-config, embedded database  |
| Auth       | Header-based admin token | `X-Admin-Token` checked against `ADMIN_SECRET`   |
| Container  | Multi-stage Dockerfile  | Produces a single ~25 MB Alpine image            |

### Architecture at a Glance

```
┌──────────────────────────────────────────────────┐
│  Client (Browser)                                │
└──────────────┬───────────────────────────────────┘
               │ HTTPS
┌──────────────▼───────────────────────────────────┐
│  Nginx (Reverse Proxy + SSL Termination)         │
└──────────────┬───────────────────────────────────┘
               │ HTTP :8080
┌──────────────▼───────────────────────────────────┐
│  Go Backend (Gin)                                │
│  ├── POST /book          → Create booking        │
│  ├── GET  /bookings      → List bookings (admin) │
│  └── /*   (NoRoute)      → Serve React SPA       │
└──────────────┬───────────────────────────────────┘
               │ File I/O
┌──────────────▼───────────────────────────────────┐
│  SQLite — /data/miniparty.db                     │
│  (Mounted volume for persistence)                │
└──────────────────────────────────────────────────┘
```

---

## 2. Hosting Strategy — The "Where"

### 2.1 Why SQLite Needs Persistent Storage

SQLite stores all data in a **single file on disk** (`miniparty.db`). This is what makes it simple and fast — no separate database server to manage. However, it imposes one hard constraint:

> **The file system where `miniparty.db` lives must be persistent and writable.**

This rules out several common deployment patterns:

| Deployment Model       | Works with SQLite? | Why / Why Not                                                                                      |
|------------------------|:------------------:|-----------------------------------------------------------------------------------------------------|
| **VPS (DigitalOcean, Hetzner, Linode)** | Yes | Full control over the file system. Mount a volume and you're done.                     |
| **PaaS with volumes (Railway, Render)** | Yes | These platforms support persistent disks that survive redeploys.                         |
| **Serverless functions (AWS Lambda, Vercel Functions)** | **No** | Ephemeral file systems — the DB file is destroyed after every invocation. Data loss is guaranteed. |
| **Container-as-a-Service without volumes (Cloud Run, App Runner)** | **No** | Containers are stateless by default. Without a mounted volume, the DB resets on every deploy.       |
| **Static hosting (Netlify, Vercel, GitHub Pages)** | **No** | These host static files only — there's no server process to run Go or write to a database.          |

**Key takeaway:** Always mount `miniparty.db` onto a **persistent volume** that is independent of the container lifecycle.

### 2.2 Recommended Hosting Options

#### Option A — VPS (Recommended for Full Control)

Best for: Production workloads, custom networking, lowest cost at scale.

| Provider                    | Starter Plan     | Persistent Storage         |
|-----------------------------|------------------|----------------------------|
| [DigitalOcean](https://www.digitalocean.com/) | $6/mo (1 vCPU, 1 GB RAM) | Block Storage Volumes |
| [Hetzner](https://www.hetzner.com/)           | €4.51/mo (2 vCPU, 2 GB RAM) | Volumes (SSD) |
| [Linode (Akamai)](https://www.linode.com/)     | $5/mo (1 vCPU, 1 GB RAM) | Block Storage Volumes |

**Stack on a VPS:**
- **Docker** + **Docker Compose** — containerized app deployment
- **Nginx** — reverse proxy, SSL termination, static asset caching
- **Certbot** (Let's Encrypt) — free, auto-renewing HTTPS certificates
- **SSH** — secure access for deployments

#### Option B — PaaS with Persistent Disk

Best for: Simpler setup, less infrastructure management, small-to-medium traffic.

| Platform                     | Persistent Disk Support | Notes                                                 |
|------------------------------|:-----------------------:|-------------------------------------------------------|
| [Railway](https://railway.app/) | Yes (Volumes)        | Mount a volume at `/data`. Automatic deploys from Git. |
| [Render](https://render.com/)   | Yes (Disks)          | Attach a persistent disk to a Web Service.             |
| [Fly.io](https://fly.io/)       | Yes (Volumes)        | `fly volumes create` + mount in `fly.toml`.            |

### 2.3 Tool Summary

| Tool           | Purpose                                       | Required? |
|----------------|-----------------------------------------------|:---------:|
| Docker         | Containerize the app into a reproducible image | Yes       |
| Docker Compose | Orchestrate multi-container setups locally and on the server | Yes |
| Nginx          | Reverse proxy, SSL termination, static caching | Yes (VPS) |
| Certbot        | Free SSL certificates from Let's Encrypt       | Yes (VPS) |
| GitHub Actions | CI/CD pipeline for automated testing and deployment | Recommended |
| `gh` CLI       | Manage GitHub Container Registry images         | Optional  |

---

## 3. Implementation Tasks — The "How"

### Checklist for Success

- [ ] **Task 1:** Containerize the application (Dockerfiles + Compose)
- [ ] **Task 2:** Configure environment variables
- [ ] **Task 3:** Set up a domain and SSL with Certbot
- [ ] **Task 4:** Set up the CI/CD pipeline

---

### Task 1: Containerization

#### 1a. Backend Dockerfile (`backend/Dockerfile`)

This builds the Go binary in a multi-stage process — the final image is ~25 MB.

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o /bin/miniparty .

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache ca-certificates sqlite-libs

WORKDIR /app
COPY --from=builder /bin/miniparty .

# The React build will be mounted or copied at /app/dist
# The SQLite database lives on a mounted volume at /data
ENV PORT=8080
ENV DIST_PATH=/app/dist
ENV DB_PATH=/data/miniparty.db

EXPOSE 8080

VOLUME ["/data"]

CMD ["./miniparty"]
```

> **Note:** `CGO_ENABLED=1` is required for SQLite (the `mattn/go-sqlite3` driver uses CGO). This differs from a pure-Go PostgreSQL driver.

#### 1b. Frontend Dockerfile (`frontend/Dockerfile`)

Builds the React app and serves it with Nginx for high-performance static file delivery.

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────
FROM nginx:1.25-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/miniparty.conf

# Copy the built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 1c. Frontend Nginx Config (`frontend/nginx.conf`)

This config handles SPA routing — all unknown paths fall back to `index.html` so React Router works correctly.

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Serve static assets directly with long cache headers
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback: serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 1d. Docker Compose (`docker-compose.yml`)

This is the single file that ties everything together. Place it in the project root.

```yaml
services:
  # ── Go API + SQLite ───────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: miniparty-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DB_PATH=/data/miniparty.db
      - ADMIN_SECRET=${ADMIN_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost}
    volumes:
      - miniparty-data:/data
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/bookings"]
      interval: 30s
      timeout: 5s
      retries: 3

  # ── React Frontend (Nginx) ───────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: miniparty-web
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

  # ── Nginx Reverse Proxy (Production) ─────────────────────────
  nginx:
    image: nginx:1.25-alpine
    container_name: miniparty-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/certbot/conf:/etc/letsencrypt:ro
      - ./nginx/certbot/www:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend

  # ── Certbot (SSL certificate renewal) ────────────────────────
  certbot:
    image: certbot/certbot
    container_name: miniparty-certbot
    volumes:
      - ./nginx/certbot/conf:/etc/letsencrypt
      - ./nginx/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

# ── Persistent Volume for SQLite ────────────────────────────────
volumes:
  miniparty-data:
    driver: local
```

> **Critical:** The `miniparty-data` named volume persists the SQLite database file across container restarts, redeployments, and image updates. **Never use a bind mount to a temporary directory.**

#### 1e. Production Nginx Config (`nginx/nginx.conf`)

This reverse proxy sits in front of both services, handles SSL, and routes traffic.

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Certbot challenge route (required for certificate renewal)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API routes → Go backend
    location /book {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /bookings {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Everything else → React frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### File Tree After Containerization

```
miniparty/
├── backend/
│   ├── Dockerfile           ← NEW
│   ├── main.go
│   ├── db/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── Dockerfile           ← NEW
│   ├── nginx.conf           ← NEW
│   ├── package.json
│   ├── src/
│   └── vite.config.js
├── nginx/
│   └── nginx.conf           ← NEW (reverse proxy config)
├── docker-compose.yml       ← NEW
├── .env                     ← NEW (not committed to Git)
├── .dockerignore
├── Dockerfile               (existing single-container build)
└── README.md
```

---

### Task 2: Environment Variables

#### Required `.env` File (Project Root)

Create a `.env` file in the project root. **Never commit this to Git.**

```bash
# ── Server ──────────────────────────────────────────────────────
PORT=8080

# ── Database ────────────────────────────────────────────────────
DB_PATH=/data/miniparty.db

# ── Security ────────────────────────────────────────────────────
ADMIN_SECRET=change-me-to-a-strong-random-string

# ── CORS ────────────────────────────────────────────────────────
CORS_ORIGIN=https://yourdomain.com

# ── Docker Image Tags (used by CI/CD) ──────────────────────────
DOCKER_REGISTRY=ghcr.io/your-username
IMAGE_TAG=latest
```

#### Environment Variable Reference

| Variable         | Default                 | Required | Description                                                    |
|------------------|-------------------------|:--------:|----------------------------------------------------------------|
| `PORT`           | `8080`                  | No       | Port the Go server listens on inside the container             |
| `DB_PATH`        | `./miniparty.db`        | Yes      | Absolute path to the SQLite database file                      |
| `ADMIN_SECRET`   | *(none)*                | Yes      | Secret token for the `X-Admin-Token` admin authentication      |
| `CORS_ORIGIN`    | `http://localhost:5173` | Yes      | Allowed origin for CORS (set to your production domain)        |
| `DIST_PATH`      | `./dist`                | No       | Path to the React build output (used in single-container mode) |
| `DOCKER_REGISTRY`| *(none)*                | CI only  | Container registry prefix (e.g., `ghcr.io/your-username`)     |
| `IMAGE_TAG`      | `latest`                | CI only  | Docker image tag for versioning                                |

#### Security Checklist

- [ ] `ADMIN_SECRET` is at least 32 characters, randomly generated
- [ ] `.env` is listed in `.gitignore`
- [ ] Production secrets are stored in GitHub Actions Secrets, **not** in code
- [ ] `CORS_ORIGIN` is set to the exact production domain (no wildcards)

---

### Task 3: Domain & SSL Setup

#### Step 1 — Register a Domain

Purchase a domain from any registrar (Namecheap, Cloudflare, Google Domains, etc.).

#### Step 2 — Point DNS to Your Server

Add an **A record** in your DNS settings:

| Type | Name | Value            | TTL  |
|------|------|------------------|------|
| A    | `@`  | `YOUR_SERVER_IP` | 300  |
| A    | `www`| `YOUR_SERVER_IP` | 300  |

Wait for DNS propagation (usually 5–30 minutes, can take up to 48 hours).

#### Step 3 — Obtain SSL Certificates with Certbot

**First-time setup** (before Nginx has SSL certs):

1. Temporarily comment out the HTTPS `server` block in `nginx/nginx.conf`.
2. Start the stack:

```bash
docker compose up -d nginx
```

3. Run Certbot to obtain the initial certificate:

```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email you@example.com \
  --agree-tos \
  --no-eff-email
```

4. Uncomment the HTTPS server block in `nginx/nginx.conf`, replacing `yourdomain.com` with your actual domain.

5. Restart Nginx:

```bash
docker compose restart nginx
```

#### Step 4 — Automatic Renewal

The `certbot` service in `docker-compose.yml` automatically attempts renewal every 12 hours. Certificates from Let's Encrypt are valid for 90 days, and Certbot renews them when they're within 30 days of expiry.

To manually test renewal:

```bash
docker compose run --rm certbot renew --dry-run
```

---

## 4. CI/CD Pipeline — The "Automation"

### Pipeline Overview

```
push to main
     │
     ▼
┌─────────────────┐     ┌─────────────────┐
│   Test Stage     │────▶│   Build Stage    │
│                  │     │                  │
│ • go test ./...  │     │ • docker build   │
│ • npm test       │     │   (backend)      │
│ • npm run lint   │     │ • docker build   │
│                  │     │   (frontend)     │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Push Stage     │
                        │                  │
                        │ • Push images to │
                        │   GHCR / Docker  │
                        │   Hub            │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Deploy Stage    │
                        │                  │
                        │ • SSH into VPS   │
                        │ • docker compose │
                        │   pull && up -d  │
                        └─────────────────┘
```

### GitHub Actions Workflow

Create the file `.github/workflows/main.yml`:

```yaml
name: CI/CD — Test, Build, Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE: ghcr.io/${{ github.repository }}/backend
  FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/frontend

jobs:
  # ════════════════════════════════════════════════════════════════
  # Stage 1: Test
  # ════════════════════════════════════════════════════════════════
  test-backend:
    name: Test — Go Backend
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
        run: go test ./... -v -race -coverprofile=coverage.out

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage.out

  test-frontend:
    name: Test — React Frontend
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

      - name: Build (verify production build succeeds)
        working-directory: ./frontend
        run: npm run build

  # ════════════════════════════════════════════════════════════════
  # Stage 2: Build & Push Docker Images
  # ════════════════════════════════════════════════════════════════
  build-and-push:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Extract metadata (tags, labels)
        id: meta
        run: |
          SHA_SHORT=$(echo "${{ github.sha }}" | cut -c1-7)
          echo "sha_short=$SHA_SHORT" >> "$GITHUB_OUTPUT"

      # ── Build & push backend image ───────────────────────────
      - name: Build & push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: |
            ${{ env.BACKEND_IMAGE }}:latest
            ${{ env.BACKEND_IMAGE }}:${{ steps.meta.outputs.sha_short }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # ── Build & push frontend image ──────────────────────────
      - name: Build & push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: |
            ${{ env.FRONTEND_IMAGE }}:latest
            ${{ env.FRONTEND_IMAGE }}:${{ steps.meta.outputs.sha_short }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ════════════════════════════════════════════════════════════════
  # Stage 3: Deploy to Production VPS
  # ════════════════════════════════════════════════════════════════
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build-and-push]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    environment:
      name: production
      url: https://yourdomain.com

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/miniparty

            # Pull latest images
            docker compose pull

            # Recreate containers with zero downtime
            docker compose up -d --remove-orphans

            # Clean up old images to free disk space
            docker image prune -f

            # Verify the backend is healthy
            echo "Waiting for health check..."
            sleep 5
            curl -sf http://localhost:8080/book > /dev/null && echo "Deploy OK" || echo "Deploy FAILED"
```

### Required GitHub Secrets

Configure these in your repository: **Settings → Secrets and variables → Actions**.

| Secret Name     | Description                                        | Example                         |
|-----------------|----------------------------------------------------|---------------------------------|
| `VPS_HOST`      | IP address or hostname of your server              | `164.90.xxx.xxx`               |
| `VPS_USER`      | SSH username on the server                         | `deploy`                        |
| `VPS_SSH_KEY`   | Private SSH key (ed25519 or RSA) for authentication| Contents of `~/.ssh/id_ed25519` |
| `ADMIN_SECRET`  | Admin authentication token                          | `a1b2c3d4...` (32+ chars)      |

> `GITHUB_TOKEN` is automatically available — no setup needed. It provides push access to GitHub Container Registry (GHCR).

### Server-Side Setup (One-Time)

Run these commands on your VPS to prepare for automated deployments:

```bash
# 1. Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Create the project directory
sudo mkdir -p /opt/miniparty
sudo chown $USER:$USER /opt/miniparty
cd /opt/miniparty

# 3. Create the docker-compose.yml for production
#    (use the compose file from Task 1d, but reference GHCR images
#     instead of local builds)
cat > docker-compose.yml << 'COMPOSE'
services:
  backend:
    image: ghcr.io/YOUR_USERNAME/miniparty/backend:latest
    container_name: miniparty-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    env_file: .env
    volumes:
      - miniparty-data:/data
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/book"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    image: ghcr.io/YOUR_USERNAME/miniparty/frontend:latest
    container_name: miniparty-web
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

  nginx:
    image: nginx:1.25-alpine
    container_name: miniparty-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend

  certbot:
    image: certbot/certbot
    container_name: miniparty-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  miniparty-data:
    driver: local
COMPOSE

# 4. Create the .env file
cat > .env << 'ENV'
PORT=8080
DB_PATH=/data/miniparty.db
ADMIN_SECRET=your-strong-secret-here
CORS_ORIGIN=https://yourdomain.com
ENV

# 5. Log in to GHCR so Docker can pull private images
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 6. Start the stack
docker compose up -d
```

---

## 5. Post-Deployment Checklist

### Verify Everything Works

| Check                              | Command / Action                                                   | Expected Result        |
|------------------------------------|--------------------------------------------------------------------|------------------------|
| Backend is running                 | `curl http://YOUR_SERVER_IP:8080/book`                             | JSON response          |
| Frontend is accessible             | Open `https://yourdomain.com` in a browser                        | React app loads        |
| SSL is working                     | Check the padlock icon in the browser                              | Valid certificate      |
| Admin endpoint is protected        | `curl https://yourdomain.com/bookings`                             | `401 Unauthorized`     |
| Admin endpoint works with token    | `curl -H "X-Admin-Token: YOUR_SECRET" https://yourdomain.com/bookings` | `200 OK` + JSON  |
| Database persists across restarts  | `docker compose restart backend` then check bookings               | Data is still there    |
| CI/CD deploys on push              | Push a commit to `main` and watch GitHub Actions                   | All stages pass, site updates |

### Backup Strategy for SQLite

Since all data lives in a single file, backups are straightforward:

```bash
# Manual backup (run on the VPS)
docker compose exec backend cp /data/miniparty.db /data/miniparty.db.bak

# Automated daily backup (add to crontab)
# crontab -e
0 3 * * * docker compose -f /opt/miniparty/docker-compose.yml exec -T backend \
  cp /data/miniparty.db /data/backups/miniparty-$(date +\%Y\%m\%d).db
```

### Monitoring (Optional but Recommended)

| Tool                                       | Purpose                        | Cost    |
|--------------------------------------------|--------------------------------|---------|
| [UptimeRobot](https://uptimerobot.com/)    | Uptime monitoring & alerts     | Free    |
| [Docker logs](https://docs.docker.com/)    | `docker compose logs -f`       | Free    |
| [Grafana + Prometheus](https://grafana.com/) | Metrics and dashboards       | Free (self-hosted) |

---

## Quick Reference — Common Commands

```bash
# ── Local Development ────────────────────────────────────────────
docker compose up --build              # Build and start all services
docker compose down                    # Stop all services
docker compose logs -f backend         # Stream backend logs

# ── Production (on VPS) ─────────────────────────────────────────
docker compose pull                    # Pull latest images from GHCR
docker compose up -d --remove-orphans  # Start/update with zero downtime
docker compose restart nginx           # Restart Nginx after config change

# ── Database ─────────────────────────────────────────────────────
docker compose exec backend ls -la /data/          # Check DB file exists
docker compose exec backend sqlite3 /data/miniparty.db ".tables"  # Inspect

# ── SSL ──────────────────────────────────────────────────────────
docker compose run --rm certbot renew --dry-run    # Test certificate renewal
docker compose run --rm certbot certificates       # List current certs

# ── Debugging ────────────────────────────────────────────────────
docker compose ps                      # Check container status
docker compose exec backend sh         # Shell into the backend container
docker stats                           # Live resource usage
```

---

> **Document version:** 1.0
> **Last updated:** February 2026
> **Stack:** React 19 + Vite 7 | Go 1.21 + Gin | SQLite | Docker | Nginx | GitHub Actions
