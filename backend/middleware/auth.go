package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("ADMIN_SECRET")
		if secret == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Admin access is not configured"})
			c.Abort()
			return
		}

		token := c.GetHeader("X-Admin-Token")
		if token == "" || token != secret {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		c.Next()
	}
}
