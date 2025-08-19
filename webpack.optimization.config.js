const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.warn'],
            passes: 2,
            unsafe: true,
            unsafe_comps: true,
            unsafe_Function: true,
            unsafe_math: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_undefined: true,
          },
          mangle: {
            safari10: true,
            toplevel: true,
            properties: {
              regex: /^_/,
            },
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
        parallel: true,
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              colormin: true,
              minifyFontValues: true,
              minifySelectors: true,
            },
          ],
        },
        parallel: true,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      minSize: 20000, // 20KB mínimo para evitar chunks muy pequeños
      maxSize: 150000, // 150KB máximo para chunks manejables
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: '~',
      enforceSizeThreshold: 50000,
      cacheGroups: {
        // Vendor chunks - librerías de terceros
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
          reuseExistingChunk: true,
        },
        // Supabase específico - chunk separado por tamaño
        supabase: {
          test: /[\\/]node_modules[\\/](@supabase|supabase)[\\/]/,
          name: 'supabase',
          chunks: 'all',
          priority: 25,
          maxSize: 200000,
          reuseExistingChunk: true,
        },
        // UI Components - Radix UI y componentes de UI
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|@heroicons|lucide-react)[\\/]/,
          name: 'ui-components',
          chunks: 'all',
          priority: 15,
          maxSize: 100000,
          reuseExistingChunk: true,
        },
        // React y Next.js específicos
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
          name: 'react-core',
          chunks: 'all',
          priority: 30,
          maxSize: 100000,
          reuseExistingChunk: true,
        },
        // Common chunks - código compartido entre páginas
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Styles separados
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
          priority: 40,
        },
      },
    },
    // Tree shaking agresivo
    usedExports: true,
    sideEffects: false,
    // Runtime chunks para mejor caching
    runtimeChunk: {
      name: 'runtime',
    },
    // Module concatenation para scope hoisting
    concatenateModules: true,
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
      analyzerPort: 8888,
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'webpack-stats.json',
      logLevel: 'info',
    }),
  ],
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 250000, // 250KB
    maxAssetSize: 250000, // 250KB
    assetFilter: function(assetFilename) {
      return !assetFilename.endsWith('.map');
    },
  },
  // Resolve optimizations
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': require('path').resolve(__dirname, './'),
    },
    // Prefer ES modules for better tree shaking
    mainFields: ['module', 'main'],
  },
  // Module rules optimizations
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { modules: false }], // Important for tree shaking
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
    ],
  },
};
