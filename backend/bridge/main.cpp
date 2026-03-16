#include <iostream>
#include <memory>
#include <string>
#include <boost/asio.hpp>
#include "../client/ClientCore.h"
#include "../server/AuthManager.h"
#include "WebSocketServer.h"
#include "MessageHandler.h"

int main() {
    std::cout << "╔══════════════════════════════════════╗\n";
    std::cout << "║     LanShare C++ v2 — Bridge App     ║\n";
    std::cout << "║  WebSocket: ws://localhost:8080       ║\n";
    std::cout << "╚══════════════════════════════════════╝\n\n";

    try {
        boost::asio::io_context ioc;

        auto client     = std::make_shared<LanShare::ClientCore>();
        auto wsServer   = std::make_shared<LanShare::WebSocketServer>(ioc, 8080);

        // Load existing users if any

       auto handler = std::make_shared<LanShare::MessageHandler>(client, wsServer);


        handler->registerCallbacks();
        client->startAsync();
        wsServer->start();

        std::cout << "[App] Bridge running...\n";
        std::cout << "[App] Open browser at: http://localhost:8080\n";
        std::cout << "[App] Press Ctrl+C to stop\n\n";

        ioc.run();

    } catch (const std::exception& e) {
        std::cerr << "[FATAL] " << e.what() << "\n";
        return 1;
    }

    return 0;
}