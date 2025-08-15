// PATCH HEARTBEAT SYSTEM FOR server.js
// Este código debe agregarse al server.js después de las definiciones iniciales

// Sistema de heartbeat para monitoring de conexiones
const activeConnections = new Map(); // socketId -> { userId, lastHeartbeat, pingCount, lastRTT }

// Métricas de cache performance
let cacheHits = 0;
let cacheMisses = 0;

const getCacheHitRate = () => {
  const total = cacheHits + cacheMisses;
  return total > 0 ? Math.round((cacheHits / total) * 100) : 0;
};

const getAverageLatency = () => {
  const stats = getConnectionStats();
  return stats.averageRTT;
};

// Inicializar heartbeat para un socket
const initializeHeartbeat = (socket, userId) => {
  activeConnections.set(socket.id, {
    userId,
    lastHeartbeat: Date.now(),
    pingCount: 0,
    connected: true,
    lastRTT: null
  });
  
  console.log(`💓 Heartbeat initialized for user ${userId} (${socket.id})`);
  
  // Send initial ping
  socket.emit('heartbeat-ping', { timestamp: Date.now() });
  
  // Set up heartbeat interval (every 30 seconds)
  const heartbeatInterval = setInterval(() => {
    const connection = activeConnections.get(socket.id);
    if (!connection || !connection.connected) {
      clearInterval(heartbeatInterval);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastHeartbeat = now - connection.lastHeartbeat;
    
    // Si no hay heartbeat response en 90 segundos, incrementar pingCount
    if (timeSinceLastHeartbeat > 90000) {
      console.log(`⚠️ Missed heartbeat for user ${userId} (${socket.id})`);
      connection.pingCount++;
      
      // After 3 missed pings (4.5 minutes), disconnect
      if (connection.pingCount >= 3) {
        console.log(`💀 Disconnecting unresponsive connection for user ${userId} (${socket.id})`);
        socket.disconnect(true);
        clearInterval(heartbeatInterval);
        return;
      }
    }
    
    // Send ping
    socket.emit('heartbeat-ping', { 
      timestamp: now,
      pingCount: connection.pingCount 
    });
    
  }, 30000); // Every 30 seconds
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    clearInterval(heartbeatInterval);
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.connected = false;
      activeConnections.delete(socket.id);
      console.log(`💀 Heartbeat cleanup for user ${userId} (${socket.id})`);
    }
  });
};

// Connection monitoring stats y métricas
const getConnectionStats = () => {
  const now = Date.now();
  const stats = {
    totalConnections: activeConnections.size,
    healthyConnections: 0,
    staleConnections: 0,
    averageRTT: 0,
    connections: []
  };
  
  let totalRTT = 0;
  let rttCount = 0;
  
  for (const [socketId, connection] of activeConnections.entries()) {
    const timeSinceLastHeartbeat = now - connection.lastHeartbeat;
    const isHealthy = timeSinceLastHeartbeat < 90000; // 90 segundos
    
    if (isHealthy) {
      stats.healthyConnections++;
    } else {
      stats.staleConnections++;
    }
    
    if (connection.lastRTT) {
      totalRTT += connection.lastRTT;
      rttCount++;
    }
    
    stats.connections.push({
      socketId,
      userId: connection.userId,
      lastHeartbeat: connection.lastHeartbeat,
      timeSinceLastHeartbeat,
      pingCount: connection.pingCount,
      lastRTT: connection.lastRTT,
      isHealthy
    });
  }
  
  stats.averageRTT = rttCount > 0 ? Math.round(totalRTT / rttCount) : 0;
  return stats;
};

// INSTRUCCIONES DE INTEGRACIÓN:
// 
// 1. Agregar después de autenticación exitosa:
//    initializeHeartbeat(socket, userId);
//
// 2. En el handler de 'heartbeat-pong':
//    const connection = activeConnections.get(socket.id);
//    if (connection) {
//      connection.lastHeartbeat = Date.now();
//      connection.pingCount = 0;
//      if (data?.timestamp) {
//        connection.lastRTT = Date.now() - data.timestamp;
//      }
//    }
//
// 3. En el handler de 'heartbeat' (versión mejorada):
//    socket.emit('heartbeat-response', {
//      timestamp: Date.now(),
//      connectedUsers: userSessions.size,
//      cacheSize: tokenCache.size,
//      serverLoad: {
//        activeConnections: activeConnections.size,
//        cacheHitRate: getCacheHitRate(),
//        averageLatency: getAverageLatency()
//      }
//    });
//
// 4. En disconnect handler agregar:
//    if (activeConnections.has(socket.id)) {
//      const connection = activeConnections.get(socket.id);
//      connection.connected = false;
//      activeConnections.delete(socket.id);
//    }
//
// 5. Agregar al cleanup interval:
//    const staleConnections = [];
//    activeConnections.forEach((connection, socketId) => {
//      const timeSinceLastHeartbeat = now - connection.lastHeartbeat;
//      if (timeSinceLastHeartbeat > 300000) { // 5 minutos
//        staleConnections.push(socketId);
//      }
//    });
//    staleConnections.forEach(socketId => {
//      activeConnections.delete(socketId);
//    });
//
// 6. Para tracking de cache hits/misses, modificar validateCachedToken:
//    if (cached && cached.token === token && cached.expiry > Date.now()) {
//      cacheHits++;
//      // ...resto del código
//    } else {
//      cacheMisses++;
//      // ...resto del código
//    }
