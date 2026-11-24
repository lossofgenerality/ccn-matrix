# ccn-matrix

Matrix for Computational Classnotes (CCN): the matrix-org components selected in the report *Matrix for CCN's Messaging Applications*, plus a **local sandbox** where you and Claude can chat in a Matrix room.

| Folder | What's in it |
|---|---|
| [`sandbox/`](sandbox/) | One-command local Matrix server, Element Web and the Claude bot |
| [`bot/`](bot/) | The CCN conversational-construct bot, built on matrix-org/matrix-js-sdk |
| [`widgets/`](widgets/) | matrix-org/matrix-widget-api, ready for Stage 4 (CCN pages inside rooms) |
| [`services/`](services/) | When and how to add matrix-hookshot and mjolnir (Stages 1–2) |
| [`MATRIX-ORG-SELECTION.md`](MATRIX-ORG-SELECTION.md) | Which matrix-org repositories are used, which are left out, and why |

## Sandbox: chat with Claude over Matrix

Everything runs on your own computer, bound to `localhost`, with federation turned off. Nobody outside can reach it.

**You need:** Docker Desktop (or Docker Engine with Compose).

1. **Configure.** In `sandbox/`, copy `.env.example` to `.env`. Fill in `REGISTRATION_TOKEN`, `BOT_PASSWORD` and your user ID in `SANDBOX_INVITE` (for example `@lucval:localhost`). Then pick how the bot reaches Claude:
   - `ANTHROPIC_API_KEY`: direct. The key stays in `.env` on your computer.
   - `CONSTRUCT_PROXY_URL`: through a CCN Cloud proxy, so the key stays in Wolfram Cloud, as with TUTUKernel and MAXITKernel. The proxy receives an Anthropic Messages API request body. It returns either the Messages API response or `{"reply": "..."}`.
   - Neither: **echo mode**. The bot repeats what you say, which tests that everything is connected.
2. **Start it.** On a Mac, double-click `start-sandbox.command`. It starts Docker Desktop if needed, opens the chat app and shows your username and registration token. Anywhere else, run `docker compose up -d --build` in `sandbox/`. To stop it, double-click `stop-sandbox.command` or run `docker compose down`.
3. **Register.** Open <http://localhost:8080> and choose *Create account*. Use the username from `SANDBOX_INVITE` (for example `lucval`) and enter the registration token when asked.
4. **Chat.** Within about 15 seconds you'll get an invite to **CCN Sandbox** from *Claude (CCN sandbox · automated)*. Accept it and say hello.

Good to know:

- **The sandbox room is deliberately unencrypted**, because the bot can't read encrypted messages yet. If you start a direct message with the bot, Element encrypts it, and the bot will point you back to the sandbox room.
- **Who the bot answers.** If only one person is in the room, the bot answers every message. Once more people join, it answers only when someone mentions it by name.
- **Logs:** `docker compose logs -f bot`
- **Stop:** `docker compose down`. Your data stays in `sandbox/data/`. Delete that folder to start fresh.
- Each message sends the room's last 20 messages to Claude. That costs API usage when a key is set.

## Bot self-test (no server needed)

```
cd bot && npm install && npm run check
```

This runs the registration flow, the history-to-conversation conversion and the proxy path against a mock server.

## Notes on the CCN principles from the report

- **Logic and keys stay out of Matrix.** The bot only carries messages. The construct is either Claude through your key or your CCN Cloud proxy.
- **The bot is clearly labelled** as automated, and the room topic says the construct is present.
- **Every room topic carries the content licence.**

---
*Production: Principal Investigator Lucval · Editors Dara, Lucia · Software FreeFormer · Agent Kirari-chan (キラリちゃん)*

**© Computational Classnotes · CC BY-NC-SA 4.0**
