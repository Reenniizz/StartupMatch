"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Testimonials = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const { ref, isInView } = useScrollAnimation();

  const testimonials = [
    {
      name: "Ana Martínez",
      role: "Co-founder & CEO",
      company: "EcoTech Solutions",
      image: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150",
      content: "StartupMatch cambió completamente mi perspectiva sobre formar equipos. En solo 2 semanas encontré a mi cofundador perfecto.",
      story: "Después de 6 meses buscando un CTO, la IA de StartupMatch me conectó con María en 48 horas. Hoy tenemos una startup valorada en $2M.",
      rating: 5,
      metrics: { funding: "$2M", time: "2 weeks", growth: "300%" }
    },
    {
      name: "Carlos Rivera",
      role: "Technical Co-founder",
      company: "FinanceAI",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
      content: "La precisión del matching es increíble. No es solo habilidades, sino visión compartida y química personal.",
      story: "Como desarrollador introvertido, networking era mi pesadilla. StartupMatch me ayudó a encontrar socios que complementan perfectamente mis habilidades técnicas.",
      rating: 5,
      metrics: { matches: "12", success: "95%", team: "5 miembros" }
    },
    {
      name: "Isabella Chen",
      role: "Product Manager",
      company: "HealthTech Innovations",
      image: "https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=150",
      content: "Las herramientas integradas nos ahorraron meses de trabajo. Desde el pitch deck hasta las métricas, todo en un lugar.",
      story: "Lo que más me impresionó fue cómo la plataforma facilitó no solo el match inicial, sino toda la colaboración posterior.",
      rating: 5,
      metrics: { time_saved: "4 months", tools: "12+", efficiency: "85%" }
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden" ref={containerRef}>
      {/* Background Elements */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"
        style={{ y }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium mb-6 border border-blue-100"
            whileHover={{ scale: 1.05 }}
          >
            <Quote className="w-4 h-4 mr-2" />
            Historias de éxito reales
          </motion.span>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Testimonios con{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              storytelling
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre cómo StartupMatch ha transformado la forma en que los emprendedores construyen sus equipos y startups
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="group"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <TestimonialCard testimonial={testimonial} index={index} />
            </motion.div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "4.9/5", label: "Rating promedio" },
              { value: "450+", label: "Startups exitosas" },
              { value: "$50M+", label: "Funding generado" },
              { value: "95%", label: "Recomiendan la plataforma" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial, index }: any) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full"
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
    >
      {/* Rating Stars */}
      <div className="flex items-center mb-6">
        {[...Array(testimonial.rating)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + i * 0.05 }}
          >
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Quote */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.2 + 0.3 }}
      >
        <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-500/20" />
        <p className="text-gray-700 text-lg leading-relaxed italic pl-6">
          &ldquo;{testimonial.content}&rdquo;
        </p>
      </motion.div>

      {/* Story */}
      <motion.div
        className="bg-gray-50 rounded-lg p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 + 0.4 }}
      >
        <h4 className="font-semibold text-gray-900 mb-2">Su historia:</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {testimonial.story}
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 + 0.5 }}
      >
        {Object.entries(testimonial.metrics).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="font-bold text-blue-600">{String(value)}</div>
            <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
          </div>
        ))}
      </motion.div>

      {/* Author */}
      <motion.div
        className="flex items-center mt-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.2 + 0.6 }}
      >
        <motion.img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gray-100"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        />
        <div>
          <div className="font-semibold text-gray-900">{testimonial.name}</div>
          <div className="text-sm text-gray-600">{testimonial.role}</div>
          <div className="text-xs text-blue-600 font-medium">{testimonial.company}</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Testimonials;