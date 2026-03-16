import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/chatStore";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";

export default function ChatPage({ send }) {
  const myUserID = useChatStore((s) => s.myUserID);

  // Refresh user list every 5 seconds
  useEffect(() => {
    send({ type: "userList" });
    const interval = setInterval(() => {
      send({ type: "userList" });
    }, 5000);
    return () => clearInterval(interval);
  }, [send]);

  return (
    <div style={{
      display: "flex", width: "100vw", height: "100vh",
      background: "var(--bg-primary)", overflow: "hidden",
      position: "relative"
    }}>
      <div className="grid-bg" />
      <div className="scanlines" />

      {/* Sidebar */}
      <Sidebar send={send} />

      {/* Chat Area */}
      <ChatArea send={send} />
    </div>
  );
}