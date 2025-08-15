// webpack.config.optimization.js
// Configuraciones avanzadas de optimización para reducir warnings

module.exports = {
  // Optimización de caché para reducir serialización de strings grandes
  cacheOptimization: {
    type: 'filesystem',
    maxMemoryGenerations: 0, // Evita mantener muchas generaciones en memoria
    compression: 'gzip', // Comprime la caché
    hashAlgorithm: 'xxhash64', // Algoritmo más rápido
    
    // Configuración de memoria
    memoryCacheUnaffected: true,
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 días
    
    // Subdirectorios para organizar caché
    cacheDirectory: 'node_modules/.cache/webpack',
    name: 'startupmatch-cache',
  },

  // Optimización de chunks para evitar strings grandes
  splitChunksOptimization: {
    chunks: 'all',
    minSize: 10000, // 10KB mínimo
    maxSize: 100000, // 100KB máximo para evitar strings grandes
    minRemainingSize: 0,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    
    cacheGroups: {
      // Separar Supabase en su propio chunk
      supabase: {
        test: /[\\/]node_modules[\\/]@supabase[\\/]/,
        name: 'supabase',
        chunks: 'all',
        priority: 20,
        maxSize: 150000,
      },
      
      // Separar UI libraries
      ui: {
        test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
        name: 'ui-libs',
        chunks: 'all',
        priority: 15,
        maxSize: 100000,
      },
      
      // Vendor chunks más pequeños
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
        maxSize: 200000,
      },
      
      // Common chunks
      common: {
        name: 'commons',
        chunks: 'all',
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
        maxSize: 100000,
      },
    },
  },

  // Configuración para suprimir warnings específicos
  warningSuppressions: [
    // Supabase Edge Runtime warnings
    /A Node\.js API is used.*which is not supported in the Edge Runtime/,
    
    // Webpack cache warnings
    /Serializing big strings.*impacts deserialization performance/,
    
    // Dependency warnings
    /Critical dependency: the request of a dependency is an expression/,
    
    // Buffer/encoding warnings
    /Module not found: Can't resolve 'bufferutil'/,
    /Module not found: Can't resolve 'utf-8-validate'/,
    
    // Supabase specific
    { module: /node_modules\/@supabase\// },
  ],
};
