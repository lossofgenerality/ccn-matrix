// Account helpers: wait for the homeserver, log the bot in, or register it
// with the sandbox registration token on first run.
// © Computational Classnotes · CC BY-NC-SA 4.0

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitForHomeserver(baseUrl, { tries = 120, delayMs = 2000 } = {}) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(`${baseUrl}/_matrix/client/versions`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    if (i === 1) console.log(`[ccn-bot] waiting for homeserver at ${baseUrl} ...`);
    await sleep(delayMs);
  }
  throw new Error(`homeserver at ${baseUrl} did not come up`);
}

async function post(url, body, accessToken) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, json };
}

export async function login(baseUrl, username, password) {
  const { status, json } = await post(`${baseUrl}/_matrix/client/v3/login`, {
    type: "m.login.password",
    identifier: { type: "m.id.user", user: username },
    password,
    initial_device_display_name: "CCN sandbox bot",
  });
  if (status === 200) return json;
  return null;
}

// Matrix registration uses "user-interactive auth": the server answers 401 with
// the stages it wants; we complete the registration-token stage (and a dummy
// stage if asked) and resend.
export async function register(baseUrl, username, password, token) {
  const url = `${baseUrl}/_matrix/client/v3/register`;
  const body = {
    username,
    password,
    initial_device_display_name: "CCN sandbox bot",
  };
  let { status, json } = await post(url, body);
  for (let step = 0; step < 4 && status === 401; step++) {
    const session = json.session;
    const done = new Set(json.completed || []);
    const flow = (json.flows || []).find((f) =>
      f.stages.every((s) => ["m.login.registration_token", "m.login.dummy"].includes(s)),
    );
    if (!flow) throw new Error(`no supported registration flow: ${JSON.stringify(json.flows)}`);
    const next = flow.stages.find((s) => !done.has(s));
    const auth =
      next === "m.login.registration_token"
        ? { type: next, token, session }
        : { type: "m.login.dummy", session };
    ({ status, json } = await post(url, { ...body, auth }));
  }
  if (status !== 200) throw new Error(`registration failed (${status}): ${JSON.stringify(json)}`);
  return json;
}

export async function loginOrRegister(baseUrl, username, password, token) {
  const existing = await login(baseUrl, username, password);
  if (existing) return existing;
  if (!token) throw new Error("bot account does not exist and no REGISTRATION_TOKEN was given");
  console.log(`[ccn-bot] registering bot account "${username}" ...`);
  return register(baseUrl, username, password, token);
}
