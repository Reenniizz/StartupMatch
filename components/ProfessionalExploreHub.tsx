'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Briefcase, 
  Star,
  TrendingUp,
  Building2,
  Zap,
  Eye,
  BookmarkPlus,
  MessageSquare,
  Calendar,
  Award,
  Target,
  BarChart3,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ExplorationMatch {
  id: string
  type: 'project' | 'founder' | 'opportunity'
  title: string
  subtitle: string
  description: string
  matchScore: number
  compatibility: {
    skills: number
    industry: number
    stage: number
    location: number
  }
  metrics: {
    views: number
    interests: number
    connections: number
  }
  tags: string[]
  location: string
  verified: boolean
  premium: boolean
  lastActive: string
  image?: string
}

interface ExploreFilters {
  query: string
  type: string
  industry: string
  stage: string
  location: string
  matchScore: number
  sortBy: string
}

export default function ProfessionalExploreHub() {
  const [matches, setMatches] = useState<ExplorationMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ExploreFilters>({
    query: '',
    type: 'all',
    industry: 'all',
    stage: 'all',
    location: 'all',
    matchScore: 0,
    sortBy: 'relevance'
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const loadMatches = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        ...filters,
        matchScore: filters.matchScore.toString()
      }).toString()
      
      const response = await fetch(`/api/professional-exploration?${queryParams}`)
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error loading exploration matches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [filters])

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query }))
  }

  const handleQuickFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <ExplorationSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header Professional */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b pb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Exploración Profesional
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Descubre oportunidades estratégicas basadas en análisis de compatibilidad
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-green-200 text-green-700">
              <Zap className="w-3 h-3 mr-1" />
              {matches.length} matches encontrados
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Búsqueda Avanzada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar proyectos, founders, oportunidades..."
                    value={filters.query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 md:col-span-4 gap-3">
                <select
                  value={filters.type}
                  onChange={(e) => handleQuickFilter('type', e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="project">Proyectos</option>
                  <option value="founder">Founders</option>
                  <option value="opportunity">Oportunidades</option>
                </select>

                <select
                  value={filters.industry}
                  onChange={(e) => handleQuickFilter('industry', e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todas las industrias</option>
                  <option value="tech">Tecnología</option>
                  <option value="fintech">Fintech</option>
                  <option value="health">Salud</option>
                  <option value="ecommerce">E-commerce</option>
                </select>

                <select
                  value={filters.stage}
                  onChange={(e) => handleQuickFilter('stage', e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todas las etapas</option>
                  <option value="idea">Idea</option>
                  <option value="mvp">MVP</option>
                  <option value="growth">Crecimiento</option>
                  <option value="scale">Escalamiento</option>
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => handleQuickFilter('sortBy', e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="match_score">Compatibilidad</option>
                  <option value="activity">Actividad reciente</option>
                  <option value="trending">Tendencia</option>
                </select>
              </div>
            </div>

            {/* Filtro de Score Mínimo */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Score mínimo de compatibilidad: {filters.matchScore}%
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, matchScore: 0 }))}
                >
                  Reset
                </Button>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.matchScore}
                onChange={(e) => setFilters(prev => ({ ...prev, matchScore: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resultados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {matches.length === 0 ? (
          <EmptyExplorationState filters={filters} />
        ) : (
          matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ExplorationMatchCard match={match} />
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}

function ExplorationMatchCard({ match }: { match: ExplorationMatch }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <Briefcase className="w-4 h-4" />
      case 'founder': return <Users className="w-4 h-4" />
      case 'opportunity': return <Target className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'founder': return 'bg-green-100 text-green-700 border-green-200'
      case 'opportunity': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Badge className={`${getTypeColor(match.type)} border`}>
                    {getTypeIcon(match.type)}
                    <span className="ml-1 capitalize">{match.type}</span>
                  </Badge>
                  {match.verified && (
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      <Award className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                  {match.premium && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {match.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {match.subtitle}
                </p>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                  {match.description}
                </p>
              </div>

              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-blue-600">
                  {match.matchScore}%
                </div>
                <div className="text-xs text-gray-500">Compatibilidad</div>
              </div>
            </div>

            {/* Métricas de Compatibilidad */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Skills</span>
                  <span className="font-medium">{match.compatibility.skills}%</span>
                </div>
                <Progress value={match.compatibility.skills} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Industria</span>
                  <span className="font-medium">{match.compatibility.industry}%</span>
                </div>
                <Progress value={match.compatibility.industry} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Etapa</span>
                  <span className="font-medium">{match.compatibility.stage}%</span>
                </div>
                <Progress value={match.compatibility.stage} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Ubicación</span>
                  <span className="font-medium">{match.compatibility.location}%</span>
                </div>
                <Progress value={match.compatibility.location} className="h-2" />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {match.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {match.tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{match.tags.length - 5} más
                </Badge>
              )}
            </div>

            {/* Información Adicional */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {match.location}
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {match.metrics.views} visualizaciones
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {match.metrics.connections} conexiones
              </div>
              <div className="text-xs">
                Activo {match.lastActive}
              </div>
            </div>
          </div>

          {/* Panel de Métricas */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Métricas de Rendimiento
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Visualizaciones</span>
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="font-medium">{match.metrics.views}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Intereses</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="font-medium">{match.metrics.interests}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conexiones</span>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="font-medium">{match.metrics.connections}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Profesionales */}
            <div className="space-y-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Eye className="w-4 h-4 mr-2" />
                Ver Perfil Completo
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <BookmarkPlus className="w-4 h-4 mr-1" />
                  Guardar
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Contactar
                </Button>
              </div>
              <Button variant="outline" className="w-full" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Programar Reunión
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyExplorationState({ filters }: { filters: ExploreFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No se encontraron resultados
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Intenta ajustar tus filtros de búsqueda para encontrar más oportunidades
      </p>
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reiniciar filtros
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Filter className="w-4 h-4 mr-2" />
          Explorar sugerencias
        </Button>
      </div>
    </motion.div>
  )
}

function ExplorationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg mb-4"></div>
        ))}
      </div>
    </div>
  )
}
