#!/bin/bash

# ============================================
# SCRIPT DE CONFIGURACIÓN COMPLETA DE BASE DE DATOS
# Ejecuta todo el proceso de setup de la base de datos
# ============================================

echo "🚀 INICIANDO CONFIGURACIÓN COMPLETA DE BASE DE DATOS"
echo "===================================================="
echo ""

# Verificar que las variables de entorno estén configuradas
echo "🔍 Verificando configuración..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurado"
    echo "   Por favor configura las variables en .env.local"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurado"
    echo "   Por favor configura las variables en .env.local"
    exit 1
fi

echo "✅ Variables de entorno configuradas correctamente"
echo ""

# Extraer información de la URL
DB_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||').supabase.co
DB_NAME="postgres"
DB_USER="postgres"

echo "🔧 Configuración de conexión:"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Verificar si psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) no está instalado"
    echo ""
    echo "💡 OPCIONES DE INSTALACIÓN:"
    echo ""
    echo "   Windows (con Chocolatey):"
    echo "   choco install postgresql"
    echo ""
    echo "   Windows (manual):"
    echo "   1. Descarga desde: https://www.postgresql.org/download/windows/"
    echo "   2. O usa la versión portable de PostgreSQL"
    echo ""
    echo "   macOS:"
    echo "   brew install postgresql"
    echo ""
    echo "   Ubuntu/Debian:"
    echo "   sudo apt-get install postgresql-client"
    echo ""
    echo "🔄 Después de instalar, ejecuta nuevamente este script"
    exit 1
fi

echo "✅ PostgreSQL client disponible"
echo ""

# Solicitar contraseña de forma segura
echo "🔑 Necesitamos la contraseña de la base de datos"
echo "   Ve a https://supabase.com/dashboard/project/cbaxjoozbnffrryuywno/settings/database"
echo "   Y busca la 'Connection string' para obtener la contraseña"
echo ""
read -s -p "Ingresa la contraseña de PostgreSQL: " DB_PASSWORD
echo ""
echo ""

# Paso 1: Verificación pre-ejecución
echo "📋 PASO 1: VERIFICACIÓN PRE-EJECUCIÓN"
echo "======================================"
PGPASSWORD=$DB_PASSWORD psql -h db.$DB_HOST -U $DB_USER -d $DB_NAME -f PRE_EXECUTION_CHECK.sql

if [ $? -ne 0 ]; then
    echo "❌ Error en la verificación pre-ejecución"
    echo "   Revisa la conexión y credenciales"
    exit 1
fi

echo ""
echo "✅ Verificación pre-ejecución completada"
echo ""

# Confirmar ejecución del esquema
echo "⚠️  ATENCIÓN: Vas a ejecutar el esquema unificado de base de datos"
echo "   Esto creará/actualizará las tablas principales del sistema"
echo ""
read -p "¿Continuar con la ejecución del esquema? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Ejecución cancelada por el usuario"
    exit 1
fi

echo ""

# Paso 2: Ejecutar esquema unificado
echo "🔨 PASO 2: EJECUTANDO ESQUEMA UNIFICADO"
echo "======================================"
PGPASSWORD=$DB_PASSWORD psql -h db.$DB_HOST -U $DB_USER -d $DB_NAME -f UNIFIED_DATABASE_SCHEMA.sql

if [ $? -ne 0 ]; then
    echo "❌ Error en la ejecución del esquema"
    echo "   Revisa los logs anteriores para más detalles"
    exit 1
fi

echo ""
echo "✅ Esquema unificado ejecutado exitosamente"
echo ""

# Paso 3: Verificación post-ejecución
echo "🔍 PASO 3: VERIFICACIÓN POST-EJECUCIÓN"
echo "====================================="
PGPASSWORD=$DB_PASSWORD psql -h db.$DB_HOST -U $DB_USER -d $DB_NAME -f POST_EXECUTION_VERIFY.sql

if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: Error en la verificación post-ejecución"
    echo "   El esquema podría haberse ejecutado parcialmente"
else
    echo ""
    echo "✅ Verificación post-ejecución completada"
fi

echo ""

# Preguntar sobre datos de ejemplo
echo "🌱 ¿Deseas insertar datos de ejemplo para desarrollo?"
echo "   Esto incluye usuarios, proyectos y conexiones de prueba"
echo ""
read -p "¿Insertar datos de ejemplo? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 PASO 4: INSERTANDO DATOS DE EJEMPLO"
    echo "====================================="
    PGPASSWORD=$DB_PASSWORD psql -h db.$DB_HOST -U $DB_USER -d $DB_NAME -f SAMPLE_DATA.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Datos de ejemplo insertados exitosamente"
    else
        echo "❌ Error al insertar datos de ejemplo"
        echo "   La base de datos funciona, pero sin datos de prueba"
    fi
else
    echo "⏭️  Saltando inserción de datos de ejemplo"
fi

echo ""
echo "🎉 CONFIGURACIÓN DE BASE DE DATOS COMPLETADA"
echo "==========================================="
echo ""
echo "📊 RESUMEN:"
echo "   ✅ Esquema unificado ejecutado"
echo "   ✅ Tablas principales creadas"
echo "   ✅ Políticas RLS configuradas"
echo "   ✅ Índices optimizados"
echo "   ✅ Funciones y triggers activados"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "   1. Ejecuta: npm run dev"
echo "   2. Ve a: http://localhost:3000"
echo "   3. Registra un usuario de prueba"
echo "   4. Explora la aplicación"
echo ""
echo "📋 ENDPOINTS ÚTILES:"
echo "   • Health Check: http://localhost:3000/api/health"
echo "   • Métricas: http://localhost:3000/api/metrics (requiere admin key)"
echo ""
echo "🎯 ¡StartupMatch está listo para usar!"
