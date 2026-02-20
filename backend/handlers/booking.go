package handlers

import (
	"net/http"
	"net/mail"
	"strings"

	"miniparty-backend/db"
	"miniparty-backend/models"

	"github.com/gin-gonic/gin"
)

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

	if err := db.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save booking"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Booking confirmed!",
		"booking": booking,
	})
}

func GetBookings(c *gin.Context) {
	var bookings []models.Booking

	if err := db.DB.Order("date ASC, time ASC").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookings"})
		return
	}

	c.JSON(http.StatusOK, bookings)
}

func validateBooking(b *models.Booking) []string {
	var errs []string

	b.Name = strings.TrimSpace(b.Name)
	b.Email = strings.TrimSpace(b.Email)
	b.Phone = strings.TrimSpace(b.Phone)

	if b.Name == "" {
		errs = append(errs, "Name is required")
	}
	if _, err := mail.ParseAddress(b.Email); err != nil {
		errs = append(errs, "Valid email is required")
	}
	if len(b.Phone) < 7 {
		errs = append(errs, "Valid phone number is required")
	}
	if b.Date == "" {
		errs = append(errs, "Date is required")
	}
	if b.Time == "" {
		errs = append(errs, "Time is required")
	}
	if b.Duration < 1 || b.Duration > 8 {
		errs = append(errs, "Duration must be between 1 and 8 hours")
	}
	if b.Guests < 1 || b.Guests > 100 {
		errs = append(errs, "Guests must be between 1 and 100")
	}

	return errs
}
