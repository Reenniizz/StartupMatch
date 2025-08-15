

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_compatibility"("p_user1_id" "uuid", "p_user2_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    score INTEGER := 0;
    profile1 RECORD;
    profile2 RECORD;
    common_skills INTEGER;
    common_objectives INTEGER;
    location_match BOOLEAN := FALSE;
    industry_match BOOLEAN := FALSE;
BEGIN
    -- Obtener perfiles
    SELECT * INTO profile1 FROM user_profiles WHERE user_profiles.user_id = p_user1_id;
    SELECT * INTO profile2 FROM user_profiles WHERE user_profiles.user_id = p_user2_id;
    
    IF profile1 IS NULL OR profile2 IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Puntos por industria similar (20 puntos max)
    IF profile1.industry = profile2.industry THEN
        score := score + 20;
        industry_match := TRUE;
    END IF;
    
    -- Puntos por ubicación similar (15 puntos max)
    IF profile1.location = profile2.location THEN
        score := score + 15;
        location_match := TRUE;
    END IF;
    
    -- Puntos por experiencia complementaria (15 puntos max)
    IF ABS(profile1.experience_years - profile2.experience_years) BETWEEN 2 AND 5 THEN
        score := score + 15;
    ELSIF ABS(profile1.experience_years - profile2.experience_years) <= 1 THEN
        score := score + 10;
    END IF;
    
    -- Puntos por habilidades comunes (25 puntos max)
    SELECT COUNT(*) INTO common_skills
    FROM user_skills s1
    JOIN user_skills s2 ON s1.skill_name = s2.skill_name
    WHERE s1.user_id = p_user1_id 
    AND s2.user_id = p_user2_id;
    
    score := score + LEAST(common_skills * 5, 25);
    
    -- Puntos por objetivos comunes (15 puntos max)
    SELECT COUNT(*) INTO common_objectives
    FROM user_objectives o1
    JOIN user_objectives o2 ON o1.objective_type = o2.objective_type
    WHERE o1.user_id = p_user1_id 
    AND o2.user_id = p_user2_id;
    
    score := score + LEAST(common_objectives * 8, 15);
    
    -- Bonus por perfil completado (10 puntos max)
    IF profile1.profile_completed_at IS NOT NULL AND profile2.profile_completed_at IS NOT NULL THEN
        score := score + 10;
    END IF;
    
    -- Asegurar que el score esté en el rango 0-100
    RETURN LEAST(GREATEST(score, 0), 100);
END;
$$;


