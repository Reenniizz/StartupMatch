-- ==============================================
-- FIX: Agregar columnas faltantes a connection_requests
-- Solución para errores de campos no encontrados
-- ==============================================

DO $$ 
BEGIN
    -- Agregar columna connection_type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connection_requests' 
        AND column_name = 'connection_type'
    ) THEN
        ALTER TABLE connection_requests 
        ADD COLUMN connection_type VARCHAR(30) DEFAULT 'general';
        
        RAISE NOTICE 'Columna connection_type agregada a connection_requests';
    ELSE
        RAISE NOTICE 'Columna connection_type ya existe en connection_requests';
    END IF;
    
    -- Agregar columna message si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connection_requests' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE connection_requests 
        ADD COLUMN message TEXT;
        
        RAISE NOTICE 'Columna message agregada a connection_requests';
    ELSE
        RAISE NOTICE 'Columna message ya existe en connection_requests';
    END IF;

    -- Agregar constraint no_self_connection si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'connection_requests' 
        AND constraint_name = 'no_self_connection'
    ) THEN
        ALTER TABLE connection_requests 
        ADD CONSTRAINT no_self_connection CHECK (requester_id != addressee_id);
        
        RAISE NOTICE 'Constraint no_self_connection agregado';
    ELSE
        RAISE NOTICE 'Constraint no_self_connection ya existe';
    END IF;

    -- Agregar constraint unique_connection_request si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'connection_requests' 
        AND constraint_name = 'unique_connection_request'
    ) THEN
        -- Primero eliminar duplicados si existen
        DELETE FROM connection_requests a USING connection_requests b 
        WHERE a.id < b.id 
        AND a.requester_id = b.requester_id 
        AND a.addressee_id = b.addressee_id;
        
        ALTER TABLE connection_requests 
        ADD CONSTRAINT unique_connection_request UNIQUE (requester_id, addressee_id);
        
        RAISE NOTICE 'Constraint unique_connection_request agregado';
    ELSE
        RAISE NOTICE 'Constraint unique_connection_request ya existe';
    END IF;
    
    -- Actualizar constraint de status si es necesario
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%status%'
        AND check_clause LIKE '%pending%'
    ) THEN
        -- Agregar constraint de status si no existe
        ALTER TABLE connection_requests 
        ADD CONSTRAINT connection_requests_status_check 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'));
        
        RAISE NOTICE 'Constraint de status agregado';
    ELSE
        RAISE NOTICE 'Constraint de status ya existe';
    END IF;

END $$;

-- Verificar todas las columnas existentes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connection_requests' 
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'connection_requests'
ORDER BY constraint_name;
