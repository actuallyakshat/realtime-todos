package routes

import (
	"realtime-todos/controllers"

	"github.com/gofiber/fiber/v2"
)

func IndexRouter(api fiber.Router) {
	api.Get("/", controllers.HealthCheck)
	AuthRouter(api)
	RoomRouter(api)
}
