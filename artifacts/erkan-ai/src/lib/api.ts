export type Conversation = {
  id: number;
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

const BASE = "/api/ai";

export async function getConversations(): Promise<Conversation[]> {
  const r = await fetch(`${BASE}/conversations`);
  if (!r.ok) throw new Error("Failed to load conversations");
  return r.json();
}

export async function createConversation(title?: string, mode?: string): Promise<Conversation> {
  const r = await fetch(`${BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, mode }),
  });
  if (!r.ok) throw new Error("Failed to create conversation");
  return r.json();
}

export async function deleteConversation(id: number): Promise<void> {
  await fetch(`${BASE}/conversations/${id}`, { method: "DELETE" });
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  const r = await fetch(`${BASE}/conversations/${conversationId}/messages`);
  if (!r.ok) throw new Error("Failed to load messages");
  return r.json();
}

export function streamMessage(
  conversationId: number,
  content: string,
  mode: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal?: AbortSignal
): void {
  fetch(`${BASE}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, mode }),
    signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      onError("Failed to connect to AI");
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
        } catch {}
      }
    }
  }).catch((err) => {
    if ((err as Error).name !== "AbortError") onError(String(err));
  });
}

export async function generateImage(prompt: string): Promise<string> {
  const r = await fetch(`${BASE}/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error("Image generation failed");
  const data = await r.json();
  return data.url;
}
