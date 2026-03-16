import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "../store/chatStore";

const WS_URL = "ws://localhost:8080";

export function useWebSocket() {
  const ws = useRef(null);
  const { handleServerMessage } = useChatStore();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("✅ Connected to LanShare Bridge");
      useChatStore.getState().setConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.current.onclose = () => {
      console.log("❌ Disconnected from bridge");
      useChatStore.getState().setConnected(false);
      setTimeout(connect, 3000);
    };
  }, [handleServerMessage]);

  const send = useCallback((obj) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(obj));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  return { send };
}