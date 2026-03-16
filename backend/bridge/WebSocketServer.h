#ifndef WEBSOCKETSERVER_H
#define WEBSOCKETSERVER_H

#include <boost/asio.hpp>
#include <boost/beast.hpp>
#include <boost/beast/websocket.hpp>
#include <string>
#include <memory>
#include <functional>
#include <vector>
#include <mutex>
#include <set>

namespace beast     = boost::beast;
namespace websocket = beast::websocket;
namespace net       = boost::asio;
using tcp           = net::ip::tcp;

namespace LanShare {

// Forward declaration — WebSocketSession se pehle WebSocketServer ka naam batao
class WebSocketServer;

using WSCommandCallback = std::function<void(const std::string& jsonMessage)>;

class WebSocketSession : public std::enable_shared_from_this<WebSocketSession> {
public:
    explicit WebSocketSession(tcp::socket socket, WebSocketServer& server);
    void start();
    void send(const std::string& message);

private:
    void doRead();
    void doWrite();

    websocket::stream<tcp::socket> ws_;
    WebSocketServer& server_;
    beast::flat_buffer buffer_;
    std::vector<std::string> writeQueue_;
    std::mutex writeMutex_;
    bool writing_ = false;
};

class WebSocketServer {
public:
    explicit WebSocketServer(net::io_context& ioc, unsigned short port = 8080);

    void start();
    void broadcast(const std::string& jsonMessage);
    void sendTo(std::shared_ptr<WebSocketSession> session, const std::string& msg);
    void setCommandCallback(WSCommandCallback cb);
    void onMessage(const std::string& message);
    void addSession(std::shared_ptr<WebSocketSession> session);
    void removeSession(std::shared_ptr<WebSocketSession> session);

private:
    void doAccept();

    net::io_context& ioc_;
    tcp::acceptor acceptor_;
    WSCommandCallback commandCallback_;
    std::set<std::shared_ptr<WebSocketSession>> sessions_;
    std::mutex sessionsMutex_;
};

} // namespace LanShare

#endif // WEBSOCKETSERVER_H