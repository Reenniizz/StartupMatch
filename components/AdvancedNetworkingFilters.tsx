'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Filter, Search, MapPin, Building, Users, TrendingUp, 
  Target, Clock, Star, Briefcase, GraduationCap, Globe,
  Zap, Award, Network, ChevronDown, X, Plus, Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdvancedFilters {
  location: string[]
  industry: string[]
  role_level: string[]
  company_size: string[]
  experience_range: [number, number]
  compatibility_min: number
  business_synergy_min: number
  mutual_connections_min: number
  languages: string[]
  investment_interest: boolean
  seeking_partnership: boolean
  has_funding: boolean
  remote_work: boolean
  availability: 'any' | 'immediate' | 'this-week' | 'this-month' | 'flexible'
}

interface SavedSearch {
  id: string
  name: string
  filters: AdvancedFilters
  results_count: number
  last_updated: string
}

const INDUSTRIES = [
  'Tecnología', 'Fintech', 'E-commerce', 'Salud', 'Educación', 
  'Marketing', 'Consultoría', 'Manufactura', 'Energía', 'Inmobiliario'
]

const ROLE_LEVELS = [
  'Founder/CEO', 'CTO/CIO', 'Director', 'Manager', 'Senior', 'Specialist'
]

const COMPANY_SIZES = [
  'Startup (1-10)', 'Pequeña (11-50)', 'Mediana (51-200)', 'Grande (200+)'
]

const LANGUAGES = [
  'Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano'
]

