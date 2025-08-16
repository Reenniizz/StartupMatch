// Test script para verificar que la migración funciona
const { SecurityLogger } = require('./lib/security-logger');

async function testSecurity() {
  console.log('🔒 Probando SecurityLogger...');
  
  try {
    // Test 1: Login exitoso
    await SecurityLogger.logAuthSuccess('test-user-id', '127.0.0.1', 'email');
    console.log('✅ Login exitoso registrado');

    // Test 2: Login fallido
    await SecurityLogger.logAuthFailure('invalid-email@test.com', '127.0.0.1', 'invalid_credentials');
    console.log('✅ Login fallido registrado');

    // Test 3: Obtener métricas
    const metrics = await SecurityLogger.getMetrics();
    console.log('✅ Métricas obtenidas:', metrics);

    console.log('\n🎉 ¡Todas las pruebas pasaron! La migración funciona correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

testSecurity();
