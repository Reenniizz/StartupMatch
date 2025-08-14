-- ==========================================
-- 🔧 AGREGAR COLUMNAS FALTANTES A PROJECTS
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- Verificar estructura actual de la tabla projects
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Agregar columnas faltantes si no existen
DO $$ 
BEGIN
    -- budget_max
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'budget_max') THEN
        ALTER TABLE projects ADD COLUMN budget_max INTEGER;
    END IF;
    
    -- budget_min (por si también falta)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'budget_min') THEN
        ALTER TABLE projects ADD COLUMN budget_min INTEGER DEFAULT 0;
    END IF;
    
    -- location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'location') THEN
        ALTER TABLE projects ADD COLUMN location VARCHAR(200);
    END IF;
    
    -- timeline
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'timeline') THEN
        ALTER TABLE projects ADD COLUMN timeline VARCHAR(100);
    END IF;
    
    -- stage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'stage') THEN
        ALTER TABLE projects ADD COLUMN stage VARCHAR(50) DEFAULT 'idea';
    END IF;
    
    -- visibility
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'visibility') THEN
        ALTER TABLE projects ADD COLUMN visibility VARCHAR(20) DEFAULT 'public';
    END IF;
    
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE projects ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    
    -- category
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'category') THEN
        ALTER TABLE projects ADD COLUMN category VARCHAR(100);
    END IF;
    
    RAISE NOTICE 'Columnas agregadas exitosamente';
END $$;

-- Verificar estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
