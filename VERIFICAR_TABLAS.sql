-- VERIFICAR_TABLAS.sql
-- Script para verificar la estructura de las tablas principales

-- Verificar estructura de connection_requests
SELECT 'ESTRUCTURA connection_requests' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'connection_requests'
ORDER BY ordinal_position;

-- Ver los triggers de connection_requests
SELECT 'TRIGGERS de connection_requests' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'connection_requests'
    AND event_object_schema = 'public';

-- Ver constraints/foreign keys de connection_requests
SELECT 'CONSTRAINTS de connection_requests' as info;
SELECT
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name='connection_requests';

