#!/bin/bash

VERSION="3.0.0"
BUILD_DIR="build/findor_$VERSION"
PACKAGE_NAME="findor_${VERSION}_all.deb"

echo "📦 Préparation du package Debian pour la version $VERSION..."

# S'assurer que le dossier de build est propre
rm -rf "$BUILD_DIR/usr/share/findor/"
mkdir -p "$BUILD_DIR/usr/share/findor/backend"
mkdir -p "$BUILD_DIR/usr/bin"

# 1. Copie des fichiers sources
echo "📂 Copie des fichiers..."
cp findor.py "$BUILD_DIR/usr/share/findor/"
cp start.sh "$BUILD_DIR/usr/share/findor/"
cp -r backend/* "$BUILD_DIR/usr/share/findor/backend/"

# 2. Création du lien symbolique dans /usr/bin
# On crée un petit script de lancement pour /usr/bin/findor
cat <<EOF > "$BUILD_DIR/usr/bin/findor"
#!/bin/bash
python3 /usr/share/findor/findor.py "\$@"
EOF
chmod +x "$BUILD_DIR/usr/bin/findor"

# 3. Construction et Copie du frontend
echo "🏗️ Construction du frontend React..."
cd frontend
npm install
npm run build
cd ..

echo "📂 Copie du build frontend vers le dossier static du backend..."
mkdir -p "$BUILD_DIR/usr/share/findor/backend/static"
cp -r frontend/dist/* "$BUILD_DIR/usr/share/findor/backend/static/"

# 4. Construction du package
echo "🛠️ Construction du package .deb..."
# On s'assure que les permissions sont correctes pour Debian
find "$BUILD_DIR" -type d -exec chmod 755 {} \;
find "$BUILD_DIR" -type f -exec chmod 644 {} \;
chmod 755 "$BUILD_DIR/usr/bin/findor"
chmod 755 "$BUILD_DIR/DEBIAN/control"
chmod 755 "$BUILD_DIR/usr/share/findor/start.sh"

dpkg-deb --build "$BUILD_DIR"

echo "✅ Package créé : findor_${VERSION}_all.deb"
