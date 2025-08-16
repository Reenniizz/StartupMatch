"use client";

import { motion } from "framer-motion";
import { Brain, Users, Settings, Shield, Sparkles, Target, Zap, Globe } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Differentiators = () => {
  const { ref, isInView } = useScrollAnimation();

  const features = [
    {
      icon: Brain,
      title: "IA predictiva y personalizada",
      description: "Algoritmos avanzados que aprenden de tus preferencias y comportamientos para mejorar los matches continuamente.",
      color: "from-blue-500 to-indigo-600",
      size: "large",
      stats: "98% precisión",
    },
    {
      icon: Users,
      title: "Comunidad exclusiva y curada",
      description: "Solo emprendedores verificados y startups con potencial real. Calidad sobre cantidad.",
      color: "from-green-500 to-teal-600",
      size: "medium",
      stats: "2.5K+ miembros",
    },
    {
      icon: Settings,
      title: "Herramientas integradas",
      description: "Todo lo que necesitas en un solo lugar: pitch decks, legal docs, métricas y más.",
      color: "from-purple-500 to-pink-600",
      size: "medium",
      stats: "15+ herramientas",
    },
    {
      icon: Shield,
      title: "Seguridad y privacidad avanzada",
      description: "Protección de ideas con NDA automáticos y encriptación de nivel empresarial.",
      color: "from-orange-500 to-red-600",
      size: "large",
      stats: "100% seguro",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  return (
    <section id="differentiators" className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-green-100 text-blue-700 rounded-full text-sm font-medium mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Lo que nos hace únicos
          </motion.span>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Diferenciadores que{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              definen el futuro
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tecnología de vanguardia combinada con un enfoque humano para crear conexiones realmente significativas.{" "}
            <span className="font-semibold text-gray-800">89% de éxito en formar equipos reales.</span>
          </p>
        </motion.div>

        {/* Asymmetric Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-6 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Large Feature 1 */}
          <motion.div
            className="lg:col-span-4 lg:row-span-2"
            variants={itemVariants}
          >
            <FeatureCard feature={features[0]} large />
          </motion.div>

          {/* Medium Feature 1 */}
          <motion.div
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <FeatureCard feature={features[1]} />
          </motion.div>

          {/* Medium Feature 2 */}
          <motion.div
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <FeatureCard feature={features[2]} />
          </motion.div>

          {/* Large Feature 2 */}
          <motion.div
            className="lg:col-span-6 lg:col-start-1"
            variants={itemVariants}
          >
            <FeatureCard feature={features[3]} horizontal />
          </motion.div>
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {[
            { icon: Target, value: "95%", label: "Success Rate" },
            { icon: Zap, value: "24h", label: "Avg. Response" },
            { icon: Globe, value: "50+", label: "Countries" },
            { icon: Users, value: "450+", label: "Startups Created" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl mb-4">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ feature, large = false, horizontal = false }: any) => {
  const cardHeight = large ? "h-96" : horizontal ? "h-48" : "h-40";
  
  return (
    <motion.div
      className={`group relative bg-gradient-to-br ${feature.color} rounded-2xl p-8 text-white overflow-hidden ${cardHeight} cursor-pointer`}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.3 } 
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12" />
      </div>

      <div className={`relative h-full flex flex-col ${horizontal ? 'lg:flex-row lg:items-center' : 'justify-between'}`}>
        <div className={horizontal ? 'lg:flex-1' : ''}>
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl mb-6"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <feature.icon className="w-8 h-8" />
          </motion.div>

          <h3 className={`font-bold mb-4 ${large || horizontal ? 'text-2xl lg:text-3xl' : 'text-xl'}`}>
            {feature.title}
          </h3>
          
          <p className={`text-white/90 leading-relaxed ${large ? 'text-lg' : 'text-sm'}`}>
            {feature.description}
          </p>
        </div>

        {horizontal && (
          <div className="lg:flex-1 lg:ml-8 mt-6 lg:mt-0">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{feature.stats}</div>
              <div className="text-white/80 text-sm">Performance metric</div>
            </div>
          </div>
        )}

        {!horizontal && (
          <div className="mt-auto">
            <motion.div
              className="inline-flex items-center text-white/80 text-sm font-medium group-hover:text-white transition-colors"
              whileHover={{ x: 5 }}
            >
              {feature.stats}
              <motion.div
                className="ml-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                →
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />
    </motion.div>
  );
};

export default Differentiators;