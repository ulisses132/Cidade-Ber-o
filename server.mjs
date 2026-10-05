import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { readContent, saveContent } from "./lib/store.mjs";
import { login, logout, session } from "./lib/auth.mjs";
import { renderPage, renderAdmin, render404 } from "./lib/render.mjs";

const publicDir = resolve("public");
const types = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

async function body(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 1000000)
      throw Object.assign(new Error("Pedido demasiado grande."), {
        status: 413,
      });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error("Pedido inválido."), { status: 400 });
  }
}

const server = http.createServer(async (req, res) => {
  const send = (status, value, type = "application/json") => {
    res.writeHead(status, { "Content-Type": `${type}; charset=utf-8` });
    res.end(type === "application/json" ? JSON.stringify(value) : value);
  };
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
  try {
    const path =
      new URL(req.url, "http://localhost").pathname.replace(/\/$/, "") || "/";
    const currentSession = session(req);
    if (path.startsWith("/api/") || path === "/admin")
      res.setHeader("Cache-Control", "no-store");
    if (req.method === "POST") {
      const origin = req.headers.origin;
      if (!origin || new URL(origin).host !== req.headers.host)
        return send(403, { error: "Origem do pedido inválida." });
      if (path === "/api/login") {
        const input = await body(req);
        const value = await login(input.password, req.socket.remoteAddress);
        res.setHeader(
          "Set-Cookie",
          `cb_session=${value.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`,
        );
        return send(200, { ok: true });
      }
      if (
        !currentSession ||
        req.headers["x-csrf-token"] !== currentSession.csrf
      )
        return send(403, { error: "Sessão expirada. Entre novamente." });
      if (path === "/api/logout") {
        logout(req);
        res.setHeader(
          "Set-Cookie",
          "cb_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
        );
        return send(200, { ok: true });
      }
      if (path === "/api/content")
        return send(200, await saveContent(await body(req)));
      return send(404, { error: "Pedido desconhecido." });
    }
    if (req.method !== "GET" && req.method !== "HEAD")
      return send(405, { error: "Método não permitido." });
    if (path === "/api/content") {
      if (!currentSession)
        return send(401, { error: "É necessário iniciar sessão." });
      return send(200, await readContent());
    }
    if (
      path.startsWith("/assets/") ||
      ["/styles.css", "/site.js", "/admin.js"].includes(path)
    ) {
      const file = resolve(publicDir, `.${decodeURIComponent(path)}`);
      if (!file.startsWith(`${publicDir}/`) || !types[extname(file)])
        return send(404, { error: "Recurso não encontrado." });
      try {
        if (!(await stat(file)).isFile()) throw new Error();
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.writeHead(200, { "Content-Type": types[extname(file)] });
        return res.end(
          req.method === "HEAD" ? undefined : await readFile(file),
        );
      } catch {
        return send(404, { error: "Recurso não encontrado." });
      }
    }
    const data = await readContent();
    if (path === "/admin")
      return send(200, renderAdmin(data, currentSession), "text/html");
    const page = renderPage(data, path);
    return send(page ? 200 : 404, page || render404(data), "text/html");
  } catch (error) {
    if (!error.status) console.error(error);
    send(error.status || 500, {
      error: error.status
        ? error.message
        : "Não foi possível concluir o pedido.",
    });
  }
});
server.listen(port, host, () =>
  console.log(`Cidade Berço: http://${host}:${port}`),
);
