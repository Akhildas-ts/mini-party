# ── Stage 1: Build the Go binary ─────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /src

# git is needed for fetching certain Go modules
RUN apk add --no-cache gcc musl-dev git

# Cache dependency downloads (only re-runs if go.mod/go.sum change)
COPY go.mod go.sum ./
RUN go mod download

# Copy source and compile a static, stripped binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /bin/miniparty .

# ── Stage 2: Minimal runtime image ──────────────────────────────
FROM alpine:3.19

# ca-certificates is required for TLS connections to Turso (*.turso.io)
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /bin/miniparty .

# Render injects PORT automatically; default to 8080 for local testing
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:${PORT}/book || exit 1

CMD ["./miniparty"]
