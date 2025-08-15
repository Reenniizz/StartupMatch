#!/usr/bin/env node

/**
 * SUPABASE DATABASE EXPORT - SQL DIRECTO
 * Usa queries SQL directas para obtener el esquema y datos
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const SUPABASE_URL = 'https://cbaxjoozbnffrryuywno.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYXhqb296Ym5mZnJyeXV5d25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxOTMwNywiZXhwIjoyMDcwNDk1MzA3fQ.DgNDUPss5ksC8HfyiNIKkztSqtmVe81rfHpD-9gtDtM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function exportDatabaseSQL() {
  console.log('🚀 Exportando base de datos con SQL directo...');
  
  let sqlOutput = '';
  sqlOutput += '-- SUPABASE DATABASE EXPORT - COMPLETE\n';
  sqlOutput += `-- Exported on: ${new Date().toISOString()}\n`;
  sqlOutput += '-- Project: StartupMatch (cbaxjoozbnffrryuywno)\n\n';
  
  try {
    // 1. Obtener lista de tablas usando SQL directo
    console.log('📋 Obteniendo lista de tablas...');
    
    const { data: tablesResult } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });
    
    if (tablesResult && tablesResult.length > 0) {
      console.log(`📊 Encontradas ${tablesResult.length} tablas`);
      
      for (const table of tablesResult) {
        await exportTableSQL(table.table_name);
      }
    } else {
      // Fallback: usar lista conocida
      console.log('📋 Usando método alternativo...');
      await exportKnownTables();
    }
    
  } catch (error) {
    console.error('❌ Error con SQL directo:', error.message);
    console.log('🔄 Usando método alternativo...');
    await exportKnownTables();
  }
  
  async function exportKnownTables() {
    // Lista de tablas conocidas de StartupMatch
    const tables = [
      'projects',
      'groups', 
      'conversations',
      'notifications',
      'users',
      'profiles',
      'connections',
      'messages',
      'applications'
    ];
    
    sqlOutput += '-- =================================\n';
    sqlOutput += '-- ESQUEMA Y DATOS DE TABLAS\n';
    sqlOutput += '-- =================================\n\n';
    
    for (const tableName of tables) {
      console.log(`📋 Procesando tabla: ${tableName}`);
      
      try {
        // Obtener estructura de la tabla
        const { data: columns } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = '${tableName}' AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });
        
        if (columns && columns.length > 0) {
          sqlOutput += `-- Tabla: ${tableName}\n`;
          sqlOutput += `-- Columnas: ${columns.length}\n`;
          
          // Estructura de la tabla
          sqlOutput += `-- CREATE TABLE ${tableName} (\n`;
          columns.forEach((col, i) => {
            const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            const comma = i < columns.length - 1 ? ',' : '';
            sqlOutput += `--   ${col.column_name} ${col.data_type}${nullable}${defaultVal}${comma}\n`;
          });
          sqlOutput += `-- );\n\n`;
        }
        
        // Obtener datos de la tabla
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (!error && data && data.length > 0) {
          console.log(`✅ ${tableName}: ${data.length} registros`);
          
          sqlOutput += `-- Datos de ${tableName} (${data.length} registros)\n`;
          sqlOutput += `DELETE FROM "${tableName}";\n`;
          
          // Generar INSERTs
          const columns = Object.keys(data[0]);
          for (const row of data) {
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'boolean') return value;
              if (typeof value === 'number') return value;
              if (value instanceof Date) return `'${value.toISOString()}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              return `'${String(value).replace(/'/g, "''")}'`;
            });
            
            sqlOutput += `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`;
          }
          sqlOutput += '\n';
          
        } else {
          console.log(`📭 ${tableName}: tabla vacía o no accesible`);
          sqlOutput += `-- Tabla ${tableName}: sin datos o no accesible\n\n`;
        }
        
      } catch (err) {
        console.warn(`⚠️ Error con tabla ${tableName}:`, err.message);
        sqlOutput += `-- ERROR: No se pudo procesar tabla ${tableName}\n\n`;
      }
    }
  }
  
  // Escribir archivo
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `StartupMatch_Database_Export_${timestamp}.sql`;
  
  fs.writeFileSync(filename, sqlOutput);
  
  console.log(`\n✅ Exportación completa!`);
  console.log(`📂 Archivo: ${filename}`);
  console.log(`📄 Tamaño: ${Math.round(fs.statSync(filename).size / 1024)} KB`);
  
  return filename;
}

// Ejecutar
if (require.main === module) {
  exportDatabaseSQL()
    .then(filename => {
      console.log(`\n🎉 ¡Base de datos exportada exitosamente!`);
      console.log(`📁 Revisa el archivo: ${filename}`);
    })
    .catch(error => {
      console.error('💥 Error:', error.message);
    });
}
