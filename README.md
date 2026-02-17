# MiniParty - Party Booking Website MVP

A simple party booking website with a React frontend and Go backend.

## Project Structure

```
miniparty/
├── frontend/          # React + Vite + Tailwind CSS
│   └── src/
│       ├── components/  # Reusable components (Navbar)
│       └── pages/       # Home, BookingForm, Confirmation
├── backend/           # Go + Gin + PostgreSQL
│   ├── db/            # Database initialization
│   ├── handlers/      # API route handlers
│   └── models/        # Data models
├── Dockerfile         # Multi-stage production build
└── README.md
```

## Prerequisites

- **Node.js** (v18+) — [https://nodejs.org](https://nodejs.org)
- **Go** (v1.21+) — [https://go.dev/dl](https://go.dev/dl)
- **PostgreSQL** (v14+) — for production (or any cloud-hosted PostgreSQL)

## Getting Started (Local Development)

### 1. Set up PostgreSQL

Create a database and set the connection string:

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/miniparty?sslmode=disable"
```

### 2. Start the Backend

```bash
cd backend
go run main.go
```

The API server starts at **http://localhost:8080**. The `bookings` table is created automatically.

### 3. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**. API calls are proxied to the backend automatically.

## Environment Variables

| Variable       | Default                  | Description                              |
|----------------|--------------------------|------------------------------------------|
| `DATABASE_URL` | *(required)*             | PostgreSQL connection string             |
| `PORT`         | `8080`                   | Server port                              |
| `CORS_ORIGIN`  | `http://localhost:5173`  | Allowed frontend origin for CORS         |
| `DIST_PATH`    | `./dist`                 | Path to the React build output           |

## Production Deployment (Docker)

Build and run as a single container:

```bash
docker build -t miniparty .
docker run -p 8080:8080 \
  -e DATABASE_URL="postgres://user:password@host:5432/miniparty?sslmode=require" \
  -e CORS_ORIGIN="https://your-domain.com" \
  miniparty
```

The container serves both the API and the React frontend on a single port.

### Deploy to Render / Railway

1. Connect your repo
2. Set build command: `docker build -t miniparty .`
3. Set environment variables: `DATABASE_URL`, `CORS_ORIGIN`
4. The platform provides `PORT` automatically

## API Endpoints

| Method | Endpoint    | Description              |
|--------|-------------|--------------------------|
| POST   | `/book`     | Create a new booking     |
| GET    | `/bookings` | List all bookings (admin)|

### POST /book — Example Request

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "date": "2026-03-15",
  "time": "18:00",
  "duration": 3,
  "guests": 25
}
```

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Go, Gin, PostgreSQL
- **Database:** PostgreSQL (cloud-hosted for production)
- **Deployment:** Single Docker container
# mini-party
