/** @type {import('webpack').Configuration} */
const path = require('path');

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunks para librerías específicas
        supabase: {
          name: 'chunk-supabase',
          test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
          chunks: 'all',
          priority: 20,
        },
        framerMotion: {
          name: 'chunk-framer-motion',
          test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
          chunks: 'all',
          priority: 20,
        },
        lucideIcons: {
          name: 'chunk-lucide-react',
          test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
          chunks: 'all',
          priority: 20,
        },
        socketIO: {
          name: 'chunk-socket-io',
          test: /[\\/]node_modules[\\/](socket\.io-client)[\\/]/,
          chunks: 'all',
          priority: 20,
        },
        // Chunk para componentes UI pesados
        uiComponents: {
          name: 'chunk-ui-heavy',
          test: /[\\/]components[\\/](RichTextEditor|ui)[\\/]/,
          chunks: 'all',
          priority: 15,
          minSize: 10000,
        },
        // Chunk común para vendor
        vendor: {
          name: 'chunk-vendor',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 10,
          minSize: 20000,
        },
        // Chunk para componentes compartidos
        shared: {
          name: 'chunk-shared',
          test: /[\\/]components[\\/]shared[\\/]/,
          chunks: 'all',
          priority: 5,
          minSize: 5000,
        }
      },
    },
  },
  // Tree shaking mejorado
  mode: 'production',
  resolve: {
    // Optimizar resolución de módulos
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    alias: {
      // Aliases para imports más eficientes
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
      '@types': path.resolve(__dirname, 'types'),
      '@hooks': path.resolve(__dirname, 'hooks'),
    }
  }
};
