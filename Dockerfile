# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.21-alpine AS backend-build
RUN apk add --no-cache gcc musl-dev
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o miniparty .

# Stage 3: Minimal production image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=backend-build /app/backend/miniparty .
COPY --from=frontend-build /app/frontend/dist ./dist

ENV PORT=8080
ENV DIST_PATH=./dist

EXPOSE 8080

CMD ["./miniparty"]
