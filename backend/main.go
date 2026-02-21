package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"miniparty-backend/db"
	"miniparty-backend/handlers"
	"miniparty-backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db.Init()
	defer db.Close()

	r := gin.Default()

	// CORS — allow multiple origins (custom domain + Vercel + localhost)
	origins := []string{"http://localhost:5173"}
	if env := os.Getenv("CORS_ORIGIN"); env != "" {
		origins = append(origins, env)
	}
	if env := os.Getenv("CORS_ORIGIN_2"); env != "" {
		origins = append(origins, env)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST"},
		AllowHeaders:     []string{"Content-Type", "X-Admin-Token"},
		AllowCredentials: true,
	}))

	// Health check — used by Render and Docker HEALTHCHECK
	r.GET("/health", func(c *gin.Context) {
		sqlDB, err := db.DB.DB()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		if err := sqlDB.Ping(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API routes
	r.POST("/book", handlers.CreateBooking)
	r.GET("/bookings", middleware.AdminAuth(), handlers.GetBookings)

	// Serve React static files in production
	distPath := "./dist"
	if env := os.Getenv("DIST_PATH"); env != "" {
		distPath = env
	}

	if info, err := os.Stat(distPath); err == nil && info.IsDir() {
		log.Println("Serving frontend from", distPath)
		r.NoRoute(func(c *gin.Context) {
			// Try to serve the static file directly (JS, CSS, images, etc.)
			filePath := filepath.Join(distPath, c.Request.URL.Path)
			if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
				c.File(filePath)
				return
			}

			// SPA fallback: serve index.html for all other paths (React Router handles routing)
			c.File(filepath.Join(distPath, "index.html"))
		})
	}

	// Port — configurable for cloud platforms
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
