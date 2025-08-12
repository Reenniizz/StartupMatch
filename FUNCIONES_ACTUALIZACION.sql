-- FUNCIONES_ACTUALIZACION.sql
-- Función para actualizar el último mensaje de una conversación

CREATE OR REPLACE FUNCTION update_conversation_last_message(
  conversation_id UUID,
  last_msg TEXT,
  msg_time TIMESTAMP
)
RETURNS void AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message = last_msg,
    last_message_at = msg_time
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Función update_conversation_last_message creada' as resultado;
