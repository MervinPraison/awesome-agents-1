import { getAgentByName } from "agents";
import { DurableObject } from "cloudflare:workers";
import { PersistedObject } from "../persisted";

const GATEWAY_ENDPOINT = "https://discord.com/api/v10/gateway";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

type State = {
  seq: number;
};

export class DiscordGateway extends DurableObject<Env> {
  heartbeatInterval = 0;
  ws: WebSocket | null = null;
  private readonly state;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = PersistedObject<State>(state.storage.kv, { prefix: "state_" });
  }

  async alarm() {
    await this.heartbeat();
  }

  async start() {
    console.log("starting discord gateway");
    if (this.ws) {
      return;
    }

    // get gateway url
    const gatewayResp = await fetch(GATEWAY_ENDPOINT);
    const { url } = await gatewayResp.json<{ url: string }>();
    const asUrl = new URL(url);

    // open ws connection with discord gateway
    const resp = await fetch(`https://${asUrl.host}?v=10&encoding=json`, {
      headers: {
        Upgrade: "websocket",
        Authorization: `Bot ${BOT_TOKEN}`
      }
    });
    const ws = resp.webSocket;
    if (!ws) throw "Error, ws was empty";
    ws?.accept();

    // setup event handlers
    ws.addEventListener(
      "message",
      async (e) => await this.handleMessage(e.data)
    );
    ws.addEventListener("close", () => this.handleClose());
    ws.addEventListener("error", console.error);
    this.ws = ws;
  }

  async handleMessage(rawData: any) {
    if (!this.ws) throw Error("Received msg when no ws is set?");
    const payload = JSON.parse(rawData);
    const { op, t, d, s } = payload;

    // Track sequence for resuming and heartbeats
    if (s !== null) this.state.seq = s;

    switch (op) {
      case 10: // Hello
        this.heartbeatInterval = d.heartbeat_interval;
        this.heartbeat();
        this.identify();
        break;

      case 0: // Dispatch
        await this.onDispatch(t, d);
        break;

      case 11: // Heartbeat ACK
        break;
    }
  }

  private identify() {
    const INTENTS = {
      DIRECT_MESSAGES: 1 << 12,
      MESSAGE_CONTENT: 1 << 15
    };
    const intents = INTENTS.DIRECT_MESSAGES | INTENTS.MESSAGE_CONTENT;
    this.ws?.send(
      JSON.stringify({
        op: 2,
        d: {
          token: BOT_TOKEN,
          intents,
          properties: { os: "cf", browser: "cf", device: "cf" }
        }
      })
    );
  }

  private async onDispatch(t: string, d: any) {
    // Only handle DM messages from non-bots
    if (t === "MESSAGE_CREATE" && !d.author?.bot && !d.guild_id && d.content) {
      const agent = await getAgentByName(this.env.AGENT, "default");
      await agent.onDmMessage({
        channelId: d.channel_id,
        authorId: d.author.id,
        content: d.content,
        id: d.id
      });
    }
  }

  private async heartbeat() {
    if (this.ws) {
      const msg = JSON.stringify({
        op: 1,
        d: this.state.seq ?? 0
      });
      this.ws.send(msg);
      await this.ctx.storage.setAlarm(Date.now() + this.heartbeatInterval);
    }
  }

  async handleClose() {
    console.log("closed");
    this.ws = null;
    await this.start();
  }
}
