import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  // Connection
  connected: false,
  setConnected: (val) => set({ connected: val }),

  // Auth
  myUserID: null,
  isAuthenticated: false,

  // Contacts & Groups
  users: [],
  groups: [],
  currentContact: null,      // { id, name, isGroup }
  setCurrentContact: (contact) => set({ currentContact: contact }),

  // Messages — { [contactID]: [{from, encrypted, decrypted, timestamp, isOwn}] }
  messages: {},

  // Unread counts — { [contactID]: number }
  unreadCounts: {},

  // File transfers — { [fromUserID]: { filename, size, percent } }
  fileTransfers: {},

  // ─────────────────────────────────────────────
  //  Handle all incoming messages from C++
  // ─────────────────────────────────────────────
  handleServerMessage: (msg) => {
    const state = get();

    switch (msg.type) {

      // Auth response
      case "auth": {
        if (msg.success) {
          set({ myUserID: msg.userID, isAuthenticated: true });
          console.log("✅ Auto-logged in as:", msg.userID);
          get().sendFn?.({ type: "userList" });
        } else {
          set({ isAuthenticated: false });
          alert("Auth failed: " + msg.reason);
        }
        break;
      }

      // Connection status
      case "connection": {
        set({ connected: msg.connected });
        if (!msg.connected) {
          set({ isAuthenticated: false, myUserID: null, users: [], groups: [] });
        }
        break;
      }

      // User list updated
      case "userList": {
        const myID = get().myUserID;
        const filtered = msg.users.filter((u) => u !== myID);
        set({ users: filtered });
        break;
      }

      // Private message received
      case "message": {
        const { from, encrypted, timestamp } = msg;
        const newMsg = {
          from,
          encrypted,
          decrypted: null,
          timestamp: parseInt(timestamp),
          isOwn: false,
          isGroup: false,
        };
        set((state) => {
          const prev = state.messages[from] || [];
          const currentContact = state.currentContact;
          const isActive = currentContact?.id === from;
          return {
            messages: { ...state.messages, [from]: [...prev, newMsg] },
            unreadCounts: {
              ...state.unreadCounts,
              [from]: isActive ? 0 : (state.unreadCounts[from] || 0) + 1,
            },
          };
        });
        break;
      }

      // Group message received
      case "groupMessage": {
        const { group, from, encrypted, timestamp } = msg;
        const newMsg = {
          from,
          encrypted,
          decrypted: null,
          timestamp: parseInt(timestamp),
          isOwn: false,
          isGroup: true,
          group,
        };
        set((state) => {
          const prev = state.messages[group] || [];
          const isActive = state.currentContact?.id === group;
          return {
            messages: { ...state.messages, [group]: [...prev, newMsg] },
            unreadCounts: {
              ...state.unreadCounts,
              [group]: isActive ? 0 : (state.unreadCounts[group] || 0) + 1,
            },
          };
        });
        break;
      }

      // Decrypted message back from C++
      case "decrypted": {
        const { from, message, context, group } = msg;
        const contactID = context === "group" ? group : from;
        set((state) => {
          const msgs = state.messages[contactID] || [];
          // Find last encrypted message from this sender and decrypt it
          const updated = [...msgs];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].from === from && updated[i].decrypted === null) {
              updated[i] = { ...updated[i], decrypted: message };
              break;
            }
          }
          return { messages: { ...state.messages, [contactID]: updated } };
        });
        break;
      }

      // Group created — code received
      case "groupCode": {
        const { group, code } = msg;
        set((state) => ({
          groups: [...state.groups, group],
        }));
        alert(`Group "${group}" created!\nJoin code: ${code}`);
        break;
      }

      // File transfer events
      case "fileStart": {
        set((state) => ({
          fileTransfers: {
            ...state.fileTransfers,
            [msg.from]: { filename: msg.filename, size: msg.size, percent: 0 },
          },
        }));
        break;
      }

      case "fileProgress": {
        set((state) => ({
          fileTransfers: {
            ...state.fileTransfers,
            [msg.from]: {
              ...state.fileTransfers[msg.from],
              percent: msg.percent,
            },
          },
        }));
        break;
      }

      case "fileComplete": {
        set((state) => {
          const ft = { ...state.fileTransfers };
          delete ft[msg.from];
          return { fileTransfers: ft };
        });
        alert(`File received: ${msg.filename} (saved to Downloads)`);
        break;
      }

      case "fileError": {
        alert(`File error from ${msg.from}: ${msg.reason}`);
        break;
      }

      default:
        console.warn("Unknown message type:", msg.type);
    }
  },

  // Send function — set by App.jsx after useWebSocket hook initializes
  sendFn: null,
  setSendFn: (fn) => set({ sendFn: fn }),

  // Clear unread for current contact
  clearUnread: (contactID) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [contactID]: 0 },
    })),

  // Add own sent message to history
  addOwnMessage: (contactID, text, isGroup) =>
    set((state) => {
      const prev = state.messages[contactID] || [];
      return {
        messages: {
          ...state.messages,
          [contactID]: [
            ...prev,
            {
              from: state.myUserID,
              encrypted: null,
              decrypted: text,
              timestamp: Math.floor(Date.now() / 1000),
              isOwn: true,
              isGroup,
            },
          ],
        },
      };
    }),

  // Add joined group to list
  addGroup: (groupName) =>
    set((state) => ({
      groups: state.groups.includes(groupName)
        ? state.groups
        : [...state.groups, groupName],
    })),
}));