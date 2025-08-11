"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Heart,
  X,
  Star,
  MapPin,
  Users,
  Briefcase,
  MessageCircle,
  Filter,
  Search,
  Zap,
  Award,
  Clock,
  Eye,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data for matches
const mockMatches = [
  {
    id: 1,
    name: "TechStart Solutions",
    founder: "María González",
    avatar: "MG",
    location: "Ciudad de México",
    industry: "FinTech",
    stage: "Seed",
    matchPercentage: 95,
    description: "Plataforma de pagos digitales para pequeñas empresas en Latinoamérica",
    skills: ["React", "Node.js", "Blockchain"],
    lookingFor: ["CTO", "Frontend Developer"],
    funding: "$500K",
    team: 8,
    isNew: true
  },
  {
    id: 2,
    name: "EcoGreen Startup",
    founder: "Carlos Rodríguez",
    avatar: "CR",
    location: "Guadalajara",
    industry: "CleanTech",
    stage: "Pre-Seed",
    matchPercentage: 89,
    description: "Soluciones IoT para monitoreo ambiental y eficiencia energética",
    skills: ["IoT", "Python", "Machine Learning"],
    lookingFor: ["Data Scientist", "Hardware Engineer"],
    funding: "$250K",
    team: 4,
    isNew: false
  },
  {
    id: 3,
    name: "HealthAI Platform",
    founder: "Dr. Ana Martínez",
    avatar: "AM",
    location: "Monterrey",
    industry: "HealthTech",
    stage: "Series A",
    matchPercentage: 87,
    description: "IA para diagnóstico médico temprano y análisis predictivo",
    skills: ["AI/ML", "Healthcare", "Python"],
    lookingFor: ["ML Engineer", "Product Manager"],
    funding: "$2M",
    team: 15,
    isNew: false
  }
];

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentMatch, setCurrentMatch] = useState(0);
  const [matches, setMatches] = useState(mockMatches);
  const [likedMatches, setLikedMatches] = useState<number[]>([]);
  const [passedMatches, setPassedMatches] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLike = () => {
    const match = matches[currentMatch];
    setLikedMatches([...likedMatches, match.id]);
    nextMatch();
  };

  const handlePass = () => {
    const match = matches[currentMatch];
    setPassedMatches([...passedMatches, match.id]);
    nextMatch();
  };

  const nextMatch = () => {
    if (currentMatch < matches.length - 1) {
      setCurrentMatch(currentMatch + 1);
    } else {
      // Reiniciar o mostrar mensaje de no más matches
      setCurrentMatch(0);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Pre-Seed': return 'bg-yellow-100 text-yellow-800';
      case 'Seed': return 'bg-green-100 text-green-800';
      case 'Series A': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const current = matches[currentMatch];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <Heart className="h-6 w-6 mr-2 text-pink-500" />
                Matches
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Badge variant="secondary">
                {matches.length - currentMatch} restantes
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-5 w-5 text-pink-500 mr-2" />
                <span className="text-2xl font-bold text-pink-600">{likedMatches.length}</span>
              </div>
              <p className="text-sm text-gray-600">Me Gusta</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold text-yellow-600">12</span>
              </div>
              <p className="text-sm text-gray-600">Matches Mutuos</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold text-blue-600">8</span>
              </div>
              <p className="text-sm text-gray-600">Conversaciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Match Card */}
        <div className="flex justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg"
            >
              <Card className="overflow-hidden shadow-2xl border-0 bg-white">
                {/* Match Header */}
                <div className="relative">
                  <div className="h-32 bg-gradient-to-r from-pink-400 to-purple-500"></div>
                  <div className="absolute top-4 right-4">
                    {current.isNew && (
                      <Badge className="bg-green-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Nuevo
                      </Badge>
                    )}
                  </div>
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white">
                      {current.avatar}
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <TrendingUp className="h-4 w-4 text-white mr-1" />
                      <span className="text-white font-semibold">{current.matchPercentage}% Match</span>
                    </div>
                  </div>
                </div>

                <CardContent className="pt-12 p-6">
                  {/* Company Info */}
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{current.name}</h2>
                    <p className="text-gray-600 mb-2">Fundador: {current.founder}</p>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {current.location}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">{current.industry}</Badge>
                    <Badge className={getStageColor(current.stage)}>{current.stage}</Badge>
                    <Badge variant="secondary">{current.funding}</Badge>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {current.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="flex items-center mb-2">
                        <Users className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="font-medium">Equipo: {current.team}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <Briefcase className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-medium">Etapa: {current.stage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Tecnologías</h3>
                    <div className="flex flex-wrap gap-1">
                      {current.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Looking For */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Buscan</h3>
                    <div className="flex flex-wrap gap-1">
                      {current.lookingFor.map((role, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePass}
            className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <X className="h-8 w-8 text-gray-600" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full flex items-center justify-center shadow-xl transition-all"
          >
            <Heart className="h-10 w-10 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Eye className="h-8 w-8 text-blue-600" />
          </motion.button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8">
          <div className="flex justify-center mb-2">
            <span className="text-sm text-gray-600">
              {currentMatch + 1} de {matches.length}
            </span>
          </div>
          <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentMatch + 1) / matches.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
