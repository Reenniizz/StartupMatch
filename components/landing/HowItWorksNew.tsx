"use client";

import { motion } from "framer-motion";
import { Brain, Users, Target, Zap } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      icon: Brain,
      title: "Perfil inteligente en 2 minutos",
      description: "IA analiza tu experiencia, skills y visión para crear un perfil que atrae co-founders de alto nivel.",
      highlight: "IA personalizada",
      metric: "94% precisión"
    },
    {
      id: 2,
      icon: Users,
      title: "Algoritmo de compatibilidad avanzado",
      description: "Más que skills: matching por personalidad, valores, equity expectations y working style.",
      highlight: "Matching 360°",
      metric: "12x más efectivo"
    },
    {
      id: 3,
      icon: Target,
      title: "Conversaciones pre-calificadas",
      description: "Solo conectas con founders pre-validados. NDA automático y context cards para iniciar.",
      highlight: "Zero waste time",
      metric: "89% response rate"
    },
    {
      id: 4,
      icon: Zap,
      title: "De match a startup en 30 días",
      description: "Herramientas integradas: pitch deck, legal docs, equity calculator y roadmap colaborativo.",
      highlight: "All-in-one",
      metric: "30 días promedio"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-4 h-4 mr-2" />
            El proceso más eficiente del mercado
          </motion.span>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            De idea solitaria a{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              equipo fundador
            </span>{" "}
            en 4 pasos
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nuestro proceso está optimizado para founders serios que buscan co-founders de alto nivel. 
            <span className="font-semibold text-gray-800"> 89% de nuestros matches forman equipos reales.</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`relative group ${
                index % 2 === 0 ? 'lg:pr-8' : 'lg:pl-8'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              {/* Connection line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-1/2 w-px h-24 bg-gradient-to-b from-blue-300 to-transparent transform -translate-x-1/2 z-0" />
              )}
              
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group-hover:border-blue-200">
                {/* Step number badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {step.id}
                </div>
                
                {/* Icon and highlight */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {step.title}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        {step.highlight}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-green-600">
                        {step.metric}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* CTA Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Listo para encontrar tu co-founder ideal?
            </h3>
            <p className="text-gray-600 mb-6">
              Únete a 12,847 founders que ya encontraron a su equipo perfecto
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Empezar ahora - Es gratis
              </motion.button>
              <motion.button
                className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Ver casos de éxito
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
