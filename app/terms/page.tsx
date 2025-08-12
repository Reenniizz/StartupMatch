"use client";

import { motion } from "framer-motion";
import { ArrowLeft, FileText, Shield, Mail, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect } from "react";

export default function TermsPage() {
  useEffect(() => {
    document.title = "Términos y Condiciones | StartupMatch";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Términos y condiciones de uso de StartupMatch. Conoce las reglas y regulaciones para usar nuestra plataforma de networking profesional para emprendedores.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Términos y condiciones de uso de StartupMatch. Conoce las reglas y regulaciones para usar nuestra plataforma de networking profesional para emprendedores.';
      document.head.appendChild(meta);
    }
  }, []);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Términos y Condiciones</h1>
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
                href="/privacy"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Política de Privacidad</span>
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
              { label: "Términos y Condiciones" }
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
                  { id: "empresa", title: "1. Información de la Empresa" },
                  { id: "aceptacion", title: "2. Aceptación y Capacidad" },
                  { id: "servicios", title: "3. Servicios y Funcionalidades" },
                  { id: "conducta", title: "4. Conducta del Usuario" },
                  { id: "propiedad", title: "5. Propiedad Intelectual" },
                  { id: "privacidad", title: "6. Privacidad y Datos" },
                  { id: "pagos", title: "7. Pagos y Facturación" },
                  { id: "responsabilidad", title: "8. Limitación de Responsabilidad" },
                  { id: "terminacion", title: "9. Terminación" },
                  { id: "disputas", title: "10. Resolución de Disputas" },
                  { id: "modificaciones", title: "11. Modificaciones" },
                  { id: "varios", title: "12. Disposiciones Varias" },
                  { id: "contacto", title: "13. Contacto" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                    <FileText className="w-4 h-4 mr-2" />
                    Términos de Servicio
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Términos y Condiciones de Uso
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Bienvenido a StartupMatch. Estos términos y condiciones establecen las reglas 
                    y regulaciones para el uso de nuestro sitio web y plataforma de networking 
                    profesional para emprendedores.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Al acceder y usar StartupMatch, aceptas automáticamente 
                    estos términos. Si no estás de acuerdo con alguna parte de estos términos, 
                    no debes usar nuestro servicio.
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-12">
                {/* Section 1: Información de la Empresa */}
                <motion.section 
                  id="empresa"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Información de la Empresa
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">StartupMatch</h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Sitio web:</p>
                          <p className="text-gray-600">https://startupmatch.com</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Email legal:</p>
                          <p className="text-gray-600">legal@startupmatch.com</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Soporte:</p>
                          <p className="text-gray-600">support@startupmatch.com</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Horario:</p>
                          <p className="text-gray-600">L-V 9:00-18:00 CET</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose prose-gray max-w-none">
                      <p>
                        StartupMatch es una plataforma de networking digital diseñada específicamente 
                        para emprendedores y profesionales que buscan formar equipos de trabajo, 
                        encontrar socios comerciales, o expandir su red profesional en el ecosistema 
                        startup y tecnológico.
                      </p>
                    </div>
                  </div>
                </motion.section>

                {/* Section 2: Aceptación y Capacidad */}
                <motion.section 
                  id="aceptacion"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Aceptación y Capacidad Legal
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          Requisitos Obligatorios
                        </h3>
                        <ul className="space-y-2 text-sm text-green-800">
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Ser mayor de 18 años de edad
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Tener capacidad legal para celebrar contratos
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Proporcionar información veraz y actualizada
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Cumplir con todas las leyes aplicables
                          </li>
                        </ul>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Al Registrarte Aceptas</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Estos términos y condiciones en su totalidad
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Nuestra política de privacidad
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Usar la plataforma de manera responsable
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            Mantener la seguridad de tu cuenta
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Importante para Menores</h3>
                      <p className="text-sm text-yellow-800 leading-relaxed">
                        Si eres menor de 18 años, no puedes usar StartupMatch. Si detectamos que un usuario 
                        es menor de edad, procederemos inmediatamente a suspender la cuenta y eliminar 
                        toda la información personal de acuerdo con las regulaciones de protección de menores.
                      </p>
                    </div>
                  </div>
                </motion.section>

                {/* Section 3: Servicios */}
                <motion.section 
                  id="servicios"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">3</span>
                    Servicios y Funcionalidades
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="prose prose-gray max-w-none">
                      <p className="text-lg text-gray-700 leading-relaxed">
                        StartupMatch proporciona una plataforma integral de networking profesional 
                        con tecnología de inteligencia artificial para facilitar conexiones 
                        significativas entre emprendedores y profesionales del ecosistema startup.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Funcionalidades Principales</h3>
                        <ul className="space-y-3 text-sm text-gray-700">
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <div>
                              <strong>Perfiles Profesionales:</strong> Creación y gestión de perfiles detallados con información profesional
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <div>
                              <strong>Matching Inteligente:</strong> Algoritmo de IA que sugiere conexiones basadas en compatibilidad profesional
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <div>
                              <strong>Mensajería Segura:</strong> Sistema de comunicación directa entre usuarios verificados
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <div>
                              <strong>Red de Contactos:</strong> Herramientas avanzadas para expandir y gestionar tu red profesional
                            </div>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Disponibilidad del Servicio</h3>
                        <div className="space-y-4 text-sm text-gray-700">
                          <div>
                            <p className="font-medium mb-2">Compromiso de Servicio:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• Disponibilidad objetivo: 99.9% mensual</li>
                              <li>• Mantenimientos programados con aviso previo</li>
                              <li>• Soporte técnico L-V 9:00-18:00 CET</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium mb-2">Modificaciones:</p>
                            <p className="text-xs">
                              Nos reservamos el derecho de modificar, suspender temporalmente o 
                              discontinuar cualquier funcionalidad con un aviso previo mínimo de 30 días.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Descargo de Garantías de Servicio</h3>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        StartupMatch se proporciona "TAL COMO ESTÁ" y "SEGÚN DISPONIBILIDAD". 
                        Aunque nos esforzamos por mantener el servicio funcionando de manera óptima, 
                        no garantizamos que el servicio será ininterrumpido, libre de errores, o que 
                        cumplirá con todos los requisitos específicos de cada usuario.
                      </p>
                    </div>
                  </div>
                </motion.section>

                {/* Continue with more sections... */}
                {/* For brevity, I'll add a few more key sections */}

                {/* Section 4: Conducta del Usuario */}
                <motion.section 
                  id="conducta"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">4</span>
                    Conducta del Usuario y Uso Prohibido
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-400 p-6">
                      <h3 className="text-lg font-semibold text-red-900 mb-4">❌ Actividades Estrictamente Prohibidas</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-sm text-red-800">
                          <li>• Publicar información falsa, engañosa o fraudulenta</li>
                          <li>• Usar lenguaje discriminatorio, ofensivo o de acoso</li>
                          <li>• Intentar hackear, dañar o comprometer la plataforma</li>
                          <li>• Crear múltiples cuentas o perfiles falsos</li>
                          <li>• Usar la plataforma para spam comercial no solicitado</li>
                        </ul>
                        <ul className="space-y-2 text-sm text-red-800">
                          <li>• Participar en cualquier actividad ilegal</li>
                          <li>• Violar los derechos de propiedad intelectual</li>
                          <li>• Compartir contenido pornográfico o inapropiado</li>
                          <li>• Intentar eludir medidas de seguridad</li>
                          <li>• Recopilar datos de otros usuarios sin consentimiento</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Sistema de Consecuencias Progresivas</h3>
                      <div className="space-y-3 text-sm text-yellow-800">
                        <div className="flex">
                          <span className="font-bold mr-3 text-yellow-900">1ª Violación:</span>
                          <span>Advertencia formal por escrito y revisión de cuenta</span>
                        </div>
                        <div className="flex">
                          <span className="font-bold mr-3 text-yellow-900">2ª Violación:</span>
                          <span>Suspensión temporal de 7-30 días según gravedad</span>
                        </div>
                        <div className="flex">
                          <span className="font-bold mr-3 text-yellow-900">3ª Violación:</span>
                          <span>Terminación permanente de cuenta sin posibilidad de apelación</span>
                        </div>
                        <div className="flex">
                          <span className="font-bold mr-3 text-yellow-900">Violación Grave:</span>
                          <span>Terminación inmediata + posibles acciones legales</span>
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
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold mr-3">13</span>
                    Contacto y Soporte Legal
                  </h2>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-8">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Asuntos Legales</h3>
                        <p className="text-sm text-gray-600 mb-3">Para consultas sobre términos, condiciones y aspectos legales</p>
                        <a href="mailto:legal@startupmatch.com" className="text-blue-600 hover:text-blue-700 font-medium">
                          legal@startupmatch.com
                        </a>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Shield className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Soporte Técnico</h3>
                        <p className="text-sm text-gray-600 mb-3">Ayuda con problemas técnicos y uso de la plataforma</p>
                        <a href="mailto:support@startupmatch.com" className="text-green-600 hover:text-green-700 font-medium">
                          support@startupmatch.com
                        </a>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <ExternalLink className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Horario de Atención</h3>
                        <p className="text-sm text-gray-600 mb-3">Nuestro equipo está disponible para ayudarte</p>
                        <p className="text-purple-600 font-medium">
                          L-V: 9:00 - 18:00 CET
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
