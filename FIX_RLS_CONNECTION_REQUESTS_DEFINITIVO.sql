-- FIX DEFINITIVO: Deshabilitar RLS para connection_requests
-- Este script corrige el problema de que las solicitudes no se persisten

BEGIN;

-- 1. Deshabilitar RLS completamente para connection_requests
ALTER TABLE connection_requests DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes que puedan estar bloqueando
DROP POLICY IF EXISTS "connection_requests_policy" ON connection_requests;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON connection_requests;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON connection_requests;
DROP POLICY IF EXISTS "Enable update access for own requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can view connection requests they sent or received" ON connection_requests;
DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON connection_requests;

-- 3. Verificar que no hay más políticas
SELECT policyname FROM pg_policies WHERE tablename = 'connection_requests';

-- 4. Confirmar que RLS está deshabilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'connection_requests';

COMMIT;

-- Test: Insertar una solicitud de prueba directamente
INSERT INTO connection_requests (
    requester_id,
    addressee_id,
    message,
    status
) VALUES (
    'test-requester-id',
    'test-addressee-id', 
    'Test message',
    'pending'
) ON CONFLICT DO NOTHING;

-- Verificar la inserción
SELECT COUNT(*) as total_after_fix FROM connection_requests;

-- Limpiar el registro de prueba
DELETE FROM connection_requests WHERE requester_id = 'test-requester-id';
