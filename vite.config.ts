
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega TODAS as vars do .env.local (prefixo vazio = sem filtro)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: process.env.VERCEL ? '/' : './', // '/' para Web/Vercel e './' para Electron
    define: {
      // Injeção explícita via define — garante que as vars cheguem ao browser
      // tanto em modo dev quanto em build de produção
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || env.GEMINI_API_KEY || env.API_KEY || ''),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false
    }
  };
});
