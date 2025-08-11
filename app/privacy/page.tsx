"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, Download, FileText } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect } from "react";

export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Política de Privacidad | StartupMatch";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Política de privacidad de StartupMatch. Conoce cómo recopilamos, usamos y protegemos tus datos personales en nuestra plataforma GDPR compliant.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Política de privacidad de StartupMatch. Conoce cómo recopilamos, usamos y protegemos tus datos personales en nuestra plataforma GDPR compliant.';
      document.head.appendChild(meta);
    }
  }, []);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Política de Privacidad</h1>
                  <p className="text-sm text-gray-500">Última actualización: 11 de Agosto, 2025</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Descargar PDF</span>
              </button>
              <Link 
                href="/terms"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Términos y Condiciones</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              { label: "Legal" },
              { label: "Política de Privacidad" }
            ]} 
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tabla de Contenidos</h2>
              <nav className="space-y-2">
                {[
                  { id: "recopilamos", title: "1. Datos que Recopilamos" },
                  { id: "usamos", title: "2. Cómo Usamos sus Datos" },
                  { id: "base-legal", title: "3. Base Legal del Tratamiento" },
                  { id: "compartimos", title: "4. Cuándo Compartimos Datos" },
                  { id: "seguridad", title: "5. Seguridad y Protección" },
                  { id: "derechos", title: "6. Sus Derechos GDPR" },
                  { id: "retencion", title: "7. Retención de Datos" },
                  { id: "cookies", title: "8. Cookies y Tracking" },
                  { id: "transferencias", title: "9. Transferencias Internacionales" },
                  { id: "menores", title: "10. Protección de Menores" },
                  { id: "cambios", title: "11. Cambios en la Política" },
                  { id: "contacto", title: "12. Contacto y DPO" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    {item.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Introduction */}
              <div className="p-8 border-b border-gray-100">
                <div className="mb-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
                    <Shield className="w-4 h-4 mr-2" />
                    Política de Privacidad GDPR
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Política de Privacidad y Protección de Datos
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    En StartupMatch, la privacidad y protección de sus datos personales es nuestra 
                    prioridad absoluta. Esta política explica detalladamente cómo recopilamos, 
                    usamos, protegemos y gestionamos su información personal.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">🛡️ Cumplimiento Total GDPR</h3>
                    <p className="text-sm text-green-800">
                      Cumplimos completamente con el Reglamento General de Protección 
                      de Datos (GDPR) de la Unión Europea y todas las leyes de privacidad aplicables.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">🔒 Transparencia Total</h3>
                    <p className="text-sm text-blue-800">
                      Esta política es clara, transparente y le permite ejercer completamente 
                      sus derechos de privacidad y protección de datos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-12">
                {/* Section 1: Datos que Recopilamos */}
                <motion.section 
                  id="recopilamos"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Datos Personales que Recopilamos
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Datos Obligatorios */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                          <Database className="w-5 h-5 mr-2" />
                          Datos Obligatorios para el Servicio
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-blue-800 mb-2">Información Personal Básica:</h4>
                            <ul className="space-y-1 text-sm text-blue-700">
                              <li>• Nombre y apellido completos</li>
                              <li>• Dirección de email (para autenticación)</li>
                              <li>• Username único en la plataforma</li>
                              <li>• Contraseña encriptada (nunca almacenada en texto plano)</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800 mb-2">Información Profesional:</h4>
                            <ul className="space-y-1 text-sm text-blue-700">
                              <li>• Rol/posición profesional actual</li>
                              <li>• Industria en la que trabajas</li>
                              <li>• Ubicación geográfica (ciudad/país)</li>
                              <li>• Habilidades y competencias profesionales</li>
                              <li>• Objetivos y tipo de conexiones buscadas</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Datos Opcionales */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                          <Eye className="w-5 h-5 mr-2" />
                          Datos Opcionales (Con su Consentimiento)
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-green-800 mb-2">Información de Contacto Adicional:</h4>
                            <ul className="space-y-1 text-sm text-green-700">
                              <li>• Número de teléfono de contacto</li>
                              <li>• Enlaces a perfiles profesionales (LinkedIn, etc.)</li>
                              <li>• Sitio web personal o corporativo</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800 mb-2">Información Profesional Extendida:</h4>
                            <ul className="space-y-1 text-sm text-green-700">
                              <li>• Empresa actual y experiencia laboral</li>
                              <li>• Proyectos anteriores y logros</li>
                              <li>• Foto de perfil profesional</li>
                              <li>• Biografía y descripción personal</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Datos Técnicos Automáticos */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Lock className="w-5 h-5 mr-2" />
                        Datos Técnicos Recopilados Automáticamente
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Datos de Conexión:</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Dirección IP (anonimizada tras 30 días)</li>
                            <li>• Tipo de dispositivo y navegador</li>
                            <li>• Sistema operativo</li>
                            <li>• Resolución de pantalla</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Datos de Uso:</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Páginas visitadas y tiempo en cada una</li>
                            <li>• Funciones utilizadas</li>
                            <li>• Interacciones con otros usuarios</li>
                            <li>• Preferencias de configuración</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Datos de Seguridad:</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Timestamps de inicio/cierre de sesión</li>
                            <li>• Intentos de acceso fallidos</li>
                            <li>• Cambios en la configuración de cuenta</li>
                            <li>• Actividades sospechosas</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Datos que NUNCA Recopilamos</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
                        <ul className="space-y-1">
                          <li>• Información bancaria o financiera</li>
                          <li>• Números de seguridad social o identificación nacional</li>
                          <li>• Información médica o de salud</li>
                          <li>• Datos biométricos</li>
                        </ul>
                        <ul className="space-y-1">
                          <li>• Conversaciones privadas fuera de la plataforma</li>
                          <li>• Contactos de su teléfono sin consentimiento</li>
                          <li>• Ubicación GPS exacta en tiempo real</li>
                          <li>• Información de navegación fuera de StartupMatch</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Section 2: Cómo Usamos sus Datos */}
                <motion.section 
                  id="usamos"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Cómo Usamos sus Datos Personales
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Funcionalidad Principal */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                          <Database className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-purple-900 mb-3">🎯 Matching y Conexiones</h3>
                        <ul className="space-y-2 text-sm text-purple-800">
                          <li>• Algoritmos de compatibilidad profesional</li>
                          <li>• Sugerencias personalizadas de conexiones</li>
                          <li>• Análisis de afinidad por habilidades e industria</li>
                          <li>• Optimización continua del matching</li>
                        </ul>
                      </div>

                      {/* Comunicación */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">📧 Comunicación Esencial</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li>• Notificaciones de nuevas conexiones</li>
                          <li>• Mensajes importantes sobre la cuenta</li>
                          <li>• Actualizaciones de seguridad</li>
                          <li>• Cambios en términos y políticas</li>
                        </ul>
                      </div>

                      {/* Seguridad */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                          <Shield className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-red-900 mb-3">🛡️ Seguridad y Protección</h3>
                        <ul className="space-y-2 text-sm text-red-800">
                          <li>• Autenticación y verificación de identidad</li>
                          <li>• Detección y prevención de fraude</li>
                          <li>• Moderación automática de contenido</li>
                          <li>• Análisis de actividades sospechosas</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Marketing y Comunicaciones (Solo con su Consentimiento)</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Con Consentimiento Explícito:</h4>
                          <ul className="space-y-1 text-sm text-gray-700">
                            <li>• Newsletter con nuevas funcionalidades</li>
                            <li>• Tips y consejos para networking efectivo</li>
                            <li>• Invitaciones a eventos exclusivos</li>
                            <li>• Estudios sobre tendencias del sector</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Control Total:</h4>
                          <ul className="space-y-1 text-sm text-gray-700">
                            <li>• Puede retirar el consentimiento en cualquier momento</li>
                            <li>• Opciones granulares de preferencias</li>
                            <li>• Link de desuscripción en cada email</li>
                            <li>• Sin spam ni comunicaciones excesivas</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Section 3: Base Legal */}
                <motion.section 
                  id="base-legal"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
                    Base Legal del Tratamiento de Datos (GDPR)
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚖️ Bases Legales Principales</h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">🤝 Ejecución de Contrato:</h4>
                            <p className="text-sm text-gray-600">Procesamiento necesario para proporcionar nuestros servicios de matching y networking profesional.</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">✅ Consentimiento:</h4>
                            <p className="text-sm text-gray-600">Para marketing, datos opcionales y funcionalidades no esenciales.</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">🛡️ Interés Legítimo:</h4>
                            <p className="text-sm text-gray-600">Para seguridad, prevención de fraude y mejora del servicio.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">🔍 Transparencia Completa</h3>
                        <div className="space-y-3 text-sm text-blue-800">
                          <p>
                            <strong>Evaluación de Interés Legítimo:</strong> Hemos realizado evaluaciones 
                            exhaustivas para asegurar que nuestros intereses legítimos no anulen 
                            sus derechos fundamentales de privacidad.
                          </p>
                          <p>
                            <strong>Minimización de Datos:</strong> Solo procesamos los datos estrictamente 
                            necesarios para cada finalidad específica.
                          </p>
                          <p>
                            <strong>Limitación de Finalidad:</strong> Sus datos solo se usan para los 
                            propósitos específicos para los cuales fueron recopilados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Section 6: Derechos GDPR */}
                <motion.section 
                  id="derechos"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">6</span>
                    Sus Derechos Fundamentales GDPR
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <p className="text-green-800 font-medium mb-4">
                        Como residente de la UE, tiene derechos fundamentales sobre sus datos personales. 
                        Garantizamos el ejercicio completo de estos derechos sin costo alguno.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: "👁️", title: "Derecho de Acceso", desc: "Ver todos los datos que tenemos sobre usted" },
                        { icon: "✏️", title: "Derecho de Rectificación", desc: "Corregir información incorrecta o incompleta" },
                        { icon: "🗑️", title: "Derecho de Supresión", desc: "Eliminar sus datos ('derecho al olvido')" },
                        { icon: "📤", title: "Portabilidad", desc: "Exportar sus datos en formato legible" },
                        { icon: "⏸️", title: "Limitación del Tratamiento", desc: "Restringir cómo usamos sus datos" },
                        { icon: "❌", title: "Derecho de Oposición", desc: "Oponerse a procesamientos específicos" },
                        { icon: "🔄", title: "Retirada de Consentimiento", desc: "Retirar consentimientos otorgados" },
                        { icon: "⚖️", title: "No Decisiones Automatizadas", desc: "Revisión humana de decisiones de IA" }
                      ].map((right, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                          <div className="text-3xl mb-2">{right.icon}</div>
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm">{right.title}</h4>
                          <p className="text-xs text-gray-600 leading-relaxed">{right.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">📞 Cómo Ejercer sus Derechos</h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">📧 Email Directo:</h4>
                          <p className="text-sm text-blue-700 mb-2">privacy@startupmatch.com</p>
                          <p className="text-xs text-blue-600">Respuesta garantizada en 72 horas</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">🏢 Oficial de Protección de Datos:</h4>
                          <p className="text-sm text-blue-700 mb-2">dpo@startupmatch.com</p>
                          <p className="text-xs text-blue-600">Para consultas técnicas complejas</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">⏱️ Tiempo de Respuesta:</h4>
                          <p className="text-sm text-blue-700 mb-2">Máximo 30 días calendario</p>
                          <p className="text-xs text-blue-600">Confirmación en 72 horas</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Proceso Seguro y Verificado</h3>
                      <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Verificación de Identidad:</h4>
                          <ul className="space-y-1">
                            <li>• Solicitudes desde email registrado verificado automáticamente</li>
                            <li>• Identificación adicional solo si necesario para proteger sus datos</li>
                            <li>• Proceso completamente gratuito</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Entrega Segura:</h4>
                          <ul className="space-y-1">
                            <li>• Datos exportados en formatos estándar (JSON, CSV)</li>
                            <li>• Transmisión encriptada TLS 1.3</li>
                            <li>• Confirmación de recepción requerida</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Contact Section */}
                <motion.section 
                  id="contacto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">12</span>
                    Contacto y Oficial de Protección de Datos
                  </h2>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <Shield className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Oficial de Protección de Datos</h3>
                            <p className="text-sm text-gray-600">Experto certificado en privacidad y GDPR</p>
                          </div>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-800">Email directo:</p>
                            <p className="text-blue-600">dpo@startupmatch.com</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Especialidades:</p>
                            <ul className="text-gray-600 ml-4 space-y-1">
                              <li>• Consultas complejas sobre GDPR</li>
                              <li>• Evaluaciones de impacto en privacidad</li>
                              <li>• Resolución de disputas de datos</li>
                              <li>• Asesoramiento sobre derechos digitales</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <Mail className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Equipo de Privacidad</h3>
                            <p className="text-sm text-gray-600">Soporte general y consultas rápidas</p>
                          </div>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-800">Email general:</p>
                            <p className="text-blue-600">privacy@startupmatch.com</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Horario de atención:</p>
                            <p className="text-gray-600">Lunes a Viernes: 9:00 - 18:00 CET</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Tiempo de respuesta:</p>
                            <p className="text-gray-600">Confirmación en 72h, resolución en 30 días</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-green-200">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">🏛️ Autoridad de Supervisión</h4>
                        <p className="text-sm text-yellow-800">
                          Si no está satisfecho con nuestra respuesta, tiene derecho a presentar una queja 
                          ante su autoridad nacional de protección de datos. En España: 
                          <strong> Agencia Española de Protección de Datos (AEPD)</strong> - www.aepd.es
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
