"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Rocket,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  Calendar,
  Target,
  TrendingUp,
  Edit3,
  Archive,
  Eye,
  Share2,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data for projects
const mockProjects = [
  {
    id: 1,
    name: "E-Commerce Platform",
    description: "Plataforma de comercio electrónico con IA para recomendaciones personalizadas",
    status: "active",
    progress: 75,
    team: 4,
    funding: "$150K",
    deadline: "2025-10-15",
    technologies: ["React", "Node.js", "MongoDB", "AI/ML"],
    category: "E-Commerce",
    createdAt: "2025-01-15",
    collaborators: [
      { name: "Ana García", role: "Frontend Dev", avatar: "AG" },
      { name: "Carlos López", role: "Backend Dev", avatar: "CL" },
      { name: "María Fernández", role: "Designer", avatar: "MF" }
    ],
    tasks: {
      completed: 28,
      total: 45
    },
    revenue: "$12K",
    isStarred: true
  },
  {
    id: 2,
    name: "HealthTech Mobile App",
    description: "Aplicación móvil para monitoreo de salud y telemedicina",
    status: "planning",
    progress: 25,
    team: 6,
    funding: "$300K",
    deadline: "2025-12-20",
    technologies: ["React Native", "Firebase", "Healthcare APIs"],
    category: "HealthTech",
    createdAt: "2025-02-20",
    collaborators: [
      { name: "Dr. Roberto Silva", role: "Medical Advisor", avatar: "RS" },
      { name: "Laura Martín", role: "Mobile Dev", avatar: "LM" }
    ],
    tasks: {
      completed: 8,
      total: 32
    },
    revenue: "$0",
    isStarred: false
  },
  {
    id: 3,
    name: "Fintech Crypto Wallet",
    description: "Billetera digital segura para criptomonedas con funciones DeFi",
    status: "completed",
    progress: 100,
    team: 8,
    funding: "$500K",
    deadline: "2025-07-30",
    technologies: ["React", "Blockchain", "Solidity", "Web3"],
    category: "FinTech",
    createdAt: "2024-10-01",
    collaborators: [
      { name: "Miguel Torres", role: "Blockchain Dev", avatar: "MT" },
      { name: "Sofia Ruiz", role: "Security Expert", avatar: "SR" }
    ],
    tasks: {
      completed: 52,
      total: 52
    },
    revenue: "$45K",
    isStarred: true
  }
];

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState(mockProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Activo', color: 'bg-green-100 text-green-800', icon: Play };
      case 'planning':
        return { label: 'Planificación', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'completed':
        return { label: 'Completado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      case 'paused':
        return { label: 'Pausado', color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalRevenue: projects.reduce((sum, p) => sum + parseInt(p.revenue.replace(/[$K,]/g, '')), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Rocket className="h-6 w-6 mr-2 text-purple-600" />
                Mis Proyectos
              </h1>
            </div>

            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Proyectos</p>
                  <p className="text-3xl font-bold text-gray-900">{projectStats.total}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-3xl font-bold text-green-600">{projectStats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completados</p>
                  <p className="text-3xl font-bold text-blue-600">{projectStats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue Total</p>
                  <p className="text-3xl font-bold text-yellow-600">${projectStats.totalRevenue}K</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="planning">Planificación</option>
              <option value="completed">Completados</option>
              <option value="paused">Pausados</option>
            </select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          {project.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Progreso</span>
                        <span className="text-sm font-semibold">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Users className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="font-semibold text-sm">{project.team}</span>
                        </div>
                        <p className="text-xs text-gray-600">Miembros</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Target className="h-4 w-4 text-green-500 mr-1" />
                          <span className="font-semibold text-sm">{project.tasks.completed}/{project.tasks.total}</span>
                        </div>
                        <p className="text-xs text-gray-600">Tareas</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-semibold text-sm">{project.revenue}</span>
                        </div>
                        <p className="text-xs text-gray-600">Revenue</p>
                      </div>
                    </div>

                    {/* Technologies */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 3).map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {project.technologies.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.technologies.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Team Avatars */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Colaboradores</p>
                      <div className="flex -space-x-2">
                        {project.collaborators.slice(0, 4).map((collaborator, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                            title={`${collaborator.name} - ${collaborator.role}`}
                          >
                            {collaborator.avatar}
                          </div>
                        ))}
                        {project.collaborators.length > 4 && (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
                            +{project.collaborators.length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Rocket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay proyectos
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "No se encontraron proyectos con los filtros aplicados."
                : "Crea tu primer proyecto para empezar."
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