ALTER FUNCTION "public"."calculate_compatibility"("p_user1_id" "uuid", "p_user2_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_compatibility"("p_user1_id" "uuid", "p_user2_id" "uuid") IS 'Calcula score de compatibilidad entre dos usuarios basado en perfiles';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_cache"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM compatibility_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_inactive_subscriptions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM push_subscriptions 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_inactive_subscriptions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_project_files"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Eliminar registros de archivos cuyos proyectos ya no existen
    DELETE FROM project_files 
    WHERE project_id NOT IN (SELECT id FROM projects);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_orphaned_project_files"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_connection_accepted_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_connection_accepted_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_connection_request_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_connection_request_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_conversation_on_connection"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Solo cuando se acepta una solicitud de conexión
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        -- Crear conversación con IDs ordenados para evitar duplicados
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (
            LEAST(NEW.requester_id, NEW.addressee_id),
            GREATEST(NEW.requester_id, NEW.addressee_id)
        )
        ON CONFLICT DO NOTHING; -- Evitar duplicados si ya existe
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_conversation_on_connection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_conversation_on_connection_accepted"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_conversation_on_connection_accepted"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_notification_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_notification_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_notification_preferences"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO notification_preferences (
        user_id, 
        new_matches, 
        new_messages
    )
    VALUES (
        user_id_param, 
        true,  -- new_matches habilitado por defecto
        true   -- new_messages habilitado por defecto
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."create_default_notification_preferences"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_mutual_match"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Solo si es un 'like' y ya existe un like recíproco
    IF NEW.interaction_type = 'like' THEN
        -- Verificar si existe like recíproco
        IF EXISTS (
            SELECT 1 FROM user_interactions 
            WHERE user_id = NEW.target_user_id 
            AND target_user_id = NEW.user_id 
            AND interaction_type = 'like'
        ) THEN
            -- Crear match mutuo (con IDs ordenados)
            INSERT INTO mutual_matches (user1_id, user2_id, compatibility_score)
            VALUES (
                LEAST(NEW.user_id, NEW.target_user_id),
                GREATEST(NEW.user_id, NEW.target_user_id),
                -- Obtener score del cache si existe
                COALESCE(
                    (SELECT compatibility_score FROM compatibility_cache 
                     WHERE user1_id = LEAST(NEW.user_id, NEW.target_user_id)
                     AND user2_id = GREATEST(NEW.user_id, NEW.target_user_id)
                     AND expires_at > NOW()),
                    75 -- Score por defecto
                )
            )
            ON CONFLICT (user1_id, user2_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_mutual_match"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_guaranteed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Crear perfil básico SIEMPRE
    INSERT INTO user_profiles (
        user_id,
        email,
        username,
        first_name,
        last_name,
        role,
        industry,
        location,
        created_at
    ) 
    SELECT 
        NEW.id,
        NEW.email,
        CASE 
            WHEN NEW.raw_user_meta_data->>'username' IS NOT NULL 
            THEN NEW.raw_user_meta_data->>'username'
            ELSE split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)
        END,
        COALESCE(NEW.raw_user_meta_data->>'firstName', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'lastName', 'Nuevo'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Profesional'),
        COALESCE(NEW.raw_user_meta_data->>'industry', 'Tecnología'),
        COALESCE(NEW.raw_user_meta_data->>'location', 'No especificado'),
        now()
    WHERE NOT EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = NEW.id
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_profile_guaranteed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."drop_policy_if_exists"("policy_name" "text", "table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    RAISE NOTICE 'Policy % dropped from table %', policy_name, table_name;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy % not found on table % (skipping)', policy_name, table_name;
END;
$$;


ALTER FUNCTION "public"."drop_policy_if_exists"("policy_name" "text", "table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_notification_stats"("user_id_param" "uuid") RETURNS TABLE("total_sent" bigint, "total_clicked" bigint, "click_rate" integer, "last_notification" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sent,
        COUNT(clicked_at) as total_clicked,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(clicked_at)::numeric / COUNT(*)::numeric) * 100)::integer
            ELSE 0
        END as click_rate,
        MAX(sent_at) as last_notification
    FROM notification_history 
    WHERE notification_history.user_id = user_id_param
    AND status = 'sent';
END;
$$;


ALTER FUNCTION "public"."get_notification_stats"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_potential_matches"("p_target_user_id" "uuid", "p_limit_count" integer DEFAULT 10, "p_min_compatibility" integer DEFAULT 50) RETURNS TABLE("user_id" "uuid", "username" character varying, "first_name" character varying, "last_name" character varying, "bio" "text", "role" character varying, "company" character varying, "industry" character varying, "location" character varying, "experience_years" integer, "avatar_url" "text", "estimated_compatibility" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.username,
        up.first_name,
        up.last_name,
        up.bio,
        up.role,
        up.company,
        up.industry,
        up.location,
        up.experience_years,
        up.avatar_url,
        COALESCE(cc.compatibility_score, calculate_compatibility(p_target_user_id, up.user_id)) as estimated_compatibility
    FROM user_profiles up
    LEFT JOIN compatibility_cache cc ON (
        cc.user1_id = LEAST(p_target_user_id, up.user_id) AND
        cc.user2_id = GREATEST(p_target_user_id, up.user_id) AND
        cc.expires_at > NOW()
    )
    WHERE up.user_id != p_target_user_id
    AND up.profile_visibility IN ('public', 'connections')
    -- Excluir usuarios ya evaluados
    AND NOT EXISTS (
        SELECT 1 FROM user_interactions ui 
        WHERE ui.user_id = p_target_user_id AND ui.target_user_id = up.user_id
    )
    -- Excluir usuarios que ya tienen match mutuo
    AND NOT EXISTS (
        SELECT 1 FROM mutual_matches mm 
        WHERE (mm.user1_id = LEAST(p_target_user_id, up.user_id) AND mm.user2_id = GREATEST(p_target_user_id, up.user_id))
    )
    -- Excluir usuarios con solicitudes de conexión existentes
    AND NOT EXISTS (
        SELECT 1 FROM connection_requests cr 
        WHERE (cr.requester_id = p_target_user_id AND cr.addressee_id = up.user_id)
        OR (cr.requester_id = up.user_id AND cr.addressee_id = p_target_user_id)
    )
    AND COALESCE(cc.compatibility_score, calculate_compatibility(p_target_user_id, up.user_id)) >= p_min_compatibility
    ORDER BY estimated_compatibility DESC, up.created_at DESC
    LIMIT p_limit_count;
END;
$$;


ALTER FUNCTION "public"."get_potential_matches"("p_target_user_id" "uuid", "p_limit_count" integer, "p_min_compatibility" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_potential_matches"("p_target_user_id" "uuid", "p_limit_count" integer, "p_min_compatibility" integer) IS 'Obtiene usuarios potenciales para matching, excluyendo ya evaluados';



CREATE OR REPLACE FUNCTION "public"."get_project_files"("project_uuid" "uuid") RETURNS TABLE("id" "uuid", "file_name" character varying, "file_type" character varying, "file_size" bigint, "mime_type" character varying, "title" character varying, "description" "text", "is_public" boolean, "public_url" "text", "created_at" timestamp without time zone, "uploader_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT 
        pf.id,
        pf.file_name,
        pf.file_type,
        pf.file_size,
        pf.mime_type,
        pf.title,
        pf.description,
        pf.is_public,
        pf.public_url,
        pf.created_at,
        CONCAT(up.first_name, ' ', up.last_name) as uploader_name
    FROM project_files pf
    LEFT JOIN user_profiles up ON up.user_id = pf.uploader_id
    WHERE pf.project_id = project_uuid
    ORDER BY pf.display_order ASC, pf.created_at DESC;
$$;


ALTER FUNCTION "public"."get_project_files"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_stats"("project_uuid" "uuid") RETURNS TABLE("total_views" bigint, "unique_views" bigint, "total_likes" bigint, "total_applications" bigint, "team_members" bigint, "recent_activity_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(pv.id) as total_views,
        COUNT(DISTINCT pv.viewer_id) as unique_views,
        COUNT(DISTINCT pl.id) as total_likes,
        COUNT(DISTINCT pa.id) as total_applications,
        COUNT(DISTINCT ptm.id) as team_members,
        COUNT(DISTINCT pu.id) FILTER (WHERE pu.published_at > NOW() - INTERVAL '30 days') as recent_activity_count
    FROM projects p
    LEFT JOIN project_views pv ON p.id = pv.project_id
    LEFT JOIN project_likes pl ON p.id = pl.project_id
    LEFT JOIN project_applications pa ON p.id = pa.project_id
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id AND ptm.status = 'active'
    LEFT JOIN project_updates pu ON p.id = pu.project_id
    WHERE p.id = project_uuid
    GROUP BY p.id;
END;
$$;


ALTER FUNCTION "public"."get_project_stats"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_stats_simple"("project_uuid" "uuid") RETURNS TABLE("project_exists" boolean, "created_days_ago" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM projects WHERE id = project_uuid) as project_exists,
    COALESCE(EXTRACT(DAYS FROM NOW() - created_at)::INTEGER, 0) as created_days_ago
  FROM projects 
  WHERE id = project_uuid
  LIMIT 1;
  
  -- If no results, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_project_stats_simple"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recommended_projects"("target_user_id" "uuid", "limit_count" integer DEFAULT 10) RETURNS TABLE("project_id" "uuid", "title" character varying, "tagline" character varying, "category" character varying, "industry" character varying, "creator_name" "text", "logo_url" "text", "compatibility_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_skills TEXT[];
    user_industry TEXT;
    user_objectives TEXT[];
BEGIN
    -- Obtener información del usuario
    SELECT up.industry, array_agg(DISTINCT us.skill_name), array_agg(DISTINCT uo.objective_type)
    INTO user_industry, user_skills, user_objectives
    FROM user_profiles up
    LEFT JOIN user_skills us ON up.user_id = us.user_id
    LEFT JOIN user_objectives uo ON up.user_id = uo.user_id
    WHERE up.user_id = target_user_id
    GROUP BY up.industry;

    RETURN QUERY
    SELECT 
        p.id as project_id,
        p.title,
        p.tagline,
        p.category,
        p.industry,
        (up.first_name || ' ' || up.last_name) as creator_name,
        p.logo_url,
        (
            -- Score basado en industry match
            CASE WHEN p.industry = user_industry THEN 30 ELSE 0 END +
            -- Score basado en skills requeridas que el usuario tiene
            (SELECT COUNT(*) * 20 FROM unnest(user_skills) skill 
             WHERE skill = ANY(SELECT jsonb_array_elements_text(p.required_skills))) +
            -- Bonus si buscan cofundador y el usuario tiene objetivos de emprendimiento
            CASE WHEN p.is_seeking_cofounder AND 'entrepreneurship' = ANY(user_objectives) THEN 20 ELSE 0 END +
            -- Factor de actividad reciente
            CASE WHEN p.last_activity_at > NOW() - INTERVAL '7 days' THEN 10 ELSE 0 END
        )::INTEGER as compatibility_score
    FROM projects p
    LEFT JOIN user_profiles up ON p.creator_id = up.user_id
    WHERE 
        p.status = 'active'
        AND p.visibility = 'public'
        AND p.creator_id != target_user_id
        AND NOT EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = p.id AND ptm.user_id = target_user_id
        )
        AND NOT EXISTS (
            SELECT 1 FROM project_applications pa
            WHERE pa.project_id = p.id AND pa.applicant_id = target_user_id
        )
    ORDER BY compatibility_score DESC, p.last_activity_at DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_recommended_projects"("target_user_id" "uuid", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = user_uuid AND read_at IS NULL
    );
END;
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_connections"("p_target_user_id" "uuid") RETURNS TABLE("connection_id" "uuid", "other_user_id" "uuid", "other_user_name" character varying, "other_user_avatar" "text", "other_user_role" character varying, "other_user_company" character varying, "connection_status" character varying, "connected_at" timestamp without time zone, "is_requester" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id as connection_id,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN cr.addressee_id
            ELSE cr.requester_id
        END as other_user_id,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN (up2.first_name || ' ' || up2.last_name)::VARCHAR
            ELSE (up1.first_name || ' ' || up1.last_name)::VARCHAR
        END as other_user_name,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN up2.avatar_url
            ELSE up1.avatar_url
        END as other_user_avatar,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN up2.role
            ELSE up1.role
        END as other_user_role,
        CASE 
            WHEN cr.requester_id = p_target_user_id THEN up2.company
            ELSE up1.company
        END as other_user_company,
        cr.status::VARCHAR as connection_status,
        COALESCE(cr.responded_at, cr.created_at) as connected_at,
        (cr.requester_id = p_target_user_id) as is_requester
    FROM connection_requests cr
    LEFT JOIN user_profiles up1 ON cr.requester_id = up1.user_id
    LEFT JOIN user_profiles up2 ON cr.addressee_id = up2.user_id
    WHERE 
        (cr.requester_id = p_target_user_id OR cr.addressee_id = p_target_user_id)
        AND cr.status IN ('accepted', 'pending')
    ORDER BY 
        CASE WHEN cr.status = 'pending' THEN 0 ELSE 1 END,
        COALESCE(cr.responded_at, cr.created_at) DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_connections"("p_target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_connections"("p_target_user_id" "uuid") IS 'Obtiene las conexiones de un usuario con detalles';



CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") RETURNS TABLE("conversation_id" "uuid", "other_user_id" "uuid", "other_user_data" json, "last_message" "text", "last_message_at" timestamp without time zone, "unread_count" integer, "created_at" timestamp without time zone)
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


ALTER FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") IS 'Obtiene todas las conversaciones de un usuario con información del otro participante';



CREATE OR REPLACE FUNCTION "public"."get_user_groups"("for_user_id" "uuid") RETURNS TABLE("group_id" "uuid", "group_data" "jsonb", "member_count" bigint, "last_activity" timestamp without time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as group_id,
    jsonb_build_object(
      'name', g.name,
      'description', g.description,
      'category', g.category,
      'isPrivate', g.is_private,
      'isVerified', g.is_verified,
      'tags', g.tags,
      'createdBy', g.created_by,
      'createdAt', g.created_at
    ) as group_data,
    COUNT(gm.user_id) as member_count,
    COALESCE(MAX(gmsg.created_at), g.created_at) as last_activity
  FROM groups g
  LEFT JOIN group_memberships gm ON g.id = gm.group_id
  LEFT JOIN group_messages gmsg ON g.id = gmsg.group_id
  WHERE g.id IN (
    SELECT group_id FROM group_memberships WHERE user_id = for_user_id
  )
  GROUP BY g.id, g.name, g.description, g.category, g.is_private, g.is_verified, 
           g.tags, g.created_by, g.created_at
  ORDER BY last_activity DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_groups"("for_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read_at = NOW(), updated_at = NOW()
    WHERE user_id = user_uuid AND read_at IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_projects"("search_term" "text" DEFAULT ''::"text", "category_filter" "text" DEFAULT ''::"text", "industry_filter" "text" DEFAULT ''::"text", "stage_filter" "text" DEFAULT ''::"text", "seeking_cofounder" boolean DEFAULT NULL::boolean, "seeking_investors" boolean DEFAULT NULL::boolean, "limit_count" integer DEFAULT 20, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" character varying, "tagline" character varying, "description" "text", "category" character varying, "industry" character varying, "stage" character varying, "creator_id" "uuid", "creator_name" "text", "creator_avatar" "text", "logo_url" "text", "view_count" integer, "like_count" integer, "application_count" integer, "team_size_current" integer, "is_seeking_cofounder" boolean, "is_seeking_investors" boolean, "created_at" timestamp without time zone, "last_activity_at" timestamp without time zone, "relevance_score" real)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.tagline,
        p.description,
        p.category,
        p.industry,
        p.stage,
        p.creator_id,
        (up.first_name || ' ' || up.last_name) as creator_name,
        up.avatar_url as creator_avatar,
        p.logo_url,
        p.view_count,
        p.like_count,
        p.application_count,
        p.team_size_current,
        p.is_seeking_cofounder,
        p.is_seeking_investors,
        p.created_at,
        p.last_activity_at,
        CASE 
            WHEN search_term = '' THEN 1.0
            ELSE 
                ts_rank(
                    to_tsvector('spanish', 
                        COALESCE(p.title, '') || ' ' || 
                        COALESCE(p.tagline, '') || ' ' || 
                        COALESCE(p.description, '')
                    ), 
                    plainto_tsquery('spanish', search_term)
                )
        END as relevance_score
    FROM projects p
    LEFT JOIN user_profiles up ON p.creator_id = up.user_id
    WHERE 
        p.status = 'active'
        AND p.visibility = 'public'
        AND (search_term = '' OR 
             to_tsvector('spanish', 
                COALESCE(p.title, '') || ' ' || 
                COALESCE(p.tagline, '') || ' ' || 
                COALESCE(p.description, '')
             ) @@ plainto_tsquery('spanish', search_term))
        AND (category_filter = '' OR p.category = category_filter)
        AND (industry_filter = '' OR p.industry = industry_filter)
        AND (stage_filter = '' OR p.stage = stage_filter)
        AND (seeking_cofounder IS NULL OR p.is_seeking_cofounder = seeking_cofounder)
        AND (seeking_investors IS NULL OR p.is_seeking_investors = seeking_investors)
    ORDER BY relevance_score DESC, p.last_activity_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$;


ALTER FUNCTION "public"."search_projects"("search_term" "text", "category_filter" "text", "industry_filter" "text", "stage_filter" "text", "seeking_cofounder" boolean, "seeking_investors" boolean, "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_projects_simple"("search_term" "text" DEFAULT NULL::"text", "user_id_filter" "uuid" DEFAULT NULL::"uuid", "page_limit" integer DEFAULT 12, "page_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "creator_id" "uuid", "created_at" timestamp with time zone, "search_rank" real)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.creator_id,
    p.created_at,
    CASE 
      WHEN search_term IS NOT NULL THEN
        ts_rank(to_tsvector('spanish', p.title || ' ' || COALESCE(p.description, '')), 
                plainto_tsquery('spanish', search_term))
      ELSE 1.0
    END as search_rank
  FROM projects p
  WHERE 
    (user_id_filter IS NULL OR p.creator_id = user_id_filter)
    AND (
      search_term IS NULL OR
      to_tsvector('spanish', p.title || ' ' || COALESCE(p.description, '')) 
      @@ plainto_tsquery('spanish', search_term)
    )
  ORDER BY 
    search_rank DESC,
    p.created_at DESC
  OFFSET page_offset
  LIMIT page_limit;
END;
$$;


ALTER FUNCTION "public"."search_projects_simple"("search_term" "text", "user_id_filter" "uuid", "page_limit" integer, "page_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."simple_create_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO user_profiles (user_id, email, username, first_name, last_name, role, industry, location)
    VALUES (
        NEW.id,
        NEW.email,
        split_part(NEW.email, '@', 1),
        'Usuario',
        'Nuevo',
        'Profesional',
        'Tecnología',
        'No especificado'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Continuar aunque falle
END;
$$;


ALTER FUNCTION "public"."simple_create_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message = NEW.message,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"("conversation_id" "uuid", "last_msg" "text", "msg_time" timestamp without time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message = last_msg,
    last_message_at = msg_time
  WHERE id = conversation_id;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"("conversation_id" "uuid", "last_msg" "text", "msg_time" timestamp without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_counters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'project_likes' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE projects SET like_count = like_count + 1 WHERE id = NEW.project_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE projects SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'project_applications' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE projects SET application_count = application_count + 1 WHERE id = NEW.project_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE projects SET application_count = GREATEST(application_count - 1, 0) WHERE id = OLD.project_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'project_views' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE projects SET view_count = view_count + 1 WHERE id = NEW.project_id;
        END IF;
    END IF;
    
    -- Actualizar last_activity_at del proyecto
    IF TG_OP = 'INSERT' THEN
        UPDATE projects SET last_activity_at = NOW() WHERE id = NEW.project_id;
        RETURN NEW;
    ELSE
        UPDATE projects SET last_activity_at = NOW() WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_project_counters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_published_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si el status cambió a 'active' y no hay published_at, lo establecemos
    IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_project_published_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."compatibility_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "compatibility_score" integer NOT NULL,
    "calculation_details" "jsonb",
    "calculated_at" timestamp without time zone DEFAULT "now"(),
    "expires_at" timestamp without time zone DEFAULT ("now"() + '24:00:00'::interval),
    CONSTRAINT "compatibility_cache_check" CHECK (("user1_id" < "user2_id")),
    CONSTRAINT "compatibility_cache_compatibility_score_check" CHECK ((("compatibility_score" >= 0) AND ("compatibility_score" <= 100)))
);


ALTER TABLE "public"."compatibility_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."compatibility_cache" IS 'Cache de scores de compatibilidad para optimizar performance';



CREATE TABLE IF NOT EXISTS "public"."connection_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "addressee_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "message" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "responded_at" timestamp without time zone,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "connection_type" character varying(30) DEFAULT 'general'::character varying,
    CONSTRAINT "connection_requests_check" CHECK (("requester_id" <> "addressee_id")),
    CONSTRAINT "connection_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'blocked'::character varying])::"text"[]))),
    CONSTRAINT "no_self_connection" CHECK (("requester_id" <> "addressee_id"))
);


ALTER TABLE "public"."connection_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."connection_requests" IS 'Almacena solicitudes de conexión entre usuarios';



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "last_message" "text",
    "last_message_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "conversations_check" CHECK (("user1_id" <> "user2_id"))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(20) DEFAULT 'member'::character varying,
    "joined_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "message_type" character varying(20) DEFAULT 'text'::character varying,
    "file_url" "text",
    "reply_to" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "category" character varying(50) NOT NULL,
    "avatar_url" "text",
    "cover_url" "text",
    "is_private" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "member_limit" integer DEFAULT 100,
    "tags" "text"[],
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mutual_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "matched_at" timestamp without time zone DEFAULT "now"(),
    "compatibility_score" integer,
    "match_status" character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT "mutual_matches_check" CHECK (("user1_id" < "user2_id")),
    CONSTRAINT "mutual_matches_compatibility_score_check" CHECK ((("compatibility_score" >= 0) AND ("compatibility_score" <= 100))),
    CONSTRAINT "mutual_matches_match_status_check" CHECK ((("match_status")::"text" = ANY ((ARRAY['active'::character varying, 'blocked'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."mutual_matches" OWNER TO "postgres";


COMMENT ON TABLE "public"."mutual_matches" IS 'Almacena matches mutuos cuando ambos usuarios se dan like';



CREATE TABLE IF NOT EXISTS "public"."notification_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" character varying(50) NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "data" "jsonb",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "delivered_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'sent'::character varying,
    "error_message" "text",
    "push_endpoint" "text",
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['sent'::character varying, 'delivered'::character varying, 'clicked'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."notification_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_history" IS 'Historial completo de notificaciones enviadas para analytics';



CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "new_matches" boolean DEFAULT true,
    "new_messages" boolean DEFAULT true,
    "connection_requests" boolean DEFAULT true,
    "connection_accepted" boolean DEFAULT true,
    "weekly_summary" boolean DEFAULT true,
    "marketing" boolean DEFAULT false,
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone,
    "timezone" "text" DEFAULT 'UTC'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_preferences" IS 'Preferencias de notificaciones personalizadas por usuario';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "read_at" timestamp without time zone,
    "action_url" "text",
    "related_user_id" "uuid",
    "related_group_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."private_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "message_type" character varying(20) DEFAULT 'text'::character varying,
    "file_url" "text",
    "read_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."private_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "applicant_id" "uuid" NOT NULL,
    "desired_role" character varying(100) NOT NULL,
    "message" "text" NOT NULL,
    "proposed_equity" numeric(5,2),
    "proposed_commitment" character varying(20) DEFAULT 'part_time'::character varying,
    "resume_url" "text",
    "portfolio_url" "text",
    "cover_letter_url" "text",
    "additional_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "response_message" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp without time zone,
    "applied_at" timestamp without time zone DEFAULT "now"(),
    "expires_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "project_applications_proposed_commitment_check" CHECK ((("proposed_commitment")::"text" = ANY ((ARRAY['part_time'::character varying, 'full_time'::character varying, 'consultant'::character varying, 'advisor'::character varying])::"text"[]))),
    CONSTRAINT "project_applications_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'under_review'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'withdrawn'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "folder_name" character varying(100) DEFAULT 'default'::character varying,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50),
    "color" character varying(7),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "update_id" "uuid" NOT NULL,
    "commenter_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "like_count" integer DEFAULT 0,
    "is_edited" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "uploader_id" "uuid" NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "mime_type" character varying(100) NOT NULL,
    "file_type" character varying(50) NOT NULL,
    "category" character varying(50) DEFAULT 'other'::character varying,
    "title" character varying(200),
    "description" "text",
    "is_public" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "bucket_name" character varying(50) NOT NULL,
    "storage_path" "text" NOT NULL,
    "public_url" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "project_files_file_type_check" CHECK ((("file_type")::"text" = ANY ((ARRAY['logo'::character varying, 'cover_image'::character varying, 'demo_video'::character varying, 'pitch_deck'::character varying, 'document'::character varying, 'image'::character varying, 'video'::character varying, 'presentation'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_ideas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "category" character varying(50),
    "industry" character varying(50),
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "converted_to_project_id" "uuid",
    "converted_at" timestamp without time zone,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "inspiration_sources" "text"[],
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "project_ideas_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'developing'::character varying, 'converted_to_project'::character varying, 'abandoned'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_ideas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "total_views" integer DEFAULT 0,
    "unique_views" integer DEFAULT 0,
    "total_likes" integer DEFAULT 0,
    "total_bookmarks" integer DEFAULT 0,
    "total_applications" integer DEFAULT 0,
    "view_to_like_rate" numeric(5,2) DEFAULT 0,
    "view_to_application_rate" numeric(5,2) DEFAULT 0,
    "views_last_30d" integer DEFAULT 0,
    "likes_last_30d" integer DEFAULT 0,
    "applications_last_30d" integer DEFAULT 0,
    "last_calculated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "target_date" "date" NOT NULL,
    "completed_date" "date",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "priority" integer DEFAULT 1,
    "sort_order" integer DEFAULT 0,
    "completed_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "project_milestones_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5))),
    CONSTRAINT "project_milestones_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'delayed'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(50) DEFAULT 'member'::character varying NOT NULL,
    "custom_title" character varying(100),
    "is_founder" boolean DEFAULT false,
    "is_admin" boolean DEFAULT false,
    "equity_percentage" numeric(5,2) DEFAULT 0,
    "commitment_level" character varying(20) DEFAULT 'part_time'::character varying,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "joined_at" timestamp without time zone DEFAULT "now"(),
    "left_at" timestamp without time zone,
    "bio" "text",
    "responsibilities" "text"[],
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "project_team_members_commitment_level_check" CHECK ((("commitment_level")::"text" = ANY ((ARRAY['part_time'::character varying, 'full_time'::character varying, 'consultant'::character varying, 'advisor'::character varying])::"text"[]))),
    CONSTRAINT "project_team_members_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'left'::character varying, 'removed'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "content" "text" NOT NULL,
    "update_type" character varying(30) DEFAULT 'general'::character varying,
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "videos" "jsonb" DEFAULT '[]'::"jsonb",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "visibility" character varying(20) DEFAULT 'public'::character varying,
    "is_pinned" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "published_at" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "project_updates_update_type_check" CHECK ((("update_type")::"text" = ANY ((ARRAY['general'::character varying, 'milestone'::character varying, 'announcement'::character varying, 'blog_post'::character varying, 'media'::character varying, 'funding'::character varying])::"text"[]))),
    CONSTRAINT "project_updates_visibility_check" CHECK ((("visibility")::"text" = ANY ((ARRAY['public'::character varying, 'team_only'::character varying, 'investors_only'::character varying])::"text"[])))
);


ALTER TABLE "public"."project_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "viewer_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "referrer" "text",
    "time_spent_seconds" integer DEFAULT 0,
    "pages_viewed" integer DEFAULT 1,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "tagline" character varying(300),
    "description" "text" NOT NULL,
    "detailed_description" "text",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "visibility" character varying(20) DEFAULT 'public'::character varying NOT NULL,
    "is_featured" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "category" character varying(50) NOT NULL,
    "industry" character varying(50) NOT NULL,
    "stage" character varying(30) DEFAULT 'idea'::character varying,
    "start_date" "date",
    "target_completion_date" "date",
    "actual_completion_date" "date",
    "logo_url" "text",
    "cover_image_url" "text",
    "demo_url" "text",
    "website_url" "text",
    "repository_url" "text",
    "pitch_deck_url" "text",
    "demo_video_url" "text",
    "tech_stack" "jsonb" DEFAULT '[]'::"jsonb",
    "required_skills" "jsonb" DEFAULT '[]'::"jsonb",
    "funding_goal" numeric(15,2),
    "funding_raised" numeric(15,2) DEFAULT 0,
    "funding_stage" character varying(30),
    "equity_offered" numeric(5,2),
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "application_count" integer DEFAULT 0,
    "team_size_current" integer DEFAULT 1,
    "team_size_target" integer DEFAULT 1,
    "is_seeking_cofounder" boolean DEFAULT false,
    "is_seeking_investors" boolean DEFAULT false,
    "is_seeking_mentors" boolean DEFAULT false,
    "is_open_to_collaboration" boolean DEFAULT true,
    "accepts_applications" boolean DEFAULT true,
    "application_deadline" "date",
    "auto_accept_applications" boolean DEFAULT false,
    "requires_application_message" boolean DEFAULT true,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "published_at" timestamp without time zone,
    "last_activity_at" timestamp without time zone DEFAULT "now"(),
    "budget_max" integer,
    "budget_min" integer DEFAULT 0,
    "location" character varying(200),
    "timeline" character varying(100),
    CONSTRAINT "projects_funding_stage_check" CHECK ((("funding_stage")::"text" = ANY ((ARRAY['bootstrapped'::character varying, 'pre_seed'::character varying, 'seed'::character varying, 'series_a'::character varying, 'series_b'::character varying, 'series_c'::character varying, 'ipo'::character varying])::"text"[]))),
    CONSTRAINT "projects_stage_check" CHECK ((("stage")::"text" = ANY ((ARRAY['idea'::character varying, 'mvp'::character varying, 'beta'::character varying, 'launch'::character varying, 'growth'::character varying, 'scaling'::character varying, 'exit'::character varying])::"text"[]))),
    CONSTRAINT "projects_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'archived'::character varying])::"text"[]))),
    CONSTRAINT "projects_visibility_check" CHECK ((("visibility")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'connections_only'::character varying, 'team_only'::character varying])::"text"[])))
)
WITH ("autovacuum_vacuum_scale_factor"='0.1', "autovacuum_analyze_scale_factor"='0.05');


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."push_subscriptions" IS 'Almacena las suscripciones push de los usuarios para enviar notificaciones';



COMMENT ON COLUMN "public"."push_subscriptions"."endpoint" IS 'URL del servidor push proporcionada por el navegador';



COMMENT ON COLUMN "public"."push_subscriptions"."p256dh" IS 'Clave pública para encriptar el contenido de las notificaciones';



COMMENT ON COLUMN "public"."push_subscriptions"."auth" IS 'Token de autenticación para verificar el origen';



CREATE TABLE IF NOT EXISTS "public"."user_experience" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_name" character varying(200) NOT NULL,
    "position" character varying(150) NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "is_current" boolean DEFAULT false,
    "location" character varying(200),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_experience" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "interaction_type" character varying(20) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "user_interactions_check" CHECK (("user_id" <> "target_user_id")),
    CONSTRAINT "user_interactions_interaction_type_check" CHECK ((("interaction_type")::"text" = ANY ((ARRAY['like'::character varying, 'pass'::character varying, 'super_like'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_interactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_interactions" IS 'Almacena las interacciones like/pass entre usuarios para el sistema de matching';



CREATE TABLE IF NOT EXISTS "public"."user_objectives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "objective_type" character varying(50) NOT NULL,
    "priority" integer DEFAULT 1,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "user_objectives_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5)))
);


ALTER TABLE "public"."user_objectives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "username" character varying(50) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "avatar_url" "text",
    "role" character varying(100) NOT NULL,
    "company" character varying(200),
    "industry" character varying(100) NOT NULL,
    "location" character varying(200) NOT NULL,
    "experience_years" integer DEFAULT 0,
    "availability_hours" integer DEFAULT 40,
    "bio" "text",
    "headline" character varying(200),
    "linkedin_url" "text",
    "github_url" "text",
    "portfolio_url" "text",
    "twitter_url" "text",
    "profile_visibility" character varying(20) DEFAULT 'public'::character varying,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "marketing_emails" boolean DEFAULT false,
    "profile_completed_at" timestamp without time zone,
    "last_active_at" timestamp without time zone DEFAULT "now"(),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "user_profiles_profile_visibility_check" CHECK ((("profile_visibility")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'connections'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_name" character varying(200) NOT NULL,
    "project_description" "text",
    "project_url" "text",
    "project_status" character varying(20) DEFAULT 'active'::character varying,
    "start_date" "date",
    "end_date" "date",
    "technologies" "text"[],
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "user_projects_project_status_check" CHECK ((("project_status")::"text" = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'paused'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "skill_name" character varying(100) NOT NULL,
    "skill_level" integer,
    "skill_category" character varying(50) DEFAULT 'other'::character varying,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "user_skills_skill_level_check" CHECK ((("skill_level" >= 1) AND ("skill_level" <= 10)))
);


ALTER TABLE "public"."user_skills" OWNER TO "postgres";


ALTER TABLE ONLY "public"."compatibility_cache"
    ADD CONSTRAINT "compatibility_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compatibility_cache"
    ADD CONSTRAINT "compatibility_cache_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "connection_requests_requester_id_addressee_id_key" UNIQUE ("requester_id", "addressee_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mutual_matches"
    ADD CONSTRAINT "mutual_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mutual_matches"
    ADD CONSTRAINT "mutual_matches_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."notification_history"
    ADD CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."private_messages"
    ADD CONSTRAINT "private_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_project_id_applicant_id_key" UNIQUE ("project_id", "applicant_id");



ALTER TABLE ONLY "public"."project_bookmarks"
    ADD CONSTRAINT "project_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_bookmarks"
    ADD CONSTRAINT "project_bookmarks_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_categories"
    ADD CONSTRAINT "project_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."project_categories"
    ADD CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_ideas"
    ADD CONSTRAINT "project_ideas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_metrics"
    ADD CONSTRAINT "project_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_metrics"
    ADD CONSTRAINT "project_metrics_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_team_members"
    ADD CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_team_members"
    ADD CONSTRAINT "project_team_members_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "unique_connection_request" UNIQUE ("requester_id", "addressee_id");



ALTER TABLE ONLY "public"."user_experience"
    ADD CONSTRAINT "user_experience_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_user_id_target_user_id_key" UNIQUE ("user_id", "target_user_id");



ALTER TABLE ONLY "public"."user_objectives"
    ADD CONSTRAINT "user_objectives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_objectives"
    ADD CONSTRAINT "user_objectives_user_id_objective_type_key" UNIQUE ("user_id", "objective_type");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_projects"
    ADD CONSTRAINT "user_projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_user_id_skill_name_key" UNIQUE ("user_id", "skill_name");



CREATE INDEX "idx_applications_applicant" ON "public"."project_applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_applications_pending" ON "public"."project_applications" USING "btree" ("project_id", "status", "applied_at") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX "idx_applications_project" ON "public"."project_applications" USING "btree" ("project_id");



CREATE INDEX "idx_applications_status" ON "public"."project_applications" USING "btree" ("status");



CREATE INDEX "idx_bookmarks_user" ON "public"."project_bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_compatibility_cache_expires" ON "public"."compatibility_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_compatibility_cache_score" ON "public"."compatibility_cache" USING "btree" ("compatibility_score" DESC);



CREATE INDEX "idx_compatibility_cache_users" ON "public"."compatibility_cache" USING "btree" ("user1_id", "user2_id");



CREATE INDEX "idx_connection_requests_addressee" ON "public"."connection_requests" USING "btree" ("addressee_id");



CREATE INDEX "idx_connection_requests_pending" ON "public"."connection_requests" USING "btree" ("addressee_id", "status") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX "idx_connection_requests_requester" ON "public"."connection_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_connection_requests_status" ON "public"."connection_requests" USING "btree" ("status");



CREATE INDEX "idx_conversations_created_at" ON "public"."conversations" USING "btree" ("created_at");



CREATE INDEX "idx_conversations_last_message_at" ON "public"."conversations" USING "btree" ("last_message_at");



CREATE INDEX "idx_conversations_user1" ON "public"."conversations" USING "btree" ("user1_id");



CREATE INDEX "idx_conversations_user2" ON "public"."conversations" USING "btree" ("user2_id");



CREATE INDEX "idx_conversations_users" ON "public"."conversations" USING "btree" ("user1_id", "user2_id");



CREATE INDEX "idx_group_memberships_group" ON "public"."group_memberships" USING "btree" ("group_id");



CREATE INDEX "idx_group_memberships_group_id" ON "public"."group_memberships" USING "btree" ("group_id");



CREATE INDEX "idx_group_memberships_joined" ON "public"."group_memberships" USING "btree" ("joined_at");



CREATE INDEX "idx_group_memberships_role" ON "public"."group_memberships" USING "btree" ("role");



CREATE INDEX "idx_group_memberships_user" ON "public"."group_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_group_memberships_user_id" ON "public"."group_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_group_messages_created" ON "public"."group_messages" USING "btree" ("created_at");



CREATE INDEX "idx_group_messages_created_at" ON "public"."group_messages" USING "btree" ("created_at");



CREATE INDEX "idx_group_messages_group" ON "public"."group_messages" USING "btree" ("group_id");



CREATE INDEX "idx_group_messages_group_id" ON "public"."group_messages" USING "btree" ("group_id");



CREATE INDEX "idx_group_messages_reply" ON "public"."group_messages" USING "btree" ("reply_to");



CREATE INDEX "idx_group_messages_type" ON "public"."group_messages" USING "btree" ("message_type");



CREATE INDEX "idx_group_messages_user" ON "public"."group_messages" USING "btree" ("user_id");



CREATE INDEX "idx_groups_category" ON "public"."groups" USING "btree" ("category");



CREATE INDEX "idx_groups_created_at" ON "public"."groups" USING "btree" ("created_at");



CREATE INDEX "idx_groups_created_by" ON "public"."groups" USING "btree" ("created_by");



CREATE INDEX "idx_groups_is_private" ON "public"."groups" USING "btree" ("is_private");



CREATE INDEX "idx_groups_is_verified" ON "public"."groups" USING "btree" ("is_verified");



CREATE INDEX "idx_groups_private" ON "public"."groups" USING "btree" ("is_private");



CREATE INDEX "idx_groups_search" ON "public"."groups" USING "gin" ("to_tsvector"('"spanish"'::"regconfig", ((("name")::"text" || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_groups_tags" ON "public"."groups" USING "gin" ("tags");



CREATE INDEX "idx_likes_project" ON "public"."project_likes" USING "btree" ("project_id");



CREATE INDEX "idx_milestones_project_status" ON "public"."project_milestones" USING "btree" ("project_id", "status");



CREATE INDEX "idx_mutual_matches_score" ON "public"."mutual_matches" USING "btree" ("compatibility_score" DESC);



CREATE INDEX "idx_mutual_matches_status" ON "public"."mutual_matches" USING "btree" ("match_status");



CREATE INDEX "idx_mutual_matches_user1" ON "public"."mutual_matches" USING "btree" ("user1_id");



CREATE INDEX "idx_mutual_matches_user2" ON "public"."mutual_matches" USING "btree" ("user2_id");



CREATE INDEX "idx_notification_history_type" ON "public"."notification_history" USING "btree" ("type", "sent_at" DESC);



CREATE INDEX "idx_notification_history_user_date" ON "public"."notification_history" USING "btree" ("user_id", "sent_at" DESC);



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_read_at" ON "public"."notifications" USING "btree" ("read_at");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("user_id", "read_at") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_private_messages_conversation" ON "public"."private_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_private_messages_created" ON "public"."private_messages" USING "btree" ("created_at");



CREATE INDEX "idx_private_messages_read" ON "public"."private_messages" USING "btree" ("read_at");



CREATE INDEX "idx_private_messages_sender" ON "public"."private_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_private_messages_type" ON "public"."private_messages" USING "btree" ("message_type");



CREATE INDEX "idx_private_messages_unread" ON "public"."private_messages" USING "btree" ("sender_id", "read_at") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_project_files_created" ON "public"."project_files" USING "btree" ("created_at");



CREATE INDEX "idx_project_files_project_id" ON "public"."project_files" USING "btree" ("project_id");



CREATE INDEX "idx_project_files_public" ON "public"."project_files" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_project_files_type" ON "public"."project_files" USING "btree" ("file_type");



CREATE INDEX "idx_project_files_uploader" ON "public"."project_files" USING "btree" ("uploader_id");



CREATE INDEX "idx_projects_activity" ON "public"."projects" USING "btree" ("last_activity_at");



CREATE INDEX "idx_projects_basic_filters" ON "public"."projects" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_projects_category" ON "public"."projects" USING "btree" ("category");



CREATE INDEX "idx_projects_created" ON "public"."projects" USING "btree" ("created_at");



CREATE INDEX "idx_projects_creator" ON "public"."projects" USING "btree" ("creator_id");



CREATE INDEX "idx_projects_creator_timeline" ON "public"."projects" USING "btree" ("creator_id", "created_at" DESC);



CREATE INDEX "idx_projects_discovery" ON "public"."projects" USING "btree" ("status", "visibility", "category", "is_featured", "created_at") WHERE ((("status")::"text" = 'active'::"text") AND (("visibility")::"text" = 'public'::"text"));



CREATE INDEX "idx_projects_featured" ON "public"."projects" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_projects_fulltext_search" ON "public"."projects" USING "gin" ("to_tsvector"('"spanish"'::"regconfig", ((((("title")::"text" || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || (COALESCE("category", ''::character varying))::"text")));



CREATE INDEX "idx_projects_industry" ON "public"."projects" USING "btree" ("industry");



CREATE INDEX "idx_projects_search" ON "public"."projects" USING "gin" ("to_tsvector"('"spanish"'::"regconfig", (((((COALESCE("title", ''::character varying))::"text" || ' '::"text") || (COALESCE("tagline", ''::character varying))::"text") || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_projects_seeking" ON "public"."projects" USING "btree" ("is_seeking_cofounder", "is_seeking_investors") WHERE (("is_seeking_cofounder" = true) OR ("is_seeking_investors" = true));



CREATE INDEX "idx_projects_stage" ON "public"."projects" USING "btree" ("stage");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_projects_tags" ON "public"."projects" USING "gin" ("tags");



CREATE INDEX "idx_projects_tech_stack" ON "public"."projects" USING "gin" ("tech_stack");



CREATE INDEX "idx_projects_visibility" ON "public"."projects" USING "btree" ("visibility");



CREATE INDEX "idx_push_subscriptions_user_active" ON "public"."push_subscriptions" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_team_members_founder" ON "public"."project_team_members" USING "btree" ("is_founder") WHERE ("is_founder" = true);



CREATE INDEX "idx_team_members_project" ON "public"."project_team_members" USING "btree" ("project_id");



CREATE INDEX "idx_team_members_role" ON "public"."project_team_members" USING "btree" ("role");



CREATE INDEX "idx_team_members_status" ON "public"."project_team_members" USING "btree" ("status");



CREATE INDEX "idx_team_members_user" ON "public"."project_team_members" USING "btree" ("user_id");



CREATE INDEX "idx_updates_author" ON "public"."project_updates" USING "btree" ("author_id");



CREATE INDEX "idx_updates_pinned" ON "public"."project_updates" USING "btree" ("project_id", "is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_updates_project" ON "public"."project_updates" USING "btree" ("project_id", "published_at");



CREATE INDEX "idx_updates_type" ON "public"."project_updates" USING "btree" ("update_type");



CREATE INDEX "idx_user_experience_company" ON "public"."user_experience" USING "btree" ("company_name");



CREATE INDEX "idx_user_experience_current" ON "public"."user_experience" USING "btree" ("is_current");



CREATE INDEX "idx_user_experience_user_id" ON "public"."user_experience" USING "btree" ("user_id");



CREATE INDEX "idx_user_interactions_created_at" ON "public"."user_interactions" USING "btree" ("created_at");



CREATE INDEX "idx_user_interactions_target_user_id" ON "public"."user_interactions" USING "btree" ("target_user_id");



CREATE INDEX "idx_user_interactions_type" ON "public"."user_interactions" USING "btree" ("interaction_type");



CREATE INDEX "idx_user_interactions_user_id" ON "public"."user_interactions" USING "btree" ("user_id");



CREATE INDEX "idx_user_objectives_priority" ON "public"."user_objectives" USING "btree" ("priority");



CREATE INDEX "idx_user_objectives_type" ON "public"."user_objectives" USING "btree" ("objective_type");



CREATE INDEX "idx_user_objectives_user_id" ON "public"."user_objectives" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_industry" ON "public"."user_profiles" USING "btree" ("industry");



CREATE INDEX "idx_user_profiles_location" ON "public"."user_profiles" USING "btree" ("location");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_username" ON "public"."user_profiles" USING "btree" ("username");



CREATE UNIQUE INDEX "idx_user_profiles_username_unique" ON "public"."user_profiles" USING "btree" ("username") WHERE (("username" IS NOT NULL) AND (("username")::"text" <> ''::"text") AND (("username")::"text" <> 'Usuario'::"text") AND (NOT (("username")::"text" ~~ 'user_%'::"text")));



CREATE INDEX "idx_user_profiles_visibility" ON "public"."user_profiles" USING "btree" ("profile_visibility") WHERE (("profile_visibility")::"text" = 'public'::"text");



CREATE INDEX "idx_user_projects_status" ON "public"."user_projects" USING "btree" ("project_status");



CREATE INDEX "idx_user_projects_technologies" ON "public"."user_projects" USING "gin" ("technologies");



CREATE INDEX "idx_user_projects_user_id" ON "public"."user_projects" USING "btree" ("user_id");



CREATE INDEX "idx_user_skills_category" ON "public"."user_skills" USING "btree" ("skill_category");



CREATE INDEX "idx_user_skills_level" ON "public"."user_skills" USING "btree" ("skill_level");



CREATE INDEX "idx_user_skills_primary" ON "public"."user_skills" USING "btree" ("is_primary");



CREATE INDEX "idx_user_skills_user_id" ON "public"."user_skills" USING "btree" ("user_id");



CREATE INDEX "idx_views_project_date" ON "public"."project_views" USING "btree" ("project_id", "created_at");



CREATE INDEX "idx_views_user" ON "public"."project_views" USING "btree" ("viewer_id") WHERE ("viewer_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "connection_request_notification_trigger" AFTER INSERT ON "public"."connection_requests" FOR EACH ROW EXECUTE FUNCTION "public"."create_connection_request_notification"();



CREATE OR REPLACE TRIGGER "set_project_published_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_published_at"();



CREATE OR REPLACE TRIGGER "trigger_connection_accepted_notification" AFTER UPDATE ON "public"."connection_requests" FOR EACH ROW EXECUTE FUNCTION "public"."create_connection_accepted_notification"();



CREATE OR REPLACE TRIGGER "trigger_connection_request_notification" AFTER INSERT OR UPDATE ON "public"."connection_requests" FOR EACH ROW EXECUTE FUNCTION "public"."create_connection_request_notification"();



CREATE OR REPLACE TRIGGER "trigger_create_conversation" AFTER UPDATE ON "public"."connection_requests" FOR EACH ROW EXECUTE FUNCTION "public"."create_conversation_on_connection"();



CREATE OR REPLACE TRIGGER "trigger_create_conversation_on_accepted" AFTER UPDATE ON "public"."connection_requests" FOR EACH ROW EXECUTE FUNCTION "public"."create_conversation_on_connection_accepted"();



CREATE OR REPLACE TRIGGER "trigger_create_mutual_match" AFTER INSERT ON "public"."user_interactions" FOR EACH ROW EXECUTE FUNCTION "public"."create_mutual_match"();



CREATE OR REPLACE TRIGGER "update_applications_updated_at" BEFORE UPDATE ON "public"."project_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."project_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_connection_requests_updated_at" BEFORE UPDATE ON "public"."connection_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversation_last_message_trigger" AFTER INSERT ON "public"."private_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



CREATE OR REPLACE TRIGGER "update_groups_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_milestones_updated_at" BEFORE UPDATE ON "public"."project_milestones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_application_count" AFTER INSERT OR DELETE ON "public"."project_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_counters"();



CREATE OR REPLACE TRIGGER "update_project_files_updated_at" BEFORE UPDATE ON "public"."project_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_like_count" AFTER INSERT OR DELETE ON "public"."project_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_counters"();



CREATE OR REPLACE TRIGGER "update_project_view_count" AFTER INSERT ON "public"."project_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_counters"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_members_updated_at" BEFORE UPDATE ON "public"."project_team_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_updates_updated_at" BEFORE UPDATE ON "public"."project_updates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_experience_updated_at" BEFORE UPDATE ON "public"."user_experience" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_projects_updated_at" BEFORE UPDATE ON "public"."user_projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."compatibility_cache"
    ADD CONSTRAINT "compatibility_cache_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compatibility_cache"
    ADD CONSTRAINT "compatibility_cache_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "connection_requests_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "connection_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_reply_to_fkey" FOREIGN KEY ("reply_to") REFERENCES "public"."group_messages"("id");



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mutual_matches"
    ADD CONSTRAINT "mutual_matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mutual_matches"
    ADD CONSTRAINT "mutual_matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_history"
    ADD CONSTRAINT "notification_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_group_id_fkey" FOREIGN KEY ("related_group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_messages"
    ADD CONSTRAINT "private_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."private_messages"
    ADD CONSTRAINT "private_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_bookmarks"
    ADD CONSTRAINT "project_bookmarks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_bookmarks"
    ADD CONSTRAINT "project_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_commenter_id_fkey" FOREIGN KEY ("commenter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."project_comments"("id");



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "public"."project_updates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_ideas"
    ADD CONSTRAINT "project_ideas_converted_to_project_id_fkey" FOREIGN KEY ("converted_to_project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."project_ideas"
    ADD CONSTRAINT "project_ideas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_metrics"
    ADD CONSTRAINT "project_metrics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_team_members"
    ADD CONSTRAINT "project_team_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_team_members"
    ADD CONSTRAINT "project_team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_updates"
    ADD CONSTRAINT "project_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_experience"
    ADD CONSTRAINT "user_experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_objectives"
    ADD CONSTRAINT "user_objectives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_projects"
    ADD CONSTRAINT "user_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_skills"
    ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view public groups" ON "public"."groups" FOR SELECT USING ((("is_private" = false) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Creators can delete their groups" ON "public"."groups" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Creators can update their groups" ON "public"."groups" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Group admins can delete messages" ON "public"."group_messages" FOR DELETE USING (("group_id" IN ( SELECT "group_memberships"."group_id"
   FROM "public"."group_memberships"
  WHERE (("group_memberships"."user_id" = "auth"."uid"()) AND (("group_memberships"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying])::"text"[]))))));



CREATE POLICY "Group admins can update groups" ON "public"."groups" FOR UPDATE USING (("id" IN ( SELECT "group_memberships"."group_id"
   FROM "public"."group_memberships"
  WHERE (("group_memberships"."user_id" = "auth"."uid"()) AND (("group_memberships"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Group members can send messages" ON "public"."group_messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."group_memberships" "gm"
  WHERE (("gm"."group_id" = "group_messages"."group_id") AND ("gm"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Group members can view messages" ON "public"."group_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_memberships" "gm"
  WHERE (("gm"."group_id" = "group_messages"."group_id") AND ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create groups" ON "public"."groups" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own interactions" ON "public"."user_interactions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own memberships" ON "public"."group_memberships" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own memberships" ON "public"."group_memberships" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can join groups" ON "public"."group_memberships" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own experience" ON "public"."user_experience" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own objectives" ON "public"."user_objectives" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own projects" ON "public"."user_projects" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own skills" ON "public"."user_skills" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own notification preferences" ON "public"."notification_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own push subscriptions" ON "public"."push_subscriptions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own subscriptions" ON "public"."push_subscriptions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own group messages" ON "public"."group_messages" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own memberships" ON "public"."group_memberships" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view joined groups" ON "public"."groups" FOR SELECT USING (("id" IN ( SELECT "group_memberships"."group_id"
   FROM "public"."group_memberships"
  WHERE ("group_memberships"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view others' experience" ON "public"."user_experience" FOR SELECT USING (true);



CREATE POLICY "Users can view others' objectives" ON "public"."user_objectives" FOR SELECT USING (true);



CREATE POLICY "Users can view others' projects" ON "public"."user_projects" FOR SELECT USING (true);



CREATE POLICY "Users can view others' skills" ON "public"."user_skills" FOR SELECT USING (true);



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view public groups" ON "public"."groups" FOR SELECT USING ((NOT "is_private"));



CREATE POLICY "Users can view their compatibility scores" ON "public"."compatibility_cache" FOR SELECT USING ((("user1_id" = "auth"."uid"()) OR ("user2_id" = "auth"."uid"())));



CREATE POLICY "Users can view their matches" ON "public"."mutual_matches" FOR SELECT USING ((("user1_id" = "auth"."uid"()) OR ("user2_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own interactions" ON "public"."user_interactions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("target_user_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own memberships" ON "public"."group_memberships" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notification history" ON "public"."notification_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "applications_insert_policy" ON "public"."project_applications" FOR INSERT WITH CHECK ((("applicant_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_applications"."project_id") AND ("p"."accepts_applications" = true) AND (("p"."status")::"text" = 'active'::"text") AND (("p"."application_deadline" IS NULL) OR ("p"."application_deadline" > CURRENT_DATE)) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."project_team_members" "ptm"
          WHERE (("ptm"."project_id" = "p"."id") AND ("ptm"."user_id" = "auth"."uid"()))))))))));



CREATE POLICY "applications_select_policy" ON "public"."project_applications" FOR SELECT USING ((("applicant_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_applications"."project_id") AND ("p"."creator_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."project_team_members" "ptm"
  WHERE (("ptm"."project_id" = "ptm"."project_id") AND ("ptm"."user_id" = "auth"."uid"()) AND ("ptm"."is_admin" = true) AND (("ptm"."status")::"text" = 'active'::"text"))))));



CREATE POLICY "applications_update_policy" ON "public"."project_applications" FOR UPDATE USING ((("applicant_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_applications"."project_id") AND ("p"."creator_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."project_team_members" "ptm"
  WHERE (("ptm"."project_id" = "ptm"."project_id") AND ("ptm"."user_id" = "auth"."uid"()) AND ("ptm"."is_admin" = true) AND (("ptm"."status")::"text" = 'active'::"text"))))));



CREATE POLICY "bookmarks_all_policy" ON "public"."project_bookmarks" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "categories_select_policy" ON "public"."project_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "comments_insert_policy" ON "public"."project_comments" FOR INSERT WITH CHECK (("commenter_id" = "auth"."uid"()));



CREATE POLICY "comments_select_policy" ON "public"."project_comments" FOR SELECT USING (true);



ALTER TABLE "public"."compatibility_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."connection_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "connection_requests_insert_policy" ON "public"."connection_requests" FOR INSERT WITH CHECK (("requester_id" = "auth"."uid"()));



CREATE POLICY "connection_requests_select_policy" ON "public"."connection_requests" FOR SELECT USING ((("requester_id" = "auth"."uid"()) OR ("addressee_id" = "auth"."uid"())));



CREATE POLICY "connection_requests_update_policy" ON "public"."connection_requests" FOR UPDATE USING (("addressee_id" = "auth"."uid"()));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_policy" ON "public"."conversations" USING ((("user1_id" = "auth"."uid"()) OR ("user2_id" = "auth"."uid"()))) WITH CHECK ((("user1_id" = "auth"."uid"()) OR ("user2_id" = "auth"."uid"())));



ALTER TABLE "public"."group_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ideas_all_policy" ON "public"."project_ideas" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "likes_delete_policy" ON "public"."project_likes" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "likes_insert_policy" ON "public"."project_likes" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_likes"."project_id") AND (("projects"."status")::"text" = 'active'::"text"))))));



CREATE POLICY "likes_select_policy" ON "public"."project_likes" FOR SELECT USING (true);



CREATE POLICY "messages_insert_policy" ON "public"."private_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "private_messages"."conversation_id") AND (("c"."user1_id" = "auth"."uid"()) OR ("c"."user2_id" = "auth"."uid"())))))));



CREATE POLICY "messages_select_policy" ON "public"."private_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "private_messages"."conversation_id") AND (("c"."user1_id" = "auth"."uid"()) OR ("c"."user2_id" = "auth"."uid"()))))));



CREATE POLICY "metrics_select_policy" ON "public"."project_metrics" FOR SELECT USING (true);



CREATE POLICY "milestones_select_policy" ON "public"."project_milestones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_milestones"."project_id") AND ((("p"."visibility")::"text" = 'public'::"text") OR ("p"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_team_members" "ptm"
          WHERE (("ptm"."project_id" = "p"."id") AND ("ptm"."user_id" = "auth"."uid"()) AND (("ptm"."status")::"text" = 'active'::"text")))))))));



ALTER TABLE "public"."mutual_matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."private_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_policy" ON "public"."user_profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_policy" ON "public"."user_profiles" FOR SELECT USING (((("profile_visibility")::"text" = 'public'::"text") OR ("id" = "auth"."uid"()) OR ((("profile_visibility")::"text" = 'connections_only'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."connection_requests" "cr"
  WHERE ((("cr"."requester_id" = "auth"."uid"()) AND ("cr"."addressee_id" = "cr"."id")) OR (("cr"."requester_id" = "cr"."id") AND ("cr"."addressee_id" = "auth"."uid"()) AND (("cr"."status")::"text" = 'accepted'::"text"))))))));



CREATE POLICY "profiles_update_policy" ON "public"."user_profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."project_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_files_delete_policy" ON "public"."project_files" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "project_files_insert_policy" ON "public"."project_files" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "project_files_select_policy" ON "public"."project_files" FOR SELECT USING (true);



CREATE POLICY "project_files_update_policy" ON "public"."project_files" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."project_ideas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_milestones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_delete_policy" ON "public"."projects" FOR DELETE USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "projects_insert_policy" ON "public"."projects" FOR INSERT WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "projects_select_policy" ON "public"."projects" FOR SELECT USING ((((("visibility")::"text" = 'public'::"text") AND (("status")::"text" = 'active'::"text")) OR ("creator_id" = "auth"."uid"()) OR ((("visibility")::"text" = 'connections_only'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."connection_requests" "cr"
  WHERE ((("cr"."requester_id" = "auth"."uid"()) AND ("cr"."addressee_id" = "projects"."creator_id")) OR (("cr"."requester_id" = "projects"."creator_id") AND ("cr"."addressee_id" = "auth"."uid"()) AND (("cr"."status")::"text" = 'accepted'::"text"))))))));



CREATE POLICY "projects_update_policy" ON "public"."projects" FOR UPDATE USING (("creator_id" = "auth"."uid"()));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_insert_policy" ON "public"."project_team_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_team_members"."project_id") AND (("p"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_team_members" "ptm"
          WHERE (("ptm"."project_id" = "p"."id") AND ("ptm"."user_id" = "auth"."uid"()) AND ("ptm"."is_admin" = true) AND (("ptm"."status")::"text" = 'active'::"text")))))))));



CREATE POLICY "team_members_select_policy" ON "public"."project_team_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_team_members"."project_id") AND ((("p"."visibility")::"text" = 'public'::"text") OR ("p"."creator_id" = "auth"."uid"()) OR ((("p"."visibility")::"text" = 'connections_only'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."connection_requests" "cr"
          WHERE (((("cr"."requester_id" = "auth"."uid"()) AND ("cr"."addressee_id" = "p"."creator_id")) OR (("cr"."requester_id" = "p"."creator_id") AND ("cr"."addressee_id" = "auth"."uid"()))) AND (("cr"."status")::"text" = 'accepted'::"text"))))) OR ("project_team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "team_members_update_policy" ON "public"."project_team_members" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_team_members"."project_id") AND ("p"."creator_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."project_team_members" "ptm"
  WHERE (("ptm"."project_id" = "ptm"."project_id") AND ("ptm"."user_id" = "auth"."uid"()) AND ("ptm"."is_admin" = true) AND (("ptm"."status")::"text" = 'active'::"text"))))));



CREATE POLICY "updates_insert_policy" ON "public"."project_updates" FOR INSERT WITH CHECK ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_updates"."project_id") AND (("p"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_team_members" "ptm"
          WHERE (("ptm"."project_id" = "p"."id") AND ("ptm"."user_id" = "auth"."uid"()) AND (("ptm"."status")::"text" = 'active'::"text"))))))))));



