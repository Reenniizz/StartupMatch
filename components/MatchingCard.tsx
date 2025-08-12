'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, X, Zap, MapPin, Building, Calendar } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface MatchUser {
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
  estimated_compatibility: number
}

export default function MatchingCard() {
  const [currentUser, setCurrentUser] = useState<MatchUser | null>(null)
  const [potentialMatches, setPotentialMatches] = useState<MatchUser[]>([])
  const [loading, setLoading] = useState(true)
  const [interacting, setInteracting] = useState(false)

  // Cargar usuarios potenciales
  const loadPotentialMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/matching?limit=20&min_compatibility=60')
      const data = await response.json()
      
      if (response.ok) {
        setPotentialMatches(data.matches || [])
        setCurrentUser(data.matches?.[0] || null)
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar matches",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading matches:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar interacción (like/pass)
  const handleInteraction = async (type: 'like' | 'pass' | 'super_like') => {
    if (!currentUser || interacting) return

    try {
      setInteracting(true)
      const response = await fetch('/api/matching/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentUser.user_id,
          interactionType: type
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Mostrar notificación si hubo match
        if (data.mutualMatch) {
          toast({
            title: "¡Es un Match! 🎉",
            description: `Has hecho match con ${currentUser.first_name}`,
            variant: "default"
          })
        }

        // Pasar al siguiente usuario
        const remainingMatches = potentialMatches.filter(u => u.user_id !== currentUser.user_id)
        setPotentialMatches(remainingMatches)
        setCurrentUser(remainingMatches[0] || null)

        // Si se acaban los usuarios, cargar más
        if (remainingMatches.length < 3) {
          loadPotentialMatches()
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al procesar interacción",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error processing interaction:', error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      })
    } finally {
      setInteracting(false)
    }
  }

  useEffect(() => {
    loadPotentialMatches()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold mb-2">¡No hay más usuarios!</h3>
          <p className="text-gray-600 mb-4">
            Has visto todos los usuarios disponibles por ahora.
          </p>
          <Button onClick={loadPotentialMatches}>
            Buscar nuevamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="p-0">
          <div className="relative h-80 bg-gradient-to-b from-blue-500 to-purple-600">
            {currentUser.avatar_url && (
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.first_name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-white/90 text-black">
                {currentUser.estimated_compatibility}% Compatible
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-4">
            <CardTitle className="text-2xl font-bold mb-1">
              {currentUser.first_name} {currentUser.last_name}
            </CardTitle>
            <p className="text-gray-600 text-lg">{currentUser.role}</p>
          </div>

          <div className="space-y-3 mb-6">
            {currentUser.company && (
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="h-4 w-4" />
                <span>{currentUser.company}</span>
              </div>
            )}
            
            {currentUser.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{currentUser.location}</span>
              </div>
            )}
            
            {currentUser.experience_years && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{currentUser.experience_years} años de experiencia</span>
              </div>
            )}
          </div>

          {currentUser.bio && (
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {currentUser.bio}
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleInteraction('pass')}
              disabled={interacting}
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0 border-red-200 hover:bg-red-50"
            >
              <X className="h-6 w-6 text-red-500" />
            </Button>

            <Button
              onClick={() => handleInteraction('super_like')}
              disabled={interacting}
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0 border-yellow-200 hover:bg-yellow-50"
            >
              <Zap className="h-6 w-6 text-yellow-500" />
            </Button>

            <Button
              onClick={() => handleInteraction('like')}
              disabled={interacting}
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 p-0 border-green-200 hover:bg-green-50"
            >
              <Heart className="h-6 w-6 text-green-500" />
            </Button>
          </div>

          <div className="text-center mt-4 text-sm text-gray-500">
            {potentialMatches.length - 1} usuarios más disponibles
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
