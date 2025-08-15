# 🗄️ DATABASE SCHEMA CONTEXT
*Contexto Completo de la Base de Datos para StartupMatch*

---

## 📊 **ARCHIVO DE REFERENCIA PRINCIPAL**

### **🎯 Archivo Master: `complete_schema.sql`**
- **Tamaño**: 132 KB (3,629 líneas)
- **Elementos**: 306 componentes de base de datos
- **Tablas**: 28 tablas principales
- **Estado**: ✅ Actualizado (15/08/2025)
- **Fuente**: Export directo de Supabase (cbaxjoozbnffrryuywno)

---

## 🏗️ **ARQUITECTURA DE LA BASE DE DATOS**

### **CORE ENTITIES (Entidades Principales)**

#### **👥 USUARIOS Y PERFILES**
```sql
user_profiles       -- Perfiles de emprendedores
user_skills         -- Habilidades de usuarios
user_experience     -- Experiencia laboral
user_objectives     -- Objetivos de usuario
```

#### **🚀 PROYECTOS Y STARTUPS**
```sql
projects            -- Proyectos de startup principales
project_categories  -- Categorías de proyectos
project_files       -- Archivos adjuntos
project_comments    -- Comentarios en proyectos
project_likes       -- Likes/favoritos
project_views       -- Visualizaciones
project_bookmarks   -- Marcadores de usuario
project_metrics     -- Métricas de rendimiento
project_milestones  -- Hitos del proyecto
project_updates     -- Actualizaciones de progreso
project_team_members -- Miembros del equipo
project_ideas       -- Ideas asociadas
```

#### **🤝 MATCHING Y CONEXIONES**
```sql
mutual_matches       -- Matches bidireccionales
connection_requests  -- Solicitudes de conexión
compatibility_cache  -- Cache de compatibilidad
user_interactions    -- Interacciones entre usuarios
project_applications -- Aplicaciones a proyectos
```

#### **💬 COMUNICACIÓN**
```sql
conversations       -- Conversaciones privadas
private_messages    -- Mensajes directos
groups              -- Grupos de discusión
group_messages      -- Mensajes de grupo
group_memberships   -- Membresías de grupo
```

#### **🔔 NOTIFICACIONES**
```sql
notifications           -- Sistema de notificaciones
notification_preferences -- Preferencias de usuario
notification_history    -- Historial de notificaciones
push_subscriptions      -- Suscripciones push
```

#### **📊 UTILIDADES Y CACHE**
```sql
user_projects       -- Relación usuario-proyecto
compatibility_cache -- Cache de cálculos de matching
```

---

## 🔧 **FUNCIONES PRINCIPALES**

### **🧮 MATCHING ALGORITHM**
```sql
calculate_compatibility(user1_id, user2_id) RETURNS integer
-- Calcula compatibilidad entre emprendedores
-- Factores: industria, ubicación, skills, objetivos
```

### **📊 MÉTRICAS Y ANALYTICS**
```sql
-- Funciones para estadísticas de proyectos
-- Cálculos de engagement
-- Métricas de matching effectiveness
```

### **🔒 ROW LEVEL SECURITY (RLS)**
```sql
-- Policies implementadas en todas las tablas sensibles
-- Acceso controlado por user_id
-- Privacidad de mensajes y datos personales
```

---

## 🎯 **USO COMO CONTEXTO DE APLICACIÓN**

### **1. DESARROLLO DE FEATURES**
```typescript
// Cuando desarrolles una nueva feature, consulta el schema:
// ¿Qué tablas necesito?
// ¿Qué relaciones existen?
// ¿Hay campos que pueda reutilizar?
```

### **2. APIS Y ENDPOINTS**
```typescript
// Para crear APIs, ve directamente las estructuras:
// app/api/projects/[id]/route.ts -> consulta projects table
// app/api/matches/route.ts -> consulta mutual_matches + compatibility_cache
```

