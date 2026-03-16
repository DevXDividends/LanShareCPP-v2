import { useState } from "react";
import { useChatStore } from "../store/chatStore";
export default function LoginPage({ send }) {
  const [ip, setIp] = useState("127.0.0.1");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [tab, setTab] = useState("login"); // "login" | "register"
  const connected = useChatStore((s) => s.connected);

  const handleConnect = () => {
  if (!ip) return;
  setIsConnecting(true);
  send({ type: "connect", ip, port: "5555" });
  // Wait 2 seconds before allowing login/register
  setTimeout(() => {
    setIsConnecting(false);
  }, 2000);
};

  const handleSubmit = () => {
  if (!username || !password) return;
  if (!connected) {
    alert("Pehle PING karo aur connected hone ka wait karo!");
    return;
  }
  if (tab === "login") send({ type: "login", username, password });
  else send({ type: "register", username, password });
};

  return (
    <div style={{
      display: "flex", width: "100vw", height: "100vh",
      background: "var(--bg-primary)", overflow: "hidden"
    }}>
      <div className="grid-bg" />
      <div className="scanlines" />

      {/* ── LEFT — Form ───────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "45%", minWidth: 380,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "48px 56px",
        borderRight: "1px solid rgba(0,255,231,0.08)"
      }}>

        {/* Logo */}
        <div style={{ width: "100%", marginBottom: 40 }}>
          <div className="flicker" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 26, fontWeight: 700, letterSpacing: 4,
            color: "var(--cyan)",
            textShadow: "0 0 20px rgba(0,255,231,0.8), 0 0 60px rgba(0,255,231,0.3)"
          }}>
            ⚡ LANSHARE
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: 5,
            color: "var(--text-muted)", marginTop: 4
          }}>
            SECURE LAN MESSAGING v2.0
          </div>
        </div>

        {/* Greeting */}
        <div style={{ width: "100%", marginBottom: 28 }}>
          <div style={{
            fontSize: 28, fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 6
          }}>
            {tab === "login" ? "Welcome back." : "Create account."}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {tab === "login"
              ? "Sign in to your secure session"
              : "Register and start chatting securely"}
          </div>
        </div>

        {/* Server IP row */}
        <div style={{ width: "100%", marginBottom: 20 }}>
          <label style={{
            display: "block", marginBottom: 6,
            fontSize: 10, letterSpacing: 2,
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase"
          }}>Server IP</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input-neon"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.x"
            />
            <button
              className="btn-neon"
              onClick={handleConnect}
              disabled={isConnecting}
              style={{ whiteSpace: "nowrap", minWidth: 96, fontSize: 11 }}
            >
              {isConnecting ? "···" : connected ? "✓ OK" : "PING"}
            </button>
          </div>

          {/* Status pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 10, padding: "3px 12px",
            background: connected
              ? "rgba(57,255,20,0.07)" : "rgba(255,45,120,0.07)",
            border: `1px solid ${connected
              ? "rgba(57,255,20,0.25)" : "rgba(255,45,120,0.25)"}`,
            borderRadius: 999, fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: connected ? "var(--green)" : "var(--magenta)"
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: connected ? "var(--green)" : "var(--magenta)",
              boxShadow: connected
                ? "0 0 5px var(--green)" : "0 0 5px var(--magenta)"
            }} />
            {connected ? "BRIDGE CONNECTED" : "NOT CONNECTED"}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: "100%", height: 1, marginBottom: 20,
          background: "linear-gradient(90deg, transparent, rgba(0,255,231,0.15), transparent)"
        }} />

        {/* Tab switcher */}
        <div style={{
          width: "100%", display: "flex",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0,255,231,0.1)",
          borderRadius: 10, padding: 4, marginBottom: 20, gap: 4
        }}>
          {["login", "register"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 0",
              background: tab === t
                ? "rgba(0,255,231,0.1)" : "transparent",
              border: tab === t
                ? "1px solid rgba(0,255,231,0.25)" : "1px solid transparent",
              borderRadius: 8,
              color: tab === t ? "var(--cyan)" : "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: 2,
              textTransform: "uppercase", cursor: "pointer",
              transition: "all 0.2s ease"
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Username */}
        <div style={{ width: "100%", marginBottom: 14 }}>
          <label style={{
            display: "block", marginBottom: 6, fontSize: 10,
            letterSpacing: 2, color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase"
          }}>Username</label>
          <input
            className="input-neon"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="enter username"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Password */}
        <div style={{ width: "100%", marginBottom: 28 }}>
          <label style={{
            display: "block", marginBottom: 6, fontSize: 10,
            letterSpacing: 2, color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase"
          }}>Password</label>
          <input
            className="input-neon"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="enter password"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Submit button */}
        <button
          className="btn-neon"
          onClick={handleSubmit}
          disabled={!connected}
          style={{ width: "100%", padding: "13px 0", fontSize: 12, letterSpacing: 3 }}
        >
          {tab === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>

        {/* Footer */}
        <div style={{
          marginTop: 32, fontSize: 10, letterSpacing: 2,
          color: "var(--text-muted)",
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: "center"
        }}>
          AES-256-GCM · LOCAL NETWORK ONLY · NO CLOUD
        </div>
      </div>

      {/* ── RIGHT — Visual Panel ──────────────────── */}
      <div style={{
        position: "relative", flex: 1, zIndex: 10,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        overflow: "hidden"
      }}>

        {/* Big glow orb */}
        <div style={{
          position: "absolute",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,255,231,0.08) 0%, rgba(112,0,255,0.06) 50%, transparent 70%)",
          pointerEvents: "none"
        }} />

        {/* Rotating ring 1 */}
        <div style={{
          position: "absolute",
          width: 340, height: 340, borderRadius: "50%",
          border: "1px solid rgba(0,255,231,0.12)",
          animation: "spin 20s linear infinite"
        }} />

        {/* Rotating ring 2 */}
        <div style={{
          position: "absolute",
          width: 440, height: 440, borderRadius: "50%",
          border: "1px solid rgba(112,0,255,0.1)",
          animation: "spin 30s linear infinite reverse"
        }} />

        {/* Rotating ring 3 */}
        <div style={{
          position: "absolute",
          width: 240, height: 240, borderRadius: "50%",
          border: "1px dashed rgba(0,255,231,0.08)",
          animation: "spin 15s linear infinite"
        }} />

        {/* Center icon */}
        <div style={{
          position: "relative", zIndex: 2,
          width: 100, height: 100, borderRadius: "50%",
          background: "rgba(0,255,231,0.06)",
          border: "1px solid rgba(0,255,231,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 40px rgba(0,255,231,0.2), inset 0 0 30px rgba(0,255,231,0.05)",
          fontSize: 40
        }}>
          🔒
        </div>

        {/* Floating feature pills */}
        {[
          { label: "AES-256-GCM ENCRYPTED", top: "25%", left: "10%", color: "var(--cyan)" },
          { label: "NO INTERNET REQUIRED", top: "35%", right: "8%", color: "#a855f7" },
          { label: "ZERO CLOUD STORAGE", bottom: "35%", left: "8%", color: "var(--magenta)" },
          { label: "LAN ONLY · PORT 5555", bottom: "25%", right: "10%", color: "var(--green)" },
        ].map((pill) => (
          <div key={pill.label} style={{
            position: "absolute",
            top: pill.top, bottom: pill.bottom,
            left: pill.left, right: pill.right,
            padding: "6px 14px",
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${pill.color}33`,
            borderRadius: 999,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: 2,
            color: pill.color,
            whiteSpace: "nowrap",
            boxShadow: `0 0 12px ${pill.color}22`
          }}>
            {pill.label}
          </div>
        ))}

        {/* Bottom tagline */}
        <div style={{
          position: "absolute", bottom: 40,
          textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: 3,
          color: "var(--text-muted)"
        }}>
          ENCRYPTED · PRIVATE · LOCAL
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}