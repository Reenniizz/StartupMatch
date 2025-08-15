#!/usr/bin/env node

/**
 * SUPABASE DATABASE EXPORT SCRIPT
 * Genera un archivo SQL completo con esquema y datos
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase (desde .env.local)
const SUPABASE_URL = 'https://cbaxjoozbnffrryuywno.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYXhqb296Ym5mZnJyeXV5d25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxOTMwNywiZXhwIjoyMDcwNDk1MzA3fQ.DgNDUPss5ksC8HfyiNIKkztSqtmVe81rfHpD-9gtDtM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function exportDatabase() {
  console.log('🚀 Iniciando exportación de base de datos...');
  
  let sqlOutput = '';
  sqlOutput += '-- SUPABASE DATABASE EXPORT\n';
  sqlOutput += `-- Exported on: ${new Date().toISOString()}\n`;
  sqlOutput += '-- Project: StartupMatch (cbaxjoozbnffrryuywno)\n\n';
  
  try {
    // Obtener lista de tablas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.error('❌ Error obteniendo tablas:', tablesError);
      
      // Fallback: Lista manual de tablas conocidas
      const knownTables = [
        'profiles', 'projects', 'applications', 'connections',
        'matches', 'groups', 'group_members', 'conversations',
        'messages', 'notifications', 'skills', 'interests'
      ];
      
      console.log('📋 Usando lista manual de tablas conocidas...');
      
      for (const tableName of knownTables) {
        await exportTable(tableName, sqlOutput);
      }
    } else {
      console.log(`📊 Encontradas ${tables.length} tablas para exportar`);
      
      // Exportar cada tabla
      for (const table of tables) {
        await exportTable(table.table_name, sqlOutput);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en exportación:', error.message);
    
    // Export manual de las tablas más importantes
    console.log('🔄 Intentando exportación manual de tablas críticas...');
    
    const criticalTables = ['profiles', 'projects', 'applications', 'connections'];
    
    for (const tableName of criticalTables) {
      console.log(`📋 Exportando tabla: ${tableName}`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (!error && data && data.length > 0) {
          sqlOutput += `\n-- Tabla: ${tableName}\n`;
          sqlOutput += `-- Registros: ${data.length}\n\n`;
          
          // Generar INSERTs
          const columns = Object.keys(data[0]);
          const tableSql = generateInsertStatements(tableName, columns, data);
          sqlOutput += tableSql;
        }
      } catch (err) {
        console.warn(`⚠️ No se pudo exportar ${tableName}:`, err.message);
      }
    }
  }
  
  // Escribir archivo
  const filename = `supabase_export_${Date.now()}.sql`;
  fs.writeFileSync(filename, sqlOutput);
  
  console.log(`✅ Base de datos exportada a: ${filename}`);
  console.log(`📄 Tamaño del archivo: ${Math.round(fs.statSync(filename).size / 1024)} KB`);
  
  return filename;
}

async function exportTable(tableName, sqlOutput) {
  try {
    console.log(`📋 Exportando tabla: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.warn(`⚠️ Error en tabla ${tableName}:`, error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`📭 Tabla ${tableName} está vacía`);
      return;
    }
    
    sqlOutput += `\n-- Tabla: ${tableName}\n`;
    sqlOutput += `-- Registros: ${data.length}\n\n`;
    
    // Generar INSERTs
    const columns = Object.keys(data[0]);
    const tableSql = generateInsertStatements(tableName, columns, data);
    sqlOutput += tableSql;
    
    console.log(`✅ Tabla ${tableName}: ${data.length} registros exportados`);
    
  } catch (err) {
    console.warn(`⚠️ No se pudo exportar ${tableName}:`, err.message);
  }
}

function generateInsertStatements(tableName, columns, data) {
  let sql = '';
  
  // Limpiar tabla
  sql += `-- Limpiar tabla ${tableName}\n`;
  sql += `DELETE FROM "${tableName}";\n\n`;
  
  // Generar INSERTs
  for (const row of data) {
    const values = columns.map(col => {
      const value = row[col];
      
      if (value === null) return 'NULL';
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value;
      if (value instanceof Date) return `'${value.toISOString()}'`;
      if (typeof value === 'object') {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }
      
      return `'${String(value).replace(/'/g, "''")}'`;
    });
    
    sql += `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`;
  }
  
  sql += '\n';
  return sql;
}

// Ejecutar exportación
if (require.main === module) {
  exportDatabase()
    .then(filename => {
      console.log(`\n🎉 ¡Exportación completa!`);
      console.log(`📂 Archivo generado: ${filename}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { exportDatabase };
