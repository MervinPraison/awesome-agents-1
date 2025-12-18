import { Agent } from "agents";
import { PersistedObject } from "../persisted";
import type { Interaction, MessageParams, Info } from "./types";

// Rate‑limit friendly fetch for Discord REST
export async function discordFetch(
  path: string,
  init: RequestInit & { botToken: string }
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bot ${init.botToken}`);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  const res = await fetch(`${DISCORD_API}${path}`, { ...init, headers });

  if (res.status !== 429) return res;

  // Respect per-route/global limits. Retry once after retry_after.
  // (Discord says: parse headers/body, don't hardcode numbers.)
  const data: any = await res.json().catch(() => ({}));
  const retryAfterMs = Math.ceil((data.retry_after ?? 1) * 1000);
  await new Promise((r) => setTimeout(r, retryAfterMs));
  return fetch(`${DISCORD_API}${path}`, { ...init, headers });
}

export const DISCORD_API = "https://discord.com/api/v10";

export class DiscordAgent extends Agent {
  readonly info: Info;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const kv = ctx.storage.kv;
    this.info = PersistedObject<Info>(kv, { prefix: "info_" });
  }

  async onDmMessage(_msg: {
    channelId: string;
    authorId: string;
    content: string;
    id: string;
  }): Promise<void> {
    throw new Error("onDmMessage not implemented");
  }

  async ensureDmChannel(): Promise<string> {
    if (this.info.dmChannel) return this.info.dmChannel;
    const res = await discordFetch(`/users/@me/channels`, {
      method: "POST",
      botToken: this.env.DISCORD_BOT_TOKEN,
      body: JSON.stringify({ recipient_id: this.info.userId }),
    });
    if (!res.ok)
      throw new Error(`Failed to open DM: ${res.status} ${await res.text()}`);
    const json = await res.json<{ id: string }>();
    this.info.dmChannel = json.id;
    return json.id;
  }

  async sendDm(msg: string) {
    const channelId = await this.ensureDmChannel();
    const chunks = this.splitMessageByNewline(msg, 2000);
    for (const chunk of chunks) {
      await this.sendChannelMessage(channelId, chunk);
    }
  }

  private async sendChannelMessage(
    channelId: string,
    msg: MessageParams | string
  ) {
    const body: MessageParams =
      typeof msg === "string" ? { content: msg } : msg;
    const res = await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      botToken: this.env.DISCORD_BOT_TOKEN,
      body: JSON.stringify(body),
    });
    if (!res.ok)
      console.error("Discord API HTTP", res.status, await res.text());
  }

  // because discord messages have a 2k char limit and llms like to go long sometimes
  private splitMessageByNewline(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }

      // Find the last newline before maxLength
      let splitIndex = remaining.lastIndexOf("\n", maxLength);

      // If no newline found, try to split at last space
      if (splitIndex === -1 || splitIndex === 0) {
        splitIndex = remaining.lastIndexOf(" ", maxLength);
      }

      // If still no good split point, just split at maxLength
      if (splitIndex === -1 || splitIndex === 0) {
        splitIndex = maxLength;
      }

      chunks.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex + 1); // +1 to skip the newline/space
    }

    return chunks;
  }
}
