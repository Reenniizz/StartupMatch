"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Shield, Eye, CheckCircle, Download, Mail } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

export default function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  const [currentSection, setCurrentSection] = useState(0);

  const termsData = {
    terms: {
      title: "Términos y Condiciones de Uso",
      icon: <FileText className="w-6 h-6" />,
      sections: [
        {
          title: "Información de la Empresa",
          content: (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">StartupMatch</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Sitio web:</strong> https://startupmatch.com</p>
                  <p><strong>Email legal:</strong> legal@startupmatch.com</p>
                  <p><strong>Soporte:</strong> support@startupmatch.com</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                StartupMatch es una plataforma de networking para emprendedores que facilita 
                conexiones profesionales y matching inteligente para formar equipos de startup.
              </p>
            </div>
          )
        },
        {
          title: "Aceptación y Capacidad",
          content: (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Debes ser:
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Mayor de 18 años</li>
                    <li>• Tener capacidad legal</li>
                    <li>• Proporcionar información veraz</li>
                    <li>• Cumplir con las leyes aplicables</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Al aceptar:</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Aceptas estos términos</li>
                    <li>• Aceptas la política de privacidad</li>
                    <li>• Te comprometes a usar la plataforma adecuadamente</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Servicios y Funcionalidades",
          content: (
            <div className="space-y-4">
              <p className="text-gray-700 text-sm">
                StartupMatch proporciona una plataforma para conectar emprendedores, 
                facilitar networking profesional y encontrar socios ideales para proyectos.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Servicios incluidos:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Perfiles profesionales</li>
                    <li>• Sistema de matching IA</li>
                    <li>• Mensajería entre usuarios</li>
                    <li>• Herramientas de networking</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Disponibilidad:</h4>
                  <p className="text-sm text-gray-700">
                    El servicio se proporciona "tal como está". Podemos modificar, 
                    suspender o discontinuar funcionalidades con previo aviso.
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Conducta del Usuario",
          content: (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">❌ Está prohibido:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Publicar información falsa o engañosa</li>
                  <li>• Usar lenguaje discriminatorio u ofensivo</li>
                  <li>• Intentar hackear o dañar la plataforma</li>
                  <li>• Crear múltiples cuentas fraudulentas</li>
                  <li>• Usar la plataforma para spam comercial</li>
                  <li>• Cualquier actividad ilegal</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Consecuencias:</h4>
                <p className="text-sm text-yellow-800">
                  Las violaciones pueden resultar en advertencia, suspensión temporal, 
                  terminación permanente de cuenta o acciones legales.
                </p>
              </div>
            </div>
          )
        },
        {
          title: "Limitación de Responsabilidad",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Descargo de responsabilidad:</h4>
                <p className="text-sm text-gray-700 mb-3">
                  StartupMatch se proporciona "TAL COMO ESTÁ" sin garantías de ningún tipo.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• No garantizamos que encontrará socios comerciales</li>
                  <li>• No verificamos la veracidad de información de usuarios</li>
                  <li>• No somos responsables por el resultado de conexiones</li>
                  <li>• Los daños están limitados a €100 o montos pagados</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          title: "Terminación y Contacto",
          content: (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Terminación:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Puede eliminar su cuenta cuando desee</li>
                    <li>• Podemos suspender cuentas que violen términos</li>
                    <li>• Los datos se eliminan según política de privacidad</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Contacto:</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Legal:</strong> legal@startupmatch.com</p>
                    <p><strong>Soporte:</strong> support@startupmatch.com</p>
                    <p><strong>Horario:</strong> L-V 9:00-18:00 CET</p>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    privacy: {
      title: "Política de Privacidad",
      icon: <Shield className="w-6 h-6" />,
      sections: [
        {
          title: "Datos que Recopilamos",
          content: (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Datos Obligatorios
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Nombre y apellido</li>
                    <li>• Email (autenticación)</li>
                    <li>• Username único</li>
                    <li>• Rol profesional</li>
                    <li>• Industria y ubicación</li>
                    <li>• Habilidades y objetivos</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">📞 Datos Opcionales</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Teléfono de contacto</li>
                    <li>• Empresa actual</li>
                    <li>• Foto de perfil</li>
                    <li>• Enlaces profesionales</li>
                    <li>• Experiencia detallada</li>
                  </ul>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">🔧 Datos Técnicos Automáticos</h4>
                <p className="text-sm text-gray-700">
                  IP, dispositivo, navegador, cookies de sesión, analytics de uso, 
                  timestamps de actividad (para seguridad y funcionalidad).
                </p>
              </div>
            </div>
          )
        },
        {
          title: "Cómo Usamos sus Datos",
          content: (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🎯 Matching</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Algoritmos de compatibilidad</li>
                    <li>• Sugerencias personalizadas</li>
                    <li>• Conexiones relevantes</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📧 Comunicación</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Notificaciones importantes</li>
                    <li>• Updates de la plataforma</li>
                    <li>• Soporte técnico</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">🛡️ Seguridad</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Autenticación segura</li>
                    <li>• Prevención de fraude</li>
                    <li>• Moderación de contenido</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Privacidad y Compartición",
          content: (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    👀 Perfil Público
                  </h4>
                  <p className="text-sm text-green-800 mb-2">Otros usuarios ven:</p>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Nombre y foto</li>
                    <li>• Rol e industria</li>
                    <li>• Ubicación (ciudad)</li>
                    <li>• Habilidades públicas</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">🔒 Información Privada</h4>
                  <p className="text-sm text-red-800 mb-2">Solo tú puedes ver:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• Tu email personal</li>
                    <li>• Número de teléfono</li>
                    <li>• Analytics personales</li>
                    <li>• Datos de sesión</li>
                  </ul>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">❌ Nunca Compartimos</h4>
                <p className="text-sm text-yellow-800">
                  No vendemos datos, no hacemos spam, no compartimos información 
                  sin consentimiento explícito.
                </p>
              </div>
            </div>
          )
        },
        {
          title: "Seguridad y Protección",
          content: (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">🔐 Medidas Técnicas</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Encriptación TLS 1.3</li>
                    <li>• Contraseñas hasheadas bcrypt</li>
                    <li>• Servidores certificados ISO 27001</li>
                    <li>• Backups encriptados</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">🏢 Medidas Organizacionales</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Acceso limitado al personal</li>
                    <li>• Autenticación de dos factores</li>
                    <li>• Auditorías regulares</li>
                    <li>• Formación en privacidad</li>
                  </ul>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">🌍 Ubicación de Datos</h4>
                <p className="text-sm text-green-800">
                  Servidores en la Unión Europea, cumplimiento GDPR, 
                  transferencias internacionales con protecciones adecuadas.
                </p>
              </div>
            </div>
          )
        },
        {
          title: "Sus Derechos GDPR",
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border text-center">
                  <div className="text-2xl mb-2">👀</div>
                  <h5 className="font-semibold text-sm text-gray-900">Acceso</h5>
                  <p className="text-xs text-gray-600">Ver todos sus datos</p>
                </div>
                <div className="bg-white p-3 rounded-lg border text-center">
                  <div className="text-2xl mb-2">✏️</div>
                  <h5 className="font-semibold text-sm text-gray-900">Rectificación</h5>
                  <p className="text-xs text-gray-600">Corregir información</p>
                </div>
                <div className="bg-white p-3 rounded-lg border text-center">
                  <div className="text-2xl mb-2">🗑️</div>
                  <h5 className="font-semibold text-sm text-gray-900">Supresión</h5>
                  <p className="text-xs text-gray-600">Eliminar cuenta</p>
                </div>
                <div className="bg-white p-3 rounded-lg border text-center">
                  <div className="text-2xl mb-2">📤</div>
                  <h5 className="font-semibold text-sm text-gray-900">Portabilidad</h5>
                  <p className="text-xs text-gray-600">Exportar datos</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📞 Ejercer sus derechos</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Email:</strong> privacy@startupmatch.com</p>
                  <p><strong>Respuesta:</strong> Máximo 30 días</p>
                  <p><strong>Sin costo:</strong> Completamente gratuito</p>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Retención y Contacto",
          content: (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">⏰ Retención de Datos</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">Cuenta activa:</p>
                    <p className="text-gray-600">Mientras use la plataforma</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Cuenta eliminada:</p>
                    <p className="text-gray-600">30 días para recuperación</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Logs de seguridad:</p>
                    <p className="text-gray-600">2 años (compliance)</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Analytics anónimos:</p>
                    <p className="text-gray-600">3 años (mejora servicio)</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Contacto y Soporte
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Privacidad:</strong> privacy@startupmatch.com</p>
                  <p><strong>DPO:</strong> dpo@startupmatch.com</p>
                  <p><strong>Soporte:</strong> support@startupmatch.com</p>
                  <p><strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00 CET</p>
                </div>
              </div>
            </div>
          )
        }
      ]
    }
  };

  const currentData = termsData[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {currentData.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentData.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Última actualización: 11 de Agosto, 2025
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {currentData.sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSection(index)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    currentSection === index
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {currentData.sections[currentSection].title}
                  </h3>
                  {currentData.sections[currentSection].content}
                </motion.div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Sección {currentSection + 1} de {currentData.sections.length}
                  </span>
                  <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                    disabled={currentSection === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentSection(Math.min(currentData.sections.length - 1, currentSection + 1))}
                    disabled={currentSection === currentData.sections.length - 1}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
