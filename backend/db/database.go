package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

var DB *sql.DB

func Init() {
	dbURL := os.Getenv("TURSO_DATABASE_URL")
	authToken := os.Getenv("TURSO_AUTH_TOKEN")

	if dbURL == "" || authToken == "" {
		log.Fatal("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required")
	}

	dsn := fmt.Sprintf("%s?authToken=%s", dbURL, authToken)

	var err error
	DB, err = sql.Open("libsql", dsn)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	createTable := `
	CREATE TABLE IF NOT EXISTS bookings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT NOT NULL,
		phone TEXT NOT NULL,
		date TEXT NOT NULL,
		time TEXT NOT NULL,
		duration INTEGER NOT NULL DEFAULT 2,
		guests INTEGER NOT NULL
	);`

	if _, err = DB.Exec(createTable); err != nil {
		log.Fatal("Failed to create table:", err)
	}

	log.Println("Database initialized (Turso/libSQL)")
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
