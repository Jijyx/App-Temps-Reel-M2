import express from 'express';

const router = express.Router();

// -----------------------------------------------------
// Données et Variables d'État (Gérées localement dans ce module)
// -----------------------------------------------------
let tasks = [
    { "id": 1, "titre": "Faire les courses", "description": "Acheter du lait et des œufs", "status": "todo" },
    { "id": 2, "titre": "Répondre aux emails", "description": "Envoyer les réponses avant midi", "status": "in-progress" },
    { "id": 3, "titre": "Nettoyer la maison", "description": "Passer l'aspirateur et la serpillère", "status": "done" },
    { "id": 4, "titre": "Faire du sport", "description": "30 min de course à pied", "status": "todo" }
];

let tasks_version = 0;
// Tableau pour stocker les objets de réponse des clients en attente
let waiting_clients = []; 


// Fonction pour notifier les clients en attente (quand tasks_version change)
function notifyClients() {
    // On itère sur les clients et on leur envoie la réponse
    waiting_clients.forEach(client => {
        // Envoie les données et la nouvelle version au client
        client.res.status(200).json({ tasks: tasks, version: tasks_version });
        // On annule la minuterie de timeout associée à cette requête
        clearTimeout(client.timeoutId);
    });
    
    // On vide le tableau pour les prochaines requêtes
    waiting_clients = [];
}

// Fonction utilitaire pour incrémenter la version
function incrementVersion() {
    tasks_version++;
}


// -----------------------------------------------------
// 1. Endpoint pour le Long Polling (/tasks GET)
// -----------------------------------------------------
router.get('/tasks', (req, res) => {
    const client_version = parseInt(req.query.version || 0, 10);
    const TIMEOUT = 30000; // 30 secondes en millisecondes

    console.log(`Polling reçu de version ${client_version}. Version serveur: ${tasks_version}`);

    // Fast path: Si le client est en retard sur la version, on renvoie immédiatement
    if (client_version < tasks_version) {
        console.log(` -> Client en retard. Réponse immédiate.`);
        return res.status(200).json({ tasks: tasks, version: tasks_version });
    }

    // Long Polling path: On met le client en attente
    const timeoutId = setTimeout(() => {
        console.log(` -> Timeout atteint. Envoi d'un 204 No Content.`);
        // Retirer ce client de la liste
        const index = waiting_clients.findIndex(client => client.res === res);
        if (index !== -1) {
            waiting_clients.splice(index, 1);
        }
        res.status(204).end(); 
    }, TIMEOUT);

    // Stockage de la réponse et du timeout dans la liste d'attente
    waiting_clients.push({ res, timeoutId });

    console.log(` -> Client en attente. Nombre total d'attente: ${waiting_clients.length}`);
});


// -----------------------------------------------------
// 2. Endpoint pour la Mise à Jour (/tasks/:task_id POST)
// -----------------------------------------------------
router.post('/tasks/:task_id', (req, res) => {
    const taskId = parseInt(req.params.task_id, 10);
    const data = req.body;

    if (!data || typeof data.status !== 'string') {
        return res.status(400).json({ error: "status manquant ou invalide" });
    }

    let updatedTask = null;
    let found = false;

    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) {
            tasks[i].status = data.status;
            updatedTask = tasks[i];
            incrementVersion();
            found = true;
            break;
        }
    }

    if (found) {
        console.log(`Tâche ${taskId} mise à jour. Nouvelle version: ${tasks_version}.`);
        notifyClients(); 
        return res.status(200).json(updatedTask);
    } else {
        return res.status(404).json({ error: "tâche non trouvée" });
    }
});


// -----------------------------------------------------
// 3. Endpoint pour la Création de Tâche (/tasks POST)
// -----------------------------------------------------
router.post('/tasks', (req, res) => {
    const data = req.body;

    if (!data || typeof data.titre !== 'string' || typeof data.description !== 'string') {
        return res.status(400).json({ error: "titre ou description manquant(e) ou invalide" });
    }

    // Déterminer le prochain ID
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

    const newTask = {
        "id": newId,
        "titre": data.titre,
        "description": data.description,
        "status": "todo"
    };

    tasks.push(newTask);
    incrementVersion();

    console.log(`Nouvelle tâche ${newId} ajoutée. Nouvelle version: ${tasks_version}.`);

    notifyClients(); 
    
    return res.status(201).json(newTask);
});

export default router;
