#!/bin/bash

# Fonction pour arrêter les processus au signal d'arrêt (Ctrl+C)
cleanup() {
    echo "Arrêt des serveurs..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

trap cleanup SIGINT

echo "🚀 Lancement de Findor Pro Web..."

# 1. Lancer le Backend FastAPI
echo "Démarrage du Backend sur http://localhost:8000..."
cd backend
python3 main.py &
BACKEND_PID=$!
cd ..

# 2. Lancer le Frontend React (Vite)
echo "Démarrage du Frontend sur http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Findor Pro est prêt ! Ouvrez votre navigateur sur http://localhost:5173"

# Attendre que les processus se terminent
wait
