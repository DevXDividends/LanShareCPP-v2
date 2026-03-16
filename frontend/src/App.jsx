import { useEffect } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useChatStore } from "./store/chatStore";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  const { send } = useWebSocket();
  const isAuthenticated = useChatStore((s) => s.isAuthenticated);
  const setSendFn = useChatStore((s) => s.setSendFn);

  useEffect(() => {
    setSendFn(send);
  }, [send, setSendFn]);

  return (
    <>
      {isAuthenticated ? (
        <ChatPage send={send} />
      ) : (
        <LoginPage send={send} />
      )}
    </>
  );
}