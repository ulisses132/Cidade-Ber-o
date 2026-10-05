import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validate } from "./validation.mjs";

export const dataDir = resolve(process.env.DATA_DIR || "data");
export const readContent = async () =>
  JSON.parse(await readFile(resolve(dataDir, "content.json"), "utf8"));
let saving = Promise.resolve();

export function saveContent(next) {
  const task = saving.then(async () => {
    const previous = await readContent();
    if (next.revision !== previous.revision) {
      throw Object.assign(
        new Error(
          "Os conteúdos foram alterados noutra janela. Atualize a página antes de guardar.",
        ),
        { status: 409 },
      );
    }
    validate(next);
    await mkdir(resolve(dataDir, "backups"), { recursive: true });
    await writeFile(
      resolve(dataDir, "backups", `${Date.now()}.json`),
      JSON.stringify(previous, null, 2),
    );
    next.revision += 1;
    const destination = resolve(dataDir, "content.json");
    await writeFile(`${destination}.tmp`, JSON.stringify(next, null, 2) + "\n");
    await rename(`${destination}.tmp`, destination);
    return next;
  });
  saving = task.catch(() => {});
  return task;
}

export { safeUrl, validate } from "./validation.mjs";
