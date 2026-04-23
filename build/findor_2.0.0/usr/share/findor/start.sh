#!/bin/bash

# Fonction pour arrêter les processus au signal d'arrêt (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT

echo "🚀 Préparation de Findor Pro Web..."

# 1. Gestion de l'environnement virtuel Python
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv
fi

echo "🔌 Activation de l'environnement virtuel et vérification des dépendances..."
source venv/bin/activate
pip install -q -r backend/requirements.txt

# 2. Lancer le Backend FastAPI
echo "📡 Démarrage du Backend sur http://localhost:8000..."
cd backend
python3 main.py &
BACKEND_PID=$!
cd ..

# 3. Lancer le Frontend React (Vite)
echo "💻 Démarrage du Frontend..."
cd frontend
# On s'assure que les modules node sont là
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances Frontend (npm install)..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Findor Pro est prêt !"
echo "➜ Frontend : http://localhost:5173"
echo "➜ Backend  : http://localhost:8000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs."

# Attendre que les processus se terminent
wait
