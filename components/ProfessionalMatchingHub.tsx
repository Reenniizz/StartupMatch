'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, Users, Target, MessageSquare, Calendar, MapPin, 
  Building, Briefcase, Award, CheckCircle, XCircle, Clock,
  BarChart3, Network, Handshake, Star, Eye, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProfessionalMatch {
  user_id: string
  username: string
  first_name: string
  last_name: string
  bio: string
  role: string
  company: string
  industry: string
  location: string
  experience_years: number
  avatar_url: string
  compatibility_score: number
  mutual_connections: number
  shared_interests: string[]
  complementary_skills: string[]
  business_synergy: number
  networking_potential: number
  collaboration_score: number
}

interface AnalysisData {
  strength_areas: string[]
  collaboration_opportunities: string[]
  business_potential: string
  recommended_action: string
}

export default function ProfessionalMatchingHub() {
  const [matches, setMatches] = useState<ProfessionalMatch[]>([])
  const [currentMatch, setCurrentMatch] = useState<ProfessionalMatch | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<'analysis' | 'list'>('analysis')

  const loadProfessionalMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/professional-matching?limit=10&min_score=70')
      const data = await response.json()
      
      if (response.ok) {
        setMatches(data.matches || [])
        setCurrentMatch(data.matches?.[0] || null)
        if (data.matches?.[0]) {
          await loadMatchAnalysis(data.matches[0].user_id)
        }
      }
    } catch (error) {
      console.error('Error loading professional matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMatchAnalysis = async (userId: string) => {
    try {
      const response = await fetch(`/api/match-analysis/${userId}`)
      const data = await response.json()
      if (response.ok) {
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Error loading analysis:', error)
    }
  }

  const handleProfessionalAction = async (action: 'connect' | 'schedule_meeting' | 'save_for_later' | 'not_interested') => {
    if (!currentMatch) return

    try {
      const response = await fetch('/api/professional-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentMatch.user_id,
          action: action,
          context: 'professional_matching'
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Mostrar siguiente match
        const remainingMatches = matches.filter(m => m.user_id !== currentMatch.user_id)
        setMatches(remainingMatches)
        const nextMatch = remainingMatches[0] || null
        setCurrentMatch(nextMatch)
        
        if (nextMatch) {
          await loadMatchAnalysis(nextMatch.user_id)
        }

        // Notificación profesional
        if (action === 'connect') {
          // Toast profesional
        }
      }
    } catch (error) {
      console.error('Error processing professional action:', error)
    }
  }

  useEffect(() => {
    loadProfessionalMatches()
  }, [])

  if (loading) {
    return <LoadingAnalytics />
  }

  if (!currentMatch) {
    return <NoMoreMatches onRefresh={loadProfessionalMatches} />
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análisis Profesional</h1>
          <p className="text-gray-600">Evaluación detallada de compatibilidad empresarial</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'analysis' ? 'default' : 'outline'}
            onClick={() => setViewMode('analysis')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Análisis
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            <Users className="w-4 h-4 mr-2" />
            Lista
          </Button>
        </div>
      </div>

      {viewMode === 'analysis' ? (
        <AnalysisView 
          match={currentMatch} 
          analysis={analysis}
          onAction={handleProfessionalAction}
        />
      ) : (
        <ListView 
          matches={matches}
          onSelectMatch={(match) => {
            setCurrentMatch(match)
            loadMatchAnalysis(match.user_id)
            setViewMode('analysis')
          }}
        />
      )}
    </div>
  )
}

// Componente de vista de análisis profesional
function AnalysisView({ 
  match, 
  analysis, 
  onAction 
}: { 
  match: ProfessionalMatch
  analysis: AnalysisData | null
  onAction: (action: 'connect' | 'schedule_meeting' | 'save_for_later' | 'not_interested') => void 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel principal de información */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tarjeta de perfil profesional */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {match.first_name.charAt(0)}{match.last_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {match.first_name} {match.last_name}
                  </CardTitle>
                  <p className="text-gray-600 font-medium">{match.role}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {match.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {match.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {match.experience_years} años
                    </div>
                  </div>
                </div>
              </div>
              
              <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                {match.compatibility_score}% Compatible
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-gray-700 leading-relaxed mb-4">{match.bio}</p>
            
            {/* Métricas clave */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Network className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <div className="font-semibold text-blue-900">{match.mutual_connections}</div>
                <div className="text-xs text-blue-600">Conexiones Mutuas</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Handshake className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <div className="font-semibold text-purple-900">{match.business_synergy}%</div>
                <div className="text-xs text-purple-600">Sinergia Empresarial</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="font-semibold text-green-900">{match.networking_potential}%</div>
                <div className="text-xs text-green-600">Potencial Networking</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análisis detallado en tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análisis de Compatibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="synergies" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="synergies">Sinergias</TabsTrigger>
                <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
                <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="synergies" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Intereses Compartidos</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.shared_interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Habilidades Complementarias</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.complementary_skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="opportunities" className="space-y-3">
                {analysis?.collaboration_opportunities.map((opportunity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Target className="w-5 h-5 text-orange-600 mt-0.5" />
                    <span className="text-gray-700">{opportunity}</span>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="recommendations" className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Recomendación Principal</span>
                  </div>
                  <p className="text-blue-800">{analysis?.recommended_action}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Potencial de Negocio</span>
                  </div>
                  <p className="text-green-800">{analysis?.business_potential}</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Panel de acciones */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Profesionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => onAction('connect')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Handshake className="w-4 h-4 mr-2" />
              Solicitar Conexión
            </Button>
            
            <Button 
              onClick={() => onAction('schedule_meeting')}
              variant="outline"
              className="w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Reunión
            </Button>
            
            <Button 
              onClick={() => onAction('save_for_later')}
              variant="outline"
              className="w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              Guardar para Después
            </Button>
            
            <Button 
              onClick={() => onAction('not_interested')}
              variant="ghost"
              className="w-full text-gray-600"
            >
              <XCircle className="w-4 h-4 mr-2" />
              No Interesado
            </Button>
          </CardContent>
        </Card>

        {/* Panel de insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Score de Colaboración</span>
              <span className="font-semibold">{match.collaboration_score}%</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Industria</span>
              <span className="font-semibold">{match.industry}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Último activo</span>
              <span className="font-semibold text-green-600">Hoy</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Vista de lista profesional
function ListView({ 
  matches, 
  onSelectMatch 
}: { 
  matches: ProfessionalMatch[]
  onSelectMatch: (match: ProfessionalMatch) => void 
}) {
  return (
    <div className="space-y-4">
      {matches.map((match, index) => (
        <motion.div
          key={match.user_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {match.first_name.charAt(0)}{match.last_name.charAt(0)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">
                      {match.first_name} {match.last_name}
                    </h3>
                    <p className="text-gray-600">{match.role} en {match.company}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{match.location}</span>
                      <span>•</span>
                      <span>{match.mutual_connections} conexiones mutuas</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800 mb-2">
                      {match.compatibility_score}% Compatible
                    </Badge>
                    <div className="text-sm text-gray-500">
                      {match.business_synergy}% Sinergia
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onSelectMatch(match)}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Analizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// Componentes auxiliares
function LoadingAnalytics() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-300 rounded w-64"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-300 rounded-lg"></div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-300 rounded-lg"></div>
            <div className="h-32 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NoMoreMatches({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="text-center p-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Análisis Completado</h3>
        <p className="text-gray-600 mb-6">
          Has revisado todos los matches profesionales disponibles. 
          Nuestro algoritmo estará trabajando para encontrar nuevas oportunidades.
        </p>
        <Button onClick={onRefresh} className="bg-blue-600 hover:bg-blue-700">
          <ArrowRight className="w-4 h-4 mr-2" />
          Buscar Nuevos Matches
        </Button>
      </CardContent>
    </Card>
  )
}
