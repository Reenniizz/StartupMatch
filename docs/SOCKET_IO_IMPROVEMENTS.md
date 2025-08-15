# Socket.IO Mejoras Propuestas

## 1. 🚀 Performance & Escalabilidad

### Problemas Actuales:
- ❌ Un solo proceso Node.js maneja todas las conexiones
- ❌ userSessions en memoria (se pierde al reiniciar)
- ❌ No hay rate limiting
- ❌ Validación de token en cada mensaje (costoso)

### Mejoras Propuestas:

#### A. Redis Adapter para Multi-Instancia
```javascript
// Permitir múltiples instancias del servidor
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

#### B. Cache de Autenticación
```javascript
// Cache de tokens para evitar validar en cada mensaje
const tokenCache = new Map(); // userId -> { token, expiry, validated }

const validateToken = async (userId, token) => {
  const cached = tokenCache.get(userId);
  if (cached && cached.token === token && cached.expiry > Date.now()) {
    return cached.validated;
  }
  // Validar con Supabase y cachear resultado
};
```

#### C. Rate Limiting
```javascript
const rateLimiter = new Map(); // userId -> { count, resetTime }

const checkRateLimit = (userId) => {
  const limit = rateLimiter.get(userId);
  if (!limit) {
    rateLimiter.set(userId, { count: 1, resetTime: Date.now() + 60000 });
    return true;
  }
  
  if (Date.now() > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = Date.now() + 60000;
    return true;
  }
  
  if (limit.count >= 60) { // 60 mensajes por minuto
    return false;
  }
  
  limit.count++;
  return true;
};
```

## 2. 🔒 Seguridad & Autenticación

### Problemas Actuales:
- ❌ Token se envía en cada conexión (visible en logs)
- ❌ No hay validación de origen
- ❌ No hay protección contra spam
- ❌ Sesiones no expiran automáticamente

### Mejoras Propuestas:

#### A. JWT con Refresh Tokens
```javascript
// Generar JWT temporal para Socket.IO
const jwt = require('jsonwebtoken');

const generateSocketToken = (userId, supabaseToken) => {
  return jwt.sign(
    { userId, supabaseToken, type: 'socket' }, 
    process.env.SOCKET_JWT_SECRET,
    { expiresIn: '1h' }
  );
};
```

#### B. IP Rate Limiting
```javascript
const ipRateLimiter = new Map(); // IP -> { count, resetTime }

io.use((socket, next) => {
  const clientIP = socket.handshake.address;
  if (!checkIPRateLimit(clientIP)) {
    return next(new Error('Rate limit exceeded'));
  }
  next();
});
```

#### C. Message Validation & Sanitization
```javascript
const validator = require('validator');
const DOMPurify = require('dompurify');

const validateMessage = (message) => {
  if (!message || typeof message !== 'string') return false;
  if (message.length > 5000) return false; // Límite de caracteres
  if (validator.contains(message, '<script')) return false; // Anti XSS básico
  return true;
};

const sanitizeMessage = (message) => {
  return DOMPurify.sanitize(validator.escape(message));
};
```

## 3. 🎯 Funcionalidades Avanzadas

### A. Estados de Mensaje Mejorados
```javascript
// Estados: sending -> sent -> delivered -> read
const messageStates = {
  SENDING: 'sending',
  SENT: 'sent', 
  DELIVERED: 'delivered',
  READ: 'read',
  ERROR: 'error'
};

// Track delivery confirmations
const pendingDeliveries = new Map(); // messageId -> [userIds]
```

### B. Typing Indicators Inteligentes
```javascript
const typingUsers = new Map(); // conversationId -> Set<userId>
const typingTimeouts = new Map(); // userId -> timeoutId

const handleTyping = (userId, conversationId, isTyping) => {
  const key = `${conversationId}:${userId}`;
  
  if (isTyping) {
    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Set());
    }
    typingUsers.get(conversationId).add(userId);
    
    // Auto-stop typing after 3 seconds
    clearTimeout(typingTimeouts.get(key));
    const timeout = setTimeout(() => {
      handleTyping(userId, conversationId, false);
    }, 3000);
    typingTimeouts.set(key, timeout);
  } else {
    typingUsers.get(conversationId)?.delete(userId);
    clearTimeout(typingTimeouts.get(key));
    typingTimeouts.delete(key);
  }
};
```

### C. Presencia de Usuario (Online/Offline/Away)
```javascript
const userPresence = new Map(); // userId -> { status, lastSeen, device }

const updatePresence = (userId, status, device = 'web') => {
  userPresence.set(userId, {
    status, // online, away, offline
    lastSeen: Date.now(),
    device
  });
  
  // Broadcast presence change
  io.emit('user-presence-changed', { userId, status, lastSeen: Date.now() });
};

// Auto-set to 'away' after 5 minutes of inactivity
const checkInactiveUsers = () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  userPresence.forEach((presence, userId) => {
    if (presence.status === 'online' && presence.lastSeen < fiveMinutesAgo) {
      updatePresence(userId, 'away');
    }
  });
};
setInterval(checkInactiveUsers, 60000); // Check every minute
```

## 4. 📊 Monitoreo & Analytics

### A. Métricas en Tiempo Real
```javascript
const metrics = {
  totalConnections: 0,
  messagesSent: 0,
  errorsCount: 0,
  avgResponseTime: 0,
  peakConnections: 0
};

