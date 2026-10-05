import { defineConfig, UserConfig, ConfigEnv } from 'vite';
import path from 'path';

export default defineConfig((env: ConfigEnv): UserConfig => {
  return {
    server: {
      port: 5000,
    },

    root: './',
    base: '/jewel/',

    publicDir: './public',

    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@framework': path.resolve(__dirname, './Framework/src'),
      },
    },

    build: {
      target: 'es2015',
      assetsDir: 'assets',
      outDir: './dist',
      sourcemap: env.mode === 'development',
    },
  };
});