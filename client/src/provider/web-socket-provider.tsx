import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { wsManagerAtom } from "../store/websocket";
import { useAuth } from "../store/auth";
import { useParams } from "react-router";

type WebSocketProviderProps = {
  children: React.ReactNode;
};

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { user } = useAuth();
  const { roomId } = useParams<{ roomId?: string }>();
  const [, initWebSocket] = useAtom(wsManagerAtom);

  const initializeWebSocket = useCallback(() => {
    if (!user?.username || !roomId) {
      return;
    }

    initWebSocket(roomId, user.username);
  }, [roomId, user?.username, initWebSocket]);

  // Only initialize WebSocket connection once when component mounts
  useEffect(() => {
    initializeWebSocket();

    return () => {
      if (user?.username) {
        initWebSocket(null, user.username);
      }
    };
  }, [initializeWebSocket, user?.username, initWebSocket]);

  return <>{children}</>;
};
