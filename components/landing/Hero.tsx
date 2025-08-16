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
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => setShowMatches(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowMatches(false);
    }
  }, [searchTerm]);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
      {/* Animated Background Elements */}
      {isClient && (
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
      )}

      {/* Connection Lines Animation - Simplified */}
      {isClient && (
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
      )}

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
                className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Users className="w-4 h-4 mr-2" />
                127 startups financiadas este mes
              </motion.span>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Encuentra tu{" "}
                <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
                  co-founder
                </span>{" "}
                en 7 días, no 7 meses
              </h1>
            </motion.div>

            <motion.p
              className="text-xl text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              El algoritmo de IA más avanzado para matching profesional. 
              <span className="font-semibold text-gray-800"> Puntuación promedio de compatibilidad: 94%</span>
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
                    Ver mis matches
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              ) : (
                // Usuario no autenticado - Botón optimizado para conversión
                <Link href="/register">
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center group w-full sm:w-auto"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Encontrar Co-founders
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              )}
              
              <motion.div className="text-center sm:text-left">
                <p className="text-sm text-gray-500 font-medium">
                  Gratis • Sin compromisos • Setup en 2 minutos
                </p>
                <p className="text-xs text-green-600 font-semibold mt-1">
                  ✨ Se unieron 1,247 founders esta semana
                </p>
              </motion.div>
            </motion.div>

            {/* Stats - Mejoradas con credibilidad */}
            <motion.div
              className="flex items-center gap-8 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">12,847</div>
                <div className="text-sm text-gray-600">Founders activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">3,200+</div>
                <div className="text-sm text-gray-600">Matches exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">$124M</div>
                <div className="text-sm text-gray-600">Capital levantado</div>
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
                Encuentra tu match perfecto
              </h3>
              
              <div className="space-y-6">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Ej: React, Marketing Digital, Fintech..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 6).map((skill) => (
                    <motion.button
                      key={skill}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedSkills.includes(skill)
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                          : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (selectedSkills.includes(skill)) {
                          setSelectedSkills(selectedSkills.filter(s => s !== skill));
                        } else {
                          setSelectedSkills([...selectedSkills, skill]);
                        }
                      }}
                    >
                      {skill}
                    </motion.button>
                  ))}
                </div>

                {/* Enhanced Mock Matches */}
                {(showMatches || selectedSkills.length > 0) && (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h4 className="font-semibold text-gray-900 flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="mr-2 w-4 h-4" />
                        Co-founders perfectos para ti
                      </span>
                      <span className="text-sm font-normal text-green-600">
                        3 nuevos matches
                      </span>
                    </h4>
                    {mockMatches.map((match, index) => (
                      <motion.div
                        key={match.name}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg hover:from-blue-100 hover:to-green-100 transition-all cursor-pointer border border-blue-100"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -1 }}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {match.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{match.name}</div>
                            <div className="text-sm text-gray-600">
                              {match.skills.join(" • ")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-bold text-lg">{match.match}</div>
                          <div className="text-xs text-gray-500">compatibilidad</div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <motion.div
                      className="text-center py-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-sm text-gray-600 mb-2">
                        ¿Te gusta lo que ves?
                      </p>
                      <Link href="/register">
                        <motion.button
                          className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Conectar ahora gratis
                        </motion.button>
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Floating indicators - Mejorado */}
            <motion.div
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎯 2 te vieron hoy
            </motion.div>
            
            <motion.div
              className="absolute -bottom-6 -left-6 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              ✨ Match perfecto
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;