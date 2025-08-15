// server.js - Servidor personalizado con Socket.IO
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

console.log(`🚀 Iniciando servidor en modo: ${dev ? 'development' : 'production'}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO server con configuración mejorada y middleware
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Store user sessions y cache de autenticación
  const userSessions = new Map(); // userId -> socketId
  const tokenCache = new Map(); // userId -> { token, expiry, validated }
  const rateLimiter = new Map(); // userId -> { count, resetTime, lastActivity }
  const ipRateLimiter = new Map(); // IP -> { count, resetTime }
  const activeConnections = new Map(); // socketId -> { userId, lastHeartbeat, pingCount, lastRTT }
  
  // Estados de mensaje mejorados
  const MessageStates = {
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    ERROR: 'error'
  };

  // Track delivery confirmations
  const pendingDeliveries = new Map(); // messageId -> [userIds]
  const messageQueue = new Map(); // userId -> [messages] (offline queue)

  // Métricas de cache performance
  let cacheHits = 0;
  let cacheMisses = 0;

  // Validación y sanitización de mensajes
  const validateMessage = (message) => {
    if (!message || typeof message !== 'string') return false;
    if (message.length > 5000) return false; // Límite de 5000 caracteres
    if (message.trim().length === 0) return false; // No mensajes vacíos
    
    // Anti-XSS básico
    const dangerousPatterns = ['<script', 'javascript:', 'onload=', 'onerror='];
    const lowerMessage = message.toLowerCase();
    
    for (const pattern of dangerousPatterns) {
      if (lowerMessage.includes(pattern)) {
        console.warn('⚠️ Mensaje bloqueado por contenido peligroso:', pattern);
        return false;
      }
    }
    
    return true;
  };

  const sanitizeMessage = (message) => {
    // Escapar caracteres HTML básicos
    return message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  // Cache de autenticación - Performance optimization
  const validateCachedToken = async (userId, token) => {
    const cached = tokenCache.get(userId);
    
    // Si está en cache y no ha expirado, retornar resultado cacheado
    if (cached && cached.token === token && cached.expiry > Date.now()) {
      cacheHits++;
      console.log('🚀 Token cache HIT para usuario:', userId);
      return cached.validated;
    }

    cacheMisses++;
    console.log('⚠️ Token cache MISS para usuario:', userId);
    
    try {
      // Validar con Supabase
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      const isValid = !error && user && user.id === userId;
      
      // Cachear resultado por 15 minutos
      tokenCache.set(userId, {
        token: token,
        expiry: Date.now() + 15 * 60 * 1000, // 15 minutos
        validated: isValid ? user : null
      });

      return isValid ? user : null;
    } catch (error) {
      console.error('❌ Error validando token:', error);
      return null;
    }
  };

  // Rate limiting - Seguridad
  const checkRateLimit = (userId) => {
    const limit = rateLimiter.get(userId);
    const now = Date.now();
    
    if (!limit) {
      rateLimiter.set(userId, { count: 1, resetTime: now + 60000, lastActivity: now });
      return true;
    }
    
    // Reset counter si ha pasado el tiempo
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + 60000;
      limit.lastActivity = now;
      return true;
    }
    
    // Verificar límite (60 mensajes por minuto)
    if (limit.count >= 60) {
      console.warn(`⚠️ Rate limit excedido para usuario: ${userId}`);
      return false;
    }
    
    limit.count++;
    limit.lastActivity = now;
    return true;
  };

  // IP Rate limiting
  const checkIPRateLimit = (clientIP) => {
    const limit = ipRateLimiter.get(clientIP);
    const now = Date.now();
    
    if (!limit) {
      ipRateLimiter.set(clientIP, { count: 1, resetTime: now + 60000 });
      return true;
    }
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + 60000;
      return true;
    }
    
    // Límite más estricto por IP (120 requests por minuto)
    if (limit.count >= 120) {
      console.warn(`⚠️ IP Rate limit excedido para IP: ${clientIP}`);
      return false;
    }
    
    limit.count++;
    return true;
  };

  // Sistema de heartbeat para monitoring de conexiones
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

  const getCacheHitRate = () => {
    const total = cacheHits + cacheMisses;
    return total > 0 ? Math.round((cacheHits / total) * 100) : 0;
  };
  
  const getAverageLatency = () => {
    const stats = getConnectionStats();
    return stats.averageRTT;
  };

  // Middleware de autenticación y rate limiting
  io.use((socket, next) => {
    const clientIP = socket.handshake.address;
    
    // Verificar rate limiting por IP
    if (!checkIPRateLimit(clientIP)) {
      console.warn(`⚠️ IP bloqueada por rate limit: ${clientIP}`);
      return next(new Error('Rate limit exceeded for IP'));
    }
    
    // Verificar que tenga datos de autenticación
    const authToken = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    
    if (!authToken || !userId) {
      console.warn(`⚠️ Conexión rechazada - falta auth token o userId`);
      return next(new Error('Authentication required'));
    }
    
    // Continuar - validación completa se hará en los eventos
    next();
  });

  console.log('🚀 Socket.IO server iniciado en puerto', port);

  io.on('connection', (socket) => {
    console.log(`🔌 Nueva conexión Socket.IO: ${socket.id}`);
    
    // Obtener datos de autenticación
    const authToken = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    
    console.log(`🔑 Token recibido: ${authToken ? 'Sí' : 'No'}, UserID: ${userId}`);
    
    // Estadísticas de conexiones
    const connectedUsers = userSessions.size;
    console.log(`📊 Usuarios conectados: ${connectedUsers + 1}`);

    // Usuario se une cuando envía su ID
    socket.on('join-user', (userId) => {
      console.log(`👤 Usuario intentando unirse: ${userId}`);
      
      if (!userId) {
        console.error('❌ UserId no proporcionado');
        socket.emit('join-error', { message: 'UserId requerido' });
        return;
      }

      // Si el usuario ya tiene otra sesión, desconectar la anterior
      if (userSessions.has(userId)) {
        const oldSocketId = userSessions.get(userId);
        console.log(`🔄 Usuario ${userId} ya conectado, desconectando sesión anterior: ${oldSocketId}`);
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }

      socket.userId = userId;
      userSessions.set(userId, socket.id);
      socket.join(`user:${userId}`);
      
      // Inicializar heartbeat system
      initializeHeartbeat(socket, userId);
      
      console.log(`✅ Usuario ${userId} conectado exitosamente con socket ${socket.id}`);
      
      // Confirmar al cliente que se unió correctamente
      socket.emit('join-success', { userId, socketId: socket.id });
      
      // Emitir que el usuario está online a otros usuarios
      socket.broadcast.emit('user-online', userId);
      
      // Enviar lista de usuarios online al nuevo usuario
      const onlineUserIds = Array.from(userSessions.keys()).filter(id => id !== userId);
      socket.emit('users-online', onlineUserIds);
    });

    // Usuario se une a una conversación específica
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`💬 Usuario se unió a conversación: ${conversationId}`);
    });

    // Manejar nuevo mensaje con optimizaciones avanzadas
    socket.on('send-message', async (data) => {
      const { conversationId, message, userId, tempId } = data;
      const authToken = socket.handshake.auth.token;
      
      console.log(`📤 Procesando mensaje en conversación ${conversationId}`);

      try {
        // 1. Validaciones básicas
        if (!authToken || !userId) {
          throw new Error('Token de autenticación o userId no proporcionado');
        }

        // 2. Verificar rate limiting
        if (!checkRateLimit(userId)) {
          throw new Error('Rate limit excedido. Máximo 60 mensajes por minuto.');
        }

        // 3. Validar y sanitizar mensaje
        if (!validateMessage(message)) {
          throw new Error('Mensaje inválido o contiene contenido no permitido');
        }

        const sanitizedMessage = sanitizeMessage(message.trim());

        // 4. Verificar autenticación con cache
        const authenticatedUser = await validateCachedToken(userId, authToken);
        
        if (!authenticatedUser) {
          throw new Error('Token de autenticación inválido o expirado');
        }

        console.log('✅ Usuario autenticado con cache:', userId);

        // 5. Verificar acceso a conversación
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .single();

        if (convError || !conversation) {
          throw new Error('Conversación no encontrada o usuario no autorizado');
        }

        // 6. Insertar mensaje en base de datos
        const { data: newMessage, error: insertError } = await supabase
          .from('private_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            message: sanitizedMessage,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Error guardando mensaje: ${insertError.message}`);
        }

        // 7. Crear datos del mensaje con estados mejorados
        const messageData = {
          id: newMessage.id,
          conversation_id: conversationId,
          sender_id: userId,
          message: sanitizedMessage,
          created_at: newMessage.created_at,
          status: MessageStates.DELIVERED,
          tempId: tempId
        };

        console.log(`✅ Mensaje guardado en DB con ID: ${messageData.id}`);

        // 8. Determinar usuarios en la conversación para delivery tracking
        const recipientId = conversation.user1_id === userId ? 
          conversation.user2_id : conversation.user1_id;
        
        // Track pending delivery
        pendingDeliveries.set(messageData.id, [recipientId]);

        // 9. Enviar a todos los usuarios en la conversación
        io.to(`conversation:${conversationId}`).emit('new-message', messageData);

        // 10. Confirmar al remitente con estado mejorado
        socket.emit('message-sent', { 
          messageId: messageData.id,
          tempId: tempId,
          status: MessageStates.SENT,
          timestamp: messageData.created_at,
          sanitized: sanitizedMessage !== message // Indica si fue modificado
        });

      } catch (error) {
        console.error('💥 Error procesando mensaje:', error);
        
        // Emisión de error con detalles mejorados
        socket.emit('message-error', { 
          error: error.message || 'Error del servidor',
          tempId: tempId,
          code: error.code || 'UNKNOWN_ERROR',
          timestamp: new Date().toISOString(),
          retryable: !error.message?.includes('Rate limit') && !error.message?.includes('inválido')
        });
      }
    });

    // Indicador de "escribiendo" mejorado
    socket.on('typing-start', (data) => {
      const { conversationId, userId } = data;
      
      // Verificar rate limiting para typing (más permisivo)
      const typingLimit = rateLimiter.get(userId);
      if (typingLimit && typingLimit.count > 100) { // 100 typing events por minuto
        return; // Ignorar silenciosamente
      }
      
      console.log(`✏️ Usuario ${userId} empezó a escribir en ${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('user-typing', { 
        userId, 
        isTyping: true,
        conversationId 
      });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId, userId } = data;
      console.log(`⏹️ Usuario ${userId} dejó de escribir en ${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('user-typing', { 
        userId, 
        isTyping: false,
        conversationId 
      });
    });

    // Confirmación de mensaje leído (delivery tracking)
    socket.on('message-read', (data) => {
      const { messageId, conversationId, userId } = data;
      console.log(`👀 Mensaje ${messageId} leído por ${userId}`);
      
      // Actualizar pending deliveries
      const pending = pendingDeliveries.get(messageId);
      if (pending) {
        const index = pending.indexOf(userId);
        if (index > -1) {
          pending.splice(index, 1);
          
          // Si no quedan usuarios pendientes, marcar como leído
          if (pending.length === 0) {
            pendingDeliveries.delete(messageId);
            
            // Notificar al remitente que fue leído
            io.to(`conversation:${conversationId}`).emit('message-status-update', {
              messageId,
              status: MessageStates.READ,
              readBy: userId,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });

    // Heartbeat avanzado para monitoring de conexión
    socket.on('heartbeat', (data) => {
      const { userId } = data;
      
      // Actualizar última actividad del rate limiter
      if (rateLimiter.has(userId)) {
        rateLimiter.get(userId).lastActivity = Date.now();
      }
      
      // Actualizar info de conexión activa
      if (activeConnections.has(socket.id)) {
        const connection = activeConnections.get(socket.id);
        connection.lastHeartbeat = Date.now();
        connection.pingCount = 0;
      }
      
      // Responder con estado del servidor y métricas
      socket.emit('heartbeat-response', {
        timestamp: Date.now(),
        connectedUsers: userSessions.size,
        cacheSize: tokenCache.size,
        serverLoad: {
          activeConnections: activeConnections.size,
          cacheHitRate: getCacheHitRate(),
          averageLatency: getAverageLatency()
        }
      });
    });

    // Sistema de heartbeat-ping/pong más robusto
    socket.on('heartbeat-pong', (data) => {
      const connection = activeConnections.get(socket.id);
      if (connection) {
        connection.lastHeartbeat = Date.now();
        connection.pingCount = 0; // Reset failed ping count
        
        // Calcular RTT si se proporciona timestamp
        if (data?.timestamp) {
          const rtt = Date.now() - data.timestamp;
          connection.lastRTT = rtt;
          console.log(`💓 Heartbeat pong from user ${connection.userId}: ${rtt}ms RTT`);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket desconectado: ${socket.id}, razón: ${reason}`);
      
      if (socket.userId) {
        console.log(`👋 Usuario ${socket.userId} se desconectó`);
        userSessions.delete(socket.userId);
        
        // Limpiar heartbeat connection
        if (activeConnections.has(socket.id)) {
          const connection = activeConnections.get(socket.id);
          connection.connected = false;
          activeConnections.delete(socket.id);
          console.log(`💀 Connection monitoring cleanup for user ${socket.userId}`);
        }
        
        // Limpiar cache de token del usuario desconectado
        tokenCache.delete(socket.userId);
        rateLimiter.delete(socket.userId);
        
        // Emitir que el usuario está offline
        socket.broadcast.emit('user-offline', socket.userId);
        
        // Estadísticas actualizadas
        console.log(`📊 Usuarios conectados restantes: ${userSessions.size}`);
        console.log(`📊 Conexiones monitoreadas: ${activeConnections.size}`);
      }
    });

    // Manejo de errores de socket
    socket.on('error', (error) => {
      console.error(`❌ Error en socket ${socket.id}:`, error);
    });
  });

  // Cleanup periódico de cache y rate limiting
  setInterval(() => {
    const now = Date.now();
    const expiredTokens = [];
    const inactiveUsers = [];

    // Limpiar tokens expirados
    tokenCache.forEach((data, userId) => {
      if (data.expiry < now) {
        expiredTokens.push(userId);
      }
    });

    // Limpiar rate limits de usuarios inactivos (>1 hora)
    rateLimiter.forEach((data, userId) => {
      if (data.lastActivity && (now - data.lastActivity) > 3600000) { // 1 hora
        inactiveUsers.push(userId);
      }
    });

    // Remover entries expiradas
    expiredTokens.forEach(userId => {
      tokenCache.delete(userId);
    });
    
    inactiveUsers.forEach(userId => {
      rateLimiter.delete(userId);
    });

    if (expiredTokens.length > 0 || inactiveUsers.length > 0) {
      console.log(`🧹 Cleanup completado: ${expiredTokens.length} tokens expirados, ${inactiveUsers.length} usuarios inactivos removidos`);
    }

    // Cleanup de conexiones stale en heartbeat system
    const staleConnections = [];
    activeConnections.forEach((connection, socketId) => {
      const timeSinceLastHeartbeat = now - connection.lastHeartbeat;
      
      // Si no hay heartbeat en 5 minutos, marcar como stale
      if (timeSinceLastHeartbeat > 300000) { // 5 minutos
        staleConnections.push(socketId);
      }
    });

    staleConnections.forEach(socketId => {
      const connection = activeConnections.get(socketId);
      if (connection) {
        console.log(`💀 Removing stale connection for user ${connection.userId} (${socketId})`);
        activeConnections.delete(socketId);
      }
    });

    // Log de estadísticas cada 5 minutos
    if (now % 300000 < 60000) { // Aproximadamente cada 5 minutos
      const stats = getConnectionStats();
      console.log(`📊 Connection Stats: ${stats.healthyConnections}/${stats.totalConnections} healthy connections`);
    }
  }, 60000); // Cada minuto

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://${hostname}:${port}`);
      console.log(`💓 Heartbeat system iniciado`);
      console.log(`📊 Connection monitoring activo`);
    });
});
