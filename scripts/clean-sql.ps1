# SCRIPT DE LIMPIEZA DE ARCHIVOS SQL
# Análisis automático para identificar archivos redundantes y obsoletos

param(
    [switch]$Execute = $false
)

Write-Host "=== ANÁLISIS DE ARCHIVOS SQL PARA LIMPIEZA ===" -ForegroundColor Cyan
Write-Host ""

# 1. ARCHIVOS VACÍOS (0 bytes)
Write-Host "1. ARCHIVOS VACÍOS (Eliminar automáticamente):" -ForegroundColor Red
$emptyFiles = Get-ChildItem *.sql | Where-Object { $_.Length -eq 0 }
foreach ($file in $emptyFiles) {
    Write-Host "   ❌ $($file.Name) (0 bytes)" -ForegroundColor Gray
}

# 2. ARCHIVOS DE EXPORTACIÓN REDUNDANTES
Write-Host "`n2. EXPORTS REDUNDANTES (Tenemos complete_schema.sql):" -ForegroundColor Red
$redundantExports = @(
    "database_schema_export.sql",
    "export_database_schema.sql", 
    "schema_export.sql",
    "supabase_export_1755251123206.sql",
    "supabase_complete_export.sql",
    "StartupMatch_Database_Export_2025-08-15T09-46-16-974Z.sql"
)

foreach ($file in $redundantExports) {
    if (Test-Path $file) {
        $size = [math]::Round((Get-Item $file).Length / 1024, 2)
        Write-Host "   ❌ $file ($size KB)" -ForegroundColor Gray
    }
}

# 3. ARCHIVOS FIX QUE YA NO SON NECESARIOS (ya aplicados)
Write-Host "`n3. ARCHIVOS FIX OBSOLETOS (Ya aplicados):" -ForegroundColor Yellow
$fixFiles = Get-ChildItem "FIX_*.sql"
foreach ($file in $fixFiles) {
    $size = [math]::Round($file.Length / 1024, 2)
    Write-Host "   ⚠️  $($file.Name) ($size KB) - Revisar si ya fue aplicado" -ForegroundColor Gray
}

# 4. ARCHIVOS DE PRUEBA/SAMPLE
Write-Host "`n4. ARCHIVOS DE DATOS DE PRUEBA:" -ForegroundColor Yellow
$sampleFiles = @(
    "INSERT_EXAMPLE_PROJECTS.sql",
    "INSERT_EXAMPLE_PROJECTS_SEARCH.sql", 
    "SAMPLE_DATA.sql",
    "SAMPLE_PROJECTS_DATA.sql",
    "database_data.sql"
)

foreach ($file in $sampleFiles) {
    if (Test-Path $file) {
        $size = [math]::Round((Get-Item $file).Length / 1024, 2)
        Write-Host "   ⚠️  $file ($size KB)" -ForegroundColor Gray
    }
}

# 5. ARCHIVOS SETUP ESPECÍFICOS QUE PUEDEN ESTAR INCLUIDOS EN COMPLETE
Write-Host "`n5. SETUPS ESPECÍFICOS (Verificar si están en complete_schema.sql):" -ForegroundColor Yellow
$setupFiles = @(
    "MATCHING_DATABASE_SETUP.sql",
    "NOTIFICATIONS_DATABASE_SETUP.sql", 
    "NOTIFICATIONS_FASE1_SETUP.sql",
    "PROJECTS_DATABASE_SETUP.sql",
    "SETUP_COMPLETO_DATABASE.sql",
    "setup_groups_database.sql",
    "setup_profiles_table.sql"
)

foreach ($file in $setupFiles) {
    if (Test-Path $file) {
        $size = [math]::Round((Get-Item $file).Length / 1024, 2)
        Write-Host "   ⚠️  $file ($size KB)" -ForegroundColor Gray
    }
}

# 6. ARCHIVOS MASTER A MANTENER
Write-Host "`n6. ARCHIVOS IMPORTANTES A MANTENER:" -ForegroundColor Green
$keepFiles = @(
    "complete_schema.sql"
)

foreach ($file in $keepFiles) {
    if (Test-Path $file) {
        $size = [math]::Round((Get-Item $file).Length / 1024, 2)
        Write-Host "   ✅ $file ($size KB) - MANTENER" -ForegroundColor Green
    }
}

# 7. RESUMEN
Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
$allSqlFiles = Get-ChildItem *.sql
$totalSize = [math]::Round(($allSqlFiles | Measure-Object -Property Length -Sum).Sum / 1024, 2)
Write-Host "Total archivos SQL: $($allSqlFiles.Count)"
Write-Host "Tamaño total: $totalSize KB"
Write-Host "Archivos vacíos: $($emptyFiles.Count)"

if ($Execute) {
    Write-Host "`n=== EJECUTANDO LIMPIEZA ===" -ForegroundColor Red
    
    # Eliminar archivos vacíos
    foreach ($file in $emptyFiles) {
        Remove-Item $file.FullName -Force
        Write-Host "✅ Eliminado: $($file.Name)" -ForegroundColor Green
    }
    
    # Eliminar exports redundantes
    foreach ($file in $redundantExports) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-Host "✅ Eliminado: $file" -ForegroundColor Green
        }
    }
} else {
    Write-Host "`n💡 Usa -Execute para ejecutar la limpieza automática" -ForegroundColor Yellow
    Write-Host "💡 Ejemplo: .\clean-sql.ps1 -Execute" -ForegroundColor Yellow
}
