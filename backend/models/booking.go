package models

type Booking struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"not null"`
	Phone    string `json:"phone" gorm:"not null"`
	Date     string `json:"date" gorm:"not null"`
	Time     string `json:"time" gorm:"not null"`
	Duration int    `json:"duration" gorm:"not null;default:2"`
	Guests   int    `json:"guests" gorm:"not null"`
}
