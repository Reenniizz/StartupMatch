// Test de las utilidades de timezone de Madrid
import { 
  formatMadridTime, 
  formatMadridDate, 
  formatMadridDateTime, 
  formatRelativeTime, 
  formatMessageTime, 
  getMadridTimezoneInfo 
} from '../lib/timezone';

// Función para probar las utilidades
const testMadridTimezone = () => {
  console.log('🕐 Testing Madrid Timezone Utilities...\n');
  
  const testDate = new Date('2025-08-12T15:30:00Z'); // UTC
  const now = new Date();
  
  console.log('📅 Fecha de prueba (UTC):', testDate.toISOString());
  console.log('📅 Fecha actual (UTC):', now.toISOString());
  console.log('');
  
  // Test formatMadridTime
  console.log('⏰ formatMadridTime:');
  console.log('  Resultado:', formatMadridTime(testDate));
  console.log('  Actual:', formatMadridTime(now));
  console.log('');
  
  // Test formatMadridDate
  console.log('📆 formatMadridDate:');
  console.log('  Resultado:', formatMadridDate(testDate));
  console.log('  Actual:', formatMadridDate(now));
  console.log('');
  
  // Test formatMadridDateTime
  console.log('📅⏰ formatMadridDateTime:');
  console.log('  Resultado:', formatMadridDateTime(testDate));
  console.log('  Actual:', formatMadridDateTime(now));
  console.log('');
  
  // Test formatRelativeTime
  console.log('⏳ formatRelativeTime:');
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('  5 minutos atrás:', formatRelativeTime(fiveMinutesAgo));
  console.log('  1 hora atrás:', formatRelativeTime(oneHourAgo));
  console.log('  1 día atrás:', formatRelativeTime(oneDayAgo));
  console.log('');
  
  // Test formatMessageTime
  console.log('💬 formatMessageTime:');
  console.log('  Ahora:', formatMessageTime(now));
  console.log('  Ayer:', formatMessageTime(oneDayAgo));
  console.log('  Una semana atrás:', formatMessageTime(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
  console.log('');
  
  // Test getMadridTimezoneInfo
  console.log('🌍 getMadridTimezoneInfo:');
  const timezoneInfo = getMadridTimezoneInfo();
  console.log('  Nombre:', timezoneInfo.name);
  console.log('  Offset:', timezoneInfo.offset);
  console.log('  Es horario de verano:', timezoneInfo.isDST);
  console.log('');
  
  console.log('✅ Test completado!');
};

// Ejecutar si es llamado directamente
if (typeof window !== 'undefined') {
  console.log('🧪 Timezone Madrid Test - Ejecutando en el navegador');
  testMadridTimezone();
} else {
  console.log('🧪 Timezone Madrid Test - Listo para ejecutar');
}

export default testMadridTimezone;