const trackMetric = (metric, value = 1) => {
  metrics[metric] += value;
  
  // Send to monitoring service (DataDog, New Relic, etc.)
  if (process.env.NODE_ENV === 'production') {
    // sendToMonitoring(metric, value);
  }
};
```

### B. Logging Estructurado
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/socket-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/socket-combined.log' })
  ]
});

// Structured logging
logger.info('Message sent', {
  userId,
  conversationId,
  messageLength: message.length,
  responseTime: Date.now() - startTime
});
```

## 5. 🎨 UX/UI Improvements

### A. Reconexión Inteligente
```javascript
// Cliente: Estrategia de reconexión exponential backoff
const reconnectionStrategy = {
  attempts: 0,
  maxAttempts: 10,
  baseDelay: 1000,
  
  getDelay() {
    return Math.min(this.baseDelay * Math.pow(2, this.attempts), 30000);
  },
  
  reset() {
    this.attempts = 0;
  }
};
```

### B. Queue de Mensajes Offline
```javascript
// Cliente: Cola para mensajes cuando está offline
const offlineMessageQueue = [];

const queueMessage = (messageData) => {
  offlineMessageQueue.push({
    ...messageData,
    queuedAt: Date.now()
  });
  
  // Guardar en localStorage
  localStorage.setItem('offlineMessages', JSON.stringify(offlineMessageQueue));
};

const processOfflineQueue = () => {
  offlineMessageQueue.forEach(message => {
    socket.emit('send-message', message);
  });
  offlineMessageQueue.length = 0;
  localStorage.removeItem('offlineMessages');
};
```

### C. Indicadores Visuales Mejorados
```javascript
// Estados visuales más detallados
const MessageStatusIndicator = ({ status, timestamp }) => {
  const getStatusIcon = () => {
    switch(status) {
      case 'sending': return <Clock className="animate-spin" />;
      case 'sent': return <Check className="text-gray-400" />;
      case 'delivered': return <CheckCheck className="text-gray-400" />;
      case 'read': return <CheckCheck className="text-blue-500" />;
      case 'error': return <X className="text-red-500" />;
    }
  };
  
  return (
    <div className="flex items-center space-x-1">
      {getStatusIcon()}
      <span className="text-xs text-gray-500">{timestamp}</span>
    </div>
  );
};
```

## 6. 🔧 DevOps & Deployment

### A. Health Checks
```javascript
// Endpoint para health checks
app.get('/health/socket', (req, res) => {
  const health = {
    status: 'healthy',
    connections: userSessions.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  res.json(health);
});
```

### B. Graceful Shutdown
```javascript
const gracefulShutdown = () => {
  console.log('🔄 Iniciando shutdown graceful...');
  
  // Notificar a todos los clientes
  io.emit('server-shutdown', { 
    message: 'Servidor reiniciándose, reconectando automáticamente...' 
  });
  
  // Dar tiempo para que los mensajes lleguen
  setTimeout(() => {
    io.close(() => {
      console.log('✅ Socket.IO servidor cerrado');
      httpServer.close(() => {
        console.log('✅ HTTP servidor cerrado');
        process.exit(0);
      });
    });
  }, 1000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

## 7. 🧪 Testing & Quality

### A. Unit Tests
```javascript
// tests/socket.test.js
const { createServer } = require('http');
const Client = require('socket.io-client');
const ioBack = require('socket.io');

describe('Socket.IO Server', () => {
  let httpServer, ioServer, clientSocket;

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new ioBack.Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      ioServer.on('connection', (socket) => {
        done();
      });
    });
  });

  test('should send message successfully', (done) => {
    clientSocket.on('new-message', (data) => {
      expect(data.message).toBe('Test message');
      done();
    });
    
    clientSocket.emit('send-message', {
      conversationId: 'test-id',
      message: 'Test message'
    });
  });
});
```

## 8. 📱 Mobile & PWA Support

### A. Push Notifications Integration
```javascript
// Integración con service workers para push notifications
const sendPushNotification = async (userId, messageData) => {
  const subscription = await getUserPushSubscription(userId);
  if (subscription) {
    await webpush.sendNotification(subscription, JSON.stringify({
      title: `Nuevo mensaje de ${messageData.senderName}`,
      body: messageData.message,
      icon: '/icon-192x192.png',
      data: {
        conversationId: messageData.conversationId,
        url: `/messages?conversation=${messageData.conversationId}`
      }
    }));
  }
};
```

## Prioridades de Implementación:

### 🔴 Alta Prioridad (Semana 1-2):
1. Cache de autenticación
2. Rate limiting básico  
3. Validación y sanitización de mensajes
4. Logging estructurado

### 🟡 Media Prioridad (Semana 3-4):
1. Estados de mensaje mejorados
2. Reconexión inteligente
3. Queue de mensajes offline
4. Health checks

### 🟢 Baja Prioridad (Futuro):
1. Redis adapter para escalabilidad
2. Push notifications
3. Analytics avanzados
4. Testing completo

¿Te gustaría que implemente alguna de estas mejoras específicas?
