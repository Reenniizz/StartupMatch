# StartupMatch 🚀

Una plataforma de matchmaking inteligente que conecta emprendedores complementarios para crear startups exitosas.

## 🌟 Características

- **Matchmaking con IA**: Algoritmos avanzados que aprenden de tus preferencias
- **Comunidad curada**: Solo emprendedores verificados y startups con potencial real
- **Dashboard completo**: Gestión de perfil, proyectos, mensajes y matches
- **Interfaz moderna**: Diseño responsive con Tailwind CSS y animaciones Framer Motion
- **Autenticación segura**: Sistema completo con Supabase

## 🛠️ Tecnologías

- **Frontend**: Next.js 15.4.6, React 19.1.1
- **Styling**: Tailwind CSS, shadcn/ui components
- **Animaciones**: Framer Motion
- **Base de datos**: Supabase
- **Autenticación**: Supabase Auth
- **Estado**: Zustand
- **TypeScript**: Tipado estricto

## 📱 Páginas Implementadas

- ✅ **Landing Page**: Hero, características, testimonios
- ✅ **Dashboard**: Panel principal con navegación
- ✅ **Profile**: Gestión completa del perfil del usuario
- ✅ **Settings**: Configuraciones y preferencias
- ✅ **Matches**: Sistema de matching tipo Tinder
- ✅ **Messages**: Chat en tiempo real
- ✅ **Projects**: Gestión de proyectos de startup
- ✅ **Login/Register**: Autenticación completa

## 🚀 Instalación

1. Clona el repositorio:
\`\`\`bash
git clone https://github.com/TU_USUARIO/StartupMatch.git
cd StartupMatch
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configura las variables de entorno:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configura tu proyecto de Supabase y añade las credenciales en \`.env.local\`:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
\`\`\`

5. Ejecuta el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📂 Estructura del Proyecto

\`\`\`
├── app/                  # App router de Next.js
│   ├── dashboard/        # Dashboard principal
│   ├── login/           # Página de login
│   ├── register/        # Página de registro
│   ├── profile/         # Gestión de perfil
│   ├── settings/        # Configuraciones
│   ├── matches/         # Sistema de matches
│   ├── messages/        # Chat y mensajes
│   └── projects/        # Gestión de proyectos
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de shadcn/ui
│   └── ...             # Componentes específicos
├── contexts/           # Context providers
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuraciones
└── store/              # Estado global con Zustand
\`\`\`

## 🎨 Características de UX/UI

- **Responsive Design**: Optimizado para móvil y desktop
- **Animaciones fluidas**: Transiciones suaves con Framer Motion
- **Tema consistente**: Paleta de colores azul-verde
- **Componentes modernos**: shadcn/ui components
- **Carga optimizada**: Lazy loading y Suspense

## 🔧 Scripts Disponibles

- \`npm run dev\` - Servidor de desarrollo
- \`npm run build\` - Build de producción
- \`npm run start\` - Servidor de producción
- \`npm run lint\` - Linting con ESLint

## 📝 Próximas Características

- [ ] Sistema de notificaciones en tiempo real
- [ ] Integración con APIs de pagos
- [ ] Chat con video llamadas
- [ ] Sistema de reviews y ratings
- [ ] Analytics avanzados
- [ ] App móvil con React Native

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push a la rama (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo \`LICENSE\` para más detalles.

## 📞 Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter) - tu@email.com

Enlace del Proyecto: [https://github.com/TU_USUARIO/StartupMatch](https://github.com/TU_USUARIO/StartupMatch)
