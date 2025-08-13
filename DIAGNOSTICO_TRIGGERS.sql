-- Script para investigar el error de connection_type
-- Verificar funciones y triggers que puedan estar causando el error

-- Ver todas las funciones relacionadas con connection_requests
SELECT 'FUNCIONES que mencionan connection_requests:' as titulo;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%connection_requests%'
   OR routine_definition ILIKE '%connection_type%';

-- Ver el código de triggers específicos
SELECT 'DEFINICIÓN DE TRIGGERS:' as titulo;
SELECT 
    t.trigger_name,
    p.prosrc as trigger_code
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = t.action_statement
WHERE t.event_object_table = 'connection_requests'
  AND t.event_object_schema = 'public';

-- Buscar cualquier referencia a connection_type en la base de datos
SELECT 'BÚSQUEDA DE connection_type en triggers:' as titulo;
SELECT 
    trigger_name,
    action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%connection_type%'
   OR trigger_name ILIKE '%connection%';

-- Ver si existe alguna columna connection_type en cualquier tabla
SELECT 'COLUMNAS llamadas connection_type:' as titulo;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'connection_type';
