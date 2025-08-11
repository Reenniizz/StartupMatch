# 🚀 Plan de Implementación - Datos de Usuario

## Fase 1: Perfil Básico (Semana 1)
### Formulario de Onboarding
- [ ] Nombre completo
- [ ] Email (ya tienes con Supabase Auth)
- [ ] Ubicación (país/ciudad)
- [ ] Rol deseado (dropdown)
- [ ] Años de experiencia (slider)
- [ ] Bio corta (150 chars)

### Componentes a crear:
```typescript
// components/onboarding/BasicProfile.tsx
// components/onboarding/ProgressIndicator.tsx
// app/onboarding/page.tsx
```

## Fase 2: Skills y Competencias (Semana 2)
### Sistema de Skills
- [ ] Categorías predefinidas (Tech, Business, Design, Marketing)
- [ ] Skill selector con niveles (1-10)
- [ ] Autocompletado de skills
- [ ] Validación de experiencia

### Componentes a crear:
```typescript
// components/onboarding/SkillsSelector.tsx
// components/ui/SkillLevel.tsx
// lib/skills-data.ts
```

## Fase 3: Preferencias y Matching (Semana 3)
### Datos para IA
- [ ] Tipo de startup preferida
- [ ] Industrias de interés
- [ ] Disponibilidad horaria
- [ ] Preferencias de colaboración
- [ ] Test de personalidad básico

### Componentes a crear:
```typescript
// components/onboarding/Preferences.tsx
// components/onboarding/PersonalityTest.tsx
// lib/matching-algorithm.ts
```

## Fase 4: Proyectos e Ideas (Semana 4)
### Gestión de Proyectos
- [ ] Proyectos actuales
- [ ] Ideas en desarrollo
- [ ] Recursos disponibles
- [ ] Timeline esperado

### Componentes a crear:
```typescript
// components/projects/ProjectForm.tsx
// components/projects/IdeaCard.tsx
// app/projects/create/page.tsx
```

## Fase 5: IA y Optimización (Semana 5+)
### Sistema de Matching
- [ ] Algoritmo de compatibilidad
- [ ] Explicaciones de matches
- [ ] Feedback loop
- [ ] Mejora continua

### Servicios a crear:
```typescript
// lib/ai/matching-service.ts
// lib/ai/gpt-integration.ts
// lib/analytics/user-behavior.ts
```

---

## 🎨 UX/UI Strategy

### Onboarding Flow
1. **Bienvenida** (30 seg) - Video/animación explicativa
2. **Perfil básico** (2 min) - Datos esenciales
3. **Skills** (3 min) - Selección interactiva
4. **Preferencias** (2 min) - Test rápido
5. **¡Listo!** - Primeros matches

### Técnicas UX
- **Save & Continue**: Progreso guardado automáticamente
- **Skip Options**: "Completar después" para datos opcionales
- **Smart Defaults**: Sugerencias basadas en datos previos
- **Validation**: Feedback inmediato

---

## 📊 Estructura de Datos

### Tabla: user_profiles
```sql
- id (uuid, FK a auth.users)
- full_name (text)
- location (text)
- desired_role (text)
- experience_years (integer)
- bio (text)
- avatar_url (text)
- availability_hours (integer)
- created_at, updated_at
```

### Tabla: user_skills
```sql
- id (uuid)
- user_id (uuid, FK)
- skill_name (text)
- skill_level (integer 1-10)
- skill_category (text)
- verified (boolean)
- created_at
```

### Tabla: user_preferences
```sql
- id (uuid)
- user_id (uuid, FK)
- preferred_industries (jsonb)
- collaboration_style (text)
- personality_data (jsonb)
- location_preference (text)
- commitment_level (text)
```

---

## 🔧 APIs y Integraciones

### Datos Automáticos
- **LinkedIn API**: Experiencia profesional
- **GitHub API**: Skills técnicas y proyectos
- **Google Places**: Validación de ubicación
- **OpenAI API**: Análisis de perfiles y matching

### Validación de Datos
- **Email verification**: Ya implementado con Supabase
- **Phone verification**: SMS con Twilio
- **Skill verification**: Portfolio/LinkedIn validation
- **Identity verification**: Opcional para usuarios premium
