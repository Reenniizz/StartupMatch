-- Script para verificar y crear tabla profiles si no existe
-- Ejecutar en el SQL Editor de Supabase

-- Verificar qué tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar si existe la tabla profiles
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'profiles'
) as profiles_exists;

-- Crear tabla profiles si no existe (basada en auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios vean todos los perfiles (lectura)
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone" ON profiles
FOR SELECT USING (true);

-- Política para que los usuarios solo puedan editar su propio perfil
CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Crear trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Crear índices
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON profiles(full_name);

SELECT '✅ Tabla profiles configurada correctamente' as resultado;
