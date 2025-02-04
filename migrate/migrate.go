package main

import (
	"realtime-todos/initialisers"
	"realtime-todos/models"
)

func init() {
	initialisers.LoadEnv()
	initialisers.ConnectDB()
}

func main() {
	initialisers.DB.AutoMigrate(&models.Room{}, &models.User{}, &models.Todo{})
}
