import express from 'express';

const router = express.Router();

// -----------------------------------------------------
// Données et Variables d'État
// -----------------------------------------------------
let stock_prices = {
    "AAPL": 170.00,
    "GOOG": 1500.00,
    "MSFT": 250.00,
    "AMZN": 130.00
};

// Dictionnaires pour suivre les changements consécutifs (logique des alertes)
let positives_changes = { ...Object.fromEntries(Object.keys(stock_prices).map(key => [key, 0])) };
let negatives_changes = { ...Object.fromEntries(Object.keys(stock_prices).map(key => [key, 0])) };

let event_id = 0;

// -----------------------------------------------------
// Fonctions Utilitaires
// -----------------------------------------------------

/**
 * Génère une mise à jour aléatoire pour une action.
 * @returns {object} Données de l'action.
 */
function generate_stock_update() {
    const symbols = Object.keys(stock_prices);
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const current_price = stock_prices[symbol];
    
    // Simule une variation de prix (+/- 0.5%)
    const change_percent = (Math.random() * 1.0 - 0.5) / 100;
    let new_price = current_price * (1 + change_percent);
    new_price = parseFloat(new_price.toFixed(2));
    
    stock_prices[symbol] = new_price; 
    
    // Le changement réel
    const change = parseFloat((new_price - current_price).toFixed(2));
    
    // Calcul de la variation en pourcentage pour la logique d'alerte
    const percent_change = (change / current_price) * 100; 

    // Mettre à jour les compteurs de changements consécutifs
    if (change > 0) {
        positives_changes[symbol]++;
        negatives_changes[symbol] = 0;
    } else if (change < 0) {
        negatives_changes[symbol]++;
        positives_changes[symbol] = 0;
    } else {
        // Prix inchangé
        positives_changes[symbol] = 0;
        negatives_changes[symbol] = 0;
    }

    return {
        symbol: symbol,
        price: new_price,
        change: change,
        percent_change: parseFloat(percent_change.toFixed(2))
    };
}


// -----------------------------------------------------
// Endpoint SSE (/stream GET)
// -----------------------------------------------------

router.get('/stream', (req, res) => {
    // 1. Définir les en-têtes SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache', // Important pour ne pas mettre en cache
        'Connection': 'keep-alive',
        // 'X-Accel-Buffering': 'no' est conseillé pour les proxies comme Nginx
    });

    // Envoyer l'état initial des prix (une seule fois au démarrage de la connexion)
    Object.keys(stock_prices).forEach(symbol => {
        const initialData = {
            symbol: symbol,
            price: stock_prices[symbol],
            change: 0,
            percent_change: 0
        };
        const ssePayload = `event: stock_update\ndata: ${JSON.stringify(initialData)}\n\n`;
        res.write(ssePayload);
    });


    // 2. Logique de diffusion en temps réel
    const intervalId = setInterval(() => {
        const stock_data = generate_stock_update();
        event_id++; // Incrémenter l'ID de l'événement

        // --- 2a. Événement de mise à jour du prix ---
        // Format SSE: id: <ID>\nevent: <Nom>\ndata: <JSON>\n\n
        let ssePayload = `id: ${event_id}\nevent: stock_update\ndata: ${JSON.stringify(stock_data)}\n\n`;
        res.write(ssePayload);

        // --- 2b. Logique d'alerte (si 3 changements consécutifs) ---
        const symbol = stock_data.symbol;
        let alert_message = null;
        
        if (positives_changes[symbol] >= 3) {
            alert_message = `Alerte: ${symbol} a augmenté ${positives_changes[symbol]} fois consécutivement!`;
            // Après l'alerte, on peut réinitialiser pour éviter une alerte à chaque cycle
            positives_changes[symbol] = 0;
        } else if (negatives_changes[symbol] >= 3) {
            alert_message = `Alerte: ${symbol} a baissé ${negatives_changes[symbol]} fois consécutivement!`;
            negatives_changes[symbol] = 0;
        }

        if (alert_message) {
            const alertPayload = `id: ${event_id}\nevent: market_alert\ndata: ${JSON.stringify({'message': alert_message})}\n\n`;
            res.write(alertPayload);
        }

    }, 2000); // Mise à jour toutes les 2 secondes

    console.log('Nouveau client SSE connecté.');

    // 3. Gérer la déconnexion du client
    req.on('close', () => {
        clearInterval(intervalId); // Arrêter l'envoi de données
        console.log('Client SSE déconnecté.');
    });
});


export default router;
