package models

type Booking struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Date     string `json:"date"`
	Time     string `json:"time"`
	Duration int    `json:"duration"`
	Guests   int    `json:"guests"`
}
