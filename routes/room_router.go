package routes

import (
	"realtime-todos/controllers"

	"github.com/gofiber/fiber/v2"
)

func RoomRouter(api fiber.Router) {
	api.Post("/room", controllers.CreateRoom)
	api.Delete("/room", controllers.DeleteRoom)
	api.Get("/rooms", controllers.GetRooms)
	api.Get("/room/:roomID", controllers.GetRoom)
	api.Patch("/room/:roomID", controllers.UpdateRoom)
	api.Get("/room/:roomID/todos", controllers.GetRoomTodos)
	api.Post("/room/:roomID/todo", controllers.AddTodo)
	api.Delete("/room/:roomID/todo/:todoID", controllers.RemoveTodo)
	api.Patch("/room/:roomID/todo/:todoID", controllers.UpdateTodo)
	api.Post("/room/:roomID/user", controllers.AddUserToRoom)
	api.Delete("/room/:roomID/user/remove", controllers.RemoveUserFromRoom)
	api.Delete("/room/:roomID/user/leave", controllers.LeaveRoom)
	api.Patch("/room/:roomID/todos", controllers.ReorderTodos)
}
