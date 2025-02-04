package controllers

import (
	"realtime-todos/helper"
	"realtime-todos/initialisers"
	"realtime-todos/models"

	"github.com/gofiber/fiber/v2"
)

func CreateRoom(c *fiber.Ctx) error {

	db := initialisers.DB

	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	type RequestBody struct {
		Name string `json:"name"`
	}

	var body RequestBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	if body.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name is required",
		})
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error fetching the user",
		})
	}

	newRoom := models.Room{
		Name:    "New Room",
		AdminID: user.ID,
		Users:   []models.User{user},
	}

	if err := db.Create(&newRoom).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error creating the room",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Room created successfully",
		"room":    newRoom,
	})

}

func GetRoom(c *fiber.Ctx) error {
	db := initialisers.DB
	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return helper.HandleError(c, err)
	}

	roomID := c.Params("roomID")

	var room models.Room
	if err := db.Preload("Users").Preload("Todos").Preload("Admin").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Room fetched successfully",
		"room":    room,
	})
}

func GetRoomTodos(c *fiber.Ctx) error {
	db := initialisers.DB
	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized bruh",
		})
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return helper.HandleError(c, err)
	}

	roomID := c.Params("roomID")

	var room models.Room
	if err := db.Preload("Users").Preload("Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Todos fetched successfully",
		"todos":   room.Todos,
	})
}

func AddTodo(c *fiber.Ctx) error {
	db := initialisers.DB
	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return helper.HandleError(c, err)
	}

	roomID := c.Params("roomID")

	var room models.Room
	if err := db.Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	type RequestBody struct {
		Title string `json:"title"`
	}

	var body RequestBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	if body.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title is required",
		})
	}

	var todo = models.Todo{
		RoomID:      room.ID,
		UserID:      user.ID,
		Title:       body.Title,
		IsCompleted: false,
	}

	if err := db.Create(&todo).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error creating the todo",
		})
	}

	if err := db.Save(&todo).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error saving the todo",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Todo created successfully",
		"todo":    todo,
	})
}

func RemoveTodo(c *fiber.Ctx) error {
	db := initialisers.DB
	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return helper.HandleError(c, err)
	}

	roomID := c.Params("roomID")

	var room models.Room
	if err := db.Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	todoID := c.Params("todoID")

	var todo models.Todo
	if err := db.Where("id = ?", todoID).First(&todo).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if err := db.Delete(&todo).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error deleting the todo",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Todo deleted successfully",
	})
}

func UpdateTodo(c *fiber.Ctx) error {
	db := initialisers.DB
	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return helper.HandleError(c, err)
	}

	roomID := c.Params("roomID")

	var room models.Room
	if err := db.Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	todoID := c.Params("todoID")

	var todo models.Todo
	if err := db.Where("id = ?", todoID).First(&todo).Error; err != nil {
		return helper.HandleError(c, err)
	}

	type RequestBody struct {
		Title       string `json:"title"`
		IsCompleted bool   `json:"isCompleted"`
	}

	var body RequestBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	if body.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title is required",
		})
	}

	todo.Title = body.Title
	todo.IsCompleted = body.IsCompleted

	if err := db.Save(&todo).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error saving the todo",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Todo updated successfully",
		"todo":    todo,
	})
}
