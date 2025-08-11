"use client";

import { motion } from "framer-motion";
import { Brain, Users, Target, Zap } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      icon: Brain,
      title: "1. Crea tu perfil",
      description: "Completa tu perfil con tus habilidades, experiencia y visión de negocio."
    },
    {
      id: 2,
      icon: Users,
      title: "2. IA encuentra matches",
      description: "Nuestro algoritmo inteligente encuentra cofundadores compatibles contigo."
    },
    {
      id: 3,
      icon: Target,
      title: "3. Conecta y colabora",
      description: "Inicia conversaciones y evalúa la compatibilidad con tus matches."
    },
    {
      id: 4,
      icon: Zap,
      title: "4. Construye tu startup",
      description: "Forma tu equipo ideal y comienza a construir el futuro juntos."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un proceso simple y efectivo para encontrar a tu cofundador ideal
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-4 mx-auto">
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                {step.title}
              </h3>
              <p className="text-gray-600 text-center">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
