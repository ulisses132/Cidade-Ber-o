import { randomBytes, scryptSync } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dataDir } from "./lib/store.mjs";

// Generate a strong password locally. Only its salted hash is stored.
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(32).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
await mkdir(dataDir, { recursive: true });
await writeFile(
  resolve(dataDir, "admin.json"),
  JSON.stringify({ salt, hash }),
  { mode: 0o600 },
);
console.log(
  `\nAcesso à gestão: http://localhost:4173/admin\nPalavra-passe: ${password}\n\nGuarde-a num gestor de palavras-passe. Executar este comando novamente substitui a palavra-passe.\n`,
);
