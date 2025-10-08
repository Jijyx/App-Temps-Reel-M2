import { registerChatHandlers } from "../handlers/chatHandler.js";
import { handleChatMessage, subscribeChatMessages } from "../config/redis.js";

export function initSocketIoChat(io) {
    // 1. Écoute des connexions clients
    io.on("connection", (socket) => {
        console.log(`[Socket] Nouvelle connexion: ${socket.id}`);
        registerChatHandlers(socket, io);
    });

    // 2. Souscris au canal redis
    subscribeChatMessages();

    // 3. on s'occupe des messages reçus de redis
    handleChatMessage((messageData) => {
        if (messageData.room) {
            io.to(messageData.room).emit("chat_message", messageData);
        }
        else{
            io.emit("chat_message", messageData);
        }
    });
}
