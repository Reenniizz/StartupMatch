-- ==========================================
-- SISTEMA DE NOTIFICACIONES PARA STARTUPMATCH
-- Compatible con esquema existente
-- Basado en: docs/database/README.md y DATABASE_SETUP.md
-- ==========================================

-- Verificar si ya existe la tabla de notificaciones
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Crear tabla de notificaciones compatible con esquema existente
        CREATE TABLE notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{}',
            read_at TIMESTAMP WITHOUT TIME ZONE NULL,
            action_url TEXT,
            related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            related_group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );

        -- Índices para optimizar consultas
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_read_at ON notifications(read_at);
        CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
        CREATE INDEX idx_notifications_type ON notifications(type);
        CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

        RAISE NOTICE 'Tabla notifications creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla notifications ya existe, omitiendo creación';
    END IF;
END $$;

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios pueden marcar sus notificaciones como leídas
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: El sistema puede crear notificaciones para cualquier usuario
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- ==========================================
-- SISTEMA DE CONNECTION REQUESTS
-- Compatible con sistema de matching existente
-- ==========================================

-- Verificar si ya existe la tabla de connection_requests
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'connection_requests') THEN
        -- Crear tabla de solicitudes de conexión
        CREATE TABLE connection_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
            connection_type VARCHAR(30) DEFAULT 'general',
            message TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            responded_at TIMESTAMP WITHOUT TIME ZONE,
            
            -- Constraints
            CONSTRAINT no_self_connection CHECK (requester_id != addressee_id),
            CONSTRAINT unique_connection_request UNIQUE (requester_id, addressee_id)
        );

        -- Índices para connection_requests
        CREATE INDEX idx_connection_requests_requester ON connection_requests(requester_id);
        CREATE INDEX idx_connection_requests_addressee ON connection_requests(addressee_id);
        CREATE INDEX idx_connection_requests_status ON connection_requests(status);
        CREATE INDEX idx_connection_requests_pending ON connection_requests(addressee_id, status) WHERE status = 'pending';

        RAISE NOTICE 'Tabla connection_requests creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla connection_requests ya existe, omitiendo creación';
    END IF;
END $$;

-- RLS para connection_requests
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para connection_requests
DROP POLICY IF EXISTS "Users can view own connection requests" ON connection_requests;
CREATE POLICY "Users can view own connection requests" ON connection_requests
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
CREATE POLICY "Users can create connection requests" ON connection_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update connection requests" ON connection_requests;
CREATE POLICY "Users can update connection requests" ON connection_requests
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ==========================================
-- FUNCIONES DE NOTIFICACIONES
-- ==========================================

-- Función para crear notificación automática cuando se recibe una solicitud de conexión
CREATE OR REPLACE FUNCTION create_connection_request_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear notificación para nuevas solicitudes pendientes
    IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status IS NULL) THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            related_user_id,
            action_url
        ) VALUES (
            NEW.addressee_id,
            'connection_request',
            'Nueva solicitud de conexión',
            'Tienes una nueva solicitud de conexión',
            jsonb_build_object(
                'connection_request_id', NEW.id,
                'requester_id', NEW.requester_id,
                'connection_type', NEW.connection_type,
                'message', NEW.message
            ),
            NEW.requester_id,
            '/matches?tab=requests'
        );
        
        RAISE NOTICE 'Notificación de solicitud de conexión creada para usuario %', NEW.addressee_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear notificaciones automáticas de solicitudes de conexión
DROP TRIGGER IF EXISTS trigger_connection_request_notification ON connection_requests;
CREATE TRIGGER trigger_connection_request_notification
    AFTER INSERT OR UPDATE ON connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_connection_request_notification();

-- Función para crear notificación cuando se acepta una conexión
CREATE OR REPLACE FUNCTION create_connection_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo crear notificación cuando el estado cambia a 'accepted'
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            related_user_id,
            action_url
        ) VALUES (
            NEW.requester_id,
            'connection_accepted',
            '¡Conexión aceptada!',
            'Tu solicitud de conexión ha sido aceptada. ¡Ya pueden conversar!',
            jsonb_build_object(
                'connection_request_id', NEW.id,
                'accepted_by', NEW.addressee_id,
                'connection_type', NEW.connection_type
            ),
            NEW.addressee_id,
            '/matches?tab=connections'
        );
        
        RAISE NOTICE 'Notificación de conexión aceptada creada para usuario %', NEW.requester_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificaciones de conexión aceptada
DROP TRIGGER IF EXISTS trigger_connection_accepted_notification ON connection_requests;
CREATE TRIGGER trigger_connection_accepted_notification
    AFTER UPDATE ON connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_connection_accepted_notification();

