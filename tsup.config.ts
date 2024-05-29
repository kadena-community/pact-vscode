import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  shims: false,
  dts: false,
  target: 'es2020',
  clean: true,
  minify: true,
  external: ['vscode'],
});
