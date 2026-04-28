import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { runPostBuild } from './scripts/post-build';

function getVersion(): string {
  const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')) as {
    version?: string;
  };
  return (pkg.version ?? '0.0.0').replace(/\./g, '-');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const version = getVersion();

  return {
    base: './',
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: `assets/fast-stocking-list-v${version}-[name]-[hash].js`,
          assetFileNames: `assets/fast-stocking-list-v${version}-[name]-[hash][extname]`,
          entryFileNames: `assets/fast-stocking-list-v${version}-[name]-[hash].js`,
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('jspdf') || id.includes('html-to-image') || id.includes('jszip')) {
              return 'vendor-export';
            }
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'fast-stocking-list-post-build',
        closeBundle() {
          runPostBuild({ siteUrl: env.SITE_URL });
        },
      },
    ],
  };
});
