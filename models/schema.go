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
}

// type Player struct {
// 	gorm.Model
// 	Username string `gorm:"uniqueIndex;not null" json:"username"`
// 	Password string `gorm:"not null" json:"password"`
// 	GameID   uint   `gorm:"not null" json:"gameId"` // Player can only be in one game at a time
// 	IsAdmin  bool   `gorm:"not null; default:false" json:"isAdmin"`
// }

// type Game struct {
// 	gorm.Model
// 	Word    string    `gorm:"not null" json:"word"` // Secret word
// 	State   GameState `gorm:"not null; default:lobby" json:"state"`
// 	Players []Player  `gorm:"many2many:game_players;constraint:OnDelete:CASCADE;" json:"players"` // Many-to-many relation with players
// 	Guesses []Guess   `gorm:"foreignkey:GameID;constraint:OnDelete:CASCADE;" json:"guesses"`      // Guesses made during the game
// }

// type Guess struct {
// 	gorm.Model
// 	GameID        uint   `gorm:"not null" json:"gameId"`
// 	PlayerID      uint   `gorm:"not null" json:"playerId"`
// 	GuessWord     string `gorm:"not null" json:"guessWord"`
// 	Feedback      string `gorm:"not null" json:"feedback"`
// 	AttemptNumber uint   `gorm:"not null" json:"attemptNumber"`
// }

// // GameState type defines possible game states
// type GameState string

// const (
// 	GameStateInProgress GameState = "in-progress"
// 	GameStateFinished   GameState = "lobby"
// )
