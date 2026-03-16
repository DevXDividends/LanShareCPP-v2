import { useState } from "react";
import { useChatStore } from "../store/chatStore";

export default function Sidebar({ send }) {
  const { users, groups, currentContact, setCurrentContact,
          unreadCounts, clearUnread, myUserID, addGroup } = useChatStore();
  const [showGroupModal, setShowGroupModal] = useState(null); // "create" | "join" | null
  const [groupInput, setGroupInput] = useState("");
  const [codeInput, setCodeInput] = useState("");

  const selectContact = (id, name, isGroup) => {
    setCurrentContact({ id, name, isGroup });
    clearUnread(id);
    if (!isGroup) send({ type: "userList" });
  };

  const handleCreateGroup = () => {
    if (!groupInput.trim()) return;
    send({ type: "createGroup", group: groupInput.trim() });
    setGroupInput(""); setCodeInput(""); setShowGroupModal(null);
  };

  const handleJoinGroup = () => {
    if (!groupInput.trim() || !codeInput.trim()) return;
    send({ type: "joinGroup", group: groupInput.trim(), code: codeInput.trim() });
    addGroup(groupInput.trim());
    setGroupInput(""); setCodeInput(""); setShowGroupModal(null);
  };

  return (
    <>
      <div style={{
        position: "relative", zIndex: 10,
        width: 260, minWidth: 260, height: "100vh",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid rgba(0,255,231,0.08)",
        background: "rgba(0,0,0,0.3)"
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(0,255,231,0.08)"
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14, fontWeight: 700, letterSpacing: 3,
            color: "var(--cyan)",
            textShadow: "0 0 10px rgba(0,255,231,0.5)"
          }}>⚡ LANSHARE</div>
          <div style={{
            marginTop: 8, padding: "6px 10px",
            background: "rgba(0,255,231,0.05)",
            border: "1px solid rgba(0,255,231,0.1)",
            borderRadius: 8, fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--text-muted)"
          }}>
            <span style={{ color: "var(--cyan)" }}>ID: </span>
            {myUserID?.split("-").slice(0, 2).join("-") || "..."}
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>

          {/* USERS section */}
          <div style={{
            fontSize: 9, letterSpacing: 3,
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            padding: "4px 6px", marginBottom: 6
          }}>
            ── USERS ({users.length})
          </div>

          {users.length === 0 ? (
            <div style={{
              fontSize: 11, color: "var(--text-muted)",
              padding: "8px 6px", fontStyle: "italic"
            }}>No users online</div>
          ) : (
            users.map((uid) => {
              const isActive = currentContact?.id === uid;
              const unread = unreadCounts[uid] || 0;
              const shortName = uid.split("-")[1] || uid;
              return (
                <div key={uid}
                  className={`contact-item ${isActive ? "active" : ""}`}
                  onClick={() => selectContact(uid, shortName, false)}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,255,231,0.1)",
                    border: "1px solid rgba(0,255,231,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "var(--cyan)",
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0
                  }}>
                    {shortName[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, color: "var(--text-primary)",
                      fontWeight: 500, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis"
                    }}>{shortName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <div className="status-online" style={{
                        width: 5, height: 5, borderRadius: "50%"
                      }} />
                      <span style={{ fontSize: 10, color: "var(--green)" }}>online</span>
                    </div>
                  </div>

                  {unread > 0 && (
                    <span className="unread-badge">{unread}</span>
                  )}
                </div>
              );
            })
          )}

          {/* GROUPS section */}
          <div style={{
            fontSize: 9, letterSpacing: 3,
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            padding: "4px 6px", marginTop: 16, marginBottom: 6
          }}>
            ── GROUPS ({groups.length})
          </div>

          {groups.map((g) => {
            const isActive = currentContact?.id === g;
            const unread = unreadCounts[g] || 0;
            return (
              <div key={g}
                className={`contact-item ${isActive ? "active" : ""}`}
                onClick={() => selectContact(g, g, true)}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(112,0,255,0.15)",
                  border: "1px solid rgba(112,0,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0
                }}>👥</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: "var(--text-primary)",
                    fontWeight: 500, whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis"
                  }}>{g}</div>
                </div>

                {unread > 0 && (
                  <span className="unread-badge">{unread}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom buttons */}
        <div style={{
          padding: "12px 10px",
          borderTop: "1px solid rgba(0,255,231,0.08)",
          display: "flex", flexDirection: "column", gap: 8
        }}>
          <button className="btn-neon" onClick={() => setShowGroupModal("create")}
            style={{ width: "100%", fontSize: 10, letterSpacing: 2, padding: "8px 0" }}>
            + CREATE GROUP
          </button>
          <button className="btn-neon btn-neon-purple"
            onClick={() => setShowGroupModal("join")}
            style={{ width: "100%", fontSize: 10, letterSpacing: 2, padding: "8px 0" }}>
            + JOIN GROUP
          </button>
          <button onClick={() => {
            send({ type: "userList" });
          }} style={{
            background: "transparent", border: "none",
            color: "var(--text-muted)", fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 2, cursor: "pointer", padding: "4px 0"
          }}>
            🔄 REFRESH
          </button>
        </div>
      </div>

      {/* ── Group Modal ───────────────────────────── */}
      {showGroupModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setShowGroupModal(null)}>
          <div className="glass-strong" style={{
            width: 380, padding: 32,
            border: "1px solid rgba(0,255,231,0.2)"
          }} onClick={(e) => e.stopPropagation()}>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14, fontWeight: 700, letterSpacing: 2,
              color: "var(--cyan)", marginBottom: 24
            }}>
              {showGroupModal === "create" ? "⚡ CREATE GROUP" : "🔗 JOIN GROUP"}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", marginBottom: 6, fontSize: 10,
                letterSpacing: 2, color: "var(--text-muted)",
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase"
              }}>Group Name</label>
              <input className="input-neon" value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                placeholder="enter group name"
                onKeyDown={(e) => e.key === "Enter" &&
                  (showGroupModal === "create" ? handleCreateGroup() : handleJoinGroup())}
              />
            </div>

            {showGroupModal === "join" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", marginBottom: 6, fontSize: 10,
                  letterSpacing: 2, color: "var(--text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase"
                }}>Join Code</label>
                <input className="input-neon" value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="e.g. TIGER-42"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinGroup()}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button className="btn-neon" style={{ flex: 1 }}
                onClick={showGroupModal === "create"
                  ? handleCreateGroup : handleJoinGroup}>
                {showGroupModal === "create" ? "CREATE" : "JOIN"}
              </button>
              <button className="btn-neon btn-neon-purple" style={{ flex: 1 }}
                onClick={() => setShowGroupModal(null)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}