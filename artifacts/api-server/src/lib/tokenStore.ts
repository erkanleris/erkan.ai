import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "erkan-ai-secret-fallback";
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Small in-memory blacklist for logged-out tokens (only grows on logout)
const blacklist = new Set<string>();

export function createToken(userId: number): string {
  return jwt.sign({ uid: userId }, SECRET, { expiresIn: TTL_SECONDS });
}

export function getUserId(token: string): number | null {
  if (blacklist.has(token)) return null;
  try {
    const payload = jwt.verify(token, SECRET) as { uid: number };
    return payload.uid;
  } catch {
    return null;
  }
}

export function deleteToken(token: string): void {
  blacklist.add(token);
}
