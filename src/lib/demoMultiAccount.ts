/**
 * Comptes multiples sur un même appareil — UNIQUEMENT pour démonstration.
 * Les mots de passe sont stockés en clair dans localStorage (jamais en production).
 */
const STORAGE_KEY = "tontine_trust_demo_accounts_v1";
const MAX_ACCOUNTS = 12;

export interface DemoAccountRecord {
  email: string;
  password: string;
  label: string;
  savedAt: string;
}

export function getDemoAccounts(): DemoAccountRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is DemoAccountRecord =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as DemoAccountRecord).email === "string" &&
        typeof (x as DemoAccountRecord).password === "string"
    );
  } catch {
    return [];
  }
}

function persist(list: DemoAccountRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ACCOUNTS)));
}

/** Ajoute ou remplace le compte (identifié par l’email, insensible à la casse). */
export function saveDemoAccount(email: string, password: string, label?: string) {
  const trimmed = email.trim();
  const norm = trimmed.toLowerCase();
  const rest = getDemoAccounts().filter((a) => a.email.toLowerCase() !== norm);
  const displayLabel = (label?.trim() || trimmed.split("@")[0] || "Compte").slice(0, 40);
  const next: DemoAccountRecord = {
    email: trimmed,
    password,
    label: displayLabel,
    savedAt: new Date().toISOString(),
  };
  persist([next, ...rest]);
}

export function removeDemoAccount(email: string) {
  const norm = email.trim().toLowerCase();
  persist(getDemoAccounts().filter((a) => a.email.toLowerCase() !== norm));
}

export function clearDemoAccounts() {
  localStorage.removeItem(STORAGE_KEY);
}
