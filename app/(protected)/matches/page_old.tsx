'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'matches'>('discover');
  const [matches, setMatches] = useState<number[]>([]);

  // Share matches state between components
  const handleNewMatch = (profileId: number) => {
    setMatches(prev => [...prev, profileId]);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Auth guard
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Inicia sesión para continuar
            </h2>
            <p className="text-gray-600 mb-6">
              Conecta con emprendedores y encuentra tu próximo socio de negocio
            </p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl py-3 px-6 font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
                💖 Matches
              </h1>
              <p className="text-gray-600 mt-1">
                ¡Hola {user.email?.split('@')[0]}! Descubre conexiones perfectas
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-md">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'discover'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Descubrir
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                activeTab === 'matches'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ❤️ Mis Matches
              {matches.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {matches.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'discover' ? (
          <DiscoverSection onNewMatch={handleNewMatch} />
        ) : (
          <MatchesSection matches={matches} />
        )}
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
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-lg p-12">
        <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">�</span>
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

// Profile Card Component
function ProfileCard({ index, onLike, onPass }: { index: number, onLike: () => void, onPass: () => void }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isPassed, setIsPassed] = useState(false);

  const profiles = [
    { name: 'Ana García', role: 'Fundadora Tech', skills: ['React', 'Node.js', 'Design'], bio: 'Apasionada por crear productos que impacten positivamente en la sociedad', match: '85%' },
    { name: 'Carlos López', role: 'CTO', skills: ['Python', 'AI', 'Blockchain'], bio: 'Experto en inteligencia artificial y blockchain, buscando cofundadores', match: '92%' },
    { name: 'María Rodríguez', role: 'Marketing Lead', skills: ['Growth', 'SEO', 'Social Media'], bio: 'Especialista en growth hacking y marketing digital para startups', match: '78%' },
    { name: 'David Chen', role: 'Product Manager', skills: ['Product', 'UX', 'Analytics'], bio: 'Product Manager con experiencia en startups de fintech y e-commerce', match: '89%' },
    { name: 'Laura Martín', role: 'Designer', skills: ['UI/UX', 'Figma', 'Branding'], bio: 'Diseñadora UX/UI especializada en productos digitales innovadores', match: '95%' },
    { name: 'Andrés Silva', role: 'Business Dev', skills: ['Sales', 'Strategy', 'Partnerships'], bio: 'Experto en desarrollo de negocio y estrategia comercial', match: '82%' }
  ];

  const profile = profiles[(index - 1) % profiles.length];

  const handleLike = () => {
    setIsLiked(true);
    setTimeout(() => {
      onLike();
    }, 500);
  };

  const handlePass = () => {
    setIsPassed(true);
    setTimeout(() => {
      onPass();
    }, 300);
  };

  if (isPassed) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden opacity-50 transform scale-95 transition-all duration-300">
        <div className="h-48 bg-gray-300 flex items-center justify-center">
          <span className="text-4xl">👋</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500 font-semibold">¡Hasta la vista!</p>
        </div>
      </div>
    );
  }

  if (isLiked) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-pink-400 transform scale-105 transition-all duration-500">
        <div className="h-48 bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl animate-bounce">💖</div>
            <p className="text-white font-bold mt-2">¡Te gusta!</p>
          </div>
        </div>
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{profile.name}</h3>
          <p className="text-pink-600 font-semibold">¡Esperemos que sea mutuo! 🤞</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105">
      {/* Match percentage badge */}
      <div className="absolute top-4 right-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
        {profile.match} match
      </div>

      {/* Avatar */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center relative">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-gray-700">
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
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {profile.bio}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {profile.skills.map((skill) => (
            <span 
              key={skill}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={handlePass}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            👋 Pasar
          </button>
          <button 
            onClick={handleLike}
            className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            💖 Me gusta
          </button>
        </div>
      </div>
    </div>
  );
}
