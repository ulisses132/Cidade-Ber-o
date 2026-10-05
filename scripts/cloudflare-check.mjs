import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Runs only against the local Wrangler emulator; never against a live site.
const base = "http://127.0.0.1:8787";
const vars = await readFile(".dev.vars", "utf8");
const password = /^ADMIN_KEY=(.+)$/m.exec(vars)[1].trim();
const post = (path, value, headers = {}) =>
  fetch(base + path, {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(value),
  });
for (const path of [
  "/",
  "/festival",
  "/contactos",
  "/edicoes/xx",
  "/styles.css",
]) {
  assert.equal((await fetch(base + path)).status, 200, path);
}
assert.equal((await fetch(base + "/api/content")).status, 401);
assert.equal((await post("/api/content", {})).status, 403);
const auth = await post("/api/login", { password });
assert.equal(auth.status, 200);
const Cookie = auth.headers.get("set-cookie").split(";")[0];
const page = await (
  await fetch(base + "/admin", { headers: { Cookie } })
).text();
const csrf = /name="csrf-token"\s+content="([a-f0-9]+)"/.exec(page)[1];
const headers = { Cookie, "X-CSRF-Token": csrf };
const data = await (await fetch(base + "/api/content", { headers })).json();
assert.equal((await post("/api/content", data, { Cookie })).status, 403);
const saved = await post("/api/content", data, headers);
assert.equal(saved.status, 200);
assert.equal((await saved.json()).revision, data.revision + 1);
assert.equal((await post("/api/content", data, headers)).status, 409);
const persisted = await (
  await fetch(base + "/api/content", { headers })
).json();
assert.equal(persisted.revision, data.revision + 1);
assert.equal((await post("/api/logout", {}, headers)).status, 200);
assert.equal((await fetch(base + "/api/content", { headers })).status, 401);
console.log(
  "Cloudflare local: páginas, assets, login, CSRF, D1, conflitos e logout verificados.",
);