### **3. COMPONENTES UI**
```typescript
// Para forms y componentes, ve los campos exactos:
// components/ProjectForm.tsx -> consulta projects schema
// components/UserProfile.tsx -> consulta user_profiles schema
```

### **4. TIPOS TYPESCRIPT**
```typescript
// Genera tipos exactos desde el schema:
// types/projects.ts -> basado en projects table
// types/user.ts -> basado en user_profiles table
```

---

## 📚 **CÓMO USAR ESTE CONTEXTO**

### **🔍 BÚSQUEDA RÁPIDA**
```bash
# Buscar una tabla específica:
Select-String -Pattern "CREATE TABLE.*projects" complete_schema.sql

# Buscar funciones:
Select-String -Pattern "CREATE FUNCTION" complete_schema.sql

# Buscar índices:
Select-String -Pattern "CREATE INDEX" complete_schema.sql
```

### **📖 LECTURA DE ESTRUCTURAS**
1. **Abrir** `complete_schema.sql`
2. **Buscar** la tabla que necesitas (Ctrl+F)
3. **Leer** columnas, tipos, constraints
4. **Identificar** relaciones con otras tablas

### **🔄 MANTENIMIENTO**
- **Actualizar schema**: Re-exportar cuando hagas cambios en DB
- **Documentar cambios**: Anotar modificaciones importantes
- **Versionado**: Incluir en commits de git

---

## 🚀 **CASOS DE USO PRÁCTICOS**

### **ESCENARIO 1: Nueva API Endpoint**
```typescript
// Necesito crear /api/projects/[id]/applications
// 1. Consulto project_applications en schema
// 2. Veo campos: project_id, applicant_id, status, message
// 3. Implemento endpoint con tipos correctos
```

### **ESCENARIO 2: Componente de Matching**
```typescript
// Necesito mostrar compatibilidad entre usuarios
// 1. Consulto mutual_matches y compatibility_cache
// 2. Veo calculate_compatibility function
// 3. Implemento lógica de UI basada en schema real
```

### **ESCENARIO 3: Sistema de Notificaciones**
```typescript
// Necesito push notifications
// 1. Consulto notifications, notification_preferences, push_subscriptions
// 2. Veo estructura completa de notificaciones
// 3. Implemento sistema completo con tipos correctos
```

### **ESCENARIO 4: Migración o Cambios**
```sql
-- Antes de hacer cambios en DB:
-- 1. Leo schema actual
-- 2. Planifico migración
-- 3. Actualizo schema después del cambio
```

---

## 📋 **CHECKLISTS DE DESARROLLO**

### **✅ ANTES DE CREAR UNA FEATURE:**
- [ ] Consultar schema para tablas relacionadas
- [ ] Verificar campos existentes antes de crear nuevos
- [ ] Revisar relaciones entre tablas
- [ ] Confirmar RLS policies necesarias

### **✅ ANTES DE CREAR APIS:**
- [ ] Identificar tablas exactas en schema
- [ ] Verificar tipos de datos correctos
- [ ] Confirmar constraints y validaciones
- [ ] Revisar índices para optimización

### **✅ ANTES DE CREAR COMPONENTS:**
- [ ] Mapear campos de DB a props de componente
- [ ] Verificar tipos TypeScript contra schema
- [ ] Confirmar validaciones necesarias
- [ ] Planear estados de loading/error

---

## 🎯 **RESULTADO FINAL**

### **CONTEXTO COMPLETO DISPONIBLE**
- ✅ **Estructura**: 28 tablas mapeadas
- ✅ **Funciones**: Sistema de matching documentado
- ✅ **Relaciones**: Todas las FK identificadas
- ✅ **Seguridad**: RLS policies visibles
- ✅ **Índices**: Performance optimizada

**Este schema es tu SINGLE SOURCE OF TRUTH para toda la aplicación** 🚀

---

*Database Schema Context Complete*  
*Reference: complete_schema.sql (132 KB)*
