"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Mail, User, Briefcase, Target, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/appStore";

interface FormData {
  name: string;
  email: string;
  role: string;
  experience: string;
  goals: string;
}

const GetStarted = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { formProgress, setFormProgress } = useAppStore();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      role: "",
      experience: "",
      goals: ""
    }
  });

  const watchedFields = watch();
  const totalSteps = 5;

  // Calculate progress based on filled fields
  useEffect(() => {
    const filledFields = Object.values(watchedFields).filter(value => value && value.length > 0).length;
    const progress = (filledFields / totalSteps) * 100;
    
    // Only update if progress has actually changed
    if (progress !== formProgress) {
      setFormProgress(progress);
    }
  }, [watchedFields, formProgress, setFormProgress]);

  const steps = [
    {
      id: "name",
      label: "Tu nombre",
      icon: User,
      placeholder: "Ej: María García",
      type: "text",
      validation: { required: "Tu nombre es requerido", minLength: { value: 2, message: "Mínimo 2 caracteres" } }
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      placeholder: "tu@email.com",
      type: "email",
      validation: { 
        required: "Email es requerido", 
        pattern: { value: /^\S+@\S+$/i, message: "Email inválido" } 
      }
    },
    {
      id: "role",
      label: "Tu rol principal",
      icon: Briefcase,
      placeholder: "Ej: CEO, CTO, Designer...",
      type: "text",
      validation: { required: "Tu rol es requerido" }
    },
    {
      id: "experience",
      label: "Años de experiencia",
      icon: Target,
      placeholder: "Ej: 0-2, 3-5, 5+",
      type: "text",
      validation: { required: "Experiencia es requerida" }
    },
    {
      id: "goals",
      label: "¿Qué buscas?",
      icon: Sparkles,
      placeholder: "Ej: Cofundador técnico, mentor, equipo completo...",
      type: "textarea",
      validation: { required: "Tus objetivos son requeridos", minLength: { value: 10, message: "Describe más detalladamente tus objetivos" } }
    }
  ];

  const onSubmit = async (data: FormData) => {
    console.log("Form submitted:", data);
    setIsSubmitted(true);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getDynamicText = () => {
    const progress = formProgress;
    if (progress < 20) return "¡Empecemos! Cuéntanos sobre ti...";
    if (progress < 40) return "¡Genial! Sigamos conociendo tu perfil...";
    if (progress < 60) return "¡Excelente! Ya casi terminamos...";
    if (progress < 80) return "¡Increíble! Solo un paso más...";
    return "¡Perfecto! Todo listo para conectarte...";
  };

  const getButtonColor = () => {
    const progress = formProgress;
    if (progress < 25) return "from-gray-400 to-gray-500";
    if (progress < 50) return "from-blue-400 to-blue-500";
    if (progress < 75) return "from-blue-500 to-green-500";
    return "from-green-500 to-emerald-500";
  };

  if (isSubmitted) {
    return (
      <section id="get-started" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              ¡Bienvenido a StartupMatch! 🚀
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Hemos recibido tu información. Prepárate para conectar con emprendedores increíbles.
            </p>
            <motion.button
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Ir al Dashboard
            </motion.button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="get-started" className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Empieza{" "}
            <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
              hoy
            </span>
          </h2>
          
          <motion.p
            className="text-xl text-gray-600 mb-8"
            key={formProgress}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getDynamicText()}
          </motion.p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progreso</span>
              <span>{Math.round(formProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${formProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Step Indicator */}
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center space-x-4">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? "bg-blue-500 w-8"
                            : index < currentStep
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Current Step */}
                {steps.map((step, index) => {
                  if (index !== currentStep) return null;
                  
                  const fieldName = step.id as keyof FormData;
                  
                  return (
                    <motion.div
                      key={step.id}
                      className="space-y-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="text-center">
                        <motion.div
                          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl mb-4"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <step.icon className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {step.label}
                        </h3>
                      </div>

                      <div className="max-w-lg mx-auto">
                        {step.type === "textarea" ? (
                          <textarea
                            {...register(fieldName, step.validation)}
                            placeholder={step.placeholder}
                            className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none h-32"
                          />
                        ) : (
                          <motion.input
                            type={step.type}
                            {...register(fieldName, step.validation)}
                            placeholder={step.placeholder}
                            className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg"
                            whileFocus={{ scale: 1.02 }}
                          />
                        )}
                        
                        {errors[fieldName] && (
                          <motion.p
                            className="text-red-500 text-sm mt-2 text-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {errors[fieldName]?.message}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8">
              <motion.button
                type="button"
                onClick={prevStep}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  currentStep === 0
                    ? "invisible"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Anterior
              </motion.button>

              <div className="text-center flex-1">
                <span className="text-sm text-gray-500">
                  {currentStep + 1} de {totalSteps}
                </span>
              </div>

              {currentStep < totalSteps - 1 ? (
                <motion.button
                  type="button"
                  onClick={nextStep}
                  disabled={!watchedFields[steps[currentStep].id as keyof FormData]}
                  className={`px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${getButtonColor()} flex items-center group`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Siguiente
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={!isValid}
                  className={`px-8 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${getButtonColor()} flex items-center group`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Conectar ahora
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default GetStarted;