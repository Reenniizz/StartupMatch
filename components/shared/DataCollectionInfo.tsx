import { Shield, Eye, Lock, Users, Database, CheckCircle, XCircle } from "lucide-react";

export default function DataCollectionInfo() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¿Qué datos guardamos?
        </h1>
        <p className="text-gray-600">
          Transparencia total sobre tu información en StartupMatch
        </p>
      </div>

      {/* Datos que recopilamos */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Información Personal
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">Nombre y apellido</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">Email (autenticación)</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">Username único</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm text-gray-700">Teléfono (opcional)</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Información Profesional
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">Rol actual</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">Industria</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">Ubicación</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">Habilidades</span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacidad */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Eye className="w-6 h-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Información Pública
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Otros emprendedores pueden ver:
          </p>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">• Nombre y rol</div>
            <div className="text-xs text-gray-500">• Industria y ubicación</div>
            <div className="text-xs text-gray-500">• Habilidades</div>
            <div className="text-xs text-gray-500">• Qué estás buscando</div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center mb-4">
            <Lock className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Información Privada
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Solo tú puedes ver:
          </p>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">• Tu email</div>
            <div className="text-xs text-gray-500">• Tu teléfono</div>
            <div className="text-xs text-gray-500">• Datos de sesión</div>
            <div className="text-xs text-gray-500">• Analytics personales</div>
          </div>
        </div>
      </div>

      {/* Lo que NO hacemos */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <XCircle className="w-6 h-6 text-red-600 mr-2" />
          Lo que NUNCA hacemos
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-700">Vender tus datos</span>
          </div>
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-700">Spam o marketing</span>
          </div>
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-700">Compartir sin permiso</span>
          </div>
        </div>
      </div>

      {/* Tus derechos */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🛡️ Tus derechos (GDPR)
        </h3>
        <div className="grid md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">👀</div>
            <div className="text-sm font-medium text-gray-900">Ver</div>
            <div className="text-xs text-gray-600">Accede a todos tus datos</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">✏️</div>
            <div className="text-sm font-medium text-gray-900">Editar</div>
            <div className="text-xs text-gray-600">Cambia tu información</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">📤</div>
            <div className="text-sm font-medium text-gray-900">Exportar</div>
            <div className="text-xs text-gray-600">Descarga tus datos</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">🗑️</div>
            <div className="text-sm font-medium text-gray-900">Eliminar</div>
            <div className="text-xs text-gray-600">Borra tu cuenta</div>
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          ¿Preguntas sobre tus datos? Contáctanos en{" "}
          <a href="mailto:privacy@startupmatch.com" className="text-blue-600 hover:text-blue-700 font-medium">
            privacy@startupmatch.com
          </a>
        </p>
      </div>
    </div>
  );
}
