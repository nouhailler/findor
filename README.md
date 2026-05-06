# Findor Pro 🔍

<div align="center">
  <img src="frontend/public/favicon.svg" alt="Findor Logo" width="120" height="120">
  <h3>L'interface ultime pour dompter la puissance de <code>find</code></h3>

  [![Version](https://img.shields.io/badge/version-3.0.0-blue.svg?style=for-the-badge)](https://github.com/nouhailler/findor)
  [![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
  [![Linux](https://img.shields.io/badge/Platform-Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://www.linux.org/)
</div>

---

## 🌟 Introduction

**Findor Pro** n'est pas qu'un simple wrapper. C'est un écosystème complet qui transforme la complexité de la commande Bash `find` en une expérience fluide, pédagogique et augmentée par l'Intelligence Artificielle. Que vous soyez un sysadmin chevronné ou un débutant sous Linux, Findor Pro vous permet de localiser n'est-ce qu'une aiguille dans une botte de foin numérique.

Disponible en **version Desktop native (PyQt6)** et en **version Web moderne (React/FastAPI)**.

---

## ✨ Fonctionnalités Clés

### 🤖 Intelligence Artificielle (v3.0.0)
- **Recherche Sémantique** : L'IA comprend vos questions ("Trouve le fichier qui contient la config de la base de données") au lieu de simples mots-clés.
- **Analyse Contextuelle** : Analyse du contenu, du nom et du chemin pour une pertinence maximale.
- **Multi-Modèles** : Support dynamique d'**Ollama** (local) et **OpenRouter** (cloud).
- **Explications Détaillées** : L'IA justifie pourquoi un fichier correspond à votre recherche.

### 🛠️ Puissance de Recherche
- **Visual Builder** : Construisez des commandes complexes visuellement (taille, date, permissions, profondeur, etc.).
- **Regex Assistant** : Ne luttez plus avec les expressions régulières, Findor vous aide à les concevoir.
- **Filtres Avancés** : Pruning de dossiers, recherche par Inode, fichiers vides, et plus encore.

### 🎨 Expérience Utilisateur
- **Thèmes Adaptatifs** : Mode Clair ☀️ / Sombre 🌙.
- **Performance** : Traitement asynchrone pour ne jamais bloquer l'interface, même sur de gros volumes.
- **Multi-Interface** : Choisissez entre l'application Desktop légère ou l'interface Web riche.

---

## 🏗️ Architecture du Projet

Le projet est structuré de manière modulaire pour offrir une flexibilité totale :

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Desktop** | Python & PyQt6 | Application native ultra-rapide et légère. |
| **Frontend Web** | React 19 & Vite | Interface moderne, réactive et élégante. |
| **Backend API** | FastAPI | Moteur de recherche et interface avec l'IA. |
| **Packaging** | Debian (.deb) | Installation simplifiée sur les systèmes Linux. |

---

## 🚀 Installation Rapide

### 📦 Via le package Debian (Recommandé)
Téléchargez la dernière version et installez-la en une ligne :
```bash
sudo dpkg -i findor_3.0.0_all.deb
sudo apt-get install -f # Répare les dépendances si nécessaire
```

### 🌐 Lancement de la version Web
Si vous avez cloné le dépôt, utilisez le script tout-en-un :
```bash
chmod +x start.sh
./start.sh
```

---

## 🛠️ Développement et Installation Manuelle

### Prérequis
- Python 3.10+
- Node.js & npm (pour le web)

### 1. Configuration du Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Configuration du Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Lancement du Desktop
```bash
# Assurez-vous d'avoir PyQt6 installé
python findor.py
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 
1. Forkez le projet.
2. Créez votre branche (`git checkout -b feature/AmazingFeature`).
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`).
4. Pushez vers la branche (`git push origin feature/AmazingFeature`).
5. Ouvrez une Pull Request.

---

<div align="center">
  <p>Développé avec ❤️ pour la communauté Linux. Sous licence MIT.</p>
  <a href="https://github.com/nouhailler/findor">
    <img src="https://img.shields.io/github/stars/nouhailler/findor?style=social" alt="Stars">
  </a>
</div>
