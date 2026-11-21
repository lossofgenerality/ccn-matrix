// Offline self-test: runs the account and construct logic against a local mock
// server (no real homeserver or API key needed). Run with `npm run check`.
// © Computational Classnotes · CC BY-NC-SA 4.0

import http from "node:http";
import assert from "node:assert/strict";
import { loginOrRegister, waitForHomeserver } from "./account.mjs";
import { toMessages, reply, mode } from "./claude.mjs";

const seen = [];
const server = http.createServer(async (req, res) => {
  let raw = "";
  for await (const c of req) raw += c;
  const body = raw ? JSON.parse(raw) : {};
  seen.push({ url: req.url, body });
  const send = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  if (req.url === "/_matrix/client/versions") return send(200, { versions: ["v1.19"] });
  if (req.url === "/_matrix/client/v3/login") return send(403, { errcode: "M_FORBIDDEN" });
  if (req.url === "/_matrix/client/v3/register") {
    const flows = [{ stages: ["m.login.registration_token", "m.login.dummy"] }];
    if (!body.auth) return send(401, { session: "s1", flows });
    if (body.auth.type === "m.login.registration_token") {
      if (body.auth.token !== "tok") return send(401, { session: "s1", flows, errcode: "M_FORBIDDEN" });
      return send(401, { session: "s1", flows, completed: ["m.login.registration_token"] });
    }
    if (body.auth.type === "m.login.dummy")
      return send(200, { user_id: `@${body.username}:localhost`, access_token: "at", device_id: "D1" });
  }
  if (req.url === "/proxy") {
    assert.equal(body.messages[0].role, "user");
    return send(200, { content: [{ type: "text", text: `proxy got ${body.messages.length} turns` }] });
  }
  send(404, { errcode: "M_UNRECOGNIZED" });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

await waitForHomeserver(base, { tries: 2, delayMs: 10 });
const s = await loginOrRegister(base, "claude", "pw", "tok");
assert.equal(s.user_id, "@claude:localhost");
assert.deepEqual(
  seen.filter((x) => x.url.endsWith("/register")).map((x) => x.body.auth?.type ?? "none"),
  ["none", "m.login.registration_token", "m.login.dummy"],
);

const history = [
  { fromBot: true, sender: "Claude", text: "hello?" }, // leading bot turn is dropped
  { fromBot: false, sender: "Lucval", text: "Hi Claude" },
  { fromBot: false, sender: "Dara", text: "and hi from me" },
  { fromBot: true, sender: "Claude", text: "Hi both!" },
  { fromBot: false, sender: "Lucval", text: "Test passed?" },
];
const msgs = toMessages(history);
assert.deepEqual(
  msgs.map((m) => m.role),
  ["user", "assistant", "user"],
);
assert.equal(msgs[0].content, "Lucval: Hi Claude\nDara: and hi from me");

assert.equal(mode({}), "echo");
assert.match(await reply(history, {}), /echo mode.*Test passed\?/);
assert.equal(mode({ CONSTRUCT_PROXY_URL: "x", ANTHROPIC_API_KEY: "y" }), "proxy");
assert.equal(await reply(history, { CONSTRUCT_PROXY_URL: `${base}/proxy` }), "proxy got 3 turns");

server.close();
console.log("selftest ok");
