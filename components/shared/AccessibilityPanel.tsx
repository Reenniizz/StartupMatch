"use client";

import React from "react";
import { Settings, Volume2, VolumeX, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  soundEnabled: boolean;
  screenReaderMode: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
}

interface UiSettings {
  darkMode: boolean;
  compactMode: boolean;
  showTimestamps: boolean;
  showAvatars: boolean;
  autoScroll: boolean;
}

interface AccessibilityPanelProps {
  accessibilitySettings: AccessibilitySettings;
  setAccessibilitySettings: React.Dispatch<React.SetStateAction<AccessibilitySettings>>;
  uiSettings: UiSettings;
  setUiSettings: React.Dispatch<React.SetStateAction<UiSettings>>;
  className?: string;
}

export default function AccessibilityPanel({ 
  accessibilitySettings, 
  setAccessibilitySettings,
  uiSettings,
  setUiSettings,
  className 
}: AccessibilityPanelProps) {
  
  const getA11yScore = () => {
    const enabledFeatures = Object.values(accessibilitySettings).filter(Boolean).length;
    return Math.round((enabledFeatures / Object.keys(accessibilitySettings).length) * 100);
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Control rápido de sonido */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAccessibilitySettings(prev => ({ 
                ...prev, 
                soundEnabled: !prev.soundEnabled 
              }))}
              aria-label={accessibilitySettings.soundEnabled ? "Silenciar notificaciones" : "Activar notificaciones"}
              className={accessibilitySettings.highContrast ? 'hover:bg-gray-700 text-white' : ''}
            >
              {accessibilitySettings.soundEnabled ? 
                <Volume2 className="h-4 w-4" /> : 
                <VolumeX className="h-4 w-4" />
              }
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {accessibilitySettings.soundEnabled ? 'Silenciar notificaciones' : 'Activar notificaciones'}
          </TooltipContent>
        </Tooltip>

        {/* Control rápido de contraste */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAccessibilitySettings(prev => ({ 
                ...prev, 
                highContrast: !prev.highContrast 
              }))}
              aria-label={accessibilitySettings.highContrast ? "Desactivar alto contraste" : "Activar alto contraste"}
              className={accessibilitySettings.highContrast ? 'hover:bg-gray-700 text-white bg-gray-800' : ''}
            >
              {accessibilitySettings.highContrast ? 
                <Eye className="h-4 w-4" /> : 
                <EyeOff className="h-4 w-4" />
              }
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {accessibilitySettings.highContrast ? 'Desactivar alto contraste' : 'Activar alto contraste'}
          </TooltipContent>
        </Tooltip>

        {/* Panel principal de configuración */}
        <Dialog>
          <DialogTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  aria-label="Configuración de accesibilidad"
                  className={`relative ${accessibilitySettings.highContrast ? 'hover:bg-gray-700 text-white' : ''}`}
                >
                  <Settings className="h-4 w-4" />
                  {getA11yScore() > 50 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-green-500">
                      {getA11yScore()}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Configuración de accesibilidad (Puntuación: {getA11yScore()}%)
              </TooltipContent>
            </Tooltip>
          </DialogTrigger>
          <DialogContent className={`sm:max-w-md ${
            accessibilitySettings.highContrast ? 'bg-black text-white border-white' : ''
          } ${
            accessibilitySettings.largeText ? 'text-lg' : ''
          }`}>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Configuración de Accesibilidad</span>
                <Badge variant={getA11yScore() > 70 ? "default" : getA11yScore() > 40 ? "secondary" : "destructive"}>
                  {getA11yScore()}% Accesible
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Configuraciones de Accesibilidad */}
              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide opacity-70">
                  Accesibilidad Visual
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="high-contrast"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Alto contraste
                    </Label>
                    <Switch
                      id="high-contrast"
                      checked={accessibilitySettings.highContrast}
                      onCheckedChange={(checked) => 
                        setAccessibilitySettings(prev => ({ ...prev, highContrast: checked }))
                      }
                      aria-describedby="high-contrast-desc"
                    />
                  </div>
                  <p id="high-contrast-desc" className="text-xs text-gray-500">
                    Mejora la legibilidad con colores de mayor contraste
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="large-text"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Texto grande
                    </Label>
                    <Switch
                      id="large-text"
                      checked={accessibilitySettings.largeText}
                      onCheckedChange={(checked) => 
                        setAccessibilitySettings(prev => ({ ...prev, largeText: checked }))
                      }
                      aria-describedby="large-text-desc"
                    />
                  </div>
                  <p id="large-text-desc" className="text-xs text-gray-500">
                    Aumenta el tamaño del texto para mejor legibilidad
                  </p>

                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="reduced-motion"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Reducir animaciones
                    </Label>
                    <Switch
                      id="reduced-motion"
                      checked={accessibilitySettings.reducedMotion}
                      onCheckedChange={(checked) => 
                        setAccessibilitySettings(prev => ({ ...prev, reducedMotion: checked }))
                      }
                      aria-describedby="reduced-motion-desc"
                    />
                  </div>
                  <p id="reduced-motion-desc" className="text-xs text-gray-500">
                    Minimiza las animaciones para usuarios sensibles al movimiento
                  </p>
                </div>
              </div>

              <Separator />

              {/* Configuraciones de Audio y Lector de Pantalla */}
              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide opacity-70">
                  Audio y Lectura
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="sound-enabled"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Notificaciones sonoras
                    </Label>
                    <Switch
                      id="sound-enabled"
                      checked={accessibilitySettings.soundEnabled}
                      onCheckedChange={(checked) => 
                        setAccessibilitySettings(prev => ({ ...prev, soundEnabled: checked }))
                      }
                      aria-describedby="sound-desc"
                    />
                  </div>
                  <p id="sound-desc" className="text-xs text-gray-500">
                    Reproduce sonidos para nuevos mensajes y acciones
                  </p>

                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="screen-reader"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Modo lector de pantalla
                    </Label>
                    <Switch
                      id="screen-reader"
                      checked={accessibilitySettings.screenReaderMode}
                      onCheckedChange={(checked) => 
                        setAccessibilitySettings(prev => ({ ...prev, screenReaderMode: checked }))
                      }
                      aria-describedby="screen-reader-desc"
                    />
                  </div>
                  <p id="screen-reader-desc" className="text-xs text-gray-500">
                    Anuncia acciones y eventos importantes para lectores de pantalla
                  </p>

                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="keyboard-nav"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Navegación por teclado
                    </Label>
                    <Switch
                      id="keyboard-nav"
                      checked={accessibilitySettings.keyboardNavigation}
                      onCheckedChange={(checked) => 
                        setAccessibilitySettings(prev => ({ ...prev, keyboardNavigation: checked }))
                      }
                      aria-describedby="keyboard-desc"
                    />
                  </div>
                  <p id="keyboard-desc" className="text-xs text-gray-500">
                    Habilita atajos de teclado y navegación sin ratón
                  </p>
                </div>
              </div>

              <Separator />

              {/* Configuraciones de UI */}
              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide opacity-70">
                  Interfaz de Usuario
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="auto-scroll"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Auto-scroll
                    </Label>
                    <Switch
                      id="auto-scroll"
                      checked={uiSettings.autoScroll}
                      onCheckedChange={(checked) => 
                        setUiSettings(prev => ({ ...prev, autoScroll: checked }))
                      }
                      aria-describedby="auto-scroll-desc"
                    />
                  </div>
                  <p id="auto-scroll-desc" className="text-xs text-gray-500">
                    Desplaza automáticamente hacia los mensajes más recientes
                  </p>

                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="show-timestamps"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Mostrar timestamps
                    </Label>
                    <Switch
                      id="show-timestamps"
                      checked={uiSettings.showTimestamps}
                      onCheckedChange={(checked) => 
                        setUiSettings(prev => ({ ...prev, showTimestamps: checked }))
                      }
                      aria-describedby="timestamps-desc"
                    />
                  </div>
                  <p id="timestamps-desc" className="text-xs text-gray-500">
                    Muestra la hora en cada mensaje
                  </p>

                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="compact-mode"
                      className={accessibilitySettings.largeText ? 'text-base' : ''}
                    >
                      Modo compacto
                    </Label>
                    <Switch
                      id="compact-mode"
                      checked={uiSettings.compactMode}
                      onCheckedChange={(checked) => 
                        setUiSettings(prev => ({ ...prev, compactMode: checked }))
                      }
                      aria-describedby="compact-desc"
                    />
                  </div>
                  <p id="compact-desc" className="text-xs text-gray-500">
                    Reduce el espaciado para mostrar más contenido
                  </p>
                </div>
              </div>

              {/* Atajos de teclado */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Atajos de Teclado</h5>
                <div className="text-xs space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Enviar mensaje:</span>
                    <code className="bg-gray-200 px-1 rounded">Enter</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Nueva línea:</span>
                    <code className="bg-gray-200 px-1 rounded">Shift + Enter</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Enfocar búsqueda:</span>
                    <code className="bg-gray-200 px-1 rounded">F6</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Salir del input:</span>
                    <code className="bg-gray-200 px-1 rounded">Esc</code>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
