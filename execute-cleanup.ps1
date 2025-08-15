# LIMPIEZA DEFINITIVA DE ARCHIVOS SQL
# Eliminación segura de archivos redundantes y obsoletos

Write-Host "🧹 INICIANDO LIMPIEZA DEFINITIVA DE ARCHIVOS SQL" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# ARCHIVOS A ELIMINAR (CONFIRMADO QUE ESTÁN EN complete_schema.sql)
$filesToDelete = @(
    # ARCHIVOS VACÍOS (0 bytes)
    "database_data.sql",
    "INSERT_EXAMPLE_PROJECTS_SEARCH.sql", 
    "SAMPLE_PROJECTS_DATA.sql",
    "schema_export.sql",
    
    # EXPORTS REDUNDANTES 
    "database_schema_export.sql",
    "export_database_schema.sql",
    "supabase_export_1755251123206.sql", 
    "supabase_complete_export.sql",
    "StartupMatch_Database_Export_2025-08-15T09-46-16-974Z.sql",
    
    # ARCHIVOS FIX APLICADOS (ya están en complete_schema.sql)
    "FIX_CONNECTION_FOREIGN_KEYS.sql",
    "FIX_CONNECTION_REQUESTS_MISSING_COLUMNS.sql",
    "FIX_CONNECTION_REQUESTS_UPDATED_AT.sql", 
    "FIX_CONVERSATIONS_FUNCTION.sql",
    "FIX_PROJECTS_COLUMNS.sql",
    "FIX_RLS_CONNECTION_REQUESTS_DEFINITIVO.sql",
    "FIX_RLS_POLICIES.sql",
    "FIX_STORAGE_TABLES.sql",
    
    # SETUPS ESPECÍFICOS INCLUIDOS EN complete_schema.sql
    "MATCHING_DATABASE_SETUP.sql",
    "NOTIFICATIONS_DATABASE_SETUP.sql",
    "NOTIFICATIONS_FASE1_SETUP.sql", 
    "PROJECTS_DATABASE_SETUP.sql",
    "SETUP_COMPLETO_DATABASE.sql",
    "setup_groups_database.sql",
    "setup_profiles_table.sql",
    
    # ARCHIVOS DE PRUEBA/EJEMPLO
    "INSERT_EXAMPLE_PROJECTS.sql",
    "SAMPLE_DATA.sql",
    
    # ARCHIVOS DE VERIFICACIÓN (innecesarios con complete_schema.sql)
    "PRE_EXECUTION_CHECK.sql",
    "POST_EXECUTION_VERIFY.sql",
    "VERIFY_DATABASE.sql"
)

# ARCHIVOS A CONSERVAR
$filesToKeep = @(
    "complete_schema.sql",           # ✅ MASTER - Contiene toda la estructura
    "UNIFIED_DATABASE_SCHEMA.sql",   # ✅ Puede ser útil como backup
    "MATCHING_SYSTEM_DATABASE.sql",  # ✅ Documentación específica del matching
    "NOTIFICATIONS_SETUP.sql",       # ✅ Setup completo de notificaciones
    "SUPABASE_STORAGE_SETUP.sql",    # ✅ Setup específico de storage
    "QUICK_PROJECTS_SETUP.sql",      # ✅ Setup rápido puede ser útil
    "REALTIME_SETUP.sql"             # ✅ Configuración realtime específica
)

Write-Host "📊 ANÁLISIS ANTES DE LA LIMPIEZA:" -ForegroundColor Yellow
$beforeFiles = Get-ChildItem *.sql
$beforeSize = [math]::Round(($beforeFiles | Measure-Object -Property Length -Sum).Sum / 1024, 2)
Write-Host "   Archivos actuales: $($beforeFiles.Count)"
Write-Host "   Tamaño total: $beforeSize KB"
Write-Host ""

Write-Host "🗑️  ARCHIVOS A ELIMINAR ($($filesToDelete.Count)):" -ForegroundColor Red
$totalSizeToDelete = 0
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $totalSizeToDelete += $size
        $sizeKB = [math]::Round($size / 1024, 2)
        Write-Host "   ❌ $file ($sizeKB KB)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ ARCHIVOS A CONSERVAR ($($filesToKeep.Count)):" -ForegroundColor Green
$totalSizeToKeep = 0
foreach ($file in $filesToKeep) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $totalSizeToKeep += $size
        $sizeKB = [math]::Round($size / 1024, 2)
        Write-Host "   ✅ $file ($sizeKB KB)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📈 RESUMEN DE LIMPIEZA:" -ForegroundColor Cyan
Write-Host "   Archivos a eliminar: $($filesToDelete.Count)"
Write-Host "   Tamaño a liberar: $([math]::Round($totalSizeToDelete / 1024, 2)) KB"
Write-Host "   Archivos a conservar: $($filesToKeep.Count)"
Write-Host "   Tamaño conservado: $([math]::Round($totalSizeToKeep / 1024, 2)) KB"
Write-Host "   Reducción: $([math]::Round((($totalSizeToDelete / ($totalSizeToDelete + $totalSizeToKeep)) * 100), 1))%"

Write-Host ""
Write-Host "⚠️  CONFIRMA LA LIMPIEZA:" -ForegroundColor Yellow
$confirmation = Read-Host "¿Proceder con la eliminación? (S/N)"

if ($confirmation -eq "S" -or $confirmation -eq "s" -or $confirmation -eq "Y" -or $confirmation -eq "y") {
    Write-Host ""
    Write-Host "🧹 EJECUTANDO LIMPIEZA..." -ForegroundColor Red
    
    $deletedCount = 0
    $deletedSize = 0
    
    foreach ($file in $filesToDelete) {
        if (Test-Path $file) {
            $size = (Get-Item $file).Length
            Remove-Item $file -Force
            $deletedCount++
            $deletedSize += $size
            Write-Host "   ✅ Eliminado: $file" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "🎉 LIMPIEZA COMPLETADA:" -ForegroundColor Green
    Write-Host "   Archivos eliminados: $deletedCount"
    Write-Host "   Espacio liberado: $([math]::Round($deletedSize / 1024, 2)) KB"
    
    $afterFiles = Get-ChildItem *.sql
    $afterSize = [math]::Round(($afterFiles | Measure-Object -Property Length -Sum).Sum / 1024, 2)
    Write-Host "   Archivos restantes: $($afterFiles.Count)"
    Write-Host "   Tamaño final: $afterSize KB"
    
    Write-Host ""
    Write-Host "📋 ARCHIVOS SQL FINALES:" -ForegroundColor Cyan
    Get-ChildItem *.sql | Sort-Object Length -Descending | ForEach-Object {
        $sizeKB = [math]::Round($_.Length / 1024, 2)
        Write-Host "   📄 $($_.Name) ($sizeKB KB)" -ForegroundColor White
    }
    
} else {
    Write-Host ""
    Write-Host "❌ Limpieza cancelada por el usuario" -ForegroundColor Yellow
}
