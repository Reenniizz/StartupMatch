'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Rocket, Users, Calendar, DollarSign, Target, MessageSquare,
  Plus, Filter, Search, Clock, Star, Award, Handshake,
  FileText, Send, Eye, CheckCircle, XCircle, AlertCircle,
  Building, Globe, Zap, TrendingUp, BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CollaborationOpportunity {
  id: string
  title: string
  description: string
  type: 'partnership' | 'project' | 'investment' | 'mentorship' | 'advisory'
  industry: string
  budget_range: string
  duration: string
  status: 'open' | 'in_review' | 'active' | 'completed' | 'cancelled'
  required_skills: string[]
  creator: {
    id: string
    name: string
    company: string
    role: string
    avatar_url?: string
  }
  applicants_count: number
  deadline: string
  created_at: string
  priority: 'high' | 'medium' | 'low'
  compatibility_score?: number
}

interface Proposal {
  id: string
  opportunity_id: string
  title: string
  description: string
  budget: string
  timeline: string
  deliverables: string[]
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  submitted_at: string
}

// Helper functions
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'partnership': return <Handshake className="w-4 h-4" />
    case 'project': return <Rocket className="w-4 h-4" />
    case 'investment': return <DollarSign className="w-4 h-4" />
    case 'mentorship': return <Star className="w-4 h-4" />
    case 'advisory': return <Award className="w-4 h-4" />
    default: return <Target className="w-4 h-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-green-100 text-green-800'
    case 'in_review': return 'bg-yellow-100 text-yellow-800'
    case 'active': return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return <AlertCircle className="w-4 h-4 text-red-600" />
    case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />
    case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />
    default: return null
  }
}

