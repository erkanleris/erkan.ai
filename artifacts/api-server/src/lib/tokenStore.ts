import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// In-memory blacklist for logged-out tokens.
// Only verified tokens are added (prevents memory abuse), and entries
// expire alongside the token itself.
const blacklist = new Map<string, number>(); // token -> expiry (ms)

function pruneBlacklist(): void {
  const now = Date.now();
  for (const [t, exp] of blacklist) {
    if (exp < now) blacklist.delete(t);
  }
}

export function createToken(userId: number): string {
  return jwt.sign({ uid: userId }, SECRET as string, { expiresIn: TTL_SECONDS });
}

export function getUserId(token: string): number | null {
  if (blacklist.has(token)) return null;
  try {
    const payload = jwt.verify(token, SECRET as string) as { uid: number };
    return payload.uid;
  } catch {
    return null;
  }
}

export function deleteToken(token: string): void {
  try {
    const payload = jwt.verify(token, SECRET as string) as { exp?: number };
    pruneBlacklist();
    blacklist.set(token, (payload.exp ?? 0) * 1000 || Date.now() + TTL_SECONDS * 1000);
  } catch {
    // Invalid token — nothing to blacklist
  }
}
