import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const CHANNEL = "chat_messages";

export const redisPublisher = new Redis(redisUrl);
export const redisSubscriber = new Redis(redisUrl);

// Log de connexion
redisPublisher.on("connect", () => console.log("[Redis] Connected"));
redisSubscriber.on("connect", () => console.log("[Redis Subscriber] Connected"));

// Fonction pour publier un message
export const publishChatMessage = async (messageData) => {
  redisPublisher.publish(CHANNEL, JSON.stringify(messageData));
};

// Fonction pour écouter les messages du canal
export const subscribeChatMessages = () => {
  redisSubscriber.subscribe(CHANNEL, (err) => {
    if (err) 
        {
            console.error("[Redis Subscribe Error]", err);
            return;
        }
  });
};

// Fonction pour gérer les messages reçus
export const handleChatMessage = (callback) => {
    redisSubscriber.on("message", (channel, message) => {
        if (channel === CHANNEL) {
            const messageData = JSON.parse(message);
            callback(messageData);
        }
    });
};
