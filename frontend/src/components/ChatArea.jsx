import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/chatStore";

export default function ChatArea({ send }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    currentContact, messages, myUserID,
    addOwnMessage, fileTransfers
  } = useChatStore();

  const contactMessages = currentContact
    ? (messages[currentContact.id] || []) : [];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contactMessages]);

  const handleSend = () => {
    if (!input.trim() || !currentContact) return;
    if (currentContact.isGroup) {
      send({ type: "sendGroup", group: currentContact.id, message: input.trim() });
    } else {
      send({ type: "send", to: currentContact.id, message: input.trim() });
    }
    addOwnMessage(currentContact.id, input.trim(), currentContact.isGroup);
    setInput("");
  };

  const handleDecrypt = (msg) => {
    if (!msg.encrypted) return;
    send({
      type: "decrypt",
      from: msg.from,
      encrypted: msg.encrypted,
      context: currentContact.isGroup ? "group" : "private",
      group: currentContact.isGroup ? currentContact.id : ""
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !currentContact) return;
    send({
      type: "sendFile",
      to: currentContact.id,
      path: file.path || file.name,
      isGroup: currentContact.isGroup ? "true" : "false"
    });
  };

  // No contact selected
  if (!currentContact) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 10
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(0,255,231,0.05)",
          border: "1px solid rgba(0,255,231,0.15)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 32,
          marginBottom: 20,
          boxShadow: "0 0 30px rgba(0,255,231,0.1)"
        }}>💬</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, letterSpacing: 2,
          color: "var(--text-muted)"
        }}>SELECT A CONTACT TO START</div>
      </div>
    );
  }

  const shortName = currentContact.name?.split("-")[1] || currentContact.name;
  const fileTransfer = fileTransfers[currentContact.id];

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      position: "relative", zIndex: 10, overflow: "hidden"
    }}>

      {/* ── Header ─────────────────────────────── */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(0,255,231,0.08)",
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(0,0,0,0.2)"
      }}>
        {/* Avatar */}
        <div style={{
          width: 38, height: 38,
          borderRadius: currentContact.isGroup ? 10 : "50%",
          background: currentContact.isGroup
            ? "rgba(112,0,255,0.15)" : "rgba(0,255,231,0.1)",
          border: `1px solid ${currentContact.isGroup
            ? "rgba(112,0,255,0.3)" : "rgba(0,255,231,0.2)"}`,
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16
        }}>
          {currentContact.isGroup ? "👥"
            : shortName[0]?.toUpperCase()}
        </div>

        <div>
          <div style={{
            fontSize: 15, fontWeight: 600,
            color: "var(--text-primary)"
          }}>{shortName}</div>
          <div style={{
            fontSize: 10, color: "var(--green)",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 1, display: "flex",
            alignItems: "center", gap: 4
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "var(--green)",
              boxShadow: "0 0 5px var(--green)"
            }} />
            {currentContact.isGroup ? "GROUP CHAT" : "ONLINE"}
          </div>
        </div>

        {/* Right side — ID */}
        <div style={{ marginLeft: "auto" }}>
          <div style={{
            fontSize: 10, color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 1
          }}>
            {currentContact.isGroup ? "🔒 GROUP KEY" : currentContact.id}
          </div>
        </div>
      </div>

      {/* ── Messages ───────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 12
      }}>

        {/* File transfer progress */}
        {fileTransfer && (
          <div className="file-card" style={{ alignSelf: "center", width: "60%" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-primary)" }}>
                📎 {fileTransfer.filename}
              </span>
              <span style={{ color: "var(--cyan)" }}>
                {fileTransfer.percent}%
              </span>
            </div>
            <div className="file-progress-bar">
              <div className="file-progress-fill"
                style={{ width: `${fileTransfer.percent}%` }} />
            </div>
          </div>
        )}

        {contactMessages.length === 0 && (
          <div style={{
            textAlign: "center", marginTop: 40,
            fontSize: 12, color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 2
          }}>
            NO MESSAGES YET · START CHATTING
          </div>
        )}

        {contactMessages.map((msg, i) => (
          <MessageRow key={i} msg={msg}
            myUserID={myUserID}
            isGroup={currentContact.isGroup}
            onDecrypt={() => handleDecrypt(msg)} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ──────────────────────────── */}
      <div style={{
        padding: "16px 24px",
        borderTop: "1px solid rgba(0,255,231,0.08)",
        background: "rgba(0,0,0,0.2)",
        display: "flex", gap: 10, alignItems: "flex-end"
      }}>
        {/* File attach */}
        <input type="file" ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelect} />
        <button onClick={() => fileInputRef.current?.click()} style={{
          background: "rgba(112,0,255,0.1)",
          border: "1px solid rgba(112,0,255,0.3)",
          borderRadius: 10, width: 42, height: 42,
          color: "#a855f7", fontSize: 18, cursor: "pointer",
          flexShrink: 0, transition: "all 0.2s ease"
        }}>📎</button>

        {/* Text input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
          rows={1}
          style={{
            flex: 1, resize: "none",
            background: "rgba(0,255,231,0.03)",
            border: "1px solid rgba(0,255,231,0.15)",
            borderRadius: 10, padding: "11px 16px",
            color: "var(--text-primary)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13, outline: "none",
            transition: "border-color 0.2s ease",
            maxHeight: 120, overflowY: "auto"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(0,255,231,0.4)";
            e.target.style.boxShadow = "0 0 15px rgba(0,255,231,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(0,255,231,0.15)";
            e.target.style.boxShadow = "none";
          }}
        />

        {/* Send button */}
        <button onClick={handleSend} style={{
          background: "rgba(0,255,231,0.1)",
          border: "1px solid rgba(0,255,231,0.3)",
          borderRadius: 10, width: 42, height: 42,
          color: "var(--cyan)", fontSize: 18,
          cursor: "pointer", flexShrink: 0,
          transition: "all 0.2s ease",
          boxShadow: "0 0 10px rgba(0,255,231,0.1)"
        }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(0,255,231,0.2)";
            e.target.style.boxShadow = "0 0 20px rgba(0,255,231,0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(0,255,231,0.1)";
            e.target.style.boxShadow = "0 0 10px rgba(0,255,231,0.1)";
          }}
        >➤</button>
      </div>
    </div>
  );
}