export default function ProfessionalCollaborationHub() {
  const [opportunities, setOpportunities] = useState<CollaborationOpportunity[]>([])
  const [myProposals, setMyProposals] = useState<Proposal[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<CollaborationOpportunity | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'browse' | 'my_proposals' | 'my_opportunities'>('browse')
  const [filters, setFilters] = useState({
    type: 'all',
    industry: 'all',
    budget: 'all',
    status: 'open'
  })

  const loadOpportunities = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const response = await fetch(`/api/collaboration-opportunities?${queryParams}`)
      const data = await response.json()
      
      if (response.ok) {
        setOpportunities(data.opportunities || [])
      }
    } catch (error) {
      console.error('Error loading opportunities:', error)
    }
  }

  const loadMyProposals = async () => {
    try {
      const response = await fetch('/api/my-proposals')
      const data = await response.json()
      
      if (response.ok) {
        setMyProposals(data.proposals || [])
      }
    } catch (error) {
      console.error('Error loading proposals:', error)
    }
  }

  useEffect(() => {
    loadOpportunities()
    loadMyProposals()
  }, [filters])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Colaboración</h1>
          <p className="text-gray-600">Oportunidades profesionales y proyectos colaborativos</p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Oportunidad
        </Button>
      </div>

      {/* Filtros rápidos */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de oportunidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="project">Proyecto</SelectItem>
                <SelectItem value="investment">Inversión</SelectItem>
                <SelectItem value="mentorship">Mentoría</SelectItem>
                <SelectItem value="advisory">Asesoría</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.industry} onValueChange={(value) => setFilters(prev => ({...prev, industry: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Industria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las industrias</SelectItem>
                <SelectItem value="tech">Tecnología</SelectItem>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="health">Salud</SelectItem>
                <SelectItem value="education">Educación</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.budget} onValueChange={(value) => setFilters(prev => ({...prev, budget: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Rango de presupuesto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquier presupuesto</SelectItem>
                <SelectItem value="0-5k">€0 - €5,000</SelectItem>
                <SelectItem value="5k-25k">€5,000 - €25,000</SelectItem>
                <SelectItem value="25k-100k">€25,000 - €100,000</SelectItem>
                <SelectItem value="100k+">€100,000+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Abiertas</SelectItem>
                <SelectItem value="in_review">En revisión</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeTab === 'browse' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('browse')}
          size="sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Explorar ({opportunities.length})
        </Button>
        <Button
          variant={activeTab === 'my_proposals' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('my_proposals')}
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Mis Propuestas ({myProposals.length})
        </Button>
        <Button
          variant={activeTab === 'my_opportunities' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('my_opportunities')}
          size="sm"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Mis Oportunidades
        </Button>
      </div>

      {/* Contenido según tab activo */}
      <AnimatePresence mode="wait">
        {activeTab === 'browse' && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {opportunities.map((opportunity, index) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onViewDetails={setSelectedOpportunity}
                onApply={() => {
                  setSelectedOpportunity(opportunity)
                  setShowProposalModal(true)
                }}
                delay={index * 0.1}
              />
            ))}
            
            {opportunities.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron oportunidades
                  </h3>
                  <p className="text-gray-600">
                    Ajusta los filtros o crea una nueva oportunidad
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'my_proposals' && (
          <motion.div
            key="proposals"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <ProposalsGrid proposals={myProposals} />
          </motion.div>
        )}

        {activeTab === 'my_opportunities' && (
          <motion.div
            key="my_opportunities"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <MyOpportunitiesManager />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales */}
      {showCreateModal && (
        <CreateOpportunityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadOpportunities()
          }}
        />
      )}

      {showProposalModal && selectedOpportunity && (
        <CreateProposalModal
          opportunity={selectedOpportunity}
          onClose={() => {
            setShowProposalModal(false)
            setSelectedOpportunity(null)
          }}
          onSuccess={() => {
            setShowProposalModal(false)
            setSelectedOpportunity(null)
            loadMyProposals()
          }}
        />
      )}

      {selectedOpportunity && !showProposalModal && (
        <OpportunityDetailsModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onApply={() => setShowProposalModal(true)}
        />
      )}
    </div>
  )
}

// Componente de tarjeta de oportunidad
function OpportunityCard({ 
  opportunity, 
  onViewDetails, 
  onApply, 
  delay 
}: {
  opportunity: CollaborationOpportunity
  onViewDetails: (opp: CollaborationOpportunity) => void
  onApply: () => void
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(opportunity.type)}
                  <Badge variant="outline" className="text-xs">
                    {opportunity.type}
                  </Badge>
                </div>
                
                <Badge className={getStatusColor(opportunity.status)}>
                  {opportunity.status}
                </Badge>
                
                {getPriorityIcon(opportunity.priority)}
                
                {opportunity.compatibility_score && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {opportunity.compatibility_score}% match
                  </Badge>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {opportunity.title}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-2">
                {opportunity.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Presupuesto</div>
                  <div className="font-medium">{opportunity.budget_range}</div>
                </div>
                <div>
                  <div className="text-gray-500">Duración</div>
                  <div className="font-medium">{opportunity.duration}</div>
                </div>
                <div>
                  <div className="text-gray-500">Aplicantes</div>
                  <div className="font-medium">{opportunity.applicants_count}</div>
                </div>
                <div>
                  <div className="text-gray-500">Deadline</div>
                  <div className="font-medium">
                    {new Date(opportunity.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {opportunity.creator.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium">{opportunity.creator.name}</div>
                <div className="text-xs text-gray-500">
                  {opportunity.creator.role} en {opportunity.creator.company}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(opportunity)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver detalles
              </Button>
              <Button
                size="sm"
                onClick={onApply}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-1" />
                Aplicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Componentes auxiliares simplificados
function ProposalsGrid({ proposals }: { proposals: Proposal[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proposals.map((proposal, index) => (
        <motion.div
          key={proposal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{proposal.title}</h3>
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {proposal.description}
                </p>
                <div className="text-sm">
                  <div className="text-gray-500">Presupuesto: {proposal.budget}</div>
                  <div className="text-gray-500">Timeline: {proposal.timeline}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function MyOpportunitiesManager() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Rocket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Gestiona tus oportunidades
        </h3>
        <p className="text-gray-600 mb-4">
          Aquí podrás ver y gestionar las oportunidades que has creado
        </p>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Crear primera oportunidad
        </Button>
      </CardContent>
    </Card>
  )
}

// Modales simplificados (implementación completa requeriría más espacio)
function CreateOpportunityModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Crear Nueva Oportunidad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Modal para crear oportunidad (implementación completa)
          </p>
          <div className="flex gap-2">
            <Button onClick={onSuccess}>Crear</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CreateProposalModal({ 
  opportunity, 
  onClose, 
  onSuccess 
}: { 
  opportunity: CollaborationOpportunity
  onClose: () => void
  onSuccess: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Crear Propuesta para: {opportunity.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Modal para crear propuesta (implementación completa)
          </p>
          <div className="flex gap-2">
            <Button onClick={onSuccess}>Enviar Propuesta</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function OpportunityDetailsModal({ 
  opportunity, 
  onClose, 
  onApply 
}: { 
  opportunity: CollaborationOpportunity
  onClose: () => void
  onApply: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{opportunity.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Vista detallada de la oportunidad (implementación completa)
          </p>
          <div className="flex gap-2">
            <Button onClick={onApply}>Aplicar</Button>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
