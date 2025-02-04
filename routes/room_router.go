package routes

import (
	"realtime-todos/controllers"

	"github.com/gofiber/fiber/v2"
)

func RoomRouter(api fiber.Router) {
	api.Post("/room", controllers.CreateRoom)
	api.Get("/room/:roomID", controllers.GetRoom)
	api.Get("/room/:roomID/todos", controllers.GetRoomTodos)
	api.Post("/room/:roomID/todo", controllers.AddTodo)
	api.Delete("/room/:roomID/todo/:todoID", controllers.RemoveTodo)
	api.Patch("/room/:roomID/todo/:todoID", controllers.UpdateTodo)
}
