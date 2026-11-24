# What's installed for Matrix so far

*Status as of 21 November 2026.*

## On GitHub (lossofgenerality/ccn-matrix)

- **Two matrix-org libraries, chosen from the report's roadmap.**
  - **matrix-js-sdk 45.1.0** powers the bot.
  - **matrix-widget-api 1.20.0** is ready for stage 4 (CCN pages inside chat rooms). No widgets are built yet.
- **Two more selected, documented but not installed.** **matrix-hookshot** (GitHub activity feeds) and **mjolnir** (moderation) are for later stages. `services/README.md` says when to add each.
- **The rest deliberately left out.** That covers the Rust SDK, vodozemac, the bridge libraries, the specs and others. `MATRIX-ORG-SELECTION.md` gives the reason for each.
- **The bot (`bot/`).** A CCN conversational-construct that:
  - signs in on its own and creates or joins rooms;
  - answers everything one-to-one, and in group rooms only when someone uses its name;
  - reaches Claude directly or through a CCN Cloud proxy, and falls back to echo mode when no key is set;
  - reads a briefing file you can edit without restarting;
  - flags replies cut off at the length limit;
  - comes with an offline self-test.
- **The sandbox (`sandbox/`).** One Docker Compose setup that runs:
  - a Matrix server (**Tuwunel**, from outside matrix-org, because matrix-org no longer publishes a server);
  - the **Element Web** chat app;
  - the bot.

  It runs on the local machine only, with no federation.
- **Mac start and stop files** (`start-sandbox.command` and `stop-sandbox.command`), plus a README.
- **`hoshino/`**, the folder this file is in.

## On Dara's Mac (Desktop → ccn-matrix)

- A copy of the repo, kept in sync with GitHub.
- **Private, git-ignored files:**
  - `sandbox/.env`: the registration token, passwords, the API key and the bot's display name.
  - `sandbox/prompts/briefing.md`: Noor's CCN briefing, including the email context.
  - `sandbox/data/`: the server's database with all chats.
- **Running in Docker:** the server at `localhost:8008` and Element at `localhost:8080`.
- **Accounts:**
  - `@dara`
  - `@noor`: the always-on bot, Hikari Noor Hoshino (星野ヌール)
  - `@claude`: the old bot account, now silent
  - `@claude-live`: an earlier visitor account, signed out and in no rooms
- **Rooms:**
  - **CCN Sandbox:** unencrypted; Noor answers when named.
  - **Dara & Noor:** the direct chat, also unencrypted; Noor answers every message.

## Still to come, from the report's roadmap

- A hosted server, so the team can join from anywhere.
- matrix-hookshot and mjolnir.
- The first CCN widget.
- A public literature room.
- Claude reached through CCN Cloud, so the API key lives in Wolfram Cloud.

---
*Production: Principal Investigator Lucval · Editors Dara, Lucia · Software FreeFormer · Hikari Noor Hoshino (星野ヌール), AI System Programming Group*

**© Computational Classnotes · CC BY-NC-SA 4.0**
