import { publishChatMessage } from "../config/redis.js";

export function registerChatHandlers(socket, io) {

  socket.on("join room", (data) => {
    socket.join(data.room);
    socket.data.username = data.username;
    socket.data.room = data.room;
    // on utilise "io" pcq on envoie à tout le monde y compris lui même
    io.to(data.room).emit("room_message", { message: `${data.username} a rejoint le salon ${data.room}.`});
    console.log(`${data.username} a rejoint le salon ${data.room}`);
  });

  socket.on("chat_message", async (data) => {
    const messageData = {
      username: data.username,
      room: data.room,
      message: data.message,
      timestamp: Date.now(),
    };

    // on publie sur redis
    await publishChatMessage(messageData);
    console.log(`[Redis] Message publié pour le salon ${data.room}`);
  });

  socket.on("disconnect", () => {
    if (socket.data.username && socket.data.room) {
        // on utilise "socket" et pas "io" pcq on envoie à tlm sauf lui même 
        socket.to(socket.data.room).emit("room_message", {message: `${socket.data.username} a quitté le salon ${socket.data.room}.`,});
        console.log(`${socket.data.username} a quitté le salon ${socket.data.room}`);
    }
  });
}
