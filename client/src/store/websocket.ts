import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";

// Types
type WebSocketMessage = {
  type:
    | "user_joined"
    | "user_left"
    | "todos_updated"
    | "room_name_updated"
    | "room_deleted";
  payload: unknown;
};

// Constants
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 3;

// Atoms
export const wsConnectionAtom = atom<WebSocket | null>(null);
export const wsConnectedAtom = atom<boolean>(false);
export const currentRoomAtom = atom<string | null>(null);
export const wsErrorAtom = atom<string | null>(null);

// Derived atom for managing the connection
export const wsManagerAtom = atom(
  (get) => get(wsConnectionAtom),
  (get, set, roomId: string | null, username: string) => {
    if (!roomId) {
      const existingWs = get(wsConnectionAtom);
      if (existingWs) {
        existingWs.close(1000, "Room disconnection requested");
        set(wsConnectionAtom, null);
        set(wsConnectedAtom, false);
        set(currentRoomAtom, null);
        set(wsErrorAtom, null);
      }
      return;
    }

    // Close existing connection if connecting to a different room
    const existingWs = get(wsConnectionAtom);
    const currentRoom = get(currentRoomAtom);
    if (existingWs && currentRoom !== roomId) {
      existingWs.close(1000, "Switching rooms");
    }

    let reconnectAttempts = 0;
    let reconnectTimeout: number;

    const connectWebSocket = () => {
      // Remove any quotes from username and properly encode both parameters
      const cleanUsername = encodeURIComponent(username.replace(/['"]/g, ""));
      const cleanRoomId = encodeURIComponent(roomId);

      // Determine the correct WebSocket protocol and host
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host =
        window.location.hostname === "localhost"
          ? `localhost:8080`
          : window.location.host;

      const wsUrl = `${protocol}//${host}/ws/${cleanRoomId}?username=${cleanUsername}`;

      const ws = new WebSocket(wsUrl);
      set(wsErrorAtom, null);

      const connectionTimeout = window.setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          set(wsErrorAtom, "Connection timeout - please try again");
        }
      }, 5000);

      ws.onopen = () => {
        window.clearTimeout(connectionTimeout);
        set(wsConnectedAtom, true);
        set(currentRoomAtom, roomId);
        set(wsErrorAtom, null);
        reconnectAttempts = 0;
        console.log(`[WS] Successfully connected to room ${roomId}`);
      };

      ws.onclose = (event) => {
        window.clearTimeout(connectionTimeout);
        set(wsConnectedAtom, false);

        // Only attempt reconnection for unexpected closures
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          set(
            wsErrorAtom,
            `Connection lost. Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} to reconnect...`
          );

          reconnectTimeout = window.setTimeout(
            connectWebSocket,
            RECONNECT_DELAY
          );
        } else if (event.code !== 1000) {
          set(
            wsErrorAtom,
            "Connection failed after multiple attempts. Please try again later."
          );
        }
      };

      ws.onerror = (error) => {
        console.error(`[WS Error] Error in room ${roomId}:`, error);
        set(
          wsErrorAtom,
          "Connection error occurred. Please check your network connection."
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[WS Message] Received in room ${roomId}:`, data);
        } catch (error) {
          console.error("[WS Message] Error parsing message:", error);
        }
      };

      set(wsConnectionAtom, ws);
      return ws;
    };

    const ws = connectWebSocket();

    return () => {
      window.clearTimeout(reconnectTimeout);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounted");
      }
    };
  }
);

// Custom hook for WebSocket messages with improved error handling
export const useWebSocketMessage = <T>(
  messageType: WebSocketMessage["type"],
  handler: (payload: T) => void
) => {
  const [ws] = useAtom(wsConnectionAtom);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const messageHandler = useCallback(
    (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        if (data.type === messageType) {
          handlerRef.current(data.payload as T);
        }
      } catch (error) {
        console.error("[WS Hook] Error handling message:", error);
      }
    },
    [messageType]
  );

  useEffect(() => {
    if (!ws) {
      console.log("[WS Hook] No WebSocket connection available");
      return;
    }

    ws.addEventListener("message", messageHandler);
    return () => {
      ws.removeEventListener("message", messageHandler);
    };
  }, [ws, messageHandler, messageType]);
};

export const useRoomWebSocket = () => {
  const [currentRoom] = useAtom(currentRoomAtom);
  const [isConnected] = useAtom(wsConnectedAtom);

  return {
    isConnected,
    currentRoom,
  };
};
