-- ==========================================
-- CORRECCIÓN DEL TRIGGER PROBLEMÁTICO
-- Actualizar la función que está causando el error
-- ==========================================

-- Corregir la función para crear notificación automática
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
                'message', NEW.message,
                'status', NEW.status
            ),
            NEW.requester_id,
            '/matches?tab=requests'
        );
        
        RAISE NOTICE 'Notificación de solicitud de conexión creada para usuario %', NEW.addressee_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que el trigger está correctamente asociado
DROP TRIGGER IF EXISTS connection_request_notification_trigger ON connection_requests;
CREATE TRIGGER connection_request_notification_trigger
    AFTER INSERT ON connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_connection_request_notification();

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Función y trigger corregidos - connection_type eliminado';
END $$;
