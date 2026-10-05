import { renderPage, renderAdmin, render404 } from "../lib/render.mjs";
import { validate } from "../lib/validation.mjs";

const encoder = new TextEncoder();
const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
const fail = (message, status) => Object.assign(new Error(message), { status });

async function digest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request.body || []) {
    size += chunk.byteLength;
    if (size > 1_000_000) throw fail("Pedido demasiado grande.", 413);
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw fail("Pedido inválido.", 400);
  }
}

async function readContent(db) {
  const row = await db
    .prepare("SELECT document FROM content WHERE id = 1")
    .first();
  if (!row)
    throw fail("Falta importar os conteúdos iniciais na base de dados.", 503);
  return JSON.parse(row.document);
}

async function getSession(request, db) {
  const id = /(?:^|;\s*)cb_session=([a-f0-9]{64})(?:;|$)/.exec(
    request.headers.get("cookie") || "",
  )?.[1];
  if (!id) return null;
  return db
    .prepare("SELECT id, csrf FROM sessions WHERE id = ? AND expires > ?")
    .bind(await digest(id), Date.now())
    .first();
}

async function login(request, env) {
  // ADMIN_KEY must be a generated 256-bit secret, not a human-chosen password.
  if (!/^[a-f0-9]{64}$/.test(env.ADMIN_KEY || ""))
    throw fail("A gestão ainda não foi configurada.", 503);
  const input = await readBody(request);
  const address = await digest(
    request.headers.get("CF-Connecting-IP") || "local",
  );
  const now = Date.now();
  const attempt = await env.DB.prepare(
    `
    INSERT INTO login_attempts (address, count, expires) VALUES (?, 1, ?)
    ON CONFLICT(address) DO UPDATE SET
      count = CASE WHEN expires <= ? THEN 1 ELSE count + 1 END,
      expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END
    RETURNING count
  `,
  )
    .bind(address, now + 900000, now, now)
    .first();
  if (attempt.count > 5)
    throw fail("Demasiadas tentativas. Aguarde 15 minutos.", 429);
  const actual = await digest(String(input?.password || ""));
  const expected = await digest(env.ADMIN_KEY);
  let difference = 0;
  for (let i = 0; i < expected.length; i++)
    difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  if (difference) throw fail("Palavra-passe incorreta.", 401);
  const id = randomToken();
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM login_attempts WHERE address = ? OR expires <= ?",
    ).bind(address, now),
    env.DB.prepare("DELETE FROM sessions WHERE expires <= ?").bind(now),
    env.DB.prepare(
      "INSERT INTO sessions (id, csrf, expires) VALUES (?, ?, ?)",
    ).bind(await digest(id), randomToken(), now + 28800000),
  ]);
  return id;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const headers = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    });
    if (url.protocol === "https:")
      headers.set("Strict-Transport-Security", "max-age=31536000");
    const send = (status, value, type = "application/json") => {
      headers.set("Content-Type", `${type}; charset=utf-8`);
      return new Response(
        request.method === "HEAD"
          ? null
          : type === "application/json"
            ? JSON.stringify(value)
            : value,
        { status, headers },
      );
    };
    const cookie = (id, maxAge) =>
      `cb_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${url.protocol === "https:" ? "; Secure" : ""}`;
    try {
      if (request.method === "POST") {
        if (request.headers.get("Origin") !== url.origin)
          return send(403, { error: "Origem do pedido inválida." });
        if (path === "/api/login") {
          const id = await login(request, env);
          headers.set("Set-Cookie", cookie(id, 28800));
          return send(200, { ok: true });
        }
        const session = await getSession(request, env.DB);
        if (!session || request.headers.get("X-CSRF-Token") !== session.csrf)
          return send(403, { error: "Sessão expirada. Entre novamente." });
        if (path === "/api/logout") {
          await env.DB.prepare("DELETE FROM sessions WHERE id = ?")
            .bind(session.id)
            .run();
          headers.set("Set-Cookie", cookie("", 0));
          return send(200, { ok: true });
        }
        if (path === "/api/content") {
          const next = await readBody(request);
          if (
            !next ||
            !Number.isSafeInteger(next.revision) ||
            next.revision < 0
          )
            throw fail("Conteúdo inválido.", 400);
          validate(next);
          const previousRevision = next.revision;
          next.revision++;
          const result = await env.DB.prepare(
            "UPDATE content SET document = ?, revision = ? WHERE id = 1 AND revision = ?",
          )
            .bind(JSON.stringify(next), next.revision, previousRevision)
            .run();
          if (!result.meta.changes)
            throw fail(
              "Os conteúdos foram alterados noutra janela. Atualize a página antes de guardar.",
              409,
            );
          return send(200, next);
        }
        return send(404, { error: "Pedido desconhecido." });
      }
      if (!["GET", "HEAD"].includes(request.method))
        return send(405, { error: "Método não permitido." });
      if (
        path.startsWith("/assets/") ||
        ["/styles.css", "/site.js", "/admin.js"].includes(path)
      )
        return env.ASSETS.fetch(request);
      if (path === "/api/content") {
        if (!(await getSession(request, env.DB)))
          return send(401, { error: "É necessário iniciar sessão." });
        return send(200, await readContent(env.DB));
      }
      const data = await readContent(env.DB);
      if (path === "/admin") {
        const page = renderAdmin(
          data,
          await getSession(request, env.DB),
        ).replace(
          "Execute <code>npm run setup</code> no terminal do projeto.",
          "Configure a chave de acesso da gestão no Cloudflare.",
        );
        return send(200, page, "text/html");
      }
      const page = renderPage(data, path);
      return send(page ? 200 : 404, page || render404(data), "text/html");
    } catch (error) {
      if (!error.status) console.error("Falha no pedido:", error.message);
      return send(error.status || 500, {
        error: error.status
          ? error.message
          : "Não foi possível concluir o pedido.",
      });
    }
  },
};
