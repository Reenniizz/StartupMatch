'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, Users, MessageSquare, Calendar, Target, 
  Network, Handshake, Star, Award, BarChart3, PieChart,
  Activity, Clock, CheckCircle, ArrowUpRight, ArrowDownRight,
  Globe, Building, Zap, Eye, UserPlus, MessageCircle, Briefcase
} from 'lucide-react'
import { motion } from 'framer-motion'

interface NetworkingMetrics {
  total_connections: number
  active_conversations: number
  matches_this_month: number
  profile_views: number
  connection_acceptance_rate: number
  response_rate: number
  networking_score: number
  industry_ranking: number
  weekly_growth: number
  monthly_growth: number
}

interface ConnectionActivity {
  date: string
  new_connections: number
  messages_sent: number
  meetings_scheduled: number
  profile_views: number
}

interface IndustryInsights {
  top_industries: Array<{
    name: string
    connections: number
    growth_rate: number
  }>
  top_roles: Array<{
    name: string
    connections: number
    avg_compatibility: number
  }>
  geographic_distribution: Array<{
    location: string
    connections: number
    percentage: number
  }>
}

interface RecommendedActions {
  id: string
  type: 'profile_optimization' | 'networking_opportunity' | 'follow_up' | 'industry_trend'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  potential_impact: string
}

export default function NetworkingAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<NetworkingMetrics | null>(null)
  const [activity, setActivity] = useState<ConnectionActivity[]>([])
  const [insights, setInsights] = useState<IndustryInsights | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedActions[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar métricas principales
      const metricsResponse = await fetch(`/api/networking-metrics?range=${timeRange}`)
      const metricsData = await metricsResponse.json()
      if (metricsResponse.ok) {
        setMetrics(metricsData.metrics)
      }

      // Cargar actividad histórica
      const activityResponse = await fetch(`/api/networking-activity?range=${timeRange}`)
      const activityData = await activityResponse.json()
      if (activityResponse.ok) {
        setActivity(activityData.activity || [])
      }

      // Cargar insights de industria
      const insightsResponse = await fetch('/api/networking-insights')
      const insightsData = await insightsResponse.json()
      if (insightsResponse.ok) {
        setInsights(insightsData.insights)
      }

      // Cargar recomendaciones
      const recommendationsResponse = await fetch('/api/networking-recommendations')
      const recommendationsData = await recommendationsResponse.json()
      if (recommendationsResponse.ok) {
        setRecommendations(recommendationsData.recommendations || [])
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics de Networking</h1>
          <p className="text-gray-600">Insights profesionales y métricas de conexión</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
            size="sm"
          >
            7 días
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
            size="sm"
          >
            30 días
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('90d')}
            size="sm"
          >
            90 días
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Conexiones Totales"
          value={metrics?.total_connections || 0}
          change={metrics?.weekly_growth || 0}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        
        <MetricCard
          title="Score de Networking"
          value={metrics?.networking_score || 0}
          suffix="/100"
          change={5.2}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        
        <MetricCard
          title="Tasa de Respuesta"
          value={metrics?.response_rate || 0}
          suffix="%"
          change={metrics?.monthly_growth || 0}
          icon={<MessageSquare className="w-5 h-5" />}
          color="purple"
        />
        
        <MetricCard
          title="Ranking en Industria"
          value={metrics?.industry_ranking || 0}
          prefix="#"
          change={-2}
          icon={<Award className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Contenido principal en tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progreso de objetivos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Objetivos del Mes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Nuevas Conexiones</span>
                    <span>{metrics?.matches_this_month || 0}/50</span>
                  </div>
                  <Progress value={((metrics?.matches_this_month || 0) / 50) * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Conversaciones Activas</span>
                    <span>{metrics?.active_conversations || 0}/25</span>
                  </div>
                  <Progress value={((metrics?.active_conversations || 0) / 25) * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tasa de Aceptación</span>
                    <span>{metrics?.connection_acceptance_rate || 0}%/80%</span>
                  </div>
                  <Progress value={metrics?.connection_acceptance_rate || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Métricas de rendimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Rendimiento Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Visualizaciones de perfil</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{metrics?.profile_views || 0}</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <ArrowUpRight className="w-3 h-3" />
                        +12% vs semana anterior
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Solicitudes enviadas</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">23</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <ArrowUpRight className="w-3 h-3" />
                        +8% vs semana anterior
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Mensajes intercambiados</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">147</div>
                      <div className="text-xs text-red-600 flex items-center">
                        <ArrowDownRight className="w-3 h-3" />
                        -3% vs semana anterior
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad reciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: 'connection', text: 'Nueva conexión con María González (CTO en TechStart)', time: '2 horas', icon: <UserPlus className="w-4 h-4 text-green-600" /> },
                  { type: 'message', text: 'Mensaje intercambiado con Carlos López sobre colaboración', time: '4 horas', icon: <MessageCircle className="w-4 h-4 text-blue-600" /> },
                  { type: 'meeting', text: 'Reunión programada con Ana Martín para mañana', time: '1 día', icon: <Calendar className="w-4 h-4 text-purple-600" /> },
                  { type: 'view', text: 'Tu perfil fue visto por 12 profesionales', time: '1 día', icon: <Eye className="w-4 h-4 text-orange-600" /> },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {activity.icon}
                    <span className="flex-1 text-sm">{activity.text}</span>
                    <span className="text-xs text-gray-500">hace {activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityCharts activity={activity} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <IndustryInsightsPanel insights={insights} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RecommendationsPanel recommendations={recommendations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente de métrica individual
function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  prefix = '', 
  suffix = '' 
}: {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  prefix?: string
  suffix?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className={`flex items-center text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-2xl font-bold">
            {prefix}{value.toLocaleString()}{suffix}
          </div>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Otros componentes auxiliares...
function ActivityCharts({ activity }: { activity: ConnectionActivity[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Actividad de Conexiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Gráfico de actividad (implementar con recharts)
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Engagement Diario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Gráfico de engagement (implementar con recharts)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IndustryInsightsPanel({ insights }: { insights: IndustryInsights | null }) {
  if (!insights) return <div>Cargando insights...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Top Industrias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.top_industries.map((industry, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{industry.name}</span>
              <div className="text-right">
                <div className="text-sm font-semibold">{industry.connections}</div>
                <div className="text-xs text-green-600">+{industry.growth_rate}%</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Roles Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.top_roles.map((role, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{role.name}</span>
              <div className="text-right">
                <div className="text-sm font-semibold">{role.connections}</div>
                <div className="text-xs text-blue-600">{role.avg_compatibility}% avg</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Distribución Geográfica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.geographic_distribution.map((location, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{location.location}</span>
                <span>{location.percentage}%</span>
              </div>
              <Progress value={location.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function RecommendationsPanel({ recommendations }: { recommendations: RecommendedActions[] }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                    <h3 className="font-semibold">{rec.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{rec.description}</p>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Zap className="w-4 h-4" />
                    <span>Impacto potencial: {rec.potential_impact}</span>
                  </div>
                </div>
                <Button size="sm">Aplicar</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-48"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-300 rounded-lg animate-pulse"></div>
        ))}
      </div>
      
      <div className="h-96 bg-gray-300 rounded-lg animate-pulse"></div>
    </div>
  )
}
