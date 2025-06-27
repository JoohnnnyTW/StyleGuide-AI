// This file provides type definitions for Vite's `import.meta.env`.
// The original reference to "vite/client" is removed to work around potential
// type resolution issues, and the necessary types are defined manually below.

interface ImportMetaEnv {
  BASE_URL: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}