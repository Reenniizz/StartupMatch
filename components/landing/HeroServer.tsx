// ✅ SERVER COMPONENT - Static Hero Content
import Link from "next/link";
import { Play, Search, ArrowRight, Users, Lightbulb, Target } from "lucide-react";
import { InteractiveHero } from "./InteractiveHero";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      
      {/* Interactive elements - this will be client-side */}
      <InteractiveHero />
      
      {/* Main content - server rendered */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Pre-header */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Target className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-sm font-medium text-white">
              Conectando emprendedores desde 2024
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Construye el{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              equipo perfecto
            </span>{" "}
            para tu startup
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Matchmaking inteligente con{" "}
            <span className="text-cyan-400 font-semibold">IA</span> que conecta
            emprendedores complementarios para crear{" "}
            <span className="text-green-400 font-semibold">startups exitosas</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/register" 
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Encontrar Cofundadores
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <button className="group inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300">
              <Play className="w-5 h-5 mr-2" />
              Ver Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">1.2k+</div>
              <div className="text-gray-300">Emprendedores</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">450+</div>
              <div className="text-gray-300">Startups Creadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">89%</div>
              <div className="text-gray-300">Tasa de Éxito</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
