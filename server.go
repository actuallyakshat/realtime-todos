package main

import (
	"os"
	"realtime-todos/initialisers"
	"realtime-todos/middlewares"
	"realtime-todos/routes"
	"realtime-todos/websockets"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func init() {
	initialisers.LoadEnv()
	initialisers.ConnectDB()
}

func main() {
	app := fiber.New()
	setupRoutes(app)
	setupWebSocketRoutes(app)
	setupStaticFiles(app)
	startServer(app)
}

func setupRoutes(app *fiber.App) {
	api := app.Group("/api")
	app.Use(logger.New())
	api.Use(middlewares.CheckAuth())

	api.Use(limiter.New(limiter.Config{
		Max:        50, // Stricter limit for API
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": "API rate limit exceeded",
			})
		},
	}))

	routes.IndexRouter(api)
}

func setupWebSocketRoutes(app *fiber.App) {
	app.Use("/ws", cors.New())
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws/:roomID", websocket.New(websockets.Hub.HandleConnection, websocket.Config{
		Origins: []string{"http://localhost:3000", "http://localhost:5173", "https://todos.actuallyakshat.in"},
	}))
}

func setupStaticFiles(app *fiber.App) {
	app.Static("/", "./client_build")

	app.Get("*", func(c *fiber.Ctx) error {
		return c.SendFile("./client_build/index.html")
	})
}

func startServer(app *fiber.App) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	//For Railway
	err := app.Listen("0.0.0.0:" + port)

	if err != nil {
		panic(err)
	}
}
