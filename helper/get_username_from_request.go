package helper

import "github.com/gofiber/fiber/v2"

func GetUsername(c *fiber.Ctx) (string, bool) {
	username, ok := c.Locals("username").(string)
	if !ok {
		return "", false
	}

	return username, ok
}
