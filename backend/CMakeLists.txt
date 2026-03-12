cmake_minimum_required(VERSION 3.15)
project(LanShareCPPv2 VERSION 2.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

find_package(Boost 1.70 REQUIRED COMPONENTS system thread)
find_package(OpenSSL REQUIRED)
find_library(SQLITE3_LIB sqlite3 REQUIRED)
set(SQLITE3_LIBRARIES ${SQLITE3_LIB})

include_directories(
    ${CMAKE_SOURCE_DIR}
    ${Boost_INCLUDE_DIRS}
    ${OPENSSL_INCLUDE_DIR}
)

# ── Common ─────────────────────────────────────────────────────────────────
add_library(LanShareCommon STATIC
    common/Protocol.h
    common/AESGCM.h
    common/AESGCM.cpp
)
target_link_libraries(LanShareCommon
    OpenSSL::SSL OpenSSL::Crypto stdc++fs)

# ── Server ─────────────────────────────────────────────────────────────────
add_library(LanShareServer STATIC
    server/ServerCore.h    server/ServerCore.cpp
    server/ClientSession.h server/ClientSession.cpp
    server/AuthManager.h   server/AuthManager.cpp
    server/GroupManager.h  server/GroupManager.cpp
    server/MessageRouter.h server/MessageRouter.cpp
)
target_link_libraries(LanShareServer
    LanShareCommon Boost::system Boost::thread)

# ── Client ─────────────────────────────────────────────────────────────────
add_library(LanShareClient STATIC
    client/ClientCore.h
    client/ClientCore.cpp
)
target_link_libraries(LanShareClient
    LanShareCommon Boost::system Boost::thread stdc++fs)

# ── Bridge ─────────────────────────────────────────────────────────────────
add_library(LanShareBridge STATIC
    bridge/WebSocketServer.h   bridge/WebSocketServer.cpp
    bridge/MessageHandler.h    bridge/MessageHandler.cpp
)
target_link_libraries(LanShareBridge
    LanShareClient LanShareCommon Boost::system Boost::thread)

# ── Server exe ─────────────────────────────────────────────────────────────
add_executable(lanshare_server server/main.cpp)
target_link_libraries(lanshare_server
    LanShareServer LanShareCommon Boost::system Boost::thread)

# ── App exe (WebSocket Bridge + ClientCore) ────────────────────────────────
add_executable(lanshare_app bridge/main.cpp)
target_link_libraries(lanshare_app
    LanShareBridge LanShareClient LanShareCommon
    Boost::system Boost::thread
    stdc++fs
    ${SQLITE3_LIBRARIES})

# ── Windows extras ─────────────────────────────────────────────────────────
if(WIN32)
    target_link_libraries(lanshare_server ws2_32 wsock32)
    target_link_libraries(lanshare_app    ws2_32 wsock32)
endif()

message(STATUS "")
message(STATUS "LanShareCPP v2 Build Configuration")
message(STATUS "===================================")
message(STATUS "Build type:   ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Boost:        ${Boost_VERSION}")
message(STATUS "OpenSSL:      ${OPENSSL_VERSION}")
message(STATUS "")
