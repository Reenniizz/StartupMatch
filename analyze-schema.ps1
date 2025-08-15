# SCHEMA ANALYZER
# Script para analizar el esquema de base de datos
# Uso: .\analyze-schema.ps1 [comando]

param(
    [string]$Command = "help"
)

$SchemaFile = "complete_schema.sql"

function Show-Help {
    Write-Host "SCHEMA ANALYZER - StartupMatch" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "COMANDOS DISPONIBLES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  LISTADOS:"
    Write-Host "    .\analyze-schema.ps1 tables     # Listar todas las tablas"
    Write-Host "    .\analyze-schema.ps1 functions  # Listar todas las funciones"
    Write-Host "    .\analyze-schema.ps1 indexes    # Listar todos los indices"
    Write-Host "    .\analyze-schema.ps1 policies   # Listar politicas RLS"
    Write-Host ""
    Write-Host "  BUSQUEDAS:"
    Write-Host "    .\analyze-schema.ps1 find projects        # Buscar todo relacionado con 'projects'"
    Write-Host "    .\analyze-schema.ps1 columns user_profiles # Ver columnas de una tabla"
    Write-Host "    .\analyze-schema.ps1 foreign user_profiles # Ver claves foraneas de una tabla"
    Write-Host ""
    Write-Host "  ANALISIS:"
    Write-Host "    .\analyze-schema.ps1 stats      # Estadisticas del schema"
    Write-Host "    .\analyze-schema.ps1 relations  # Mapa de relaciones entre tablas"
    Write-Host ""
}

function Get-Tables {
    Write-Host "TABLAS EN LA BASE DE DATOS" -ForegroundColor Green
    Write-Host "==========================" -ForegroundColor Green
    Select-String -Pattern "CREATE TABLE.*\(" $SchemaFile | ForEach-Object {
        $tableName = ($_.Line -split "CREATE TABLE ")[1] -split " \(" | Select-Object -First 1
        Write-Host "  -> $tableName" -ForegroundColor White
    }
}

function Get-Functions {
    Write-Host "FUNCIONES EN LA BASE DE DATOS" -ForegroundColor Blue
    Write-Host "=============================" -ForegroundColor Blue
    Select-String -Pattern "CREATE.*FUNCTION" $SchemaFile | ForEach-Object {
        $functionLine = $_.Line -replace "CREATE OR REPLACE FUNCTION ", "CREATE FUNCTION "
        $functionName = ($functionLine -split "CREATE FUNCTION ")[1] -split "\(" | Select-Object -First 1
        Write-Host "  -> $functionName" -ForegroundColor White
    }
}

function Get-Indexes {
    Write-Host "INDICES EN LA BASE DE DATOS" -ForegroundColor Magenta
    Write-Host "===========================" -ForegroundColor Magenta
    Select-String -Pattern "CREATE.*INDEX" $SchemaFile | ForEach-Object {
        $indexName = ($_.Line -split "CREATE.*INDEX ")[1] -split " " | Select-Object -First 1
        Write-Host "  -> $indexName" -ForegroundColor White
    }
}

function Get-Policies {
    Write-Host "POLITICAS RLS" -ForegroundColor Red
    Write-Host "=============" -ForegroundColor Red
    Select-String -Pattern "CREATE POLICY" $SchemaFile | ForEach-Object {
        $policyName = ($_.Line -split "CREATE POLICY ")[1] -split " " | Select-Object -First 1
        Write-Host "  -> $policyName" -ForegroundColor White
    }
}

function Find-Schema($searchTerm) {
    Write-Host "BUSCANDO: '$searchTerm'" -ForegroundColor Yellow
    Write-Host "======================" -ForegroundColor Yellow
    Select-String -Pattern $searchTerm $SchemaFile -Context 2 | ForEach-Object {
        Write-Host "Linea $($_.LineNumber):" -ForegroundColor Cyan
        Write-Host $_.Line -ForegroundColor White
        Write-Host ""
    }
}

