-- Agregar campos de estado de mensajes para indicadores como WhatsApp
-- Ejecutar después de add_delivered_at_field.sql

-- Agregar campo read_at para tracking de lectura (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'private_messages' AND column_name = 'read_at') THEN
        ALTER TABLE private_messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna read_at agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna read_at ya existe, saltando...';
    END IF;
END $$;

-- Agregar índices para optimizar queries de estado
CREATE INDEX IF NOT EXISTS idx_private_messages_delivered_at 
ON private_messages(delivered_at) 
WHERE delivered_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_private_messages_read_at 
ON private_messages(read_at) 
WHERE read_at IS NULL;

-- Índice compuesto para queries de estado por conversación
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation_status 
ON private_messages(conversation_id, delivered_at, read_at);

-- Comentarios para documentar el sistema de estado
COMMENT ON COLUMN private_messages.delivered_at IS 'Timestamp cuando el mensaje fue entregado al destinatario (equivalente al segundo check ✅✅ de WhatsApp)';
COMMENT ON COLUMN private_messages.read_at IS 'Timestamp cuando el mensaje fue leído por el destinatario (equivalente al ícono de "visto" 👀 de WhatsApp)';
