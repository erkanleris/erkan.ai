import { randomUUID } from "crypto";

const store = new Map<string, { userId: number; expiresAt: number }>();
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createToken(userId: number): string {
  const token = randomUUID();
  store.set(token, { userId, expiresAt: Date.now() + TTL });
  return token;
}

export function getUserId(token: string): number | null {
  const entry = store.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) { store.delete(token); return null; }
  return entry.userId;
}

export function deleteToken(token: string): void {
  store.delete(token);
}
