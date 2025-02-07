package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null;size:255" json:"username"`
	Password string `gorm:"not null;size:255" json:"-"`
	Rooms    []Room `gorm:"many2many:room_users;constraint:OnDelete:CASCADE;" json:"rooms"`
	Todos    []Todo `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"todos"`
}

type Room struct {
	gorm.Model
	Name    string `gorm:"not null;size:255" json:"name"`
	AdminID uint   `gorm:"not null" json:"adminId"`
	Admin   User   `gorm:"foreignKey:AdminID" json:"admin"`
	Users   []User `gorm:"many2many:room_users;constraint:OnDelete:CASCADE;" json:"users"`
	Todos   []Todo `gorm:"foreignKey:RoomID;constraint:OnDelete:CASCADE;" json:"todos"`
}

type Todo struct {
	gorm.Model
	RoomID      uint   `gorm:"not null;index" json:"roomId"`
	Room        Room   `gorm:"foreignKey:RoomID" json:"room"`
	UserID      uint   `gorm:"not null;index" json:"userId"`
	User        User   `gorm:"foreignKey:UserID" json:"user"`
	Title       string `gorm:"not null;size:255" json:"title"`
	IsCompleted bool   `gorm:"default:false" json:"isCompleted"`
	Order       uint   `gorm:"default:0" json:"order"`
}
