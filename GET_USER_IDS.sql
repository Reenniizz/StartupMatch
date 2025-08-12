-- GET_USER_IDS.sql
-- Script simple para obtener los UUIDs de usuarios registrados

-- PASO 1: Ver todos los usuarios registrados
SELECT 
  'USUARIOS REGISTRADOS:' as info,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- PASO 2: Obtener los primeros 2 usuarios para usar en datos de prueba
SELECT 
  'COPIA ESTOS UUIDs PARA EL SCRIPT DE PRUEBA:' as instruccion,
  id as user_uuid,
  email as user_email,
  ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_number
FROM auth.users
ORDER BY created_at ASC
LIMIT 3;
