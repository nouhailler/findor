#!/bin/bash

# Déterminer le dossier de l'script pour gérer les lancements depuis n'importe où
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Fonction pour arrêter les processus au signal d'arrêt (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT

# Vérification du port 8000 (Backend)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Le port 8000 est déjà utilisé. Tentative de libération..."
    fuser -k 8000/tcp 2>/dev/null
    sleep 1
fi

# Vérification du port 5173 (Vite)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Le port 5173 est déjà utilisé. Tentative de libération..."
    fuser -k 5173/tcp 2>/dev/null
    sleep 1
fi

echo "🚀 Préparation de Findor Pro Web..."

# 1. Gestion de l'environnement virtuel Python
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv
fi

echo "🔌 Activation de l'environnement virtuel..."
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
if [ -d "frontend" ]; then
    cd frontend
    if [ ! -f "package.json" ]; then
        echo "❌ Erreur : package.json non trouvé dans $(pwd)"
        exit 1
    fi
    if [ ! -d "node_modules" ]; then
        echo "📦 Installation des dépendances Frontend (npm install)..."
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
    cd ..
else
    echo "❌ Erreur : Dossier 'frontend' non trouvé."
    exit 1
fi

echo ""
echo "✅ Findor Pro est prêt !"
echo "➜ Frontend : http://localhost:5173"
echo "➜ Backend  : http://localhost:8000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs."

wait
