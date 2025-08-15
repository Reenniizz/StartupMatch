-- ========================================
-- SCRIPT COMPLETO PARA EXPORTAR ESQUEMA
-- Copia y pega en Supabase SQL Editor
-- ========================================

-- 1. LISTAR TODAS LAS TABLAS
SELECT 
    'TABLE: ' || table_name as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. OBTENER CREATE TABLE STATEMENTS
SELECT 
    table_name,
    'CREATE TABLE ' || table_name || ' (' || chr(10) ||
    string_agg(
        '    ' || column_name || ' ' || 
        UPPER(data_type) ||
        CASE 
            WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
            WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
            WHEN numeric_precision IS NOT NULL THEN '(' || numeric_precision || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ',' || chr(10)
    ) || chr(10) || ');' as create_statement
FROM information_schema.columns 
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- 3. OBTENER POLÍTICAS RLS
SELECT 
    'POLICY: ' || policyname as info,
    'CREATE POLICY ' || policyname || ' ON ' || tablename || 
    ' FOR ' || cmd || 
    CASE WHEN roles IS NOT NULL THEN ' TO ' || array_to_string(roles, ', ') ELSE '' END ||
    CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || 
    ';' as policy_sql
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. OBTENER FUNCIONES
SELECT 
    'FUNCTION: ' || routine_name as info,
    routine_definition as function_body
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 5. OBTENER TRIGGERS
SELECT 
    'TRIGGER: ' || trigger_name as info,
    event_object_table as table_name,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. OBTENER ÍNDICES
SELECT 
    'INDEX: ' || indexname as info,
    indexdef as index_sql
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;
