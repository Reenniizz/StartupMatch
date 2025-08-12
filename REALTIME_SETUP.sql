-- REALTIME_SETUP.sql
-- Verificar y preparar tablas para Supabase Realtime

-- Verificar estructura de private_messages
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'private_messages' 
AND table_schema = 'public';

-- Verificar estructura de group_messages  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'group_messages' 
AND table_schema = 'public';

-- Habilitar realtime para las tablas (ejecutar en Supabase SQL Editor)
-- ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

SELECT '✅ Ejecuta los comandos ALTER PUBLICATION en Supabase SQL Editor' as instruccion;
