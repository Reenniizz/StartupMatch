# ============================================
# SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS PARA WINDOWS
# PowerShell version del setup de base de datos
# ============================================

Write-Host "🚀 INICIANDO CONFIGURACIÓN COMPLETA DE BASE DE DATOS" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

# Verificar que las variables de entorno estén configuradas
Write-Host "🔍 Verificando configuración..." -ForegroundColor Yellow

# Leer variables del archivo .env.local
$envFile = ".\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: Archivo .env.local no encontrado" -ForegroundColor Red
    Write-Host "   Por favor configura las variables en .env.local" -ForegroundColor Red
    exit 1
}

# Cargar variables de entorno
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$supabaseUrl = [System.Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL")
$serviceRoleKey = [System.Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")

if (-not $supabaseUrl) {
    Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurado" -ForegroundColor Red
    Write-Host "   Por favor configura las variables en .env.local" -ForegroundColor Red
    exit 1
}

if (-not $serviceRoleKey) {
    Write-Host "❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurado" -ForegroundColor Red
    Write-Host "   Por favor configura las variables en .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Variables de entorno configuradas correctamente" -ForegroundColor Green
Write-Host ""

# Extraer información de la URL
$dbHost = $supabaseUrl -replace "https://", "" -replace "\.supabase\.co", ""
$dbHost = "db.$dbHost.supabase.co"
$dbName = "postgres"
$dbUser = "postgres"

Write-Host "🔧 Configuración de conexión:" -ForegroundColor Yellow
Write-Host "   Host: $dbHost" -ForegroundColor Gray
Write-Host "   Database: $dbName" -ForegroundColor Gray
Write-Host "   User: $dbUser" -ForegroundColor Gray
Write-Host ""

# Verificar si psql está instalado
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL client (psql) no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 OPCIONES DE INSTALACIÓN:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Opción 1 - Chocolatey (Recomendado):" -ForegroundColor Cyan
    Write-Host "   1. Instala Chocolatey: https://chocolatey.org/install" -ForegroundColor Gray
    Write-Host "   2. Ejecuta: choco install postgresql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Opción 2 - Manual:" -ForegroundColor Cyan
    Write-Host "   1. Descarga desde: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "   2. Instala solo el cliente si no quieres el servidor completo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Opción 3 - Portable:" -ForegroundColor Cyan
    Write-Host "   1. Descarga PostgreSQL portable" -ForegroundColor Gray
    Write-Host "   2. Añade psql.exe al PATH" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔄 Después de instalar, ejecuta nuevamente este script" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL client disponible en: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Solicitar contraseña de forma segura
Write-Host "🔑 Necesitamos la contraseña de la base de datos" -ForegroundColor Yellow
Write-Host "   Ve a https://supabase.com/dashboard/project/cbaxjoozbnffrryuywno/settings/database" -ForegroundColor Gray
Write-Host "   Y busca la 'Connection string' para obtener la contraseña" -ForegroundColor Gray
Write-Host ""
$securePassword = Read-Host "Ingresa la contraseña de PostgreSQL" -AsSecureString
$dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
Write-Host ""

# Función para ejecutar psql con manejo de errores
function Invoke-Psql {
    param(
        [string]$SqlFile,
        [string]$Description
    )
    
    Write-Host "📄 Ejecutando: $Description" -ForegroundColor Cyan
    
    $env:PGPASSWORD = $dbPassword
    $result = & psql -h $dbHost -U $dbUser -d $dbName -f $SqlFile
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "✅ $Description completado exitosamente" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Error en: $Description" -ForegroundColor Red
        return $false
    }
}

# Paso 1: Verificación pre-ejecución
Write-Host "📋 PASO 1: VERIFICACIÓN PRE-EJECUCIÓN" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

if (-not (Invoke-Psql -SqlFile "PRE_EXECUTION_CHECK.sql" -Description "Verificación pre-ejecución")) {
    Write-Host "   Revisa la conexión y credenciales" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Confirmar ejecución del esquema
Write-Host "⚠️  ATENCIÓN: Vas a ejecutar el esquema unificado de base de datos" -ForegroundColor Yellow
Write-Host "   Esto creará/actualizará las tablas principales del sistema" -ForegroundColor Gray
Write-Host ""
$confirmation = Read-Host "Continuar con la ejecucion del esquema? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "🛑 Ejecución cancelada por el usuario" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Ejecutar esquema unificado
Write-Host "🔨 PASO 2: EJECUTANDO ESQUEMA UNIFICADO" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow

if (-not (Invoke-Psql -SqlFile "UNIFIED_DATABASE_SCHEMA.sql" -Description "Esquema unificado")) {
    Write-Host "   Revisa los logs anteriores para más detalles" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Verificación post-ejecución
Write-Host "🔍 PASO 3: VERIFICACIÓN POST-EJECUCIÓN" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

if (-not (Invoke-Psql -SqlFile "POST_EXECUTION_VERIFY.sql" -Description "Verificación post-ejecución")) {
    Write-Host "⚠️  Advertencia: Error en la verificación post-ejecución" -ForegroundColor Yellow
    Write-Host "   El esquema podría haberse ejecutado parcialmente" -ForegroundColor Yellow
} else {
    Write-Host ""
}

# Preguntar sobre datos de ejemplo
Write-Host "Deseas insertar datos de ejemplo para desarrollo?" -ForegroundColor Yellow
Write-Host "   Esto incluye usuarios, proyectos y conexiones de prueba" -ForegroundColor Gray
Write-Host ""
$sampleData = Read-Host "Insertar datos de ejemplo? (y/N)"
if ($sampleData -eq 'y' -or $sampleData -eq 'Y') {
    Write-Host ""
    Write-Host "📝 PASO 4: INSERTANDO DATOS DE EJEMPLO" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Yellow
    
    if (Invoke-Psql -SqlFile "SAMPLE_DATA.sql" -Description "Datos de ejemplo") {
        Write-Host ""
    } else {
        Write-Host "   La base de datos funciona, pero sin datos de prueba" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Saltando inserción de datos de ejemplo" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 CONFIGURACIÓN DE BASE DE DATOS COMPLETADA" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESUMEN:" -ForegroundColor Yellow
Write-Host "   ✅ Esquema unificado ejecutado" -ForegroundColor Green
Write-Host "   ✅ Tablas principales creadas" -ForegroundColor Green
Write-Host "   ✅ Políticas RLS configuradas" -ForegroundColor Green
Write-Host "   ✅ Índices optimizados" -ForegroundColor Green
Write-Host "   ✅ Funciones y triggers activados" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Ejecuta: npm run dev" -ForegroundColor Gray
Write-Host "   2. Ve a: http://localhost:3000" -ForegroundColor Gray
Write-Host "   3. Registra un usuario de prueba" -ForegroundColor Gray
Write-Host "   4. Explora la aplicación" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 ENDPOINTS ÚTILES:" -ForegroundColor Yellow
Write-Host "   • Health Check: http://localhost:3000/api/health" -ForegroundColor Gray
Write-Host "   • Métricas: http://localhost:3000/api/metrics (requiere admin key)" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 ¡StartupMatch está listo para usar!" -ForegroundColor Green
