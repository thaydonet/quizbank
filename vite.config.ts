import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Optimize for development
      server: {
        hmr: {
          overlay: false
        }
      },
      // Optimize build
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              router: ['react-router-dom'],
              supabase: ['@supabase/supabase-js']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      // Optimize caching for production
      ...(mode === 'production' && {
        build: {
          ...this.build,
          assetsInlineLimit: 4096,
          cssCodeSplit: true,
          sourcemap: false
        }
      })
    };
});
