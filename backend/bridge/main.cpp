#include <iostream>
#include <memory>
#include <string>
#include <boost/asio.hpp>
#include "../client/ClientCore.h"
#include "WebSocketServer.h"
#include "MessageHandler.h"

int main() {
    std::cout << "╔══════════════════════════════════════╗\n";
    std::cout << "║     LanShare C++ v2 — Bridge App     ║\n";
    std::cout << "║  WebSocket: ws://localhost:8080       ║\n";
    std::cout << "╚══════════════════════════════════════╝\n\n";

    try {
        // Single io_context — WebSocket server + ClientCore dono isme chalenge
        boost::asio::io_context ioc;

        // ClientCore — LanShare server se baat karega
        auto client = std::make_shared<LanShare::ClientCore>();

        // WebSocket server — browser se baat karega
        auto wsServer = std::make_shared<LanShare::WebSocketServer>(ioc, 8080);

        // MessageHandler — dono ko jodega
        auto handler = std::make_shared<LanShare::MessageHandler>(client, wsServer);

        // Saare callbacks register karo
        handler->registerCallbacks();

        // ClientCore ka async IO start karo
        client->startAsync();

        // WebSocket server start karo
        wsServer->start();

        std::cout << "[App] Bridge running...\n";
        std::cout << "[App] Open browser at: http://localhost:8080\n";
        std::cout << "[App] Press Ctrl+C to stop\n\n";

        // WebSocket ka io_context run karo — yahan block hoga
        ioc.run();

    } catch (const std::exception& e) {
        std::cerr << "[FATAL] " << e.what() << "\n";
        return 1;
    }

    return 0;
}