// ── Message Row Component ───────────────────────
function MessageRow({ msg, myUserID, isGroup, onDecrypt }) {
  const isOwn = msg.isOwn || msg.from === myUserID;
  const shortFrom = msg.from?.split("-")[1] || msg.from;

  return (
    <div style={{
      display: "flex",
      flexDirection: isOwn ? "row-reverse" : "row",
      alignItems: "flex-end", gap: 8
    }}>
      {/* Avatar */}
      {!isOwn && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(0,255,231,0.08)",
          border: "1px solid rgba(0,255,231,0.15)",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 11,
          fontWeight: 700, color: "var(--cyan)",
          fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0
        }}>
          {shortFrom?.[0]?.toUpperCase()}
        </div>
      )}

      <div style={{ maxWidth: "70%" }}>
        {/* Sender name for group */}
        {isGroup && !isOwn && (
          <div style={{
            fontSize: 10, color: "var(--cyan)",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 4, paddingLeft: 4
          }}>{shortFrom}</div>
        )}

        {/* Bubble */}
        <div className={isOwn ? "bubble-own" : "bubble-other"}>
          {msg.decrypted ? (
            <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {msg.decrypted}
            </div>
          ) : msg.isOwn ? (
            <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {msg.decrypted || "..."}
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 10
            }}>
              <div style={{
                fontSize: 11, color: "var(--text-muted)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1
              }}>🔒 ENCRYPTED</div>
              <button onClick={onDecrypt} style={{
                background: "rgba(0,255,231,0.08)",
                border: "1px solid rgba(0,255,231,0.2)",
                borderRadius: 6, padding: "3px 10px",
                color: "var(--cyan)", fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1, cursor: "pointer",
                transition: "all 0.2s ease"
              }}>🔓 DECRYPT</button>
            </div>
          )}

          {/* Timestamp */}
          <div style={{
            fontSize: 9, color: "var(--text-muted)",
            marginTop: 4, textAlign: isOwn ? "right" : "left",
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {msg.timestamp
              ? new Date(msg.timestamp * 1000).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit"
                })
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
}