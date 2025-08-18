-- Actualizar función get_user_conversations para incluir username
CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") 
RETURNS TABLE(
    "conversation_id" "uuid", 
    "other_user_id" "uuid", 
    "other_user_data" json, 
    "last_message" "text", 
    "last_message_at" timestamp without time zone, 
    "unread_count" integer, 
    "created_at" timestamp without time zone
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        CASE 
            WHEN c.user1_id = for_user_id THEN c.user2_id
            ELSE c.user1_id
        END as other_user_id,
        json_build_object(
            'firstName', 
            CASE 
                WHEN c.user1_id = for_user_id THEN up2.first_name
                ELSE up1.first_name
            END,
            'lastName',
            CASE 
                WHEN c.user1_id = for_user_id THEN up2.last_name
                ELSE up1.last_name
            END,
            'username',
            CASE 
                WHEN c.user1_id = for_user_id THEN up2.username
                ELSE up1.username
            END,
            'company',
            CASE 
                WHEN c.user1_id = for_user_id THEN up2.company
                ELSE up1.company
            END,
            'avatar',
            CASE 
                WHEN c.user1_id = for_user_id THEN up2.avatar_url
                ELSE up1.avatar_url
            END
        ) as other_user_data,
        (
            SELECT pm.message 
            FROM private_messages pm 
            WHERE pm.conversation_id = c.id 
            ORDER BY pm.created_at DESC 
            LIMIT 1
        ) as last_message,
        (
            SELECT pm.created_at 
            FROM private_messages pm 
            WHERE pm.conversation_id = c.id 
            ORDER BY pm.created_at DESC 
            LIMIT 1
        ) as last_message_at,
        (
            SELECT COUNT(*)::INTEGER 
            FROM private_messages pm 
            WHERE pm.conversation_id = c.id 
              AND pm.sender_id != for_user_id 
              AND pm.read_at IS NULL
        ) as unread_count,
        c.created_at
    FROM conversations c
    LEFT JOIN user_profiles up1 ON c.user1_id = up1.user_id
    LEFT JOIN user_profiles up2 ON c.user2_id = up2.user_id
    WHERE c.user1_id = for_user_id OR c.user2_id = for_user_id
    ORDER BY 
        COALESCE(
            (SELECT pm.created_at FROM private_messages pm WHERE pm.conversation_id = c.id ORDER BY pm.created_at DESC LIMIT 1),
            c.created_at
        ) DESC;
END;
$$;

-- Comentario actualizado
COMMENT ON FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") IS 'Obtiene todas las conversaciones de un usuario con información completa del otro participante incluyendo username';
