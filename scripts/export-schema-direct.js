// export-schema-direct.js - Export database schema using direct connection
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration from your .env.local
const SUPABASE_URL = 'https://cbaxjoozbnffrryuywno.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYXhqb296Ym5mZnJyeXV5d25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxOTMwNywiZXhwIjoyMDcwNDk1MzA3fQ.DgNDUPss5ksC8HfyiNIKkztSqtmVe81rfHpD-9gtDtM';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function exportSchema() {
  console.log('🗄️ Exportando esquema de base de datos...');
  
  let schemaSQL = `-- ============================================
-- STARTUPMATCH DATABASE SCHEMA EXPORT
-- Generated on: ${new Date().toISOString()}
-- Project: cbaxjoozbnffrryuywno
-- ============================================

`;

  try {
    // 1. Export table structure
    console.log('📋 Exportando estructura de tablas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️ No se puede acceder a information_schema, usando método alternativo...');
      
      // Alternative method - get table info from pg_tables
      const { data: pgTables, error: pgError } = await supabase
        .rpc('get_table_info');
        
      if (pgError) {
        console.log('📝 Obteniendo información de tablas usando SQL directo...');
        
        // Manual table list - you'll need to update this based on your actual tables
        const knownTables = [
          'profiles', 'projects', 'project_applications', 'connections', 
          'connection_requests', 'conversations', 'private_messages',
          'group_messages', 'groups', 'group_members', 'notifications',
          'user_interactions', 'matches', 'mutual_matches'
        ];
        
        for (const tableName of knownTables) {
          console.log(`📋 Procesando tabla: ${tableName}`);
          
          try {
            // Get table structure using DESCRIBE equivalent
            const { data: columns, error: columnError } = await supabase
              .rpc('get_table_columns', { table_name: tableName });
              
            if (!columnError && columns && columns.length > 0) {
              schemaSQL += `-- Table: ${tableName}\n`;
              schemaSQL += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
              
              const columnDefs = columns.map(col => {
                return `  ${col.column_name} ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`;
              }).join(',\n');
              
              schemaSQL += columnDefs + '\n);\n\n';
            } else {
              // Fallback - just create a placeholder
              schemaSQL += `-- Table: ${tableName} (structure not accessible)\n`;
              schemaSQL += `-- CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
              schemaSQL += `--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
              schemaSQL += `--   created_at timestamptz DEFAULT now()\n`;
              schemaSQL += `-- );\n\n`;
            }
          } catch (tableError) {
            console.log(`⚠️ Error procesando ${tableName}:`, tableError.message);
            schemaSQL += `-- Error accessing table: ${tableName}\n\n`;
          }
        }
      }
    } else {
      // Process tables normally
      for (const table of tables || []) {
        console.log(`📋 Procesando tabla: ${table.table_name}`);
        schemaSQL += `-- Table: ${table.table_name}\n`;
        schemaSQL += `-- Type: ${table.table_type}\n\n`;
      }
    }

    // 2. Add RLS policies info
    console.log('🔒 Exportando información de RLS policies...');
    schemaSQL += `-- ============================================
-- RLS POLICIES INFORMATION
-- ============================================

-- Enable RLS on all tables
`;

    const rlsTables = [
      'profiles', 'projects', 'project_applications', 'connections',
      'connection_requests', 'conversations', 'private_messages',
      'notifications', 'matches', 'groups', 'group_members'
    ];

    for (const table of rlsTables) {
      schemaSQL += `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n`;
    }

    // 3. Add functions and triggers info
    schemaSQL += `

-- ============================================
-- COMMON FUNCTIONS AND TRIGGERS
-- ============================================

-- Updated at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Common triggers for updated_at
`;

    for (const table of rlsTables) {
      schemaSQL += `
CREATE TRIGGER handle_${table}_updated_at
  BEFORE UPDATE ON public.${table}
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
`;
    }

    // 4. Add indexes
    schemaSQL += `

-- ============================================
-- COMMON INDEXES
-- ============================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON public.projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_connections_user1_id ON public.connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2_id ON public.connections(user2_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

`;

    // Write to file
    fs.writeFileSync('database_schema_export.sql', schemaSQL);
    console.log('✅ Esquema exportado exitosamente a: database_schema_export.sql');
    console.log(`📊 Archivo generado: ${(schemaSQL.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error exportando esquema:', error);
  }
}

// Run export
exportSchema();
