# Findor Pro - Instructions Gemini CLI 🤖

Ce fichier définit les standards et les flux de travail pour le développement de Findor Pro.

## 🏗️ Architecture & Standards

- **Backend** : FastAPI avec typage strict via Pydantic. Les commandes `find` sont exécutées via `subprocess`.
- **Frontend** : React 19 avec TypeScript. Préférer le CSS Vanilla ou les CSS Modules.
- **Desktop** : PyQt6. Maintenir le style sombre (`DARK_STYLE`) défini dans `findor.py`.
- **IA** : L'intégration IA passe par le backend. Les modèles supportés sont Ollama et OpenRouter.

## 🛠️ Conventions de Code

- **Langue** : Commentaires et documentation en Français. Code (variables, fonctions) en Anglais.
- **Style** : Suivre la PEP 8 pour le Python. Utiliser ESLint pour le TypeScript.
- **Sécurité** : Ne jamais logger ou committer de clés API OpenRouter. Utiliser des variables d'environnement (`.env`).

## 🧪 Tests & Validation

- Toujours vérifier que les modifications sur le backend n'impactent pas la version Desktop si elles touchent à la logique de construction de la commande `find`.
- Tester les nouvelles fonctionnalités avec `start.sh` pour s'assurer de la compatibilité full-stack.

## 📦 Packaging

- Les versions sont packagées en `.deb`. Lors d'une montée de version, mettre à jour :
  1. `README.md` (badges et texte)
  2. `CONTEXT.md`
  3. Le fichier `control` dans `build/findor_X.X.X/DEBIAN/` (si applicable)
