#include "WebSocketServer.h"
#include <iostream>

namespace LanShare {

// ─────────────────────────────────────────────
//  WebSocketSession
// ─────────────────────────────────────────────

WebSocketSession::WebSocketSession(tcp::socket socket, WebSocketServer& server)
    : ws_(std::move(socket))
    , server_(server)
{}

void WebSocketSession::start() {
    ws_.async_accept([self = shared_from_this()](beast::error_code ec) {
        if (!ec) {
            std::cout << "[WS] Browser connected\n";
            self->doRead();
        } else {
            std::cerr << "[WS] Accept error: " << ec.message() << "\n";
        }
    });
}

void WebSocketSession::doRead() {
    ws_.async_read(buffer_,
        [self = shared_from_this()](beast::error_code ec, std::size_t) {
            if (!ec) {
                std::string msg = beast::buffers_to_string(self->buffer_.data());
                self->buffer_.consume(self->buffer_.size());
                self->server_.onMessage(msg);
                self->doRead();
            } else {
                std::cout << "[WS] Browser disconnected\n";
                self->server_.removeSession(self);
            }
        });
}

void WebSocketSession::send(const std::string& message) {
    std::lock_guard<std::mutex> lock(writeMutex_);
    writeQueue_.push_back(message);
    if (!writing_) {
        writing_ = true;
        doWrite();
    }
}

void WebSocketSession::doWrite() {
    if (writeQueue_.empty()) { writing_ = false; return; }

    std::string msg = writeQueue_.front();
    writeQueue_.erase(writeQueue_.begin());

    ws_.async_write(net::buffer(msg),
        [self = shared_from_this(), msg](beast::error_code ec, std::size_t) {
            std::lock_guard<std::mutex> lock(self->writeMutex_);
            if (!ec) {
                self->doWrite();
            } else {
                self->writing_ = false;
                std::cerr << "[WS] Write error: " << ec.message() << "\n";
            }
        });
}

// ─────────────────────────────────────────────
//  WebSocketServer
// ─────────────────────────────────────────────

WebSocketServer::WebSocketServer(net::io_context& ioc, unsigned short port)
    : ioc_(ioc)
    , acceptor_(ioc, tcp::endpoint(tcp::v4(), port))
{
    std::cout << "[WS] WebSocket server ready on port " << port << "\n";
}

void WebSocketServer::start() {
    doAccept();
}

void WebSocketServer::doAccept() {
    acceptor_.async_accept(
        [this](beast::error_code ec, tcp::socket socket) {
            if (!ec) {
                auto session = std::make_shared<WebSocketSession>(
                    std::move(socket), *this);
                addSession(session);
                session->start();
            }
            doAccept(); // keep accepting
        });
}

void WebSocketServer::broadcast(const std::string& jsonMessage) {
    std::lock_guard<std::mutex> lock(sessionsMutex_);
    for (auto& session : sessions_) {
        session->send(jsonMessage);
    }
}

void WebSocketServer::sendTo(std::shared_ptr<WebSocketSession> session,
                              const std::string& msg) {
    session->send(msg);
}

void WebSocketServer::setCommandCallback(WSCommandCallback cb) {
    commandCallback_ = cb;
}

void WebSocketServer::onMessage(const std::string& message) {
    if (commandCallback_) commandCallback_(message);
}

void WebSocketServer::addSession(std::shared_ptr<WebSocketSession> session) {
    std::lock_guard<std::mutex> lock(sessionsMutex_);
    sessions_.insert(session);
    std::cout << "[WS] Sessions active: " << sessions_.size() << "\n";
}

void WebSocketServer::removeSession(std::shared_ptr<WebSocketSession> session) {
    std::lock_guard<std::mutex> lock(sessionsMutex_);
    sessions_.erase(session);
    std::cout << "[WS] Sessions active: " << sessions_.size() << "\n";
}

} // namespace LanShare