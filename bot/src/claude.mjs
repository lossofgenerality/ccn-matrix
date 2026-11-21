// The conversational-construct's "brain": turns a room's recent history into a
// reply. Three modes, chosen by environment variables:
//   CONSTRUCT_PROXY_URL  -> POST the Messages API body to a CCN Cloud proxy
//                           (keeps the API key off this machine; same idea as
//                           TUTUKernel / MAXITKernel)
//   ANTHROPIC_API_KEY    -> call the Anthropic Messages API directly
//   (neither)            -> echo mode, for testing the plumbing only
// © Computational Classnotes · CC BY-NC-SA 4.0

import { readFileSync } from "node:fs";

const API_URL = "https://api.anthropic.com/v1/messages";

const DEFAULT_PROMPT =
  "You are Claude, taking part in a Computational Classnotes (CCN) Matrix test room as a clearly labelled automated account. " +
  "Messages from people are prefixed with their name. Reply conversationally and concisely in plain text.";

// System prompt: SYSTEM_PROMPT_FILE (a briefing file, re-read on every reply so
// edits apply without a restart) > SYSTEM_PROMPT > built-in default.
export function systemPrompt(env = process.env) {
  if (env.SYSTEM_PROMPT_FILE) {
    try {
      const text = readFileSync(env.SYSTEM_PROMPT_FILE, "utf8").trim();
      if (text) return text;
    } catch {
      /* missing file: fall through */
    }
  }
  return env.SYSTEM_PROMPT || DEFAULT_PROMPT;
}

export function mode(env = process.env) {
  if (env.CONSTRUCT_PROXY_URL) return "proxy";
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  return "echo";
}

// Matrix history -> Messages API turns. Messages from people become "user"
// turns (prefixed with the sender's name so Claude can tell people apart);
// the bot's own messages become "assistant" turns. Consecutive turns with the
// same role are merged, and the list must start with a user turn.
export function toMessages(history) {
  const out = [];
  for (const h of history) {
    const role = h.fromBot ? "assistant" : "user";
    const text = h.fromBot ? h.text : `${h.sender}: ${h.text}`;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += `\n${text}`;
    else out.push({ role, content: text });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

export async function reply(history, env = process.env) {
  const messages = toMessages(history);
  if (!messages.length) return null;
  const m = mode(env);

  if (m === "echo") {
    const lastUser = [...history].reverse().find((h) => !h.fromBot);
    return `(echo mode: no ANTHROPIC_API_KEY or CONSTRUCT_PROXY_URL set) You said: ${lastUser?.text ?? ""}`;
  }

  const body = {
    model: env.CLAUDE_MODEL || "claude-sonnet-5-5",
    max_tokens: Number(env.CLAUDE_MAX_TOKENS || 4096),
    system: systemPrompt(env),
    messages,
  };

  const url = m === "proxy" ? env.CONSTRUCT_PROXY_URL : API_URL;
  const headers = { "Content-Type": "application/json" };
  if (m === "anthropic") {
    headers["x-api-key"] = env.ANTHROPIC_API_KEY;
    headers["anthropic-version"] = "2023-06-01";
  }

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const why = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(`construct call failed: ${why}`);
  }
  // Accept a Messages API response, or a proxy that returns {reply: "..."}.
  if (typeof json.reply === "string") return json.reply;
  let text = (json.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  // Say so when a reply was cut off by the length limit, instead of stopping mid-word.
  if (text && json.stop_reason === "max_tokens") text += " … (reply cut off at the length limit; ask me to continue)";
  return text || null;
}