-- ==========================================
-- FUNCIONES UTILITARIAS
-- ==========================================

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read_at = NOW(), updated_at = NOW()
    WHERE user_id = user_uuid AND read_at IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para contar notificaciones no leídas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = user_uuid AND read_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear conversación automática cuando se acepta una conexión
CREATE OR REPLACE FUNCTION create_conversation_on_connection_accepted()
RETURNS TRIGGER AS $$
DECLARE
    conversation_exists BOOLEAN;
BEGIN
    -- Solo procesar cuando se acepta una conexión
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Verificar si ya existe una conversación entre estos usuarios
        SELECT EXISTS(
            SELECT 1 FROM conversations 
            WHERE (user1_id = NEW.requester_id AND user2_id = NEW.addressee_id)
               OR (user1_id = NEW.addressee_id AND user2_id = NEW.requester_id)
        ) INTO conversation_exists;
        
        -- Crear conversación si no existe
        IF NOT conversation_exists THEN
            INSERT INTO conversations (user1_id, user2_id, created_at)
            VALUES (
                LEAST(NEW.requester_id, NEW.addressee_id),
                GREATEST(NEW.requester_id, NEW.addressee_id),
                NOW()
            );
            
            RAISE NOTICE 'Conversación creada entre usuarios % y %', NEW.requester_id, NEW.addressee_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear conversación automáticamente
DROP TRIGGER IF EXISTS trigger_create_conversation_on_accepted ON connection_requests;
CREATE TRIGGER trigger_create_conversation_on_accepted
    AFTER UPDATE ON connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_on_connection_accepted();

-- ==========================================
-- FUNCIÓN DE TRIGGER PARA UPDATED_AT
-- ==========================================

-- Función para actualizar updated_at en notificaciones y connection_requests
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON connection_requests;
CREATE TRIGGER update_connection_requests_updated_at
    BEFORE UPDATE ON connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DATOS DE EJEMPLO (SOLO PARA DESARROLLO)
-- ==========================================

/*
-- Descomenta estas líneas solo para desarrollo/testing
-- NO ejecutar en producción

-- Insertar notificaciones de ejemplo
INSERT INTO notifications (user_id, type, title, message, data) 
SELECT 
    id as user_id,
    'connection_request' as type,
    'Nueva solicitud de conexión' as title,
    'Juan Pérez quiere conectar contigo' as message,
    '{"requester_id": "123", "connection_request_id": "456"}' as data
FROM auth.users 
WHERE email LIKE '%@test.com'
LIMIT 1;

-- Insertar solicitud de conexión de ejemplo
INSERT INTO connection_requests (requester_id, addressee_id, message, connection_type)
SELECT 
    u1.id as requester_id,
    u2.id as addressee_id,
    '¡Hola! Me gustaría conectar contigo para intercambiar ideas sobre startups.' as message,
    'general' as connection_type
FROM auth.users u1, auth.users u2
WHERE u1.email LIKE '%@test.com' AND u2.email LIKE '%@test.com' AND u1.id != u2.id
LIMIT 1;
*/

-- ==========================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ==========================================

-- Mostrar resumen de lo que se creó
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SISTEMA DE NOTIFICACIONES INSTALADO';
    RAISE NOTICE '==========================================';
    
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - notifications (con % filas)', (SELECT COUNT(*) FROM notifications);
    RAISE NOTICE '  - connection_requests (con % filas)', (SELECT COUNT(*) FROM connection_requests);
    
    RAISE NOTICE 'Funciones creadas:';
    RAISE NOTICE '  - create_connection_request_notification()';
    RAISE NOTICE '  - create_connection_accepted_notification()';
    RAISE NOTICE '  - create_conversation_on_connection_accepted()';
    RAISE NOTICE '  - mark_all_notifications_read()';
    RAISE NOTICE '  - get_unread_notifications_count()';
    
    RAISE NOTICE 'Triggers creados:';
    RAISE NOTICE '  - trigger_connection_request_notification';
    RAISE NOTICE '  - trigger_connection_accepted_notification';
    RAISE NOTICE '  - trigger_create_conversation_on_accepted';
    
    RAISE NOTICE 'Políticas RLS:';
    RAISE NOTICE '  - notifications: % políticas', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications');
    RAISE NOTICE '  - connection_requests: % políticas', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'connection_requests');
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'INSTALACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE 'Las notificaciones se crearán automáticamente';
    RAISE NOTICE 'cuando los usuarios envíen/acepten conexiones';
    RAISE NOTICE '==========================================';
END $$;
