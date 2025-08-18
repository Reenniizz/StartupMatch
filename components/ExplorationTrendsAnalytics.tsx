'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Users,
  Building2,
  MapPin,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TrendData {
  id: string
  name: string
  category: string
  growth: number
  volume: number
  prediction: 'rising' | 'stable' | 'declining'
  timeframe: string
  description: string
  relatedOpportunities: number
}

interface MarketInsight {
  id: string
  title: string
  type: 'opportunity' | 'threat' | 'trend'
  impact: 'high' | 'medium' | 'low'
  description: string
  actionItems: string[]
  timeline: string
}

export default function ExplorationTrendsAnalytics() {
  const [trends, setTrends] = useState<TrendData[]>([])
  const [insights, setInsights] = useState<MarketInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const loadTrendsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exploration-trends')
      const data = await response.json()
      setTrends(data.trends || [])
      setInsights(data.insights || [])
    } catch (error) {
      console.error('Error loading trends data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrendsData()
  }, [])

  const filteredTrends = selectedCategory === 'all' 
    ? trends 
    : trends.filter(trend => trend.category === selectedCategory)

  if (loading) {
    return <TrendsAnalyticsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b pb-4"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Análisis de Tendencias del Mercado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Insights estratégicos para optimizar tu exploración profesional
        </p>
      </motion.div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Predicciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {/* Filtros de Categoría */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Filtrar por categoría
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Todas
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['technology', 'fintech', 'health', 'sustainability', 'ai'].map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista de Tendencias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrends.map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TrendCard trend={trend} />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <InsightCard insight={insight} />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictionsView trends={trends} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TrendCard({ trend }: { trend: TrendData }) {
  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'rising': return <ArrowUpRight className="w-4 h-4 text-green-500" />
      case 'declining': return <ArrowDownRight className="w-4 h-4 text-red-500" />
      default: return <TrendingUp className="w-4 h-4 text-blue-500" />
    }
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'rising': return 'bg-green-100 text-green-800 border-green-200'
      case 'declining': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {trend.name}
            </h3>
            <Badge variant="outline" className="text-xs capitalize mb-2">
              {trend.category}
            </Badge>
          </div>
          <div className="text-right">
            <div className="flex items-center text-lg font-bold text-gray-900 dark:text-gray-100">
              {trend.growth > 0 ? '+' : ''}{trend.growth}%
              {getPredictionIcon(trend.prediction)}
            </div>
            <div className="text-xs text-gray-500">{trend.timeframe}</div>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {trend.description}
        </p>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs">
            <span>Volumen de actividad</span>
            <span className="font-medium">{trend.volume}/100</span>
          </div>
          <Progress value={trend.volume} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <Badge className={`${getPredictionColor(trend.prediction)} border text-xs`}>
            {trend.prediction === 'rising' ? 'En crecimiento' : 
             trend.prediction === 'declining' ? 'En declive' : 'Estable'}
          </Badge>
          <div className="flex items-center text-xs text-gray-500">
            <Target className="w-3 h-3 mr-1" />
            {trend.relatedOpportunities} oportunidades
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InsightCard({ insight }: { insight: MarketInsight }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Zap className="w-5 h-5 text-green-500" />
      case 'threat': return <Target className="w-5 h-5 text-red-500" />
      default: return <TrendingUp className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      case 'threat': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  return (
    <Card className={`border-l-4 ${getTypeColor(insight.type)} hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getTypeIcon(insight.type)}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {insight.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${getImpactColor(insight.impact)} border text-xs`}>
                  Impacto {insight.impact}
                </Badge>
                <span className="text-xs text-gray-500">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {insight.timeline}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {insight.description}
        </p>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            Acciones recomendadas:
          </h4>
          <ul className="space-y-1">
            {insight.actionItems.map((action, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function PredictionsView({ trends }: { trends: TrendData[] }) {
  const risingTrends = trends.filter(t => t.prediction === 'rising').slice(0, 5)
  const decliningTrends = trends.filter(t => t.prediction === 'declining').slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <ArrowUpRight className="w-5 h-5 mr-2" />
            Tendencias en Crecimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {risingTrends.map((trend) => (
            <div key={trend.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {trend.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {trend.category}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">+{trend.growth}%</div>
                <div className="text-xs text-gray-500">{trend.timeframe}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <ArrowDownRight className="w-5 h-5 mr-2" />
            Tendencias en Declive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {decliningTrends.map((trend) => (
            <div key={trend.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {trend.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {trend.category}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600">{trend.growth}%</div>
                <div className="text-xs text-gray-500">{trend.timeframe}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TrendsAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-12 bg-gray-200 rounded-lg mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
