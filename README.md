# Findor Pro 🔍

**Findor Pro** est une interface graphique (GUI) moderne et performante pour la commande Bash `find` sous Linux. Développée en Python avec PyQt6, elle permet de construire des requêtes de recherche complexes de manière intuitive tout en affichant la commande générée en temps réel, ce qui en fait un excellent outil pédagogique.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![PyQt6](https://img.shields.io/badge/PyQt6-6.0+-41CD52?logo=qt&logoColor=white)

## ✨ Fonctionnalités

### 🛠 Filtres de Recherche Avancés
- **Localisation** : Choix du dossier source via un sélecteur graphique.
- **Pattern** : Recherche par nom ou pattern (ex: `*.py`) avec option de sensibilité à la casse.
- **Types** : Filtrage par fichiers, dossiers ou liens symboliques.
- **Taille** : Recherche par taille (> ou <) avec unités automatiques (Ko, Mo, Go).
- **Temps** : Filtrage par date de dernière modification (en jours).
- **Profondeur** : Limitation de la récursion via `-mindepth` et `-maxdepth`.

### 🔑 Permissions et Propriété
- Recherche par **permissions octales** (ex: `755`).
- Filtrage par **utilisateur** et **groupe** propriétaire.

### ⚙️ Actions et Exécution
- **Aperçu Pédagogique** : Affiche la commande Bash exacte générée en temps réel.
- **Action -exec** : Exécute des commandes personnalisées sur les résultats trouvés (avec confirmation de sécurité).
- **Copie rapide** : Bouton pour copier le chemin d'un fichier sélectionné dans le presse-papier.

### 🎨 Interface et Performance
- **Mode Sombre** : Interface élégante et lisible.
- **Multi-threading** : Les recherches s'exécutent en arrière-plan via `QThread`, garantissant une interface fluide.
- **Résultats Tabulaires** : Affichage détaillé (Nom, Chemin, Taille, Permissions).

## 🚀 Installation

### Prérequis
- Système d'exploitation : **Linux**
- Python 3.10 ou supérieur

### Installation via Environnement Virtuel (Recommandé)

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/nouhailler/findor.git
   cd findor
   ```

2. **Créer et activer l'environnement virtuel** :
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Installer les dépendances** :
   ```bash
   pip install PyQt6
   ```

## 🌐 Version Web (React + FastAPI)

Findor Pro est désormais disponible via votre navigateur web ! Cette version moderne utilise React pour une interface réactive et FastAPI pour l'interaction avec le système.

### Lancement rapide
```bash
./start.sh
```

### Installation manuelle
1. **Backend** :
   ```bash
   cd backend
   pip install -r requirements.txt
   python3 main.py
   ```
2. **Frontend** :
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---
## 🖥 Version Desktop (Legacy)
La version originale en PyQt6 reste disponible via `findor.py`.

1. Sélectionnez votre **dossier de départ**.
2. Ajustez vos **filtres** dans les différents onglets.
3. Observez la **commande Bash** se construire automatiquement en haut de la fenêtre.
4. Cliquez sur **Lancer la recherche**.
5. Faites un clic droit ou utilisez le bouton pour copier le chemin des fichiers trouvés.

## 🛡 Sécurité
- L'application utilise `shlex` pour traiter les commandes `-exec`, évitant ainsi les injections de shell basiques.
- Une boîte de dialogue de confirmation apparaît toujours avant d'exécuter une action susceptible de modifier le système.

## 📄 Licence
Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---
Développé avec ❤️ pour simplifier la puissance de la ligne de commande.
