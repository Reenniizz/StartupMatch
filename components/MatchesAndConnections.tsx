'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Clock, Check, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Match {
  id: string
  matchedAt: string
  compatibilityScore: number
  otherUser: {
    id: string
    name: string
    avatar: string
    role: string
    company: string
  }
}

interface Connection {
  connection_id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar: string
  other_user_role: string
  other_user_company: string
  connection_status: 'pending' | 'accepted'
  connected_at: string
  is_requester: boolean
}

export default function MatchesAndConnections() {
  const [matches, setMatches] = useState<Match[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeTab, setActiveTab] = useState<'matches' | 'connections'>('matches')
  const [loading, setLoading] = useState(true)

  // Cargar matches
  const loadMatches = async () => {
    try {
      const response = await fetch('/api/matching/matches')
      const data = await response.json()
      
      if (response.ok) {
        setMatches(data.matches || [])
      } else {
        toast({
          title: "Error",
          description: "Error al cargar matches",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  // Cargar conexiones
  const loadConnections = async () => {
    try {
      const response = await fetch('/api/connections')
      const data = await response.json()
      
      if (response.ok) {
        setConnections(data.connections || [])
      } else {
        toast({
          title: "Error",
          description: "Error al cargar conexiones",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }

  // Enviar solicitud de conexión
  const sendConnectionRequest = async (userId: string) => {
    console.log('🚀 Enviando solicitud de conexión a usuario:', userId);
    
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresseeId: userId,
          message: '¡Hola! Me gustaría conectar contigo.'
        })
      })

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      const data = await response.json()
      console.log('📦 Datos recibidos:', data);

      if (response.ok) {
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de conexión ha sido enviada",
          variant: "default"
        })
        loadConnections()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al enviar solicitud",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending connection:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      })
    }
  }

  // Responder a solicitud de conexión
  const respondToConnection = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (response.ok) {
        const message = status === 'accepted' ? 
          'Conexión aceptada. ¡Ya puedes comenzar a conversar!' : 
          'Solicitud rechazada'
        
        toast({
          title: status === 'accepted' ? "¡Conectado!" : "Solicitud rechazada",
          description: message,
          variant: "default"
        })
        loadConnections()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al responder",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error responding to connection:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadMatches(), loadConnections()])
      setLoading(false)
    }
    
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const pendingConnections = connections.filter(c => c.connection_status === 'pending' && !c.is_requester)
  const acceptedConnections = connections.filter(c => c.connection_status === 'accepted')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'matches' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'connections' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Conexiones ({acceptedConnections.length})
        </button>
      </div>

      {/* Notificaciones de solicitudes pendientes */}
      {pendingConnections.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">
              Solicitudes pendientes ({pendingConnections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConnections.map(connection => (
                <div key={connection.connection_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={connection.other_user_avatar} />
                      <AvatarFallback>
                        {connection.other_user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{connection.other_user_name}</p>
                      <p className="text-sm text-gray-600">{connection.other_user_role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToConnection(connection.connection_id, 'rejected')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => respondToConnection(connection.connection_id, 'accepted')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenido de tabs */}
      {activeTab === 'matches' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">💔</div>
              <h3 className="text-xl font-semibold mb-2">No tienes matches aún</h3>
              <p className="text-gray-600">¡Sigue explorando usuarios para encontrar tu primer match!</p>
            </div>
          ) : (
            matches.map(match => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={match.otherUser.avatar} />
                      <AvatarFallback>
                        {match.otherUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{match.otherUser.name}</h3>
                      <p className="text-sm text-gray-600">{match.otherUser.role}</p>
                      {match.otherUser.company && (
                        <p className="text-sm text-gray-500">{match.otherUser.company}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {match.compatibilityScore}%
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => sendConnectionRequest(match.otherUser.id)}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Match desde {new Date(match.matchedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {acceptedConnections.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2">No tienes conexiones aún</h3>
              <p className="text-gray-600">Conecta con tus matches para empezar a conversar</p>
            </div>
          ) : (
            acceptedConnections.map(connection => (
              <Card key={connection.connection_id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={connection.other_user_avatar} />
                      <AvatarFallback>
                        {connection.other_user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{connection.other_user_name}</h3>
                      <p className="text-sm text-gray-600">{connection.other_user_role}</p>
                      {connection.other_user_company && (
                        <p className="text-sm text-gray-500">{connection.other_user_company}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => window.location.href = '/messages'}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar mensaje
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Conectado desde {new Date(connection.connected_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
