#include "MessageHandler.h"
#include <iostream>
#include <sstream>
#include <stdexcept>

// ── tiny Base64 (no external dependency) ──────────────────────────────────
static const std::string B64_CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

namespace LanShare {

// ─────────────────────────────────────────────
//  Constructor
// ─────────────────────────────────────────────
MessageHandler::MessageHandler(std::shared_ptr<ClientCore> client,
                               std::shared_ptr<WebSocketServer> wsServer)
    : client_(client)
    , wsServer_(wsServer)
{}
// ─────────────────────────────────────────────
//  Register all callbacks
// ─────────────────────────────────────────────

void MessageHandler::registerCallbacks() {

    client_->setAuthCallback(
        [this](bool ok, const std::string& uid, const std::string& reason) {
            onAuth(ok, uid, reason);
        });

    client_->setConnectionCallback(
        [this](bool connected, const std::string& reason) {
            onConnection(connected, reason);
        });

    client_->setMessageCallback(
        [this](const std::string& from, const std::vector<uint8_t>& enc, uint64_t ts) {
            onMessage(from, enc, ts);
        });

    client_->setGroupMessageCallback(
        [this](const std::string& group, const std::string& from,
               const std::vector<uint8_t>& enc, uint64_t ts) {
            onGroupMessage(group, from, enc, ts);
        });

    client_->setUserListCallback(
        [this](const std::vector<std::string>& users) {
            onUserList(users);
        });

    client_->setGroupCodeCallback(
        [this](const std::string& groupName, const std::string& code) {
            onGroupCode(groupName, code);
        });

    client_->setFileMetadataCallback(
        [this](const std::string& from, const std::string& filename, uint64_t size) {
            onFileMetadata(from, filename, size);
        });

    client_->setFileProgressCallback(
        [this](const std::string& uid, int pct) {
            onFileProgress(uid, pct);
        });

    client_->setFileCompleteCallback(
        [this](const std::string& from, const std::string& filename) {
            onFileComplete(from, filename);
        });

    client_->setFileErrorCallback(
        [this](const std::string& uid, const std::string& reason) {
            onFileError(uid, reason);
        });

    // Wire WebSocket commands → handleCommand
    wsServer_->setCommandCallback(
        [this](const std::string& json) {
            handleCommand(json);
        });

    std::cout << "[Bridge] All callbacks registered\n";
}

// ─────────────────────────────────────────────
//  Callbacks → JSON → Browser
// ─────────────────────────────────────────────

void MessageHandler::onAuth(bool success, const std::string& userID,
                             const std::string& reason) {
    if (!success) {
        if (reason.find("already exists") != std::string::npos && 
            !pendingHostname_.empty()) {
            // Username exists — try login
            std::cout << "[Bridge] Already registered, logging in...\n";
            std::string hostname = pendingHostname_;
            client_->login(hostname, "lanshare-auto-" + hostname);
            return;
        }
        // Other auth failure
        wsServer_->broadcast(makeJson("auth", {
            {"success", "false"},
            {"userID",  ""},
            {"reason",  reason}
        }));
        return;
    }
    
    // Success!
    pendingHostname_ = "";
    std::cout << "[Bridge] Logged in as: " << userID << "\n";
    wsServer_->broadcast(makeJson("auth", {
        {"success", "true"},
        {"userID",  userID},
        {"reason",  reason}
    }));
}

void MessageHandler::onConnection(bool connected, const std::string& reason) {
    wsServer_->broadcast(makeJson("connection", {
        {"connected", connected ? "true" : "false"},
        {"reason",    reason}
    }));
    
    if (connected && !pendingHostname_.empty()) {
        std::cout << "[Bridge] Auto-login: " << pendingHostname_ << "\n";
        // Try register first — server will fail if already exists
        client_->registerUser(pendingHostname_, "lanshare-auto-" + pendingHostname_);
    }
}

void MessageHandler::onMessage(const std::string& fromUserID,
                                const std::vector<uint8_t>& encrypted,
                                uint64_t timestamp) {
    wsServer_->broadcast(makeJson("message", {
        {"from",      fromUserID},
        {"encrypted", toBase64(encrypted)},
        {"timestamp", std::to_string(timestamp)}
    }));
}

void MessageHandler::onGroupMessage(const std::string& groupName,
                                     const std::string& fromUserID,
                                     const std::vector<uint8_t>& encrypted,
                                     uint64_t timestamp) {
    wsServer_->broadcast(makeJson("groupMessage", {
        {"group",     groupName},
        {"from",      fromUserID},
        {"encrypted", toBase64(encrypted)},
        {"timestamp", std::to_string(timestamp)}
    }));
}

void MessageHandler::onUserList(const std::vector<std::string>& users) {
    // Build JSON array manually
    std::string arr = "[";
    for (size_t i = 0; i < users.size(); i++) {
        arr += "\"" + users[i] + "\"";
        if (i + 1 < users.size()) arr += ",";
    }
    arr += "]";

    wsServer_->broadcast("{\"type\":\"userList\",\"users\":" + arr + "}");
}

void MessageHandler::onGroupCode(const std::string& groupName,
                                  const std::string& code) {
    wsServer_->broadcast(makeJson("groupCode", {
        {"group", groupName},
        {"code",  code}
    }));
}

void MessageHandler::onFileMetadata(const std::string& fromUserID,
                                     const std::string& filename,
                                     uint64_t filesize) {
    wsServer_->broadcast(makeJson("fileStart", {
        {"from",     fromUserID},
        {"filename", filename},
        {"size",     std::to_string(filesize)}
    }));
}

void MessageHandler::onFileProgress(const std::string& userID, int percent) {
    wsServer_->broadcast(makeJson("fileProgress", {
        {"from",    userID},
        {"percent", std::to_string(percent)}
    }));
}

void MessageHandler::onFileComplete(const std::string& fromUserID,
                                     const std::string& filename) {
    wsServer_->broadcast(makeJson("fileComplete", {
        {"from",     fromUserID},
        {"filename", filename}
    }));
}

void MessageHandler::onFileError(const std::string& userID,
                                  const std::string& reason) {
    wsServer_->broadcast(makeJson("fileError", {
        {"from",   userID},
        {"reason", reason}
    }));
}

// ─────────────────────────────────────────────
//  Browser → JSON → ClientCore
// ─────────────────────────────────────────────

void MessageHandler::handleCommand(const std::string& json) {
    std::cout << "[Bridge] Command: " << json << "\n";

    // Simple JSON field extractor — no external lib
    auto extract = [&](const std::string& key) -> std::string {
        std::string search = "\"" + key + "\":\"";
        size_t pos = json.find(search);
        if (pos == std::string::npos) return "";
        pos += search.size();
        size_t end = json.find("\"", pos);
        return end == std::string::npos ? "" : json.substr(pos, end - pos);
    };

    std::string type = extract("type");

    if (type == "connect") {
    std::string ip       = extract("ip");
    std::string port     = extract("port");
    std::string hostname = extract("hostname");
    unsigned short p = port.empty() ? 5555 : (unsigned short)std::stoi(port);
    
    // Store hostname for auto-login after connection
    pendingHostname_ = hostname.empty() ? "unknown-device" : hostname;
    client_->connect(ip, p);

    } else if (type == "register") {
        client_->registerUser(extract("username"), extract("password"));

    } else if (type == "login") {
        client_->login(extract("username"), extract("password"));

    } else if (type == "logout") {
        client_->logout();

    } else if (type == "send") {
        // Browser bhejta hai plain text → C++ encrypt karta hai
        std::string to      = extract("to");
        std::string message = extract("message");
        std::string myID    = client_->getUserID();

        std::vector<std::string> ids = {myID, to};
        std::sort(ids.begin(), ids.end());
        AESGCM::Key key = AESGCM::deriveKeyFromPassword(
            ids[0] + ":" + ids[1] + ":lanshare-v1", "lanshare-salt-2024");

        auto enc  = client_->getCrypto().encrypt(
            std::vector<uint8_t>(message.begin(), message.end()), key);
        auto blob = enc.serialize();
        client_->sendPrivateMessage(to, blob);

    } else if (type == "sendGroup") {
        std::string group   = extract("group");
        std::string message = extract("message");

        AESGCM::Key key = AESGCM::deriveKeyFromPassword(
            "group:" + group + ":lanshare-v1", "lanshare-salt-2024");

        auto enc  = client_->getCrypto().encrypt(
            std::vector<uint8_t>(message.begin(), message.end()), key);
        auto blob = enc.serialize();
        client_->sendGroupMessage(group, blob);

    } else if (type == "decrypt") {
        // Browser encrypted blob bhejta hai → C++ decrypt karke wapas bhejta hai
        std::string from    = extract("from");
        std::string b64     = extract("encrypted");
        std::string myID    = client_->getUserID();
        std::string context = extract("context"); // "private" or "group"
        std::string group   = extract("group");

        try {
            auto blob = fromBase64(b64);
            AESGCM::Key key;

            if (context == "group") {
                key = AESGCM::deriveKeyFromPassword(
                    "group:" + group + ":lanshare-v1", "lanshare-salt-2024");
            } else {
                std::vector<std::string> ids = {myID, from};
                std::sort(ids.begin(), ids.end());
                key = AESGCM::deriveKeyFromPassword(
                    ids[0] + ":" + ids[1] + ":lanshare-v1", "lanshare-salt-2024");
            }

            auto encData  = AESGCM::EncryptedData::deserialize(blob);
            auto decrypted = client_->getCrypto().decryptToString(encData, key);

            wsServer_->broadcast(makeJson("decrypted", {
                {"from",    from},
                {"message", decrypted},
                {"context", context},
                {"group",   group}
            }));
        } catch (const std::exception& e) {
            wsServer_->broadcast(makeJson("decryptError", {
                {"from",   from},
                {"reason", std::string(e.what())}
            }));
        }

    } else if (type == "createGroup") {
        client_->createGroup(extract("group"));

    } else if (type == "joinGroup") {
        client_->joinGroup(extract("group"), extract("code"));

    } else if (type == "leaveGroup") {
        client_->leaveGroup(extract("group"));

    } else if (type == "userList") {
        client_->requestUserList();

    } else if (type == "sendFile") {
        std::string to       = extract("to");
        std::string filepath = extract("path");
        bool isGroup         = extract("isGroup") == "true";
        client_->sendFile(to, filepath, isGroup);

    } else {
        std::cerr << "[Bridge] Unknown command: " << type << "\n";
    }
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

std::string MessageHandler::makeJson(
    const std::string& type,
    const std::vector<std::pair<std::string,std::string>>& fields)
{
    std::string json = "{\"type\":\"" + type + "\"";
    for (auto& [k, v] : fields) {
        // if value is a raw bool or number — no quotes
        bool raw = (v == "true" || v == "false" ||
                    (!v.empty() && (std::isdigit(v[0]) || v[0] == '-')));
        json += ",\"" + k + "\":" + (raw ? v : "\"" + v + "\"");
    }
    json += "}";
    return json;
}

std::string MessageHandler::toBase64(const std::vector<uint8_t>& data) {
    std::string out;
    int val = 0, valb = -6;
    for (uint8_t c : data) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            out.push_back(B64_CHARS[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) out.push_back(B64_CHARS[((val << 8) >> (valb + 8)) & 0x3F]);
    while (out.size() % 4) out.push_back('=');
    return out;
}

std::vector<uint8_t> MessageHandler::fromBase64(const std::string& b64) {
    std::vector<int> T(256, -1);
    for (int i = 0; i < 64; i++) T[B64_CHARS[i]] = i;
    std::vector<uint8_t> out;
    int val = 0, valb = -8;
    for (uint8_t c : b64) {
        if (T[c] == -1) break;
        val = (val << 6) + T[c];
        valb += 6;
        if (valb >= 0) {
            out.push_back((val >> valb) & 0xFF);
            valb -= 8;
        }
    }
    return out;
}

} // namespace LanShare