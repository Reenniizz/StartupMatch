-- Script para verificar el estado actual de la tabla private_messages
-- Ejecutar para ver qué campos ya existen antes de hacer cambios

-- 1. Ver estructura actual de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'private_messages' 
ORDER BY ordinal_position;

-- 2. Verificar índices existentes relacionados con mensajes
SELECT 
    i.indexname,
    i.indexdef
FROM pg_indexes i
WHERE i.tablename = 'private_messages'
AND (i.indexname LIKE '%delivered%' OR i.indexname LIKE '%read%' OR i.indexname LIKE '%status%')
ORDER BY i.indexname;

-- 3. Verificar si hay datos con delivered_at y read_at
SELECT 
    COUNT(*) as total_messages,
    COUNT(delivered_at) as messages_with_delivered_at,
    COUNT(read_at) as messages_with_read_at,
    COUNT(CASE WHEN delivered_at IS NULL THEN 1 END) as pending_delivery,
    COUNT(CASE WHEN read_at IS NULL AND delivered_at IS NOT NULL THEN 1 END) as delivered_but_unread
FROM private_messages;

-- 4. Ver comentarios en las columnas
SELECT 
    col_description(pgc.oid, a.attnum) as column_comment,
    a.attname as column_name
FROM pg_attribute a
JOIN pg_class pgc ON pgc.oid = a.attrelid
JOIN pg_namespace n ON n.oid = pgc.relnamespace
WHERE pgc.relname = 'private_messages' 
AND n.nspname = 'public'
AND a.attnum > 0
AND NOT a.attisdropped
AND col_description(pgc.oid, a.attnum) IS NOT NULL
ORDER BY a.attnum;
