"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lightbulb, MessageCircle, Rocket, ArrowRight, CheckCircle, Play } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { ref, isInView } = useScrollAnimation();

  const steps = [
    {
      icon: User,
      title: "Crea tu perfil",
      subtitle: "En solo 3 minutos",
      description: "Completa tu perfil profesional. Nuestra IA analiza tus habilidades, experiencia y objetivos para encontrar matches perfectos.",
      features: ["Setup automático", "Análisis de skills", "Verificación instantánea"],
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      number: "01"
    },
    {
      icon: Lightbulb,
      title: "Publica o explora ideas",
      subtitle: "Matching inteligente",
      description: "Comparte tu idea de startup o explora proyectos existentes. El algoritmo encuentra cofundadores ideales basado en complementariedad.",
      features: ["Ideas verificadas", "Matching IA", "Compatibilidad 95%+"],
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      number: "02"
    },
    {
      icon: MessageCircle,
      title: "Conecta y comunícate",
      subtitle: "Herramientas integradas",
      description: "Herramientas de comunicación diseñadas para emprendedores. Chat, videollamadas y espacios colaborativos.",
      features: ["Chat seguro", "Video calls HD", "Workspaces compartidos"],
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      number: "03"
    },
    {
      icon: Rocket,
      title: "Construye tu startup",
      subtitle: "Gestión colaborativa",
      description: "Una vez conectados, accede a herramientas para gestionar tu startup: pitch decks, métricas y milestones.",
      features: ["Project management", "Pitch builder", "Analytics avanzados"],
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      number: "04"
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Cómo{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              funciona
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un proceso simple y poderoso que conecta emprendedores de manera inteligente
          </p>
        </motion.div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          {/* Steps Grid */}
          <div className="grid grid-cols-4 gap-8 mb-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`relative cursor-pointer transition-all duration-300 ${
                  activeStep === index ? 'transform -translate-y-2' : ''
                }`}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setActiveStep(index)}
                onClick={() => setActiveStep(index)}
              >
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-8 -right-4 w-8 h-0.5 bg-gray-300 z-0">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: activeStep > index ? '100%' : '0%' }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                )}

                {/* Step Card */}
                <div className={`${step.bgColor} rounded-2xl p-6 text-center relative z-10 transition-all duration-300 ${
                  activeStep === index ? 'ring-2 ring-blue-500 shadow-xl' : 'shadow-md hover:shadow-lg'
                }`}>
                  {/* Step Number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-4`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{step.subtitle}</p>
                  
                  {/* Features Preview */}
                  <div className="space-y-1">
                    {step.features.slice(0, 2).map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-center justify-center text-xs text-gray-700">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active Step Details */}
          <motion.div
            key={activeStep}
            className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {steps[activeStep].title}
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {steps[activeStep].description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {steps[activeStep].features.map((feature, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center text-gray-700"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center group">
                  <Play className="w-5 h-5 mr-2" />
                  Ver demo de este paso
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="relative">
                <div className={`w-full h-80 ${steps[activeStep].bgColor} rounded-2xl flex items-center justify-center relative overflow-hidden`}>
                  {/* Animated Background */}
                  <div className="absolute inset-0 opacity-20">
                    <motion.div
                      className={`w-32 h-32 bg-gradient-to-r ${steps[activeStep].color} rounded-full blur-xl`}
                      animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  
                  {/* Main Icon */}
                  <div className={`w-32 h-32 bg-gradient-to-r ${steps[activeStep].color} rounded-2xl flex items-center justify-center relative z-10`}>
                    {activeStep === 0 && <User className="w-16 h-16 text-white" />}
                    {activeStep === 1 && <Lightbulb className="w-16 h-16 text-white" />}
                    {activeStep === 2 && <MessageCircle className="w-16 h-16 text-white" />}
                    {activeStep === 3 && <Rocket className="w-16 h-16 text-white" />}
                  </div>

                  {/* Floating Elements */}
                  <motion.div
                    className="absolute top-8 right-8 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    ✨
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center flex-shrink-0`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-bold text-blue-500 mr-2">{step.number}</span>
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">{step.description}</p>
                  <ul className="space-y-1">
                    {step.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;