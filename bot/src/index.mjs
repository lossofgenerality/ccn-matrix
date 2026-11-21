// CCN Matrix bot — sandbox edition.
// Logs into the homeserver as an automated account, creates (or rejoins) the
// "CCN Sandbox" room, invites the people listed in SANDBOX_INVITE, and answers
// messages there through the construct in claude.mjs.
// © Computational Classnotes · CC BY-NC-SA 4.0

import {
  createClient,
  ClientEvent,
  RoomEvent,
  RoomMemberEvent,
  EventType,
  MsgType,
  Preset,
  Visibility,
} from "matrix-js-sdk";
import { logger } from "matrix-js-sdk/lib/logger.js";
import { waitForHomeserver, loginOrRegister } from "./account.mjs";
import { reply, mode } from "./claude.mjs";

logger.setLevel(process.env.SDK_LOG_LEVEL || "warn");

const env = process.env;
const HS_URL = env.HOMESERVER_URL || "http://localhost:8008";
const BOT_USER = env.BOT_USERNAME || "claude";
const BOT_PASSWORD = env.BOT_PASSWORD;
const REG_TOKEN = env.REGISTRATION_TOKEN;
const ROOM_ALIAS_LOCAL = env.SANDBOX_ROOM_ALIAS || "sandbox";
const INVITE = (env.SANDBOX_INVITE || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const HISTORY = Number(env.HISTORY_MESSAGES || 20);
const DISPLAY_NAME = env.BOT_DISPLAY_NAME || "Claude (CCN sandbox · automated)";
const COPYRIGHT = "© Computational Classnotes · CC BY-NC-SA 4.0";

if (!BOT_PASSWORD) {
  console.error("[ccn-bot] BOT_PASSWORD is required");
  process.exit(1);
}

await waitForHomeserver(HS_URL);
const session = await loginOrRegister(HS_URL, BOT_USER, BOT_PASSWORD, REG_TOKEN);
const me = session.user_id;
const serverName = me.split(":").slice(1).join(":");

const client = createClient({
  baseUrl: HS_URL,
  accessToken: session.access_token,
  userId: me,
  deviceId: session.device_id,
});

console.log(`[ccn-bot] signed in as ${me} · construct mode: ${mode()}`);

// ---------- the sandbox room ----------

async function ensureSandboxRoom() {
  const alias = `#${ROOM_ALIAS_LOCAL}:${serverName}`;
  let roomId;
  try {
    roomId = (await client.getRoomIdForAlias(alias)).room_id;
    await client.joinRoom(roomId);
  } catch {
    const created = await client.createRoom({
      name: "CCN Sandbox",
      topic: `Test room: you + Claude (an automated account). Messages here are sent to the construct to be answered. ${COPYRIGHT}`,
      room_alias_name: ROOM_ALIAS_LOCAL,
      preset: Preset.PrivateChat,
      visibility: Visibility.Private,
      // Deliberately unencrypted: the sandbox bot has no E2EE store yet.
    });
    roomId = created.room_id;
    console.log(`[ccn-bot] created ${alias} (${roomId})`);
  }
  return roomId;
}

// People may register after the bot starts, so keep retrying invites.
async function inviteLoop(roomId) {
  const pending = new Set(INVITE);
  while (pending.size) {
    for (const user of [...pending]) {
      const room = client.getRoom(roomId);
      const m = room?.getMember(user)?.membership;
      if (m === "join" || m === "invite") {
        pending.delete(user);
        continue;
      }
      try {
        await client.invite(roomId, user);
        console.log(`[ccn-bot] invited ${user} to the sandbox room`);
        pending.delete(user);
      } catch (e) {
        if (e?.errcode !== "M_NOT_FOUND" && e?.httpStatus !== 404)
          console.log(`[ccn-bot] invite ${user} not yet possible: ${e?.errcode || e?.message}`);
      }
    }
    if (pending.size) await new Promise((r) => setTimeout(r, 15000));
  }
}

// ---------- answering ----------

const warnedEncrypted = new Set();
const busy = new Set();

function humansIn(room) {
  return room.getJoinedMembers().filter((m) => m.userId !== me).length;
}

function addressed(room, text) {
  if (humansIn(room) <= 1) return true; // one-to-one with the construct: always answer
  const t = text.toLowerCase();
  return t.includes(BOT_USER.toLowerCase()) || t.includes(me.toLowerCase()); // group: answer when addressed
}

function recentHistory(room) {
  return room
    .getLiveTimeline()
    .getEvents()
    .filter((e) => e.getType() === EventType.RoomMessage && typeof e.getContent().body === "string")
    .slice(-HISTORY)
    .map((e) => ({
      fromBot: e.getSender() === me,
      sender: room.getMember(e.getSender())?.name || e.getSender(),
      text: e.getContent().body,
    }));
}

async function handle(event, room) {
  if (event.getSender() === me) return;

  if (event.getType() === EventType.RoomMessageEncrypted) {
    if (!warnedEncrypted.has(room.roomId)) {
      warnedEncrypted.add(room.roomId);
      await client.sendNotice(
        room.roomId,
        "This room is encrypted and the sandbox bot can't read encrypted messages yet. Please chat in the CCN Sandbox room instead.",
      );
    }
    return;
  }
  if (event.getType() !== EventType.RoomMessage) return;
  const content = event.getContent();
  if (content.msgtype !== MsgType.Text || typeof content.body !== "string") return;
  if (!addressed(room, content.body)) return;
  if (busy.has(room.roomId)) return; // one answer at a time per room
  busy.add(room.roomId);

  try {
    await client.sendTyping(room.roomId, true, 30000);
    const text = await reply(recentHistory(room));
    if (text) await client.sendTextMessage(room.roomId, text);
  } catch (e) {
    console.error(`[ccn-bot] ${e.message}`);
    await client.sendNotice(room.roomId, `Sorry, I couldn't answer that (${e.message}).`).catch(() => {});
  } finally {
    await client.sendTyping(room.roomId, false, 0).catch(() => {});
    busy.delete(room.roomId);
  }
}

// Accept invites to other rooms (direct chats, test rooms).
client.on(RoomMemberEvent.Membership, (_e, member) => {
  if (member.userId === me && member.membership === "invite") {
    client.joinRoom(member.roomId).then(
      () => console.log(`[ccn-bot] joined ${member.roomId} after invite`),
      (e) => console.error(`[ccn-bot] could not join ${member.roomId}: ${e.message}`),
    );
  }
});

let ready = false;
client.on(RoomEvent.Timeline, (event, room, toStartOfTimeline) => {
  if (!ready || toStartOfTimeline || !room) return; // ignore backfill and the initial sync
  handle(event, room);
});

client.once(ClientEvent.Sync, async (state) => {
  if (state !== "PREPARED") return;
  ready = true;
  await client.setDisplayName(DISPLAY_NAME).catch(() => {});
  const roomId = await ensureSandboxRoom();
  console.log(`[ccn-bot] ready — sandbox room ${roomId}`);
  inviteLoop(roomId);
});

await client.startClient({ initialSyncLimit: HISTORY });

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    client.stopClient();
    process.exit(0);
  });
}
