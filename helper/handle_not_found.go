package helper

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func HandleError(c *fiber.Ctx, err error) error {
	if err == gorm.ErrRecordNotFound {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Record not found",
		})
	}
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"error": "Internal server error",
	})
}
