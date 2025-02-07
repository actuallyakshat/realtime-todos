package websockets

import (
	"encoding/json"
	"fmt"
	"log"
	"realtime-todos/initialisers"
	"realtime-todos/models"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

type RoomHub struct {
	// connections stores active WebSocket connections per room
	connections map[uint][]Connection
	mu          sync.RWMutex
}

// Connection represents a WebSocket connection for a specific player
type Connection struct {
	Conn     *websocket.Conn
	RoomId   uint
	Username string
}

// Message represents the structure of WebSocket messages
type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

var (
	// Hub is the global instance of RoomHub
	Hub = &RoomHub{
		connections: make(map[uint][]Connection),
	}
)

func (h *RoomHub) HandleConnection(c *websocket.Conn) {
	// Get roomID and username from query params

	roomID := c.Params("roomID")
	username := c.Query("username")

	if roomID == "" || username == "" {
		log.Printf("Missing required parameters: roomID=%s, username=%s", roomID, username)
		c.Close()
		return
	}

	// Convert roomID to uint
	var room models.Room
	if err := initialisers.DB.Where("id = ?", roomID).First(&room).Error; err != nil {
		log.Printf("Error fetching room: %v\n", err)
		c.Close()
		return
	}

	// Create new connection
	conn := Connection{
		Conn:     c,
		RoomId:   room.ID,
		Username: username,
	}

	// Add connection to hub
	h.addConnection(conn)

	// Remove connection when function returns
	defer func() {
		h.removeConnection(conn)
		conn.Conn.Close()
	}()

	// Listen for WebSocket messages
	for {
		messageType, _, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unexpected close error: %v", err)
			}
			break
		}
		if messageType == websocket.CloseMessage {
			log.Printf("Received close message from %s in room %d", conn.Username, conn.RoomId)
			break
		}
	}
}

// addConnection adds a new connection to the hub
func (h *RoomHub) addConnection(conn Connection) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.connections[conn.RoomId] = append(h.connections[conn.RoomId], conn)
}

// removeConnection removes a connection from the hub
func (h *RoomHub) removeConnection(conn Connection) {
	h.mu.Lock()
	defer h.mu.Unlock()

	conns := h.connections[conn.RoomId]
	for i, c := range conns {
		if c.Conn == conn.Conn {
			h.connections[conn.RoomId] = append(conns[:i], conns[i+1:]...)
			break
		}
	}

	// Clean up empty room connections
	if len(h.connections[conn.RoomId]) == 0 {
		delete(h.connections, conn.RoomId)
	}
}

// BroadcastToRoom sends a message to all connected clients in a specific room
func (h *RoomHub) BroadcastToRoom(roomId uint, messageType string, payload interface{}) {
	message := Message{
		Type:    messageType,
		Payload: payload,
	}

	jsonMessage, err := json.Marshal(message)
	if err != nil {
		fmt.Printf("Error marshaling message: %v\n", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, conn := range h.connections[roomId] {
		err := conn.Conn.WriteMessage(websocket.TextMessage, jsonMessage)
		if err != nil {
			fmt.Printf("Error sending message to %s: %v\n", conn.Username, err)
		}
	}
}

func BroadcastUserJoined(room models.Room) {
	Hub.BroadcastToRoom(room.ID, "user_joined", room)
}

func BroadcastUserLeft(room models.Room) {
	Hub.BroadcastToRoom(room.ID, "user_left", room)
}

func BroadcastTodosUpdated(room models.Room) {
	Hub.BroadcastToRoom(room.ID, "todos_updated", room)
}

func BroadcastRoomNameUpdated(room models.Room) {
	Hub.BroadcastToRoom(room.ID, "room_name_updated", room)
}

func BroadcastRoomDeleted(room models.Room) {
	Hub.BroadcastToRoom(room.ID, "room_deleted", room)
}
