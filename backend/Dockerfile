# ── Stage 1: Build the Go binary ─────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /src

# git needed for module fetches; no gcc/musl-dev since CGO is disabled
RUN apk add --no-cache git

# Cache dependency downloads (layer only invalidates when go.mod/sum change)
COPY go.mod go.sum ./
RUN go mod download

# Copy source and compile a static, stripped binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /bin/miniparty .

# ── Stage 2: Minimal runtime image (~7 MB base) ─────────────────
FROM alpine:3.19

# ca-certificates: required for TLS to *.turso.io
# wget: used by the HEALTHCHECK probe
RUN apk add --no-cache ca-certificates

# Non-root user for security
RUN adduser -D -H appuser
USER appuser

WORKDIR /app
COPY --from=builder /bin/miniparty .

# Render injects PORT at runtime; 8080 is the local/fallback default
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:${PORT}/book || exit 1

CMD ["./miniparty"]
