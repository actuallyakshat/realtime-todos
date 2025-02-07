package controllers

import (
	"realtime-todos/helper"
	"realtime-todos/initialisers"
	"realtime-todos/models"
	"realtime-todos/websockets"

	"github.com/gofiber/fiber/v2"
)

func CreateRoom(c *fiber.Ctx) error {
	// No changes needed here as it doesn't involve preloading
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
		Name:    body.Name,
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

func DeleteRoom(c *fiber.Ctx) error {
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

	roomID := c.Query("roomId")
	if roomID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Room ID is required",
		})
	}

	var room models.Room
	// Convert roomID to uint before querying
	if err := db.Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if room.AdminID != user.ID {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	if err := db.Delete(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastRoomDeleted(room)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Room deleted successfully",
		"room":    room,
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
	if err := db.Preload("Users.Todos").Preload("Admin").Where("id = ?", roomID).First(&room).Error; err != nil {
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

func UpdateRoom(c *fiber.Ctx) error {
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
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
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

	room.Name = body.Name

	if err := db.Save(&room).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error saving the room",
		})
	}

	websockets.BroadcastRoomNameUpdated(room)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Room updated successfully",
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
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Collect all todos from all users in the room
	var allTodos []models.Todo
	for _, user := range room.Users {
		allTodos = append(allTodos, user.Todos...)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Todos fetched successfully",
		"todos":   allTodos,
	})
}

func AddTodo(c *fiber.Ctx) error {
	db := initialisers.DB
	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized USERNAME ERROR",
		})
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return helper.HandleError(c, err)
	}

	roomID := c.Params("roomID")

	var room models.Room
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized NOT IN ROOM",
		})
	}

	type RequestBody struct {
		Title string `json:"title"`
		Order uint   `json:"order"`
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
		Order:       body.Order,
	}

	if err := db.Create(&todo).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error creating the todo",
		})
	}

	// Refresh room data to get updated todos
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastTodosUpdated(room)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
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
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
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

	// Refresh room data to get updated todos
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastTodosUpdated(room)
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
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
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
		Title       *string `json:"title"`       // Make pointer to handle optional fields
		IsCompleted *bool   `json:"isCompleted"` // Make pointer to handle optional fields
		Order       *uint   `json:"order"`       // Make pointer to handle optional fields
	}

	var body RequestBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	if body.Title != nil {
		if *body.Title == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Title cannot be empty",
			})
		}
		todo.Title = *body.Title
	}

	if body.IsCompleted != nil {
		todo.IsCompleted = *body.IsCompleted
	}

	if body.Order != nil {
		todo.Order = *body.Order
	}

	if err := db.Save(&todo).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error saving the todo",
		})
	}

	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastTodosUpdated(room)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Todo updated successfully",
		"todo":    todo,
	})
}

func GetRooms(c *fiber.Ctx) error {
	db := initialisers.DB

	username, ok := helper.GetUsername(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var user models.User
	if err := db.Preload("Rooms.Users.Todos").Preload("Rooms.Admin").Where("username = ?", username).First(&user).Error; err != nil {
		return helper.HandleError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Rooms fetched successfully",
		"rooms":   user.Rooms,
	})
}

func AddUserToRoom(c *fiber.Ctx) error {
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
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	type RequestBody struct {
		Username string `json:"username"`
	}

	var body RequestBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	if body.Username == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username is required",
		})
	}

	var userToAdd models.User
	if err := db.Where("username = ?", body.Username).First(&userToAdd).Error; err != nil {
		return helper.HandleError(c, err)
	}

	for _, user := range room.Users {
		if user.ID == userToAdd.ID {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "User is already in the room",
			})
		}
	}

	if err := db.Model(&room).Association("Users").Append(&userToAdd); err != nil {
		return helper.HandleError(c, err)
	}

	// Refresh room data
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastUserJoined(room)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User added successfully",
		"user":    userToAdd,
	})
}

func LeaveRoom(c *fiber.Ctx) error {
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
	if err := db.Preload("Users").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	type RequestBody struct {
		Username string `json:"username"`
	}

	var body RequestBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	if body.Username == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username is required",
		})
	}

	var userToRemove models.User
	if err := db.Where("username = ?", body.Username).First(&userToRemove).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if err := db.Model(&room).Association("Users").Delete(&userToRemove); err != nil {
		return helper.HandleError(c, err)
	}

	if err := db.Where("room_id = ? AND user_id = ?", room.ID, userToRemove.ID).Delete(&models.Todo{}).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastUserLeft(room)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User removed successfully",
		"user":    userToRemove,
	})
}

func RemoveUserFromRoom(c *fiber.Ctx) error {
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
	if err := db.Preload("Users").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	type RequestBody struct {
		Username string `json:"username"`
	}

	var body RequestBody
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	if body.Username == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username is required",
		})
	}

	var userToRemove models.User
	if err := db.Where("username = ?", body.Username).First(&userToRemove).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if err := db.Model(&room).Association("Users").Delete(&userToRemove); err != nil {
		return helper.HandleError(c, err)
	}

	if err := db.Where("room_id = ? AND user_id = ?", room.ID, userToRemove.ID).Delete(&models.Todo{}).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastUserLeft(room)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User removed successfully",
		"user":    userToRemove,
	})
}

func ReorderTodos(c *fiber.Ctx) error {
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
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	if !helper.IsUserInRoom(user, room) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Create a struct to match the frontend data structure
	var request struct {
		Todos []struct {
			ID    uint `json:"id"`
			Order uint `json:"order"`
		} `json:"todos"`
	}

	if err := c.BodyParser(&request); err != nil {
		return helper.HandleError(c, err)
	}

	// Update the order of each todo in the database
	for _, update := range request.Todos {
		if err := db.Model(&models.Todo{}).Where("id = ?", update.ID).Update("order", update.Order).Error; err != nil {
			return helper.HandleError(c, err)
		}
	}

	// Refresh room data to get updated todos
	if err := db.Preload("Users.Todos").Where("id = ?", roomID).First(&room).Error; err != nil {
		return helper.HandleError(c, err)
	}

	websockets.BroadcastTodosUpdated(room)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Todos reordered successfully",
	})
}
