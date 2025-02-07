package helper

import (
	"realtime-todos/models"
)

func IsUserInRoom(user models.User, room models.Room) bool {
	for _, u := range room.Users {
		if u.ID == user.ID {
			return true
		}
	}
	return false
}
