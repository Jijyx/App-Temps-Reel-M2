import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // Pour générer un ID unique pour chaque connexion WebSocket

// Map pour stocker les connexions WebSocket et leur pseudo : Map<WebSocket, string>
const clients = new Map();

export function startWebSocketServer(server) {
    // Crée le serveur WebSocket en lui attachant le serveur HTTP existant
    const wss = new WebSocketServer({ 
        server,
        path: '/websocket/chat' // Utiliser un chemin spécifique pour l'upgrade WS
    });

    console.log("Serveur WebSocket démarré et écoutant sur le chemin '/websocket/chat'");

    wss.on('connection', function connection(ws, req) {
        // Ajouter un ID temporaire ou utiliser l'objet ws lui-même comme clé
        // L'ajout au map et la définition du pseudo se feront à la réception du 1er message 'username'
        ws.id = uuidv4(); 
        
        let pseudo = null;

        ws.on('message', function incoming(message) {
            try {
                const data = JSON.parse(message.toString());

                // 1. Gestion du message d'enregistrement (username)
                if (data.type === "username" && !pseudo) {
                    pseudo = data.name;
                    clients.set(ws, pseudo);
                    console.log(`[${pseudo}] s'est connecté`);

                    // Envoyer un message d'information à TOUS les autres clients
                    const joinMessage = JSON.stringify({ type: "info", text: `${pseudo} a rejoint le chat ! :)` });
                    broadcast(joinMessage, ws); // Exclure l'expéditeur

                // 2. Gestion des messages de chat
                } else if (data.type === "message" && pseudo) {
                    console.log(`[${pseudo}] : ${data.text}`);
                    
                    const chatMessage = JSON.stringify({ 
                        type: "message", 
                        name: pseudo, 
                        text: data.text 
                    });
                    
                    // MODIFICATION ICI: Diffuser à TOUS les clients SAUF l'expéditeur
                    broadcast(chatMessage, ws); 
                }
            } catch (e) {
                console.error("Erreur de parsing ou de traitement du message WS:", e);
            }
        });

        ws.on('close', () => {
            if (pseudo) {
                console.log(`[${pseudo}] s'est déconnecté`);
                clients.delete(ws);
                
                // Envoyer un message d'information de déconnexion à tous les clients restants
                const leaveMessage = JSON.stringify({ type: "info", text: `${pseudo} a quitté le chat` });
                broadcast(leaveMessage);
            }
        });
        
        ws.on('error', (error) => {
            console.error(`Erreur WebSocket pour [${pseudo || 'Client inconnu'}] :`, error);
        });
    });

    // on diffuse un message à tous les clients connectés (si on veut exclure un client, on rempli excludeClient)
    function broadcast(message, excludeClient = null) {
        wss.clients.forEach(function each(client) {
            if (client !== excludeClient && client.readyState === client.OPEN) {
                client.send(message);
            }
        });
    }

    return wss;
}
