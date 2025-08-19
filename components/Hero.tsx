"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Search, ArrowRight, Users, Lightbulb, Target } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/contexts/AuthProvider";
import Link from "next/link";

const Hero = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showMatches, setShowMatches] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { selectedSkills, setSelectedSkills } = useAppStore();
  const { user } = useAuth();

  const skills = [
    "React", "Node.js", "Python", "UI/UX Design", "Marketing", 
    "Sales", "Blockchain", "AI/ML", "Mobile Dev", "DevOps"
  ];

  // Safety check to ensure selectedSkills is never undefined
  const safeSelectedSkills = selectedSkills || [];
  
  // Safety check for skills array
  const safeSkills = skills || [];

  const mockMatches = [
    { name: "Ana García", skills: ["React", "UI/UX Design"], match: "95%" },
    { name: "Carlos López", skills: ["Node.js", "DevOps"], match: "89%" },
    { name: "María Ruiz", skills: ["Marketing", "Sales"], match: "87%" },
  ];

  // Fixed values to prevent hydration mismatch
  const floatingElements = [
    { id: 0, size: 120, duration: 15, delay: 0, left: 10, top: 20 },
    { id: 1, size: 80, duration: 18, delay: 0.5, left: 70, top: 60 },
    { id: 2, size: 100, duration: 12, delay: 1, left: 30, top: 80 },
    { id: 3, size: 90, duration: 20, delay: 1.5, left: 85, top: 15 },
    { id: 4, size: 110, duration: 14, delay: 2, left: 50, top: 40 },
    { id: 5, size: 70, duration: 16, delay: 0.8, left: 20, top: 70 },
  ];

  useEffect(() => {
    setIsClient(true);
    // Debug logging
    console.log('Hero component mounted, selectedSkills:', selectedSkills);
    console.log('safeSelectedSkills:', safeSelectedSkills);
  }, [selectedSkills, safeSelectedSkills]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => setShowMatches(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowMatches(false);
    }
  }, [searchTerm]);

  // Early return if not client to prevent hydration issues
  if (!isClient) {
    return null;
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        {floatingElements.map((element) => (
          <motion.div
            key={element.id}
            className="absolute bg-gradient-to-br from-blue-200 to-green-200 rounded-full blur-xl"
            style={{
              width: element.size,
              height: element.size,
              left: `${element.left}%`,
              top: `${element.top}%`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: element.duration,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Connection Lines Animation - Simplified */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <path
          d="M100,200 Q400,100 700,300 T1200,200"
          stroke="url(#gradient)"
          strokeWidth="2"
          fill="none"
          className="animate-pulse"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#3B82F6" }} />
            <stop offset="100%" style={{ stopColor: "#10B981" }} />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                IA + Networking = Startup Success
              </motion.span>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Construye el{" "}
                <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                  equipo perfecto
                </span>{" "}
                para tu startup
              </h1>
            </motion.div>

            <motion.p
              className="text-xl text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Matchmaking inteligente con IA que entiende tu visión y conecta 
              emprendedores complementarios para crear startups exitosas.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {user ? (
                // Usuario autenticado - Botón para ir al dashboard
                <Link href="/dashboard">
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center group w-full sm:w-auto"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Ir al Dashboard
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              ) : (
                // Usuario no autenticado - Botón para registrarse
                <Link href="/register">
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center group w-full sm:w-auto"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Empezar ahora
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              )}
              
              <motion.button
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300 flex items-center justify-center group w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="mr-2 w-5 h-5" />
                Tour interactivo
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex items-center gap-8 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">2,500+</div>
                <div className="text-sm text-gray-600">Emprendedores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">450+</div>
                <div className="text-sm text-gray-600">Startups creadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-600">Tasa de match</div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Interactive Demo */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="mr-3 w-6 h-6 text-blue-600" />
                Demo en tiempo real
              </h3>
              
              <div className="space-y-6">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Busca habilidades que necesitas..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e?.target?.value || '';
                      setSearchTerm(value);
                    }}
                  />
                </div>

                {/* Skills Tags - Simplified for debugging */}
                <div className="flex flex-wrap gap-2">
                  {safeSkills && safeSkills.length > 0 ? (
                    safeSkills.slice(0, 6).map((skill) => {
                      if (!skill) return null; // Skip undefined skills
                      
                      const isSelected = safeSelectedSkills && safeSelectedSkills.includes(skill);
                      
                      return (
                        <motion.button
                          key={skill}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (!safeSelectedSkills) return;
                            
                            if (isSelected) {
                              setSelectedSkills(safeSelectedSkills.filter(s => s !== skill));
                            } else {
                              setSelectedSkills([...safeSelectedSkills, skill]);
                            }
                          }}
                        >
                          {skill}
                        </motion.button>
                      );
                    })
                  ) : (
                    <div className="text-gray-500">Cargando habilidades...</div>
                  )}
                </div>

                {/* Mock Matches */}
                {showMatches && (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Users className="mr-2 w-4 h-4" />
                      Matches encontrados
                    </h4>
                    {mockMatches.map((match, index) => (
                      <motion.div
                        key={match.name}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div>
                          <div className="font-medium text-gray-900">{match.name}</div>
                          <div className="text-sm text-gray-600">
                            {match.skills.join(", ")}
                          </div>
                        </div>
                        <div className="text-green-600 font-semibold">{match.match}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Floating indicators */}
            <motion.div
              className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ¡Nuevo match!
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;