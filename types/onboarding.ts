interface UserOnboardingData {
  // Paso 1: Básico (30 segundos)
  fullName: string;
  location: string;
  desiredRole: 'founder' | 'cofounder' | 'cto' | 'cmo' | 'other';
  
  // Paso 2: Experiencia (1 minuto)
  experienceYears: number;
  topSkills: string[]; // Máximo 5
  bio: string;
  
  // Paso 3: Preferencias (30 segundos)
  industries: string[];
  availabilityHours: number;
  collaborationStyle: 'remote' | 'hybrid' | 'inperson';
}

export type { UserOnboardingData };
