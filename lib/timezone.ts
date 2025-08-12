/**
 * Utilidades para manejo de fechas en la zona horaria de Madrid, España
 */

// Zona horaria de Madrid
export const MADRID_TIMEZONE = 'Europe/Madrid';

/**
 * Formatea una fecha a la hora local de Madrid
 */
export const formatMadridTime = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Adelantar 2 horas
  const adjustedDate = new Date(dateObj.getTime() + (2 * 60 * 60 * 1000));
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MADRID_TIMEZONE,
    hour12: false, // Formato 24 horas como es común en España
  };
  
  return adjustedDate.toLocaleTimeString('es-ES', { ...defaultOptions, ...options });
};

/**
 * Formatea una fecha completa en Madrid
 */
export const formatMadridDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Adelantar 2 horas para mantener consistencia
  const adjustedDate = new Date(dateObj.getTime() + (2 * 60 * 60 * 1000));
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: MADRID_TIMEZONE,
  };
  
  return adjustedDate.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
};

/**
 * Formatea fecha y hora completa en Madrid
 */
export const formatMadridDateTime = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Adelantar 2 horas para mantener consistencia
  const adjustedDate = new Date(dateObj.getTime() + (2 * 60 * 60 * 1000));
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MADRID_TIMEZONE,
    hour12: false,
  };
  
  return adjustedDate.toLocaleString('es-ES', { ...defaultOptions, ...options });
};

/**
 * Obtiene la hora actual en Madrid
 */
export const getCurrentMadridTime = (): Date => {
  return new Date();
};

/**
 * Formatea tiempo relativo en español para Madrid
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Adelantar 2 horas a ambas fechas para mantener consistencia
  const adjustedNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  const adjustedDate = new Date(dateObj.getTime() + (2 * 60 * 60 * 1000));
  
  // Convertir ambas fechas a la zona horaria de Madrid para comparar
  const madridNow = new Date(adjustedNow.toLocaleString('en-US', { timeZone: MADRID_TIMEZONE }));
  const madridDate = new Date(adjustedDate.toLocaleString('en-US', { timeZone: MADRID_TIMEZONE }));
  
  const diffInMs = madridNow.getTime() - madridDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return 'ahora';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    // Para fechas más antiguas, mostrar la fecha
    return formatMadridDate(adjustedDate, { day: 'numeric', month: 'short' });
  }
};

/**
 * Formatea tiempo para mensajes (hoy: hora, ayer: "Ayer", más antiguo: fecha)
 */
export const formatMessageTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Adelantar 2 horas a ambas fechas para mantener consistencia
  const adjustedNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  const adjustedDate = new Date(dateObj.getTime() + (2 * 60 * 60 * 1000));
  
  // Obtener fechas en zona horaria de Madrid
  const madridNow = new Date(adjustedNow.toLocaleString('en-US', { timeZone: MADRID_TIMEZONE }));
  const madridDate = new Date(adjustedDate.toLocaleString('en-US', { timeZone: MADRID_TIMEZONE }));
  
  const nowDay = madridNow.toDateString();
  const messageDay = madridDate.toDateString();
  
  const yesterday = new Date(madridNow);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDay = yesterday.toDateString();
  
  if (messageDay === nowDay) {
    // Hoy - mostrar solo la hora
    return formatMadridTime(dateObj);
  } else if (messageDay === yesterdayDay) {
    // Ayer
    return 'Ayer';
  } else {
    // Más antiguo - mostrar fecha
    const diffInMs = madridNow.getTime() - madridDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 7) {
      // Esta semana - mostrar día de la semana
      return madridDate.toLocaleDateString('es-ES', { 
        weekday: 'long',
        timeZone: MADRID_TIMEZONE 
      });
    } else {
      // Más antiguo - mostrar fecha completa
      return formatMadridDate(dateObj, { day: 'numeric', month: 'short' });
    }
  }
};

/**
 * Obtener información de la zona horaria de Madrid
 */
export const getMadridTimezoneInfo = (): { name: string; offset: string; isDST: boolean } => {
  const now = new Date();
  const madridTime = new Date(now.toLocaleString('en-US', { timeZone: MADRID_TIMEZONE }));
  const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  const offsetMs = madridTime.getTime() - utcTime.getTime();
  const offsetHours = offsetMs / (1000 * 60 * 60);
  const offsetString = `GMT${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
  // Verificar si es horario de verano (DST)
  const january = new Date(now.getFullYear(), 0, 1);
  const july = new Date(now.getFullYear(), 6, 1);
  const janOffset = january.getTimezoneOffset();
  const julOffset = july.getTimezoneOffset();
  const isDST = Math.max(janOffset, julOffset) !== now.getTimezoneOffset();
  
  return {
    name: 'Hora de Madrid (CET/CEST)',
    offset: offsetString,
    isDST
  };
};
