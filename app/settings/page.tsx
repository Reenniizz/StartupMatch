"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Bell,
  Shield,
  Moon,
  Sun,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Save,
  AlertTriangle,
  Check,
  Settings as SettingsIcon,
  User,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    
    // Privacy
    profileVisibility: 'public', // public, friends, private
    showEmail: false,
    showLocation: true,
    allowMessages: true,
    
    // Appearance
    darkMode: false,
    language: 'es',
    timezone: 'America/Mexico_City',
    
    // Account
    twoFactorAuth: false,
    loginAlerts: true
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load settings from localStorage or user preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('startupMatch-theme');
    if (savedTheme) {
      setSettings(prev => ({
        ...prev,
        darkMode: savedTheme === 'dark'
      }));
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save theme to localStorage
    localStorage.setItem('startupMatch-theme', settings.darkMode ? 'dark' : 'light');
    
    // Here you would typically save other settings to Supabase
    console.log('Saving settings:', settings);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setSavedMessage('Configuración guardada correctamente');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'ELIMINAR') {
      return;
    }
    
    // Here you would typically delete the account from Supabase
    console.log('Deleting account...');
    
    // Sign out and redirect
    await signOut();
    router.push('/');
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
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
                <SettingsIcon className="h-6 w-6 mr-2" />
                Configuración
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              {savedMessage && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">{savedMessage}</span>
                </div>
              )}
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                size="sm"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue-600" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notificaciones por email</h3>
                  <p className="text-sm text-gray-600">Recibe actualizaciones importantes por correo</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notificaciones push</h3>
                  <p className="text-sm text-gray-600">Recibe notificaciones en tu dispositivo</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Emails de marketing</h3>
                  <p className="text-sm text-gray-600">Recibe ofertas y promociones</p>
                </div>
                <Switch
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Resumen semanal</h3>
                  <p className="text-sm text-gray-600">Resumen de tu actividad cada semana</p>
                </div>
                <Switch
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => updateSetting('weeklyDigest', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Visibilidad del perfil</h3>
                  <p className="text-sm text-gray-600">Quién puede ver tu perfil completo</p>
                </div>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => updateSetting('profileVisibility', e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="public">Público</option>
                  <option value="friends">Solo contactos</option>
                  <option value="private">Privado</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mostrar email</h3>
                  <p className="text-sm text-gray-600">Permitir que otros vean tu email</p>
                </div>
                <Switch
                  checked={settings.showEmail}
                  onCheckedChange={(checked) => updateSetting('showEmail', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mostrar ubicación</h3>
                  <p className="text-sm text-gray-600">Mostrar tu ubicación en el perfil</p>
                </div>
                <Switch
                  checked={settings.showLocation}
                  onCheckedChange={(checked) => updateSetting('showLocation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Permitir mensajes</h3>
                  <p className="text-sm text-gray-600">Otros usuarios pueden enviarte mensajes</p>
                </div>
                <Switch
                  checked={settings.allowMessages}
                  onCheckedChange={(checked) => updateSetting('allowMessages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {settings.darkMode ? (
                  <Moon className="h-5 w-5 mr-2 text-purple-600" />
                ) : (
                  <Sun className="h-5 w-5 mr-2 text-yellow-600" />
                )}
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Modo oscuro</h3>
                  <p className="text-sm text-gray-600">Cambia a tema oscuro para mejor visibilidad</p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Idioma</h3>
                  <p className="text-sm text-gray-600">Idioma de la interfaz</p>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Zona horaria</h3>
                  <p className="text-sm text-gray-600">Tu zona horaria local</p>
                </div>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="America/Mexico_City">Ciudad de México</option>
                  <option value="America/New_York">Nueva York</option>
                  <option value="Europe/London">Londres</option>
                  <option value="Asia/Tokyo">Tokio</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-red-600" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Autenticación de dos factores</h3>
                  <p className="text-sm text-gray-600">Añade una capa extra de seguridad</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                  />
                  {settings.twoFactorAuth && (
                    <Button variant="outline" size="sm">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Alertas de inicio de sesión</h3>
                  <p className="text-sm text-gray-600">Te notificamos cuando alguien accede a tu cuenta</p>
                </div>
                <Switch
                  checked={settings.loginAlerts}
                  onCheckedChange={(checked) => updateSetting('loginAlerts', checked)}
                />
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Información de la Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Usuario desde</label>
                  <p className="text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Cambiar Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Zona de Peligro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">Eliminar Cuenta</h3>
                <p className="text-sm text-red-700 mb-4">
                  Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, está seguro.
                </p>
                
                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Cuenta
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-700">
                      Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
                    </p>
                    <input
                      type="text"
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="ELIMINAR"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleteText !== 'ELIMINAR'}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Eliminar Permanentemente
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteText('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
