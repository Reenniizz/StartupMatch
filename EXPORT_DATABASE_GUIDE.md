# 🗄️ GUÍA COMPLETA: EXPORTAR BASE DE DATOS SUPABASE

## 📋 **MÉTODOS DISPONIBLES**

### **1. DESDE SUPABASE DASHBOARD (Más Fácil)**
```sql
-- Copia este SQL en el SQL Editor de tu Supabase Dashboard
-- Ejecuta cada sección por separado

-- === EXPORTAR ESQUEMA COMPLETO ===
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- === EXPORTAR CREATE STATEMENTS ===
\dt+ public.*
\df+ public.*
```

### **2. USANDO SUPABASE CLI (Si tienes acceso)**
```bash
# Vincular proyecto
supabase link --project-ref TU_PROJECT_REF

# Exportar esquema completo
supabase db dump --file database_export.sql

# Solo esquema (sin datos)
supabase db dump --schema-only --file schema_only.sql

# Solo datos
supabase db dump --data-only --file data_only.sql

# Esquema específico
supabase db dump --schema public --file public_schema.sql
```

### **3. USANDO PG_DUMP DIRECTO**
```bash
# Con URL de conexión de Supabase
pg_dump "postgresql://postgres:[password]@[host]:[port]/postgres" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --file=supabase_export.sql
```

### **4. DESDE CÓDIGO (Node.js)**
```javascript
// script_export_db.js
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function exportSchema() {
  try {
    await client.connect();
    
    // Obtener todas las tablas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('=== TABLAS ===');
    tables.rows.forEach(row => {
      console.log(row.table_name);
    });
    
    // Obtener estructura de cada tabla
    for (const table of tables.rows) {
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      console.log(`\n=== ${table.table_name.toUpperCase()} ===`);
      columns.rows.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    }
    
  } finally {
    await client.end();
  }
}

exportSchema().catch(console.error);
```

---

## 🎯 **RECOMENDACIÓN RÁPIDA**

### **MÉTODO MÁS FÁCIL:**

1. **Ve a tu Supabase Dashboard**
2. **SQL Editor** → Pega este código:

```sql
-- EXPORTAR TODO EL ESQUEMA
SELECT 
    t.table_name,
    string_agg(
        c.column_name || ' ' || c.data_type ||
        CASE WHEN c.character_maximum_length IS NOT NULL 
             THEN '(' || c.character_maximum_length || ')'
             ELSE '' END ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN c.column_default IS NOT NULL 
             THEN ' DEFAULT ' || c.column_default ELSE '' END,
        ',\n    '
    ) as table_structure
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;
```

3. **Ejecuta** y copia el resultado
4. **Guarda en un archivo .sql**

---

## 📁 **ARCHIVOS GENERADOS**

He creado `export_database_schema.sql` con todos los scripts necesarios.

¿Cuál método prefieres usar? ¿Tienes acceso al Dashboard de Supabase?
