# 📊 Datos de Usuarios - StartupMatch

## 🔍 Información Recopilada

StartupMatch recopila los siguientes datos de usuarios durante el proceso de registro y uso de la plataforma:

---

## 👤 **Información Personal Básica**

### ✅ Datos Obligatorios
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Nombre** | Texto | Identificación, comunicación | Juan |
| **Apellido** | Texto | Identificación, comunicación | Pérez |
| **Username** | Texto único | Perfil público, menciones | juan_perez |
| **Email** | Email válido | Autenticación, comunicación | juan@email.com |
| **Contraseña** | Hash encriptado | Seguridad de acceso | [Hash seguro] |

### 📞 Datos Opcionales
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Teléfono** | Texto libre | Comunicación directa | +34 600 123 456 |

---

## 💼 **Información Profesional**

### ✅ Datos Obligatorios
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Rol Actual** | Selección/Texto | Matching por expertise | Fundador/CEO |
| **Industria** | Selección/Texto | Matching sectorial | Tecnología |
| **Ubicación** | Texto libre | Matching geográfico | Madrid, España |

### 🏢 Datos Opcionales
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Empresa Actual** | Texto libre | Contexto profesional | Mi Startup SL |

---

## 🎯 **Preferencias y Objetivos**

### ✅ Datos Obligatorios
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **¿Qué buscas?** | Array de opciones | Algoritmo de matching | ["Co-fundador técnico", "Inversionistas"] |
| **Habilidades** | Array de texto | Matching por competencias | ["React", "Marketing Digital", "Liderazgo"] |

---

## 🔐 **Datos Técnicos y de Seguridad**

### 📊 Metadatos Automáticos
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **ID Usuario** | UUID único | Identificación interna | 550e8400-e29b-41d4... |
| **Fecha Registro** | Timestamp | Auditoría, analytics | 2025-01-15T10:30:00Z |
| **Última Actividad** | Timestamp | Sesiones, seguridad | 2025-01-15T15:45:23Z |
| **IP Registro** | Dirección IP | Seguridad, geolocalización | 192.168.1.1 |
| **User Agent** | Texto | Compatibilidad, seguridad | Mozilla/5.0... |

### 🍪 Datos de Sesión
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Session Token** | JWT encriptado | Autenticación segura | [Token JWT] |
| **Refresh Token** | Token seguro | Renovación de sesión | [Refresh token] |

---

## 🤖 **Datos para Matching IA** (Futuro)

### 📈 Analytics de Comportamiento
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Interacciones** | Array de objetos | Mejorar algoritmos | Matches vistos, likes dados |
| **Tiempo en Plataforma** | Numérico | Engagement, calidad | 45 minutos promedio |
| **Preferencias Implícitas** | JSON | Personalización IA | Sectores más visitados |

### 🎲 Feedback de Matches
| Campo | Tipo | Propósito | Ejemplo |
|-------|------|-----------|---------|
| **Ratings Dados** | Array numérico | Calidad del matching | [4.5, 3.2, 5.0] |
| **Feedback Textual** | Texto libre | Mejora de algoritmos | "Muy compatible" |

---

## 🔒 **Política de Privacidad**

### ✅ **Datos que SÍ guardamos:**
- ✅ Información de perfil público
- ✅ Preferencias de matching
- ✅ Historial de interacciones básico
- ✅ Metadatos técnicos necesarios

### ❌ **Datos que NO guardamos:**
- ❌ Contraseñas en texto plano
- ❌ Información bancaria o financiera
- ❌ Datos sensibles innecesarios
- ❌ Conversaciones privadas sin consentimiento

### 🛡️ **Seguridad y Encriptación:**
- 🔐 **Contraseñas hasheadas** con bcrypt
- 🔐 **Datos sensibles encriptados** en BD
- 🔐 **Transmisión HTTPS** obligatoria
- 🔐 **Tokens JWT** con expiración

### 📍 **Ubicación de Datos:**
- 🌍 **Servidores:** Europa (GDPR compliant)
- 🏠 **Base de datos:** Supabase (SOC 2 certified)
- 🔄 **Backups:** Encriptados y georeplicados

---

## 👥 **Compartición de Datos**

### ✅ **Datos Públicos (Perfil):**
- Nombre completo
- Username
- Rol profesional
- Industria
- Ubicación (ciudad/país)
- Habilidades
- Qué está buscando

### 🔒 **Datos Privados (Solo usuario):**
- Email
- Teléfono
- IP de registro
- Datos de sesión
- Analytics detallados

### 🤝 **Con Terceros:**
- ❌ **Nunca vendemos** datos personales
- ⚠️ **Solo compartimos** datos agregados y anónimos para analytics
- ✅ **APIs públicas** solo muestran datos de perfil con consentimiento

---

## 📋 **Derechos del Usuario (GDPR)**

### 🔍 **Derecho de Acceso:**
- Ver todos tus datos guardados
- Exportar información en JSON/CSV

### ✏️ **Derecho de Rectificación:**
- Editar información de perfil
- Actualizar preferencias

### 🗑️ **Derecho al Olvido:**
- Eliminar cuenta completamente
- Borrado de datos en 30 días

### 📤 **Portabilidad:**
- Exportar datos en formato estándar
- Transferir a otras plataformas

---

## 📞 **Contacto y Solicitudes**

Para ejercer tus derechos o hacer consultas sobre datos:

- 📧 **Email:** privacy@startupmatch.com
- 🌐 **Formulario:** /privacy/request
- ⏱️ **Respuesta:** Máximo 30 días

---

## 📅 **Retención de Datos**

| Tipo de Dato | Tiempo de Retención | Razón |
|--------------|-------------------|-------|
| **Perfil Activo** | Mientras cuenta activa | Funcionalidad |
| **Cuenta Eliminada** | 30 días | Recuperación accidental |
| **Analytics Anónimos** | 2 años | Mejora del servicio |
| **Logs de Seguridad** | 1 año | Auditoría |

---

*Última actualización: Enero 2025*
*Versión: 1.0*
