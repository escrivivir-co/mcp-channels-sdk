#!/bin/bash

# Script para generar paquetes desde los directorios dist
# Ejecutar desde socket-gym/ws-server/

echo "🚀 Generando paquetes AlephScript desde directorios dist..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    echo "❌ ERROR: Ejecuta este script desde el directorio socket-gym/ws-server/"
    exit 1
fi

# Variables
CORE_BROWSER_DIR="packages/aleph-script-core-browser"
ANGULAR_DIR="packages/aleph-script-angular"

echo "1. 🔨 Compilando librerías..."

# Build core-browser
echo "   • Compilando @alephscript/core-browser..."
if npm run build:core-browser > /dev/null 2>&1; then
    echo "     ✓ Compilación exitosa"
else
    echo "     ❌ ERROR: Falló la compilación de core-browser"
    exit 1
fi

# Build angular
echo "   • Compilando @alephscript/angular..."
if npm run build:angular > /dev/null 2>&1; then
    echo "     ✓ Compilación exitosa"
else
    echo "     ❌ ERROR: Falló la compilación de angular"
    exit 1
fi

echo ""

echo "2. 📦 Generando paquetes..."

# Limpiar paquetes anteriores
echo "   • Limpiando paquetes anteriores..."
rm -f "$CORE_BROWSER_DIR"/*.tgz
rm -f "$ANGULAR_DIR"/*.tgz

# Pack core-browser desde directorio raíz (incluye dist)
echo "   • Empaquetando @alephscript/core-browser..."
cd "$CORE_BROWSER_DIR"
if npm pack > /dev/null 2>&1; then
    echo "     ✓ Paquete generado: $(ls *.tgz)"
else
    echo "     ❌ ERROR: Falló el empaquetado de core-browser"
    exit 1
fi
cd - > /dev/null

# Pack angular desde directorio dist (solo contenido compilado)
echo "   • Empaquetando @alephscript/angular..."
cd "$ANGULAR_DIR/dist"
if npm pack > /dev/null 2>&1; then
    echo "     ✓ Paquete generado: $(ls *.tgz)"
    # Mover el paquete al directorio padre
    mv *.tgz ../
else
    echo "     ❌ ERROR: Falló el empaquetado de angular"
    exit 1
fi
cd - > /dev/null

echo ""

echo "🎉 EMPAQUETADO COMPLETADO!"
echo ""
echo "📋 Paquetes generados:"
echo "   • $CORE_BROWSER_DIR/$(ls $CORE_BROWSER_DIR/*.tgz | xargs -n 1 basename)"
echo "   • $ANGULAR_DIR/$(ls $ANGULAR_DIR/*.tgz | xargs -n 1 basename)"
echo ""
echo "🚀 Estos paquetes están listos para usar en threejs-gamify-ui"
echo ""
