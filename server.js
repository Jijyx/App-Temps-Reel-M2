import express from 'express';
import path from 'path';
import http from 'http'; // Ajouté pour Socket.IO et WebSocket
import { Server as IOServer } from 'socket.io'; // Ajouté pour Socket.IO
import { fileURLToPath } from 'url'; // Nécessaire pour obtenir __dirname
import longPollingRoutes from './routes/longPolling.js'; // L'extension .js est obligatoire en ES Module
import streamingDonneesSSERoutes from './routes/streamingDonneesSSE.js';
import { startWebSocketServer } from './routes/webSocketChat.js';
import { initSocketIoChat } from './routes/multiRoomChat.js';
import { initCollaborativeApp } from './routes/collaborativeApp.js';

// Utilitaire pour simuler __dirname en mode ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Utiliser express.json() pour parser le corps des requêtes en JSON
app.use(express.json());

// -----------------------------------------------------
// Configuration du chemin statique et des routes
// -----------------------------------------------------

// Sert les fichiers statiques (CSS, JS) depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route principale pour la page d'accueil (Menu des Exercices)
app.get('/', (req, res) => {
    // Sert le fichier public/index.html
    res.sendFile(path.join(__dirname, 'public/pages', 'index.html'));
});

// Route spécifique pour l'Exercice 1 (Gestionnaire de Tâches)
app.get('/longPolling', (req, res) => {
    // Sert le fichier public/longPolling.html
    res.sendFile(path.join(__dirname, 'public/pages', 'longPolling.html'));
});

app.get('/streamingDonneesSSE', (req, res) => {
    // Sert le fichier public/streamingDonneesSSE.html
    res.sendFile(path.join(__dirname, 'public/pages', 'streamingDonneesSSE.html'));
});

app.get('/webSocketChat', (req, res) => {
    // Sert le fichier public/pages/webSocketChat.html
    res.sendFile(path.join(__dirname, 'public/pages', 'webSocketChat.html'));
});

app.get('/multiRoomChat', (req, res) => {
    // Sert le fichier public/pages/multiRoomChat.html
    res.sendFile(path.join(__dirname, 'public/pages', 'multiRoomChat.html'));
});

app.get('/collaborativeApp', (req, res) => {
    // Sert le fichier public/pages/collaborativeApp.html
    res.sendFile(path.join(__dirname, 'public/pages', 'collaborativeApp.html'));
});

// -----------------------------------------------------
// Montage des routeurs d'API
// -----------------------------------------------------
app.use('/streamingDonneesSSE', streamingDonneesSSERoutes);
app.use(longPollingRoutes);

// -----------------------------------------------------
// Démarrage du serveur HTTP, WebSocket et Socket.IO
// -----------------------------------------------------
// 1. Créer le serveur HTTP explicitement (obligatoire pour Socket.IO et WebSocket)
const server = http.createServer(app);

// 2. Démarrer le serveur Socket.IO (Exercice 4)
const io = new IOServer(server);
initSocketIoChat(io); // Initialise la logique du chat Socket.IO
initCollaborativeApp(app, server); // Initialise la logique de l'application collaborative

// 3. Initialiser le serveur WebSocket (Exercice 3)
startWebSocketServer(server);

// 4. Écouter sur le port
server.listen(PORT, () => {
    console.log(`Serveur Express démarré sur http://localhost:${PORT}`);
    console.log(`Socket.IO et WebSocket écoutent sur le port ${PORT}`);
});