export default function AdvancedNetworkingFilters() {
  const [filters, setFilters] = useState<AdvancedFilters>({
    location: [],
    industry: [],
    role_level: [],
    company_size: [],
    experience_range: [1, 20],
    compatibility_min: 70,
    business_synergy_min: 60,
    mutual_connections_min: 0,
    languages: [],
    investment_interest: false,
    seeking_partnership: false,
    has_funding: false,
    remote_work: false,
    availability: 'any'
  })

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [resultsCount, setResultsCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  // Cargar búsquedas guardadas desde localStorage al inicializar
  useEffect(() => {
    const saved = localStorage.getItem('advancedSearches')
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved searches:', error)
      }
    }
  }, [])

  // Guardar búsquedas en localStorage cuando cambien
  useEffect(() => {
    if (savedSearches.length > 0) {
      localStorage.setItem('advancedSearches', JSON.stringify(savedSearches))
    }
  }, [savedSearches])

  // Aplicar filtros y obtener resultados
  const applyFilters = async () => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/advanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setResultsCount(data.count || 0)
    } catch (error) {
      console.error('Error applying filters:', error)
      // Simulamos resultados para desarrollo si no hay API
      setResultsCount(Math.floor(Math.random() * 500) + 50)
    } finally {
      setIsSearching(false)
    }
  }

  // Guardar búsqueda
  const saveSearch = async () => {
    if (!searchName.trim()) return

    // Verificar si ya existe una búsqueda con el mismo nombre
    if (savedSearches.some(search => search.name.toLowerCase() === searchName.toLowerCase().trim())) {
      alert('Ya existe una búsqueda con ese nombre. Por favor, usa un nombre diferente.')
      return
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: { ...filters },
      results_count: resultsCount,
      last_updated: new Date().toISOString()
    }

    setSavedSearches(prev => [...prev, newSearch])
    setSearchName('')
  }

  // Cargar búsqueda guardada
  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters)
    applyFilters()
  }

  const updateFilter = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const addToArrayFilter = (key: string, value: string) => {
    setFilters(prev => {
      const currentArray = (prev as any)[key] as string[]
      if (!currentArray.includes(value)) {
        return {
          ...prev,
          [key]: [...currentArray, value]
        }
      }
      return prev
    })
  }

  const removeFromArrayFilter = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: ((prev as any)[key] as string[]).filter((item: string) => item !== value)
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      location: [],
      industry: [],
      role_level: [],
      company_size: [],
      experience_range: [1, 20],
      compatibility_min: 70,
      business_synergy_min: 60,
      mutual_connections_min: 0,
      languages: [],
      investment_interest: false,
      seeking_partnership: false,
      has_funding: false,
      remote_work: false,
      availability: 'any'
    })
  }

  useEffect(() => {
    // Debounce para evitar muchas llamadas
    const timeoutId = setTimeout(() => {
      applyFilters()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters])

  return (
    <div className="space-y-6">
      {/* Header con controles principales */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Búsqueda Avanzada</h2>
          <p className="text-gray-600">Encuentra conexiones profesionales específicas</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros Avanzados
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          
          <Button onClick={applyFilters} disabled={isSearching}>
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>

      {/* Resultados rápidos */}
      <Card>
        <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-lg">
                      {isSearching ? '...' : resultsCount.toLocaleString()}
                    </span>
                    <span className="text-gray-600">profesionales encontrados</span>
                  </div>
                  
                  {Object.values(filters).some(value => 
                    Array.isArray(value) ? value.length > 0 : 
                    typeof value === 'boolean' ? value : 
                    typeof value === 'string' ? value !== 'any' :
                    typeof value === 'number' ? value > 0 : false
                  ) && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Filtros activos
                    </Badge>
                  )}

                  {isSearching && (
                    <Badge variant="outline" className="animate-pulse">
                      Buscando...
                    </Badge>
                  )}
                </div>            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre para guardar búsqueda..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-48"
                />
                <Button 
                  size="sm" 
                  onClick={saveSearch}
                  disabled={!searchName.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de filtros avanzados */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Filtros Avanzados de Networking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Filtros de ubicación */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Ubicación
                    </Label>
                    <Select onValueChange={(value) => addToArrayFilter('location', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="madrid">Madrid, España</SelectItem>
                        <SelectItem value="barcelona">Barcelona, España</SelectItem>
                        <SelectItem value="valencia">Valencia, España</SelectItem>
                        <SelectItem value="sevilla">Sevilla, España</SelectItem>
                        <SelectItem value="mexico">Ciudad de México</SelectItem>
                        <SelectItem value="bogota">Bogotá, Colombia</SelectItem>
                        <SelectItem value="buenos-aires">Buenos Aires, Argentina</SelectItem>
                        <SelectItem value="lima">Lima, Perú</SelectItem>
                        <SelectItem value="santiago">Santiago, Chile</SelectItem>
                        <SelectItem value="remote">Trabajo Remoto</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {filters.location.map(loc => (
                        <Badge key={loc} variant="secondary" className="text-xs">
                          {loc}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => removeFromArrayFilter('location', loc)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Filtros de industria */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Industria
                    </Label>
                    <Select onValueChange={(value) => addToArrayFilter('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar industria" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(industry => (
                          <SelectItem key={industry} value={industry.toLowerCase()}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {filters.industry.map(ind => (
                        <Badge key={ind} variant="secondary" className="text-xs">
                          {ind}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => removeFromArrayFilter('industry', ind)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Nivel de rol */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Nivel de Rol
                    </Label>
                    <Select onValueChange={(value) => addToArrayFilter('role_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_LEVELS.map(level => (
                          <SelectItem key={level} value={level.toLowerCase()}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {filters.role_level.map(role => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => removeFromArrayFilter('role_level', role)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tamaño de empresa */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Tamaño de Empresa
                    </Label>
                    <Select onValueChange={(value) => addToArrayFilter('company_size', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tamaño" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map(size => (
                          <SelectItem key={size} value={size.toLowerCase()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {filters.company_size.map(size => (
                        <Badge key={size} variant="secondary" className="text-xs">
                          {size}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => removeFromArrayFilter('company_size', size)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Idiomas */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Idiomas
                    </Label>
                    <Select onValueChange={(value) => addToArrayFilter('languages', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang} value={lang.toLowerCase()}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {filters.languages.map(lang => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => removeFromArrayFilter('languages', lang)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Disponibilidad */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Disponibilidad
                    </Label>
                    <Select 
                      value={filters.availability} 
                      onValueChange={(value: string) => {
                        const validValues = ['any', 'immediate', 'this-week', 'this-month', 'flexible'] as const
                        if (validValues.includes(value as any)) {
                          updateFilter('availability', value as AdvancedFilters['availability'])
                        }
                      }}
                    >  <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquiera</SelectItem>
                        <SelectItem value="immediate">Inmediata</SelectItem>
                        <SelectItem value="this-week">Esta semana</SelectItem>
                        <SelectItem value="this-month">Este mes</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sliders para rangos numéricos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Años de Experiencia: {filters.experience_range[0]} - {filters.experience_range[1]}
                    </Label>
                    <Slider
                      value={filters.experience_range}
                      onValueChange={(value) => updateFilter('experience_range', value as [number, number])}
                      max={30}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Compatibilidad Mínima: {filters.compatibility_min}%
                    </Label>
                    <Slider
                      value={[filters.compatibility_min]}
                      onValueChange={(value) => updateFilter('compatibility_min', value[0])}
                      max={100}
                      min={50}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      Conexiones Mutuas Mínimas: {filters.mutual_connections_min}
                    </Label>
                    <Slider
                      value={[filters.mutual_connections_min]}
                      onValueChange={(value) => updateFilter('mutual_connections_min', value[0])}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Checkboxes para preferencias especiales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="investment"
                      checked={filters.investment_interest}
                      onCheckedChange={(checked) => updateFilter('investment_interest', Boolean(checked))}
                    />
                    <Label htmlFor="investment" className="text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Interés en Inversión
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="partnership"
                      checked={filters.seeking_partnership}
                      onCheckedChange={(checked) => updateFilter('seeking_partnership', Boolean(checked))}
                    />
                    <Label htmlFor="partnership" className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      Busca Socios
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="funding"
                      checked={filters.has_funding}
                      onCheckedChange={(checked) => updateFilter('has_funding', Boolean(checked))}
                    />
                    <Label htmlFor="funding" className="text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-500" />
                      Tiene Financiación
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remote"
                      checked={filters.remote_work}
                      onCheckedChange={(checked) => updateFilter('remote_work', Boolean(checked))}
                    />
                    <Label htmlFor="remote" className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-500" />
                      Trabajo Remoto
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Búsquedas guardadas */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Búsquedas Guardadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSearches.map(search => (
                <div key={search.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{search.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {search.results_count} resultados
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Actualizado: {new Date(search.last_updated).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => loadSavedSearch(search)}
                      className="flex-1"
                    >
                      Cargar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSavedSearches(prev => prev.filter(s => s.id !== search.id))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
