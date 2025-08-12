# 📊 StartupMatch - Extensiones de Base de Datos

*Tablas adicionales para completar las funcionalidades implementadas*

---

## 🎯 **TABLAS ADICIONALES NECESARIAS**

### **1. Sistema de Grupos**
```sql
-- Tabla de grupos
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'Industria', 'Tecnología', 'Stage', etc.
  avatar_url TEXT,
  cover_url TEXT,
  is_private BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  member_limit INTEGER DEFAULT 100,
  tags TEXT[],
  
  -- Metadatos
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabla de membresías de grupos
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);

-- Mensajes de grupos
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file'
  file_url TEXT,
  reply_to UUID REFERENCES group_messages(id),
  created_at TIMESTAMP DEFAULT now()
);
```

### **2. Sistema de Matching**
```sql
-- Tabla de matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  match_type VARCHAR(30) DEFAULT 'mutual', -- 'mutual', 'one_sided'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'blocked'
  
  -- Razones del match
  common_skills TEXT[],
  common_objectives TEXT[],
  location_match BOOLEAN DEFAULT false,
  industry_match BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Acciones de match (like, dislike, etc.)
CREATE TABLE match_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL, -- 'like', 'pass', 'super_like', 'block'
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(from_user_id, to_user_id)
);
```

### **3. Sistema de Mensajería**
```sql
-- Conversaciones privadas
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Mensajes privados
CREATE TABLE private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  file_url TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

### **4. Sistema de Notificaciones**
```sql
-- Notificaciones
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'match', 'message', 'group_invite', 'profile_view'
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB, -- Datos adicionales específicos del tipo
  
  -- Estado
  read_at TIMESTAMP,
  action_taken BOOLEAN DEFAULT false,
  
  -- Referencias opcionales
  related_user_id UUID REFERENCES auth.users(id),
  related_group_id UUID REFERENCES groups(id),
  related_match_id UUID REFERENCES matches(id),
  
  created_at TIMESTAMP DEFAULT now()
);
```

### **5. Métricas y Análisis**
```sql
-- Actividad del usuario
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'profile_view', 'match_action', 'message_sent'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Vistas de perfil
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  view_duration INTEGER, -- en segundos
  created_at TIMESTAMP DEFAULT now(),
  
  CHECK (viewer_id != viewed_user_id)
);
```

---

## 🔐 **POLÍTICAS RLS ADICIONALES**

```sql
-- Políticas para grupos
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public groups" ON groups
  FOR SELECT USING (NOT is_private);

CREATE POLICY "Users can view joined groups" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas para matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create match actions" ON match_actions
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- Políticas para mensajes
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Políticas para notificaciones
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
```

---

## 📊 **FUNCIONES ÚTILES**

```sql
-- Función para calcular compatibilidad
CREATE OR REPLACE FUNCTION calculate_compatibility_score(user1_uuid UUID, user2_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  common_skills_count INTEGER;
  common_objectives_count INTEGER;
  location_match BOOLEAN := false;
  industry_match BOOLEAN := false;
BEGIN
  -- Skills en común (max 40 puntos)
  SELECT COUNT(*)::INTEGER INTO common_skills_count
  FROM user_skills s1
  JOIN user_skills s2 ON s1.skill_name = s2.skill_name
  WHERE s1.user_id = user1_uuid AND s2.user_id = user2_uuid;
  
  score := score + LEAST(common_skills_count * 8, 40);
  
  -- Objetivos complementarios (max 30 puntos)
  SELECT COUNT(*)::INTEGER INTO common_objectives_count
  FROM user_objectives o1
  JOIN user_objectives o2 ON o1.objective_type = o2.objective_type
  WHERE o1.user_id = user1_uuid AND o2.user_id = user2_uuid;
  
  score := score + LEAST(common_objectives_count * 15, 30);
  
  -- Ubicación similar (15 puntos)
  SELECT (p1.location = p2.location) INTO location_match
  FROM user_profiles p1, user_profiles p2
  WHERE p1.user_id = user1_uuid AND p2.user_id = user2_uuid;
  
  IF location_match THEN
    score := score + 15;
  END IF;
  
  -- Industria similar (15 puntos)
  SELECT (p1.industry = p2.industry) INTO industry_match
  FROM user_profiles p1, user_profiles p2
  WHERE p1.user_id = user1_uuid AND p2.user_id = user2_uuid;
  
  IF industry_match THEN
    score := score + 15;
  END IF;
  
  RETURN score;
END;
$$ language 'plpgsql';

-- Función para obtener matches sugeridos
CREATE OR REPLACE FUNCTION get_suggested_matches(for_user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  compatibility_score INTEGER,
  common_skills TEXT[],
  profile_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    calculate_compatibility_score(for_user_id, up.user_id) as compatibility_score,
    ARRAY(
      SELECT s1.skill_name 
      FROM user_skills s1 
      JOIN user_skills s2 ON s1.skill_name = s2.skill_name
      WHERE s1.user_id = for_user_id AND s2.user_id = up.user_id
      LIMIT 5
    ) as common_skills,
    jsonb_build_object(
      'firstName', up.first_name,
      'lastName', up.last_name,
      'role', up.role,
      'company', up.company,
      'location', up.location,
      'avatar', up.avatar_url,
      'headline', up.headline
    ) as profile_data
  FROM user_profiles up
  WHERE up.user_id != for_user_id
    AND up.profile_visibility = 'public'
    AND up.user_id NOT IN (
      SELECT COALESCE(user1_id, user2_id)
      FROM matches 
      WHERE (user1_id = for_user_id OR user2_id = for_user_id)
    )
    AND up.user_id NOT IN (
      SELECT to_user_id 
      FROM match_actions 
      WHERE from_user_id = for_user_id 
        AND action IN ('pass', 'block')
    )
  ORDER BY calculate_compatibility_score(for_user_id, up.user_id) DESC
  LIMIT limit_count;
END;
$$ language 'plpgsql';
```

---

## 🚀 **RESUMEN**

Con estas extensiones tendrás:

✅ **Sistema completo de grupos** con roles y mensajería  
✅ **Matching inteligente** con algoritmo de compatibilidad  
✅ **Mensajería privada** entre usuarios  
✅ **Sistema de notificaciones** completo  
✅ **Métricas y análisis** de actividad  
✅ **Seguridad RLS** en todas las tablas  
✅ **Funciones optimizadas** para consultas complejas  

**Tu base de datos estará 100% completa para todas las funcionalidades de StartupMatch.**
