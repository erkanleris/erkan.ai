const FETCH_OPTS: RequestInit = { credentials: "include" };

export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  subscriptionType: string;
  conversationCount: number;
  imageCount: number;
  createdAt: string;
  lastLoginAt: string | null;
};

export type Conversation = {
  id: number;
  userId: number | null;
  title: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

/* ── Auth ──────────────────────────────────────────── */

export async function authMe(): Promise<User | null> {
  const r = await fetch("/api/auth/me", FETCH_OPTS);
  if (r.status === 401) return null;
  if (!r.ok) return null;
  return r.json();
}

export async function authRegister(name: string, email: string, password: string): Promise<User> {
  const username = email.split("@")[0]!.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const r = await fetch("/api/auth/register", {
    ...FETCH_OPTS, method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Registration failed");
  return data;
}

export async function authLogin(email: string, password: string): Promise<User> {
  const r = await fetch("/api/auth/login", {
    ...FETCH_OPTS, method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Login failed");
  return data;
}

export async function authLogout(): Promise<void> {
  await fetch("/api/auth/logout", { ...FETCH_OPTS, method: "POST" });
}

/* ── Users / Profile ───────────────────────────────── */

export async function getProfile(): Promise<User> {
  const r = await fetch("/api/users/me", FETCH_OPTS);
  if (!r.ok) throw new Error("Failed to load profile");
  return r.json();
}

export async function updateProfile(data: Partial<Pick<User, "name" | "username" | "bio" | "avatarUrl">>): Promise<User> {
  const r = await fetch("/api/users/me", {
    ...FETCH_OPTS, method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error ?? "Update failed");
  return result;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const r = await fetch("/api/users/me/password", {
    ...FETCH_OPTS, method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Password change failed");
}

export async function deleteAccount(): Promise<void> {
  const r = await fetch("/api/users/me", { ...FETCH_OPTS, method: "DELETE" });
  if (!r.ok) throw new Error("Delete account failed");
}

/* ── Conversations ─────────────────────────────────── */

export async function getConversations(): Promise<Conversation[]> {
  const r = await fetch("/api/ai/conversations", FETCH_OPTS);
  if (!r.ok) throw new Error("Failed to load conversations");
  return r.json();
}

export async function createConversation(title?: string, mode?: string): Promise<Conversation> {
  const r = await fetch("/api/ai/conversations", {
    ...FETCH_OPTS, method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, mode }),
  });
  if (!r.ok) throw new Error("Failed to create conversation");
  return r.json();
}

export async function deleteConversation(id: number): Promise<void> {
  await fetch(`/api/ai/conversations/${id}`, { ...FETCH_OPTS, method: "DELETE" });
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const r = await fetch(`/api/ai/conversations/${conversationId}/messages`, FETCH_OPTS);
  if (!r.ok) throw new Error("Failed to load messages");
  return r.json();
}

export function streamMessage(
  conversationId: number, content: string, mode: string,
  onChunk: (text: string) => void, onDone: () => void,
  onError: (err: string) => void, signal?: AbortSignal
): void {
  fetch(`/api/ai/conversations/${conversationId}/messages`, {
    ...FETCH_OPTS, method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, mode }), signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) { onError("Failed to connect to AI"); return; }
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
    ...FETCH_OPTS, method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error("Image generation failed");
  const data = await r.json();
  return data.url;
}
