-- ==============================================
-- FIX: Agregar columna updated_at a connection_requests
-- Solución para error: record "new" has no field "updated_at"
-- ==============================================

-- Verificar si existe la columna updated_at en connection_requests
DO $$ 
BEGIN
    -- Agregar columna updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connection_requests' 
        AND column_name = 'updated_at'
    ) THEN
        -- Agregar la columna con valor por defecto
        ALTER TABLE connection_requests 
        ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
        
        -- Actualizar registros existentes con la fecha de creación
        UPDATE connection_requests 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'Columna updated_at agregada a connection_requests';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe en connection_requests';
    END IF;
END $$;

-- Verificar que el trigger y función existan
-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para connection_requests si no existe
DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON connection_requests;
CREATE TRIGGER update_connection_requests_updated_at
    BEFORE UPDATE ON connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificación final y mensaje
DO $$ 
BEGIN
    RAISE NOTICE 'Fix aplicado exitosamente para connection_requests.updated_at';
END $$;

-- Verificar columnas existentes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connection_requests' 
  AND column_name IN ('updated_at', 'responded_at', 'created_at')
ORDER BY column_name;
