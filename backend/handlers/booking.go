package handlers

import (
	"fmt"
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

	// Check for time overlap with existing bookings on the same date
	if conflict, endTime := checkTimeConflict(&booking); conflict {
		c.JSON(http.StatusConflict, gin.H{
			"error": fmt.Sprintf(
				"This time slot is already taken. The current booking ends at %s. Please choose a different time.",
				endTime,
			),
		})
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

// checkTimeConflict checks if the new booking overlaps with any existing booking on the same date.
// Returns (true, existingEndTime) if conflict found, (false, "") otherwise.
func checkTimeConflict(booking *models.Booking) (bool, string) {
	// Parse the new booking's start time (expected format "HH:MM" e.g. "14:00")
	var newStartHour, newStartMin int
	if _, err := fmt.Sscanf(booking.Time, "%d:%d", &newStartHour, &newStartMin); err != nil {
		return false, ""
	}
	newStartTotal := newStartHour*60 + newStartMin
	newEndTotal := newStartTotal + booking.Duration*60

	// Get all existing bookings on the same date
	var existing []models.Booking
	if err := db.DB.Where("date = ?", booking.Date).Find(&existing).Error; err != nil {
		return false, ""
	}

	for _, ex := range existing {
		var exStartHour, exStartMin int
		if _, err := fmt.Sscanf(ex.Time, "%d:%d", &exStartHour, &exStartMin); err != nil {
			continue
		}
		exStartTotal := exStartHour*60 + exStartMin
		exEndTotal := exStartTotal + ex.Duration*60

		// Two intervals overlap if one starts before the other ends and vice versa
		if newStartTotal < exEndTotal && exStartTotal < newEndTotal {
			endHour := exEndTotal / 60
			endMin := exEndTotal % 60
			period := "AM"
			displayHour := endHour
			if displayHour >= 12 {
				period = "PM"
				if displayHour > 12 {
					displayHour -= 12
				}
			}
			if displayHour == 0 {
				displayHour = 12
			}
			return true, fmt.Sprintf("%d:%02d %s", displayHour, endMin, period)
		}
	}

	return false, ""
}

func DeleteBooking(c *gin.Context) {
	id := c.Param("id")

	result := db.DB.Delete(&models.Booking{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete booking"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking deleted successfully"})
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
