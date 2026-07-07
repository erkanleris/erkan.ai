/* ── Token storage ─────────────────────────── */
const TOKEN_KEY = "erkan_auth_token";

export function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setStoredToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}
export function clearStoredToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

function getHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

/* ── Types ─────────────────────────────────── */
export type User = {
  id: number; name: string; username: string; email: string;
  bio: string | null; avatarUrl: string | null;
  subscriptionType: string; subscriptionExpiresAt: string | null;
  conversationCount: number; imageCount: number;
  createdAt: string; lastLoginAt: string | null;
};

export type Conversation = {
  id: number; userId: number | null; title: string; mode: string;
  createdAt: string; updatedAt: string;
};

export type Message = {
  id: number; conversationId: number; role: "user" | "assistant";
  content: string; createdAt: string;
};

export type SubscriptionStatus = {
  plan: string; expiresAt: string | null;
  dailyUsed: number; dailyLimit: number;
};

export type SubscriptionCode = {
  id: number; code: string; plan: string; durationDays: number;
  usedBy: number | null; usedAt: string | null;
  note: string | null; createdAt: string;
};

/* ── Auth ──────────────────────────────────── */

export async function authMe(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  const r = await fetch("/api/auth/me", { headers: getHeaders() });
  if (r.status === 401) { clearStoredToken(); return null; }
  if (!r.ok) return null;
  return r.json();
}

export async function authRegister(name: string, email: string, password: string): Promise<User> {
  const r = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Registration failed");
  setStoredToken(data.token);
  return data.user;
}

export async function authLogin(email: string, password: string): Promise<User> {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Login failed");
  setStoredToken(data.token);
  return data.user;
}

export async function authLogout(): Promise<void> {
  const token = getStoredToken();
  if (token) await fetch("/api/auth/logout", { method: "POST", headers: { "Authorization": `Bearer ${token}` } }).catch(() => {});
  clearStoredToken();
}

/* ── Users / Profile ───────────────────────── */

export async function getProfile(): Promise<User> {
  const r = await fetch("/api/users/me", { headers: getHeaders() });
  if (!r.ok) throw new Error("Failed to load profile");
  return r.json();
}

export async function updateProfile(data: Partial<Pick<User, "name" | "username" | "bio" | "avatarUrl">>): Promise<User> {
  const r = await fetch("/api/users/me", { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error ?? "Update failed");
  return result;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const r = await fetch("/api/users/me/password", {
    method: "PUT", headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Password change failed");
}

export async function deleteAccount(): Promise<void> {
  const r = await fetch("/api/users/me", { method: "DELETE", headers: authHeaders() });
  clearStoredToken();
  if (!r.ok) throw new Error("Delete account failed");
}

/* ── Subscriptions ─────────────────────────── */

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const r = await fetch("/api/subscriptions/status", { headers: getHeaders() });
  if (!r.ok) throw new Error("Failed to load subscription");
  return r.json();
}

export async function activateCode(code: string): Promise<{ plan: string; planName: string; expiresAt: string; durationDays: number }> {
  const r = await fetch("/api/subscriptions/activate", {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ code }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Activation failed");
  return data;
}

/* ── Admin ─────────────────────────────────── */

function adminHeaders(adminKey: string): HeadersInit {
  return { "Content-Type": "application/json", "Authorization": `Bearer ${adminKey}` };
}

export async function adminGenerateCode(
  adminKey: string, plan: string, durationDays: number, note?: string
): Promise<SubscriptionCode> {
  const r = await fetch("/api/admin/codes", {
    method: "POST", headers: adminHeaders(adminKey),
    body: JSON.stringify({ plan, durationDays, note }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Failed to generate code");
  return data.code;
}

export async function adminGetCodes(adminKey: string): Promise<SubscriptionCode[]> {
  const r = await fetch("/api/admin/codes", { headers: { "Authorization": `Bearer ${adminKey}` } });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Failed to load codes");
  return data;
}

export async function adminGetUsers(adminKey: string): Promise<User[]> {
  const r = await fetch("/api/admin/users", { headers: { "Authorization": `Bearer ${adminKey}` } });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Failed to load users");
  return data;
}

export async function adminDeleteCode(adminKey: string, id: number): Promise<void> {
  const r = await fetch(`/api/admin/codes/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${adminKey}` } });
  if (!r.ok) throw new Error("Failed to delete code");
}

/* ── Conversations ─────────────────────────── */

export async function getConversations(): Promise<Conversation[]> {
  const r = await fetch("/api/ai/conversations", { headers: getHeaders() });
  if (!r.ok) throw new Error("Failed to load conversations");
  return r.json();
}

export async function createConversation(title?: string, mode?: string): Promise<Conversation> {
  const r = await fetch("/api/ai/conversations", {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ title, mode }),
  });
  if (!r.ok) throw new Error("Failed to create conversation");
  return r.json();
}

export async function deleteConversation(id: number): Promise<void> {
  await fetch(`/api/ai/conversations/${id}`, { method: "DELETE", headers: getHeaders() });
}

export async function deleteAllConversations(): Promise<void> {
  await fetch("/api/ai/conversations", { method: "DELETE", headers: getHeaders() });
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const r = await fetch(`/api/ai/conversations/${conversationId}/messages`, { headers: getHeaders() });
  if (!r.ok) throw new Error("Failed to load messages");
  return r.json();
}

export function streamMessage(
  conversationId: number, content: string, mode: string,
  onChunk: (text: string) => void, onDone: () => void,
  onError: (err: string) => void, signal?: AbortSignal
): void {
  fetch(`/api/ai/conversations/${conversationId}/messages`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ content, mode }), signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: "Connection failed" }));
      onError(err.error ?? "Failed to connect to AI");
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) onChunk(data.content);
          if (data.done) onDone();
          if (data.error) onError(data.error);
        } catch { /* ignore */ }
      }
    }
  }).catch((err) => {
    if ((err as Error).name !== "AbortError") onError(String(err));
  });
}

export async function generateImage(prompt: string): Promise<string> {
  const r = await fetch("/api/ai/generate-image", {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ prompt }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Image generation failed");
  return data.url;
}
