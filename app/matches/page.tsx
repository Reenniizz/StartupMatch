"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Building2,
  MapPin,
  Users,
  Briefcase,
  MessageCircle,
  Filter,
  Search,
  Award,
  Clock,
  Globe,
  TrendingUp,
  Star,
  Target,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data for professional matches
const mockMatches = [
  {
    id: 1,
    companyName: "TechStart Solutions",
    founder: "María González",
    founderTitle: "CEO & Founder",
    avatar: "MG",
    location: "Ciudad de México, México",
    industry: "FinTech",
    stage: "Series A",
    compatibilityScore: 92,
    description: "Desarrollamos soluciones de pagos digitales B2B para empresas medianas en Latinoamérica. Nuestra plataforma reduce los costos de transacción en un 40% y mejora la experiencia de pago.",
    technologies: ["React", "Node.js", "PostgreSQL", "AWS"],
    lookingFor: ["CTO", "Senior Backend Developer"],
    funding: "$1.2M",
    teamSize: 12,
    founded: "2022",
    revenue: "$250K ARR",
    isVerified: true,
    website: "techstart.mx"
  },
  {
    id: 2,
    companyName: "EcoMetrics Analytics",
    founder: "Dr. Carlos Rodríguez",
    founderTitle: "Co-Founder & Head of R&D",
    avatar: "CR",
    location: "Guadalajara, México",
    industry: "CleanTech",
    stage: "Seed",
    compatibilityScore: 87,
    description: "Plataforma de análisis predictivo para optimización energética en edificios corporativos. Utilizamos IoT y Machine Learning para reducir el consumo energético hasta un 35%.",
    technologies: ["Python", "TensorFlow", "IoT", "React"],
    lookingFor: ["Data Scientist", "VP of Sales"],
    funding: "$800K",
    teamSize: 8,
    founded: "2023",
    revenue: "Pre-revenue",
    isVerified: true,
    website: "ecometrics.com"
  },
  {
    id: 3,
    companyName: "HealthAI Diagnostics",
    founder: "Dra. Ana Martínez",
    founderTitle: "Chief Medical Officer",
    avatar: "AM",
    location: "Monterrey, México",
    industry: "HealthTech",
    stage: "Series B",
    compatibilityScore: 89,
    description: "Desarrollamos algoritmos de IA para diagnóstico médico temprano en radiología. Nuestro sistema ha demostrado 94% de precisión en detección de anomalías.",
    technologies: ["Python", "TensorFlow", "Computer Vision", "DICOM"],
    lookingFor: ["AI/ML Engineer", "Regulatory Affairs Manager"],
    funding: "$3.5M",
    teamSize: 25,
    founded: "2021",
    revenue: "$1.2M ARR",
    isVerified: true,
    website: "healthai.mx"
  }
];

export default function MatchesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentMatch, setCurrentMatch] = useState(0);
  const [matches, setMatches] = useState(mockMatches);
  const [interestedMatches, setInterestedMatches] = useState<number[]>([]);
  const [declinedMatches, setDeclinedMatches] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleInterested = () => {
    const match = matches[currentMatch];
    setInterestedMatches([...interestedMatches, match.id]);
    nextMatch();
  };

  const handleDecline = () => {
    const match = matches[currentMatch];
    setDeclinedMatches([...declinedMatches, match.id]);
    nextMatch();
  };

  const nextMatch = () => {
    if (currentMatch < matches.length - 1) {
      setCurrentMatch(currentMatch + 1);
    } else {
      setCurrentMatch(0);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Pre-Seed': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Seed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Series A': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Series B': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'FinTech': return 'bg-green-50 text-green-700 border-green-200';
      case 'HealthTech': return 'bg-red-50 text-red-700 border-red-200';
      case 'CleanTech': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const current = matches[currentMatch];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-slate-300">|</div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                <Handshake className="h-6 w-6 mr-2 text-slate-600" />
                Oportunidades de Colaboración
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-slate-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {currentMatch + 1} de {matches.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-700 mb-1">{interestedMatches.length}</div>
              <div className="text-sm text-slate-500">Interesados</div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">7</div>
              <div className="text-sm text-slate-500">Conexiones Mutuas</div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">4</div>
              <div className="text-sm text-slate-500">En Conversación</div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">2</div>
              <div className="text-sm text-slate-500">Reuniones Pactadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Match Card */}
        <div className="flex justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              <Card className="border-slate-200 shadow-lg bg-white">
                {/* Company Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                        {current.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h2 className="text-2xl font-bold text-slate-900">{current.companyName}</h2>
                          {current.isVerified && (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-slate-600 mb-2">{current.founder} • {current.founderTitle}</p>
                        <div className="flex items-center text-slate-500 text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          {current.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-700 mb-1">{current.compatibilityScore}%</div>
                      <div className="text-sm text-slate-500">Compatibilidad</div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                      <div className="text-sm font-medium text-slate-700">{current.founded}</div>
                      <div className="text-xs text-slate-500">Fundada</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Users className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                      <div className="text-sm font-medium text-slate-700">{current.teamSize}</div>
                      <div className="text-xs text-slate-500">Equipo</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <DollarSign className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                      <div className="text-sm font-medium text-slate-700">{current.funding}</div>
                      <div className="text-xs text-slate-500">Funding</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                      <div className="text-sm font-medium text-slate-700">{current.revenue}</div>
                      <div className="text-xs text-slate-500">Revenue</div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Stage & Industry */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className={`${getIndustryColor(current.industry)} border`}>
                      {current.industry}
                    </Badge>
                    <Badge className={`${getStageColor(current.stage)} border`}>
                      {current.stage}
                    </Badge>
                    <div className="flex items-center text-slate-500 text-sm">
                      <Globe className="h-3 w-3 mr-1" />
                      {current.website}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    {current.description}
                  </p>

                  {/* Technologies */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Stack Tecnológico
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {current.technologies.map((tech, index) => (
                        <Badge key={index} variant="outline" className="border-slate-300 text-slate-700">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Looking For */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Buscan Incorporar
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {current.lookingFor.map((role, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-700 border-blue-200">
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
        <div className="flex justify-center space-x-6 mb-8">
          <Button
            onClick={handleDecline}
            variant="outline"
            size="lg"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8"
          >
            <XCircle className="h-5 w-5 mr-2" />
            No es para mí
          </Button>

          <Button
            onClick={() => {/* Ver más detalles */}}
            variant="outline"
            size="lg"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 px-8"
          >
            <Info className="h-5 w-5 mr-2" />
            Ver detalles
          </Button>

          <Button
            onClick={handleInterested}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Me interesa
          </Button>
        </div>

        {/* Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progreso</span>
            <span>{currentMatch + 1} de {matches.length}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full">
            <div 
              className="h-full bg-slate-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentMatch + 1) / matches.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
