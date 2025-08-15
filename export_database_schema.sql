-- SCRIPT PARA EXPORTAR ESQUEMA COMPLETO DESDE SUPABASE DASHBOARD
-- Copia y pega en el SQL Editor de Supabase

-- 1. OBTENER TODAS LAS TABLAS
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. OBTENER DEFINICIÓN DE TODAS LAS TABLAS
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || string_agg(
        column_name || ' ' || data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
            WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
            WHEN numeric_precision IS NOT NULL THEN '(' || numeric_precision || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
    ) || ');' as create_statement
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 3. OBTENER TODAS LAS FUNCIONES
SELECT 
    'CREATE OR REPLACE FUNCTION ' || routine_name || '() RETURNS ' || data_type || ' AS $$' || routine_definition || '$$ LANGUAGE ' || external_language || ';' as function_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. OBTENER POLÍTICAS RLS
SELECT 
    'CREATE POLICY ' || policyname || ' ON ' || tablename || 
    ' FOR ' || cmd || 
    ' TO ' || roles::text ||
    CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';' as policy_statement
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. OBTENER TRIGGERS
SELECT 
    'CREATE TRIGGER ' || trigger_name || 
    ' ' || action_timing || ' ' || string_agg(event_manipulation, ' OR ') || 
    ' ON ' || event_object_table ||
    ' FOR EACH ' || action_orientation ||
    ' EXECUTE FUNCTION ' || action_statement || ';' as trigger_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY trigger_name, action_timing, event_object_table, action_orientation, action_statement
ORDER BY event_object_table, trigger_name;
