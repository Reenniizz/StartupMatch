"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Zap, Building, MapPin, Plus, X, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpAndLogin, user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic info
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "", // New optional phone field
    password: "",
    confirmPassword: "",
    // Step 2: Professional info
    role: "",
    customRole: "", // New field for custom role
    company: "",
    industry: "",
    customIndustry: "", // New field for custom industry
    location: "",
    // Step 3: Interests
    lookingFor: [] as string[],
    skills: ["", "", ""] as string[], // Start with 3 empty skills
    agreeToTerms: false,
    // Legal acceptance
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // All hooks must be called unconditionally
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              StartupMatch
            </span>
          </div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </motion.div>
      </div>
    );
  }

  // Show dashboard redirect message if user is logged in
  if (user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              StartupMatch
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Ya estás conectado!</h1>
          <p className="text-gray-600 mb-6">Te estamos redirigiendo a tu dashboard...</p>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <Link 
            href="/dashboard" 
            className="inline-block bg-gradient-to-r from-blue-600 to-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          >
            Ir al Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear custom fields when changing from "Otros" to another option
      if (name === "role" && value !== "Otros") {
        setFormData(prev => ({ ...prev, customRole: "" }));
      }
      if (name === "industry" && value !== "Otros") {
        setFormData(prev => ({ ...prev, customIndustry: "" }));
      }
    }
    
    // Clear error when user starts typing/selecting
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    // Clear custom field errors too
    if (name === "role" && errors.customRole) {
      setErrors(prev => ({ ...prev, customRole: "" }));
    }
    if (name === "industry" && errors.customIndustry) {
      setErrors(prev => ({ ...prev, customIndustry: "" }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // New functions for dynamic skills
  const handleSkillChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === index ? value : skill)
    }));
  };

  const addSkillField = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, ""]
    }));
  };

  const removeSkillField = (index: number) => {
    if (formData.skills.length > 3) { // Keep minimum 3 fields
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index)
      }));
    }
  };

  const handleLookingForToggle = (option: string) => {
    setFormData(prev => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(option)
        ? prev.lookingFor.filter(o => o !== option)
        : [...prev.lookingFor, option]
    }));
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName) newErrors.firstName = "El nombre es requerido";
    if (!formData.lastName) newErrors.lastName = "El apellido es requerido";
    
    if (!formData.username) {
      newErrors.username = "El nombre de usuario es requerido";
    } else if (formData.username.length < 3) {
      newErrors.username = "El nombre de usuario debe tener al menos 3 caracteres";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Solo se permiten letras, números y guión bajo";
    }
    
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.role) {
      newErrors.role = "El rol es requerido";
    } else if (formData.role === "Otros" && !formData.customRole.trim()) {
      newErrors.customRole = "Especifica tu rol";
    }
    
    if (!formData.industry) {
      newErrors.industry = "La industria es requerida";
    } else if (formData.industry === "Otros" && !formData.customIndustry.trim()) {
      newErrors.customIndustry = "Especifica tu industria";
    }
    
    if (!formData.location) newErrors.location = "La ubicación es requerida";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (formData.lookingFor.length === 0) {
      newErrors.lookingFor = "Selecciona al menos una opción";
    }
    
    // Filter out empty skills and check if we have at least 3 non-empty skills
    const filledSkills = formData.skills.filter(skill => skill.trim() !== "");
    if (filledSkills.length < 3) {
      newErrors.skills = "Ingresa al menos 3 habilidades";
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
    }
    
    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = "Debes aceptar la política de privacidad";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    if (currentStep === 1) isValid = validateStep1();
    if (currentStep === 2) isValid = validateStep2();
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep3()) return;
    
    setIsLoading(true);
    
    try {
      // Prepare user metadata
      const userMetadata = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone, // Include phone in metadata
        role: formData.role === "Otros" ? formData.customRole : formData.role,
        company: formData.company,
        industry: formData.industry === "Otros" ? formData.customIndustry : formData.industry,
        location: formData.location,
        lookingFor: formData.lookingFor,
        skills: formData.skills.filter(skill => skill.trim() !== "") // Filter empty skills
      };

      // 🔍 DEBUG: Log registration attempt details
      console.log("🚀 INICIANDO REGISTRO:");
      console.log("📧 Email:", formData.email);
      console.log("👤 Username:", formData.username);
      console.log("📋 Metadata:", userMetadata);
      console.log("🔑 Password length:", formData.password.length);

      const result = await signUpAndLogin(
        formData.email, 
        formData.password,
        userMetadata
      );

      // 🔍 DEBUG: Log result
      console.log("✅ RESULTADO DEL REGISTRO:", result);
      
      if (result.error) {
        console.error("❌ ERROR EN REGISTRO:", result.error);
        console.error("❌ Error message:", result.error.message);
        console.error("❌ Error code:", result.error.code);
        console.error("❌ Full error:", result.error);
        
        if (result.error.message.includes('User already registered')) {
          setErrors({ general: "Este email ya está registrado. Intenta iniciar sesión." });
        } else if (result.error.message.includes('Password should be')) {
          setErrors({ general: "La contraseña debe tener al menos 6 caracteres" });
        } else if (result.error.message.includes('Database error')) {
          setErrors({ general: `Error de base de datos: ${result.error.message}` });
        } else {
          setErrors({ general: `Error: ${result.error.message}` });
        }
      } else {
        console.log("✅ REGISTRO EXITOSO");
        console.log("📧 Needs confirmation:", result.needsConfirmation);
        console.log("👤 User data:", result.user);
        
        if (result.needsConfirmation) {
          console.log("📧 Redirigiendo a login con mensaje de confirmación");
          // Email confirmation required - redirect to login with message
          router.push("/login?message=Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta");
        } else {
          console.log("🏠 Redirigiendo al dashboard");
          // Direct login successful - go to dashboard
          router.push("/dashboard");
        }
      }
      
    } catch (error) {
      console.error("💥 EXCEPCIÓN EN REGISTRO:", error);
      console.error("💥 Error type:", typeof error);
      console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack');
      setErrors({ general: `Error inesperado: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const industries = [
    "Tecnología", "Fintech", "E-commerce", "Salud", "Educación", "Entretenimiento", 
    "Logística", "Inmobiliaria", "Energía", "Agricultura", "Manufactura", "Otros"
  ];

  const roles = [
    "Fundador/CEO", "Director de Tecnología (CTO)", "Gerente de Producto", "Desarrollador", "Diseñador", "Marketing", 
    "Ventas", "Desarrollo de Negocio", "Inversionista", "Asesor", "Otros"
  ];

  const lookingForOptions = [
    "Co-fundador técnico", "Co-fundador de negocio", "Inversionistas", 
    "Mentores", "Equipo de desarrollo", "Socios estratégicos"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:block text-sm">Volver</span>
        </Link>
      </div>

      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <motion.div 
              className="flex items-center justify-center gap-2 mb-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                StartupMatch
              </span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Crea tu cuenta</h1>
            <p className="text-sm text-gray-600">Encuentra tu cofundador ideal en 3 pasos</p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Información básica</span>
              <span>Perfil profesional</span>
              <span>Intereses</span>
            </div>
          </div>

          {/* Form */}
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <form onSubmit={handleSubmit}>
              {/* General error */}
              {errors.general && (
                <motion.div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.general}
                </motion.div>
              )}

              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Información básica</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.firstName ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Juan"
                        />
                      </div>
                      {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                    </div>

                    <div className="md:col-span-1">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.lastName ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Pérez"
                        />
                      </div>
                      {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                    </div>

                    <div className="md:col-span-1">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.username ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="juan_perez"
                        />
                      </div>
                      {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="juan@email.com"
                        />
                      </div>
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono <span className="text-gray-500 text-xs">(opcional)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="+34 600 123 456"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full pl-9 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar contraseña *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-9 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Professional Information */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Perfil profesional</h2>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuál es tu rol actual? *
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.role ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    >
                      <option value="">Selecciona tu rol</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                    
                    {/* Custom role input */}
                    {formData.role === "Otros" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3"
                      >
                        <input
                          type="text"
                          name="customRole"
                          value={formData.customRole}
                          onChange={handleInputChange}
                          placeholder="Escribe tu rol"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-blue-50 ${
                            errors.customRole ? "border-red-300" : "border-blue-200"
                          }`}
                        />
                        {errors.customRole && <p className="mt-1 text-sm text-red-600">{errors.customRole}</p>}
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa actual (opcional)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Mi empresa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                        Industria *
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.industry ? "border-red-300 bg-red-50" : "border-gray-300"
                        }`}
                      >
                        <option value="">Selecciona industria</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                      {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
                      
                      {/* Custom industry input */}
                      {formData.industry === "Otros" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-3"
                        >
                          <input
                            type="text"
                            name="customIndustry"
                            value={formData.customIndustry}
                            onChange={handleInputChange}
                            placeholder="Escribe tu industria"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-blue-50 ${
                              errors.customIndustry ? "border-red-300" : "border-blue-200"
                            }`}
                          />
                          {errors.customIndustry && <p className="mt-1 text-sm text-red-600">{errors.customIndustry}</p>}
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Ubicación *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.location ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Ciudad, País"
                        />
                      </div>
                      {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Interests and Skills */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">¡Casi listo!</h2>
                    <p className="text-gray-600 text-sm">Cuéntanos sobre tus intereses y habilidades</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100">
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      ¿Qué estás buscando? ✨
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {lookingForOptions.map(option => (
                        <motion.label 
                          key={option} 
                          className={`group flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            formData.lookingFor.includes(option)
                              ? 'bg-white border-2 border-blue-300 shadow-sm'
                              : 'bg-white/70 border-2 border-transparent hover:border-blue-200'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={formData.lookingFor.includes(option)}
                              onChange={() => handleLookingForToggle(option)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                              formData.lookingFor.includes(option)
                                ? 'bg-gradient-to-r from-blue-500 to-green-500 border-blue-500'
                                : 'border-gray-300 group-hover:border-blue-400'
                            }`}>
                              {formData.lookingFor.includes(option) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-1"
                                />
                              )}
                            </div>
                          </div>
                          <span className={`ml-2 text-xs font-medium transition-colors ${
                            formData.lookingFor.includes(option) ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {option}
                          </span>
                        </motion.label>
                      ))}
                    </div>
                    {errors.lookingFor && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs text-red-600 flex items-center gap-1"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                        {errors.lookingFor}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Tus habilidades principales *
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Escribe y presiona Enter para agregar (mínimo 3)
                    </p>
                    
                    {/* Skills display as pills */}
                    <div className="mb-3">
                      {formData.skills.filter(skill => skill.trim() !== "").length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          {formData.skills
                            .filter(skill => skill.trim() !== "")
                            .map((skill, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-green-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <span>{skill}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const originalIndex = formData.skills.findIndex(s => s === skill);
                                    removeSkillField(originalIndex);
                                  }}
                                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </motion.div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Input for new skill */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        placeholder="Ej: React, Marketing Digital, Liderazgo..."
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder:text-gray-400"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value && !formData.skills.includes(value)) {
                              const emptyIndex = formData.skills.findIndex(skill => skill.trim() === "");
                              if (emptyIndex !== -1) {
                                handleSkillChange(emptyIndex, value);
                              } else {
                                addSkillField();
                                handleSkillChange(formData.skills.length, value);
                              }
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        Enter ↵
                      </div>
                    </div>
                    
                    {/* Compact progress indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((num) => (
                            <div
                              key={num}
                              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                                formData.skills.filter(skill => skill.trim() !== "").length >= num
                                  ? 'bg-gradient-to-r from-blue-500 to-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                          {formData.skills.filter(skill => skill.trim() !== "").length > 3 && (
                            <div className="text-xs text-blue-600 font-medium ml-1">
                              +{formData.skills.filter(skill => skill.trim() !== "").length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formData.skills.filter(skill => skill.trim() !== "").length}/3+ habilidades
                        </span>
                      </div>
                      
                      {formData.skills.filter(skill => skill.trim() !== "").length >= 3 && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1 text-green-600"
                        >
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium">Completado</span>
                        </motion.div>
                      )}
                    </div>
                    
                    {errors.skills && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-600 flex items-center gap-1"
                      >
                        <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                        {errors.skills}
                      </motion.p>
                    )}
                  </div>

                  {/* Terms and Conditions Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      {/* Terms of Service */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="acceptTerms"
                          checked={formData.acceptTerms || false}
                          onChange={(e) => setFormData(prev => ({...prev, acceptTerms: e.target.checked}))}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-5">
                          Acepto los{' '}
                          <Link
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                          >
                            términos y condiciones de uso
                          </Link>
                        </label>
                      </div>
                      
                      {/* Privacy Policy */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="acceptPrivacy"
                          checked={formData.acceptPrivacy || false}
                          onChange={(e) => setFormData(prev => ({...prev, acceptPrivacy: e.target.checked}))}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="acceptPrivacy" className="text-sm text-gray-700 leading-5">
                          Acepto la{' '}
                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                          >
                            política de privacidad
                          </Link>{' '}
                          y el tratamiento de mis datos personales
                        </label>
                      </div>

                      {/* Marketing Communications (Optional) */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="acceptMarketing"
                          checked={formData.acceptMarketing || false}
                          onChange={(e) => setFormData(prev => ({...prev, acceptMarketing: e.target.checked}))}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="acceptMarketing" className="text-sm text-gray-700 leading-5">
                          <span className="text-gray-500">(Opcional)</span> Acepto recibir comunicaciones promocionales y newsletters sobre nuevas funcionalidades
                        </label>
                      </div>
                    </div>

                    {/* Error Messages */}
                    {(errors.acceptTerms || errors.acceptPrivacy) && (
                      <motion.div 
                        className="bg-red-50 border border-red-200 rounded-lg p-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="space-y-1">
                          {errors.acceptTerms && (
                            <p className="text-sm text-red-800 flex items-center gap-1">
                              <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                              {errors.acceptTerms}
                            </p>
                          )}
                          {errors.acceptPrivacy && (
                            <p className="text-sm text-red-800 flex items-center gap-1">
                              <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
                              {errors.acceptPrivacy}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {(!formData.acceptTerms || !formData.acceptPrivacy) && (
                      <motion.div 
                        className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <p className="text-sm text-amber-800">
                          ⚠️ Debes aceptar los términos y condiciones y la política de privacidad para continuar
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <div>
                  {currentStep > 1 && (
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Anterior
                    </motion.button>
                  )}
                </div>
                
                <div>
                  {currentStep < 3 ? (
                    <motion.button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Continuar
                      <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                        <ArrowLeft className="w-2.5 h-2.5 rotate-180" />
                      </div>
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          <span>¡Crear cuenta!</span>
                          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                            <Zap className="w-3 h-3" />
                          </div>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </form>

            {/* Login link */}
            {currentStep === 1 && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
