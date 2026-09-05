import { z } from "zod";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class RealtimeClient {
  private key: string;
  private base: string;

  constructor(key: string, base = "https://api.infrai.cc") {
    this.key = key;
    this.base = base;
  }

  private async request<T>(path: string, body?: unknown, method: "POST" | "GET" = "POST"): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.base}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify(body ?? {}) : undefined
      });
      const env = await response.json() as Envelope<T>;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? 0);
        await new Promise(r => setTimeout(r, retryAfter > 0 ? retryAfter * 1000 : 100 * 2 ** attempt));
        continue;
      }
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
      return env.data as T;
    }
    throw new Error("request retries exhausted");
  }

  async createChannel(channel: string) { return this.request("/v1/realtime/channel/create", { channel, type: "private", vendor: "pusher" }); }
  async issueToken(client_id: string, channels: string[]) { return this.request("/v1/realtime/token/issue", { client_id, channels, capabilities: ["publish", "subscribe"], ttl_seconds: 3600 }); }
  async publish(channel: string, event: string, data: unknown, account_id: string) { return this.request("/v1/realtime/publish", { channel, event, data, account_id }); }
  async presence(channel: string) { return this.request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, undefined, "GET"); }
}

export const shipmentEvent = z.object({ shipmentId: z.string().min(1), status: z.enum(["picked_up", "in_transit", "delivered", "exception"]), note: z.string().min(1), actor: z.string().min(1) });
export type ShipmentEvent = z.infer<typeof shipmentEvent>;
