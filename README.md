# Findor Pro 🔍 - Ultimate Web & Desktop GUI for `find`

**Findor Pro** est une interface graphique ultra-complète et pédagogique pour la commande Bash `find` sous Linux. Désormais disponible en version **Web (React/FastAPI)** et **Desktop (PyQt6)**.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)

## 🚀 Nouveautés de la Version 2.0.0 (Pro)

### 🌐 Interface Web Moderne
- **Architecture Client-Serveur** : Frontend React (Vite/TS) et Backend FastAPI.
- **Thèmes Personnalisables** : Basculez entre le mode **Sombre** et le mode **Clair** via le menu Paramètres.
- **Ouverture Intelligente** : Cliquez sur un résultat de recherche pour l'ouvrir instantanément dans votre éditeur de texte préféré (`gnome-text-editor` ou défaut système).

### 🧠 Assistant Regex Convivial
- Ne luttez plus avec la syntaxe absconse des expressions régulières !
- Choisissez des scénarios courants : "Commence par", "Contient uniquement des chiffres", "Format de date", "Plusieurs mots (OU)", etc.
- L'assistant génère automatiquement la Regex POSIX-Extended optimale pour `find`.

### 💡 Bibliothèque de Scénarios Experts
- Apprenez à utiliser `find` comme un administrateur système senior.
- **Pruning** : Ignorez intelligemment les dossiers lourds (`node_modules`, `.git`).
- **Optimisation Performance** : Apprenez la différence entre les terminateurs `-exec ... ;` et `-exec ... +`.
- **Filtres Chirurgicaux** : Recherche par inode, fichiers vides, ou permissions complexes (`-perm /002`).

## 🛠 Installation et Lancement

### Lancement Rapide (Web)
```bash
./start.sh
```
Ce script gère automatiquement la création de l'environnement virtuel Python, l'installation des dépendances et le lancement du Frontend et du Backend.

### Installation manuelle
1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/nouhailler/findor.git
   cd findor
   ```
2. **Backend** :
   ```bash
   pip install -r backend/requirements.txt
   python3 backend/main.py
   ```
3. **Frontend** :
   ```bash
   cd frontend && npm install && npm run dev
   ```

## 🖥 Version Desktop (Legacy)
La version PyQt6 originale est toujours disponible pour un usage local rapide :
```bash
python3 findor.py
```

## 🛡 Sécurité
- Validation stricte des arguments système.
- Confirmation requise avant toute action `-exec` risquée.
- Utilisation de `shlex` pour prévenir les injections de commandes.

## 📄 Licence
Distribué sous la licence MIT.

---
Développé avec ❤️ pour rendre la puissance de Linux accessible à tous.
