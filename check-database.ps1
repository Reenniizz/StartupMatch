# ============================================
# SCRIPT SIMPLE DE VERIFICACIÓN DE BASE DE DATOS
# Solo verifica el estado actual sin ejecutar nada
# ============================================

Write-Host "🔍 VERIFICANDO ESTADO DE BASE DE DATOS..." -ForegroundColor Green
Write-Host ""

# Cargar variables de entorno
$envFile = ".\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]*)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Variables de entorno cargadas" -ForegroundColor Green
} else {
    Write-Host "❌ Archivo .env.local no encontrado" -ForegroundColor Red
    exit 1
}

$supabaseUrl = [System.Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL")
if ($supabaseUrl) {
    Write-Host "✅ Supabase URL configurada: $supabaseUrl" -ForegroundColor Green
} else {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL no configurado" -ForegroundColor Red
}

# Verificar PostgreSQL client
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "✅ PostgreSQL client disponible: $($psqlPath.Source)" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL client (psql) no instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Para instalar PostgreSQL client:" -ForegroundColor Yellow
    Write-Host "   1. Instalar Chocolatey: https://chocolatey.org/install" -ForegroundColor Gray
    Write-Host "   2. Ejecutar: choco install postgresql" -ForegroundColor Gray
    Write-Host "   3. O descargar desde: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 ARCHIVOS DE BASE DE DATOS DISPONIBLES:" -ForegroundColor Yellow

$dbFiles = @(
    @{Name="PRE_EXECUTION_CHECK.sql"; Desc="Verificación pre-ejecución"},
    @{Name="UNIFIED_DATABASE_SCHEMA.sql"; Desc="Esquema unificado principal"},
    @{Name="POST_EXECUTION_VERIFY.sql"; Desc="Verificación post-ejecución"},
    @{Name="SAMPLE_DATA.sql"; Desc="Datos de ejemplo"}
)

foreach ($file in $dbFiles) {
    if (Test-Path $file.Name) {
        Write-Host "   ✅ $($file.Name) - $($file.Desc)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($file.Name) - NO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 PRÓXIMOS PASOS PARA CONFIGURAR LA BASE DE DATOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Si PostgreSQL client no está instalado:" -ForegroundColor Cyan
Write-Host "      choco install postgresql" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Para ejecutar solo verificación pre-ejecución:" -ForegroundColor Cyan
Write-Host "      psql -h [DB_HOST] -U postgres -d postgres -f PRE_EXECUTION_CHECK.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Para ejecutar el esquema completo:" -ForegroundColor Cyan
Write-Host "      psql -h [DB_HOST] -U postgres -d postgres -f UNIFIED_DATABASE_SCHEMA.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Para verificar después de la ejecución:" -ForegroundColor Cyan
Write-Host "      psql -h [DB_HOST] -U postgres -d postgres -f POST_EXECUTION_VERIFY.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Para añadir datos de ejemplo:" -ForegroundColor Cyan
Write-Host "      psql -h [DB_HOST] -U postgres -d postgres -f SAMPLE_DATA.sql" -ForegroundColor Gray
Write-Host ""

if ($supabaseUrl) {
    $dbHost = $supabaseUrl -replace "https://", "" -replace "\.supabase\.co", ""
    $dbHost = "db.$dbHost.supabase.co"
    Write-Host "📡 TU HOST DE BASE DE DATOS ES: $dbHost" -ForegroundColor Green
    Write-Host "   Reemplaza [DB_HOST] en los comandos de arriba con este valor" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎯 Estado de verificación completado" -ForegroundColor Green
