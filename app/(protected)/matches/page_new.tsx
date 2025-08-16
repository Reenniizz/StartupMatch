'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'matches'>('discover');
  const [matches, setMatches] = useState<number[]>([]);

  const handleNewMatch = (profileId: number) => {
    setMatches(prev => [...prev, profileId]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando matches...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso restringido
          </h2>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para ver los matches
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl py-3 px-6 font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            💕 Matches & Conexiones
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubre emprendedores que complementen tus habilidades y conecta con quienes ya mostraron interés
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'discover'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔍 Descubrir ({activeTab === 'discover' ? 'activo' : 'inactivo'})
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 relative ${
                activeTab === 'matches'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              💖 Matches ({matches.length})
              {matches.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {matches.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          {activeTab === 'discover' ? (
            <DiscoverSection onNewMatch={handleNewMatch} />
          ) : (
            <MatchesSection matches={matches} />
          )}
        </div>
      </div>
    </div>
  );
}

// Discover Section Component
function DiscoverSection({ onNewMatch }: { onNewMatch: (profileId: number) => void }) {
  const [profiles, setProfiles] = useState([1, 2, 3, 4, 5, 6]);
  const [localMatches, setLocalMatches] = useState<number[]>([]);

  const handleLike = (profileId: number) => {
    setLocalMatches(prev => [...prev, profileId]);
    setProfiles(prev => prev.filter(id => id !== profileId));
    onNewMatch(profileId);
    
    // Show success message
    setTimeout(() => {
      // Could show a toast notification here
    }, 500);
  };

  const handlePass = (profileId: number) => {
    setProfiles(prev => prev.filter(id => id !== profileId));
  };

  if (profiles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-lg p-12">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Has explorado todos los perfiles!
          </h2>
          <p className="text-gray-600 mb-6">
            No hay más perfiles disponibles por ahora. Vuelve mañana para descubrir nuevas conexiones.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setProfiles([1, 2, 3, 4, 5, 6])}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl py-3 px-6 font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
            >
              🔄 Recargar perfiles
            </button>
            <button 
              onClick={() => {}}
              className="border-2 border-gray-300 text-gray-700 rounded-xl py-3 px-6 font-semibold hover:bg-gray-50 transition-colors"
            >
              ⚙️ Ajustar filtros
            </button>
          </div>
          {localMatches.length > 0 && (
            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">
                🎊 ¡Tienes {localMatches.length} nuevos likes! Ve a la sección de matches para verlos.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Descubre nuevas conexiones
        </h2>
        <p className="text-gray-600 mb-4">
          Encuentra emprendedores que complementen tus habilidades
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            📊 {profiles.length} perfiles disponibles
          </div>
          {localMatches.length > 0 && (
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full">
              💖 {localMatches.length} likes enviados
            </div>
          )}
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((i) => (
          <ProfileCard 
            key={i} 
            index={i} 
            onLike={() => handleLike(i)}
            onPass={() => handlePass(i)}
          />
        ))}
      </div>
    </div>
  );
}

// Matches Section Component
function MatchesSection({ matches }: { matches: number[] }) {
  const profiles = [
    { name: 'Ana García', role: 'Fundadora Tech', skills: ['React', 'Node.js', 'Design'], bio: 'Apasionada por crear productos que impacten positivamente en la sociedad' },
    { name: 'Carlos López', role: 'CTO', skills: ['Python', 'AI', 'Blockchain'], bio: 'Experto en inteligencia artificial y blockchain, buscando cofundadores' },
    { name: 'María Rodríguez', role: 'Marketing Lead', skills: ['Growth', 'SEO', 'Social Media'], bio: 'Especialista en growth hacking y marketing digital para startups' },
    { name: 'David Chen', role: 'Product Manager', skills: ['Product', 'UX', 'Analytics'], bio: 'Product Manager con experiencia en startups de fintech y e-commerce' },
    { name: 'Laura Martín', role: 'Designer', skills: ['UI/UX', 'Figma', 'Branding'], bio: 'Diseñadora UX/UI especializada en productos digitales innovadores' },
    { name: 'Andrés Silva', role: 'Business Dev', skills: ['Sales', 'Strategy', 'Partnerships'], bio: 'Experto en desarrollo de negocio y estrategia comercial' }
  ];

  if (matches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-lg p-12">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">💕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Aquí aparecerán tus matches!
          </h2>
          <p className="text-gray-600 mb-6">
            Cuando hagas match con otros emprendedores, podrás verlos y contactarlos aquí
          </p>
          <button 
            onClick={() => {}}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl py-3 px-6 font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
          >
            Explorar perfiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tus Matches ✨
        </h2>
        <p className="text-gray-600 mb-4">
          ¡Estas personas también están interesadas en conectar contigo!
        </p>
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full inline-block">
          💖 {matches.length} {matches.length === 1 ? 'match' : 'matches'} encontrados
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((matchId) => {
          const profile = profiles[(matchId - 1) % profiles.length];
          
          return (
            <div key={matchId} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-green-200">
              {/* Match Badge */}
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-center py-2 font-bold">
                🎉 ¡Es un Match! 🎉
              </div>

              {/* Avatar */}
              <div className="h-40 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-gray-700">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {profile.name}
                </h3>
                <p className="text-green-600 font-semibold mb-3">
                  {profile.role}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  {profile.bio}
                </p>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg">
                  💬 Enviar mensaje
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Profile Card Component
function ProfileCard({ index, onLike, onPass }: { index: number, onLike: () => void, onPass: () => void }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isPassed, setIsPassed] = useState(false);

  const profiles = [
    { name: 'Ana García', role: 'Fundadora Tech', skills: ['React', 'Node.js', 'Design'], bio: 'Apasionada por crear productos que impacten positivamente en la sociedad' },
    { name: 'Carlos López', role: 'CTO', skills: ['Python', 'AI', 'Blockchain'], bio: 'Experto en inteligencia artificial y blockchain, buscando cofundadores' },
    { name: 'María Rodríguez', role: 'Marketing Lead', skills: ['Growth', 'SEO', 'Social Media'], bio: 'Especialista en growth hacking y marketing digital para startups' },
    { name: 'David Chen', role: 'Product Manager', skills: ['Product', 'UX', 'Analytics'], bio: 'Product Manager con experiencia en startups de fintech y e-commerce' },
    { name: 'Laura Martín', role: 'Designer', skills: ['UI/UX', 'Figma', 'Branding'], bio: 'Diseñadora UX/UI especializada en productos digitales innovadores' },
    { name: 'Andrés Silva', role: 'Business Dev', skills: ['Sales', 'Strategy', 'Partnerships'], bio: 'Experto en desarrollo de negocio y estrategia comercial' }
  ];

  const profile = profiles[(index - 1) % profiles.length];

  const handleLike = () => {
    setIsLiked(true);
    setTimeout(() => {
      onLike();
    }, 800);
  };

  const handlePass = () => {
    setIsPassed(true);
    setTimeout(() => {
      onPass();
    }, 500);
  };

  if (isLiked || isPassed) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 ${
        isLiked ? 'scale-105 rotate-3 border-2 border-green-400' : 'scale-95 -rotate-2 opacity-50'
      }`}>
        <div className={`h-60 bg-gradient-to-br ${
          isLiked 
            ? 'from-green-400 to-emerald-500' 
            : 'from-gray-400 to-gray-500'
        } flex items-center justify-center`}>
          <div className="text-6xl animate-bounce">
            {isLiked ? '💖' : '👋'}
          </div>
        </div>
        <div className="p-6 text-center">
          <p className={`text-lg font-bold ${
            isLiked ? 'text-green-600' : 'text-gray-500'
          }`}>
            {isLiked ? '¡Like enviado!' : '¡Perfil pasado!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Avatar */}
      <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-gray-700">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {profile.name}
        </h3>
        <p className="text-blue-600 font-semibold mb-3">
          {profile.role}
        </p>
        <p className="text-gray-600 text-sm mb-4">
          {profile.bio}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
              {skill}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handlePass}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            👋 Pasar
          </button>
          <button 
            onClick={handleLike}
            className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg"
          >
            💖 Like
          </button>
        </div>
      </div>
    </div>
  );
}
