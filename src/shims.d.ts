// markdown-it-emoji v3 ships ESM without bundled type declarations.
declare module 'markdown-it-emoji' {
  import type { PluginSimple } from 'markdown-it';
  export const full: PluginSimple;
  export const light: PluginSimple;
  export const bare: PluginSimple;
}
