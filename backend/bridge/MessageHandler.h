#ifndef MESSAGEHANDLER_H
#define MESSAGEHANDLER_H

#include "../client/ClientCore.h"
#include "WebSocketServer.h"
#include "../common/AESGCM.h"
#include <string>
#include <memory>

namespace LanShare {

class MessageHandler {
public:
    MessageHandler(std::shared_ptr<ClientCore> client,
                   std::shared_ptr<WebSocketServer> wsServer);

    void registerCallbacks();
    void handleCommand(const std::string& jsonMessage);

private:
    void onAuth        (bool success, const std::string& userID, const std::string& reason);
    void onMessage     (const std::string& fromUserID, const std::vector<uint8_t>& encrypted, uint64_t timestamp);
    void onGroupMessage(const std::string& groupName, const std::string& fromUserID, const std::vector<uint8_t>& encrypted, uint64_t timestamp);
    void onUserList    (const std::vector<std::string>& users);
    void onConnection  (bool connected, const std::string& reason);
    void onGroupCode   (const std::string& groupName, const std::string& code);
    void onFileMetadata(const std::string& fromUserID, const std::string& filename, uint64_t filesize);
    void onFileProgress(const std::string& userID, int percent);
    void onFileComplete(const std::string& fromUserID, const std::string& filename);
    void onFileError   (const std::string& userID, const std::string& reason);

    std::string makeJson(const std::string& type,
                         const std::vector<std::pair<std::string,std::string>>& fields);
    std::string toBase64(const std::vector<uint8_t>& data);
    std::vector<uint8_t> fromBase64(const std::string& b64);

    std::shared_ptr<ClientCore>      client_;
    std::shared_ptr<WebSocketServer> wsServer_;
    std::string pendingHostname_;
};

} // namespace LanShare

#endif // MESSAGEHANDLER_H