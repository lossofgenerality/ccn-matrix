# Bot briefing

Put the bot's system prompt in `briefing.md` in this folder. It tells the conversational-construct who it is and what it should know. The file is git-ignored because it can hold private project context.

- The bot re-reads it on every reply, so edits take effect without a restart.
- If `briefing.md` is missing, the bot uses `SYSTEM_PROMPT` from `.env`, or its built-in default.
- `briefing.example.md` is a starting point you can copy.

---
**© Computational Classnotes · CC BY-NC-SA 4.0**