CREATE POLICY "updates_select_policy" ON "public"."project_updates" FOR SELECT USING (((("visibility")::"text" = 'public'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_updates"."project_id") AND (("p"."creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_team_members" "ptm"
          WHERE (("ptm"."project_id" = "p"."id") AND ("ptm"."user_id" = "auth"."uid"()) AND (("ptm"."status")::"text" = 'active'::"text"))))))))));



ALTER TABLE "public"."user_experience" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "views_insert_policy" ON "public"."project_views" FOR INSERT WITH CHECK ((("viewer_id" IS NULL) OR ("viewer_id" = "auth"."uid"())));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_compatibility"("p_user1_id" "uuid", "p_user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_compatibility"("p_user1_id" "uuid", "p_user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_compatibility"("p_user1_id" "uuid", "p_user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_inactive_subscriptions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_inactive_subscriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_inactive_subscriptions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_orphaned_project_files"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_project_files"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_orphaned_project_files"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_connection_accepted_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_connection_accepted_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_connection_accepted_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_connection_request_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_connection_request_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_connection_request_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation_on_connection"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation_on_connection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation_on_connection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation_on_connection_accepted"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation_on_connection_accepted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation_on_connection_accepted"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_mutual_match"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_mutual_match"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_mutual_match"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_guaranteed"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_guaranteed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_guaranteed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."drop_policy_if_exists"("policy_name" "text", "table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."drop_policy_if_exists"("policy_name" "text", "table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."drop_policy_if_exists"("policy_name" "text", "table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_notification_stats"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_notification_stats"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notification_stats"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_potential_matches"("p_target_user_id" "uuid", "p_limit_count" integer, "p_min_compatibility" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_potential_matches"("p_target_user_id" "uuid", "p_limit_count" integer, "p_min_compatibility" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_potential_matches"("p_target_user_id" "uuid", "p_limit_count" integer, "p_min_compatibility" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_files"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_files"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_files"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_stats"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_stats"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_stats"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_stats_simple"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_stats_simple"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_stats_simple"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recommended_projects"("target_user_id" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recommended_projects"("target_user_id" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recommended_projects"("target_user_id" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_connections"("p_target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_connections"("p_target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_connections"("p_target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("for_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_groups"("for_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_groups"("for_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_groups"("for_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_projects"("search_term" "text", "category_filter" "text", "industry_filter" "text", "stage_filter" "text", "seeking_cofounder" boolean, "seeking_investors" boolean, "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_projects"("search_term" "text", "category_filter" "text", "industry_filter" "text", "stage_filter" "text", "seeking_cofounder" boolean, "seeking_investors" boolean, "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_projects"("search_term" "text", "category_filter" "text", "industry_filter" "text", "stage_filter" "text", "seeking_cofounder" boolean, "seeking_investors" boolean, "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_projects_simple"("search_term" "text", "user_id_filter" "uuid", "page_limit" integer, "page_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_projects_simple"("search_term" "text", "user_id_filter" "uuid", "page_limit" integer, "page_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_projects_simple"("search_term" "text", "user_id_filter" "uuid", "page_limit" integer, "page_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."simple_create_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."simple_create_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_create_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"("conversation_id" "uuid", "last_msg" "text", "msg_time" timestamp without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"("conversation_id" "uuid", "last_msg" "text", "msg_time" timestamp without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"("conversation_id" "uuid", "last_msg" "text", "msg_time" timestamp without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_counters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_published_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."compatibility_cache" TO "anon";
GRANT ALL ON TABLE "public"."compatibility_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."compatibility_cache" TO "service_role";



GRANT ALL ON TABLE "public"."connection_requests" TO "anon";
GRANT ALL ON TABLE "public"."connection_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."connection_requests" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."group_memberships" TO "anon";
GRANT ALL ON TABLE "public"."group_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."group_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."group_messages" TO "anon";
GRANT ALL ON TABLE "public"."group_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."group_messages" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."mutual_matches" TO "anon";
GRANT ALL ON TABLE "public"."mutual_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."mutual_matches" TO "service_role";



GRANT ALL ON TABLE "public"."notification_history" TO "anon";
GRANT ALL ON TABLE "public"."notification_history" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_history" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."private_messages" TO "anon";
GRANT ALL ON TABLE "public"."private_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."private_messages" TO "service_role";



GRANT ALL ON TABLE "public"."project_applications" TO "anon";
GRANT ALL ON TABLE "public"."project_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."project_applications" TO "service_role";



GRANT ALL ON TABLE "public"."project_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."project_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."project_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."project_categories" TO "anon";
GRANT ALL ON TABLE "public"."project_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."project_categories" TO "service_role";



GRANT ALL ON TABLE "public"."project_comments" TO "anon";
GRANT ALL ON TABLE "public"."project_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_comments" TO "service_role";



GRANT ALL ON TABLE "public"."project_files" TO "anon";
GRANT ALL ON TABLE "public"."project_files" TO "authenticated";
GRANT ALL ON TABLE "public"."project_files" TO "service_role";



GRANT ALL ON TABLE "public"."project_ideas" TO "anon";
GRANT ALL ON TABLE "public"."project_ideas" TO "authenticated";
GRANT ALL ON TABLE "public"."project_ideas" TO "service_role";



GRANT ALL ON TABLE "public"."project_likes" TO "anon";
GRANT ALL ON TABLE "public"."project_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_likes" TO "service_role";



GRANT ALL ON TABLE "public"."project_metrics" TO "anon";
GRANT ALL ON TABLE "public"."project_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."project_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."project_milestones" TO "anon";
GRANT ALL ON TABLE "public"."project_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."project_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."project_team_members" TO "anon";
GRANT ALL ON TABLE "public"."project_team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_team_members" TO "service_role";



GRANT ALL ON TABLE "public"."project_updates" TO "anon";
GRANT ALL ON TABLE "public"."project_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_updates" TO "service_role";



GRANT ALL ON TABLE "public"."project_views" TO "anon";
GRANT ALL ON TABLE "public"."project_views" TO "authenticated";
GRANT ALL ON TABLE "public"."project_views" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_experience" TO "anon";
GRANT ALL ON TABLE "public"."user_experience" TO "authenticated";
GRANT ALL ON TABLE "public"."user_experience" TO "service_role";



GRANT ALL ON TABLE "public"."user_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_objectives" TO "anon";
GRANT ALL ON TABLE "public"."user_objectives" TO "authenticated";
GRANT ALL ON TABLE "public"."user_objectives" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_projects" TO "anon";
GRANT ALL ON TABLE "public"."user_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."user_projects" TO "service_role";



GRANT ALL ON TABLE "public"."user_skills" TO "anon";
GRANT ALL ON TABLE "public"."user_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."user_skills" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
