.PHONY: help install-backend install-frontend install-desktop run-web run-desktop package clean

help:
	@echo "Findor Pro - Commandes disponibles :"
	@echo "  make install-backend  : Installe les dépendances Python du backend"
	@echo "  make install-frontend : Installe les dépendances Node.js du frontend"
	@echo "  make install-desktop  : Installe les dépendances pour la version PyQt6"
	@echo "  make run-web          : Lance le backend et le frontend (via start.sh)"
	@echo "  make run-desktop      : Lance l'application PyQt6"
	@echo "  make package          : Génère le package Debian .deb"
	@echo "  make clean            : Nettoie les fichiers temporaires et les builds"

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

install-desktop:
	pip install -r requirements.txt

run-web:
	chmod +x start.sh
	./start.sh

run-desktop:
	python3 findor.py

package:
	chmod +x package.sh
	./package.sh

test:
	cd backend && pytest

clean:
	rm -rf build/findor_3.0.0/usr/share/findor/
	rm -rf build/findor_3.0.0/usr/bin/
	rm -rf frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	@echo "✨ Nettoyage terminé."
