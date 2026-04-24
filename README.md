# Findor Pro 🔍 - Ultimate Web & Desktop GUI for `find`

**Findor Pro** est une interface graphique ultra-complète et pédagogique pour la commande Bash `find` sous Linux. Désormais disponible en version **Web (React/FastAPI)** et **Desktop (PyQt6)**.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)

## 🚀 Nouveautés de la Version 3.0.0 (AI Update)

### 🤖 IA Dynamique & OpenRouter
- **Gestion des modèles dynamiques** : Findor récupère désormais en temps réel la liste des modèles disponibles (Ollama ou OpenRouter).
- **Support OpenRouter Free** : Accès direct aux modèles gratuits de OpenRouter avec mise à jour en un clic.
- **Auto-sélection** : L'interface choisit intelligemment le premier modèle disponible si votre configuration devient obsolète.

### 🧠 Recherche Sémantique Avancée
- **Analyse Contextuelle** : L'IA ne se base plus uniquement sur le contenu, mais comprend aussi le nom et le chemin du fichier pour répondre à vos questions.
- **Explications Nuancées** : Pour chaque fichier analysé, l'IA fournit désormais une explication détaillée (pourquoi le fichier correspond ou non).
- **Bouton Stop** : Vous pouvez désormais arrêter instantanément une analyse IA en cours si elle prend trop de temps.

### 🎨 Améliorations UX/UI
- **Thèmes Adaptatifs** : La zone de réponse de l'IA est désormais parfaitement lisible en mode **Clair** comme en mode **Sombre**.
- **Indicateurs Visuels** : Retour visuel immédiat sur la pertinence des fichiers (Vert/Rouge).

## 🚀 Nouveautés de la Version 2.0.0 (Pro)
- **Architecture Client-Serveur** : Frontend React et Backend FastAPI.
- **Thèmes Personnalisables**.
- **Assistant Regex Convivial**.

## 🛠 Installation et Lancement

### Installation via le package Debian (Recommandé)
Téléchargez le fichier `findor_3.0.0_all.deb` depuis la section Releases et installez-le :
```bash
sudo dpkg -i findor_3.0.0_all.deb
sudo apt-get install -f # Pour les dépendances
```

### Lancement Rapide (Web)
```bash
./start.sh
```

### Installation manuelle
1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/nouhailler/findor.git
   cd findor
   ```
2. **Backend** : `pip install -r backend/requirements.txt && python3 backend/main.py`
3. **Frontend** : `cd frontend && npm install && npm run dev`
