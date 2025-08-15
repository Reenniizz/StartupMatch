const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://cbaxjoozbnffrryuywno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYXhqb296Ym5mZnJyeXV5d25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxOTMwNywiZXhwIjoyMDcwNDk1MzA3fQ.DgNDUPss5ksC8HfyiNIKkztSqtmVe81rfHpD-9gtDtM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function exportDatabaseSchema() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `export_database_schema.sql`;
  
  let schemaSQL = `-- =====================================================
-- STARTUPMATCH DATABASE SCHEMA EXPORT
-- Generated: ${new Date().toISOString()}
-- Database: cbaxjoozbnffrryuywno.supabase.co
-- =====================================================

`;

  try {
    console.log('🔍 Exportando estructura de la base de datos...');
    
    // 1. OBTENER INFORMACIÓN DE TABLAS
    console.log('📋 Obteniendo información de tablas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('Error obteniendo tablas:', tablesError);
      return;
    }

    console.log(`✅ Encontradas ${tables.length} tablas`);

    // 2. OBTENER ESQUEMA COMPLETO CON SQL DIRECTO
    console.log('🏗️ Obteniendo esquema completo...');
    
    const schemaQueries = [
      // Obtener CREATE TABLE statements
      `
      SELECT 
        'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
        string_agg(column_name || ' ' || column_type, ', ') || ');' as create_statement,
        tablename
      FROM (
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          format_type(atttypid, atttypmod) as column_type,
          attnum
        FROM pg_attribute 
        JOIN pg_class ON pg_class.oid = pg_attribute.attrelid
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_attribute.attnum > 0 
        AND NOT pg_attribute.attisdropped
        AND schemaname = 'public'
        AND pg_class.relkind = 'r'
      ) t
      GROUP BY schemaname, tablename
      ORDER BY tablename;
      `,
      
      // Obtener constraints
      `
      SELECT conname, pg_get_constraintdef(c.oid) as constraint_def, conrelid::regclass as table_name
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public'
      ORDER BY conrelid::regclass::text, contype;
      `,
      
      // Obtener índices
      `
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname;
      `,
      
      // Obtener funciones
      `
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
      `,
      
      // Obtener triggers
      `
      SELECT 
        t.tgname as trigger_name,
        pg_get_triggerdef(t.oid) as trigger_definition
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND NOT t.tgisinternal
      ORDER BY t.tgname;
      `
    ];

    // Ejecutar consulta para obtener la estructura
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Obtener todas las tablas con sus columnas
        SELECT 
          'CREATE TABLE IF NOT EXISTS ' || t.table_name || ' (' ||
          string_agg(
            c.column_name || ' ' || 
            CASE 
              WHEN c.data_type = 'character varying' THEN 'varchar(' || c.character_maximum_length || ')'
              WHEN c.data_type = 'character' THEN 'char(' || c.character_maximum_length || ')'
              WHEN c.data_type = 'numeric' THEN 'numeric(' || c.numeric_precision || ',' || c.numeric_scale || ')'
              ELSE c.data_type
            END ||
            CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default ELSE '' END
            , ', '
            ORDER BY c.ordinal_position
          ) || ');' as create_statement
        FROM information_schema.tables t
        JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name
        ORDER BY t.table_name;
      `
    });

    if (schemaError) {
      console.log('⚠️ RPC no disponible, usando método alternativo...');
      
      // Método alternativo: obtener información básica de tablas
      for (const table of tables) {
        console.log(`📄 Procesando tabla: ${table.table_name}`);
        
        // Obtener columnas de la tabla
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('*')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (!columnsError && columns) {
          schemaSQL += `\n-- Tabla: ${table.table_name}\n`;
          schemaSQL += `CREATE TABLE IF NOT EXISTS ${table.table_name} (\n`;
          
          const columnDefs = columns.map(col => {
            let columnDef = `  ${col.column_name} ${col.data_type}`;
            
            // Agregar longitud para varchar
            if (col.data_type === 'character varying' && col.character_maximum_length) {
              columnDef += `(${col.character_maximum_length})`;
            }
            
            // Agregar NOT NULL si aplica
            if (col.is_nullable === 'NO') {
              columnDef += ' NOT NULL';
            }
            
            // Agregar DEFAULT si aplica
            if (col.column_default) {
              columnDef += ` DEFAULT ${col.column_default}`;
            }
            
            return columnDef;
          });
          
          schemaSQL += columnDefs.join(',\n');
          schemaSQL += `\n);\n`;
        }
      }
      
    } else {
      // Usar datos del RPC si está disponible
      schemaData.forEach(row => {
        schemaSQL += `\n${row.create_statement}\n`;
      });
    }

    // 3. AGREGAR POLÍTICAS RLS
    console.log('🔒 Obteniendo políticas RLS...');
    try {
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('*');
      
      if (policies && policies.length > 0) {
        schemaSQL += `\n-- =====================================================\n`;
        schemaSQL += `-- ROW LEVEL SECURITY POLICIES\n`;
        schemaSQL += `-- =====================================================\n`;
        
        policies.forEach(policy => {
          schemaSQL += `\n-- Política: ${policy.policyname} en tabla ${policy.tablename}\n`;
          schemaSQL += `ALTER TABLE ${policy.tablename} ENABLE ROW LEVEL SECURITY;\n`;
          schemaSQL += `CREATE POLICY "${policy.policyname}" ON ${policy.tablename}\n`;
          schemaSQL += `  FOR ${policy.cmd || 'ALL'}\n`;
          if (policy.roles && policy.roles.length > 0) {
            schemaSQL += `  TO ${policy.roles.join(', ')}\n`;
          }
          if (policy.qual) {
            schemaSQL += `  USING (${policy.qual})\n`;
          }
          if (policy.with_check) {
            schemaSQL += `  WITH CHECK (${policy.with_check})\n`;
          }
          schemaSQL += `;\n`;
        });
      }
    } catch (error) {
      console.log('⚠️ No se pudieron obtener las políticas RLS');
    }

    // 4. AGREGAR EXTENSIONES COMUNES
    schemaSQL += `\n-- =====================================================\n`;
    schemaSQL += `-- EXTENSIONES COMUNES DE SUPABASE\n`;
    schemaSQL += `-- =====================================================\n`;
    schemaSQL += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
    schemaSQL += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n`;
    schemaSQL += `CREATE EXTENSION IF NOT EXISTS "pgjwt";\n`;
    
    // 5. GUARDAR ARCHIVO
    fs.writeFileSync(filename, schemaSQL);
    
    console.log(`\n✅ ¡Esquema exportado exitosamente!`);
    console.log(`📄 Archivo: ${filename}`);
    console.log(`📊 Tablas procesadas: ${tables.length}`);
    console.log(`📏 Tamaño del archivo: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
    
    // Mostrar resumen de tablas
    console.log(`\n📋 TABLAS ENCONTRADAS:`);
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error exportando esquema:', error);
  }
}

// Ejecutar la exportación
exportDatabaseSchema();
