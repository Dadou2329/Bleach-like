// Vite config for the headless capture tools: the app's config with HMR off, so editing sources while a long
// capture runs cannot reload the page mid-capture (the page keeps the modules it loaded at startup).
import { defineConfig, mergeConfig } from 'vite';
import base from '../../vite.config.ts';

export default mergeConfig(base, defineConfig({ server: { hmr: false } }));
