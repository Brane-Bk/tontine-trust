/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TALYPAY_TOKEN?: string;
  /** "false" pour désactiver le règlement immédiat fictif (prod + webhooks TalyPay). */
  readonly VITE_DEMO_PAYMENTS?: string;
}
