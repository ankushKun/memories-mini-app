/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_KEY: string;
  readonly VITE_PUBLIC_POSTHOG_HOST: string;
  // Add other environment variables if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}