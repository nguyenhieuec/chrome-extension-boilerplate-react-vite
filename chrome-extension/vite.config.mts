import { resolve } from 'node:path';
import { defineConfig, type PluginOption } from "vite";
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets';
import makeManifestPlugin from './utils/plugins/make-manifest-plugin';
import { watchPublicPlugin, watchRebuildPlugin } from '@extension/hmr';
import { isDev, isProduction, watchOption } from '@extension/vite-config';
import { copyFileSync } from 'node:fs'; // Import copyFileSync

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');

const outDir = resolve(rootDir, '..', 'dist');
export default defineConfig({
  resolve: {
    alias: {
      '@root': rootDir,
      '@src': srcDir,
      '@assets': resolve(srcDir, 'assets'),
    },
  },
  plugins: [
    libAssetsPlugin({
      outputPath: outDir,
    }) as PluginOption,
    watchPublicPlugin(),
    makeManifestPlugin({ outDir }),
    isDev && watchRebuildPlugin({ reload: true }),
    {
      name: 'copy-welcome-js',
      writeBundle: () => {
        try {
          copyFileSync(
            resolve(__dirname, 'welcome.js'),
            resolve(outDir, 'welcome.js')
          );
          console.log('welcome.js has been copied to the dist folder.');
        } catch (error) {
          console.error('Error copying welcome.js:', error);
        }
      },
    } as PluginOption,
    {
      name: 'copy-welcome-html',
      writeBundle: () => {
        try {
          copyFileSync(
            resolve(__dirname, 'welcome.html'),
            resolve(outDir, 'welcome.html')
          );
          console.log('welcome.html has been copied to the dist folder.');
        } catch (error) {
          console.error('Error copying welcome.html:', error);
        }
      },
    } as PluginOption,
  ],
  publicDir: resolve(rootDir, 'public'),
  build: {
    lib: {
      formats: ['iife'],
      entry: resolve(__dirname, 'src/background/index.ts'),
      name: 'BackgroundScript',
      fileName: 'background',
    },
    outDir,
    emptyOutDir: false,
    sourcemap: isDev,
    minify: isProduction,
    reportCompressedSize: isProduction,
    watch: watchOption,
    rollupOptions: {
      external: ['chrome'],
    },
  },
  envDir: '../',
});
