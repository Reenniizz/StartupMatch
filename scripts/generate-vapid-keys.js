// ==============================================
// GENERADOR DE VAPID KEYS PARA PUSH NOTIFICATIONS
// Este script genera las claves VAPID necesarias para Web Push Protocol
// ==============================================

const webpush = require('web-push');

console.log('🔑 Generando VAPID Keys para Push Notifications...\n');

try {
  // Generar las claves VAPID
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ VAPID Keys generadas exitosamente!\n');
  
  console.log('📋 Copia estas variables a tu archivo .env.local:\n');
  console.log('# ========================================');
  console.log('# VAPID KEYS PARA PUSH NOTIFICATIONS');
  console.log('# ========================================');
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('VAPID_EMAIL=tu-email@ejemplo.com  # Cambia por tu email real');
  console.log('# ========================================\n');
  
  console.log('📖 Instrucciones:');
  console.log('1. Copia las variables de arriba');
  console.log('2. Pégalas en tu archivo .env.local');
  console.log('3. Cambia VAPID_EMAIL por tu email real');
  console.log('4. Reinicia tu servidor de desarrollo (npm run dev)');
  console.log('5. ¡Las notificaciones push estarán listas!\n');
  
  console.log('🔒 Importante:');
  console.log('- La clave PÚBLICA va en NEXT_PUBLIC_VAPID_PUBLIC_KEY (visible al cliente)');
  console.log('- La clave PRIVADA va en VAPID_PRIVATE_KEY (solo en servidor)');
  console.log('- NUNCA compartas la clave privada públicamente');
  console.log('- Estas claves son únicas para tu aplicación\n');
  
} catch (error) {
  console.error('❌ Error generando VAPID keys:', error);
  process.exit(1);
}
