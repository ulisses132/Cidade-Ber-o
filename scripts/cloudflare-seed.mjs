import { readFile, writeFile } from "node:fs/promises";
import { validate } from "../lib/validation.mjs";

const content = JSON.parse(await readFile("data/content.json", "utf8"));
validate(content);
const document = JSON.stringify(content).replaceAll("'", "''");
// Never overwrite content already edited online during another deployment.
await writeFile(
  "cloudflare/seed.sql",
  `INSERT OR IGNORE INTO content (id, revision, document) VALUES (1, ${content.revision}, '${document}');\n`,
);
console.log(
  "Importação inicial preparada; conteúdos existentes não serão substituídos.",
);