function Get-TableColumns($tableName) {
    Write-Host "COLUMNAS DE LA TABLA: $tableName" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    
    # Buscar la definicion de la tabla
    $tableStart = Select-String -Pattern "CREATE TABLE.*$tableName" $SchemaFile
    if ($tableStart) {
        $startLine = $tableStart.LineNumber
        $content = Get-Content $SchemaFile
        
        # Leer lineas hasta encontrar el final de la tabla
        for ($i = $startLine; $i -lt $content.Length; $i++) {
            $line = $content[$i - 1]  # PowerShell arrays are 0-indexed
            
            if ($line -match "^\s*\w+.*,?\s*$" -and $line -notmatch "CREATE TABLE" -and $line -notmatch "CONSTRAINT") {
                $columnInfo = $line.Trim() -replace ",$", ""
                if ($columnInfo -and $columnInfo -ne ");" -and $columnInfo -ne ")") {
                    Write-Host "  -> $columnInfo" -ForegroundColor White
                }
            }
            
            if ($line -match "^\);?\s*$") {
                break
            }
        }
    } else {
        Write-Host "ERROR: Tabla '$tableName' no encontrada" -ForegroundColor Red
    }
}

function Get-ForeignKeys($tableName) {
    Write-Host "CLAVES FORANEAS DE: $tableName" -ForegroundColor Blue
    Write-Host "==============================" -ForegroundColor Blue
    Select-String -Pattern "FOREIGN KEY.*REFERENCES.*$tableName|REFERENCES.*$tableName" $SchemaFile | ForEach-Object {
        Write-Host "  -> $($_.Line.Trim())" -ForegroundColor White
    }
}

function Get-Stats {
    Write-Host "ESTADISTICAS DEL SCHEMA" -ForegroundColor Magenta
    Write-Host "=======================" -ForegroundColor Magenta
    
    $tables = (Select-String -Pattern "CREATE TABLE" $SchemaFile).Count
    $functions = (Select-String -Pattern "CREATE.*FUNCTION" $SchemaFile).Count
    $indexes = (Select-String -Pattern "CREATE.*INDEX" $SchemaFile).Count
    $policies = (Select-String -Pattern "CREATE POLICY" $SchemaFile).Count
    $triggers = (Select-String -Pattern "CREATE TRIGGER" $SchemaFile).Count
    
    Write-Host "  Tablas:     $tables" -ForegroundColor White
    Write-Host "  Funciones:  $functions" -ForegroundColor White
    Write-Host "  Indices:    $indexes" -ForegroundColor White
    Write-Host "  Politicas:  $policies" -ForegroundColor White
    Write-Host "  Triggers:   $triggers" -ForegroundColor White
    
    $fileSize = (Get-Item $SchemaFile).Length
    $fileSizeKB = [math]::Round($fileSize / 1024, 2)
    Write-Host "  Tamano:     $fileSizeKB KB" -ForegroundColor White
}

function Get-Relations {
    Write-Host "RELACIONES ENTRE TABLAS" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    Select-String -Pattern "REFERENCES\s+(\w+)" $SchemaFile | ForEach-Object {
        if ($_.Line -match "REFERENCES\s+(\w+)") {
            $referencedTable = $matches[1]
            Write-Host "  -> ... REFERENCES $referencedTable" -ForegroundColor White
        }
    }
}

# Ejecutar el comando solicitado
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "tables" { Get-Tables }
    "functions" { Get-Functions }
    "indexes" { Get-Indexes }
    "policies" { Get-Policies }
    "stats" { Get-Stats }
    "relations" { Get-Relations }
    "find" { 
        if ($args.Count -gt 0) {
            Find-Schema $args[0]
        } else {
            Write-Host "ERROR: Especifica un termino de busqueda: .\analyze-schema.ps1 find <termino>" -ForegroundColor Red
        }
    }
    "columns" {
        if ($args.Count -gt 0) {
            Get-TableColumns $args[0]
        } else {
            Write-Host "ERROR: Especifica una tabla: .\analyze-schema.ps1 columns <tabla>" -ForegroundColor Red
        }
    }
    "foreign" {
        if ($args.Count -gt 0) {
            Get-ForeignKeys $args[0]
        } else {
            Write-Host "ERROR: Especifica una tabla: .\analyze-schema.ps1 foreign <tabla>" -ForegroundColor Red
        }
    }
    default {
        Write-Host "ERROR: Comando no reconocido: $Command" -ForegroundColor Red
        Write-Host "INFO: Usa '.\analyze-schema.ps1 help' para ver todos los comandos" -ForegroundColor Yellow
    }
}
