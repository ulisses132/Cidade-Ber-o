import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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

export function safeUrl(value, image = false) {
  if (!value) return true;
  if (
    image &&
    /^\/assets\/[a-zA-Z0-9/_\-.]+$/.test(value) &&
    !value.includes("..")
  )
    return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validate(data) {
  const reject = () => {
    throw Object.assign(
      new Error(
        "Verifique os campos e os endereços. Os links externos devem começar por https://.",
      ),
      { status: 400 },
    );
  };
  if (
    !data.site ||
    !Array.isArray(data.editions) ||
    !data.editions.length ||
    data.editions.length > 200
  )
    reject();
  for (const key of [
    "title",
    "tagline",
    "about",
    "email",
    "phone",
    "address",
    "instagram",
    "facebook",
    "youtube",
  ]) {
    if (typeof data.site[key] !== "string" || data.site[key].length > 10000)
      reject();
  }
  const ids = new Set();
  for (const edition of data.editions) {
    if (!/^[a-z0-9-]+$/.test(edition.id) || ids.has(edition.id)) reject();
    ids.add(edition.id);
    for (const key of [
      "roman",
      "dates",
      "venue",
      "description",
      "poster",
      "video",
      "ticketUrl",
      "ticketInfo",
    ]) {
      if (typeof edition[key] !== "string" || edition[key].length > 10000)
        reject();
    }
    if (
      !Number.isInteger(edition.number) ||
      edition.number < 1 ||
      !edition.roman
    )
      reject();
    if (
      edition.year !== null &&
      (!Number.isInteger(edition.year) ||
        edition.year < 1999 ||
        edition.year > 2200)
    )
      reject();
    for (const key of ["video", "ticketUrl"])
      if (!safeUrl(edition[key])) reject();
    if (!safeUrl(edition.poster, true)) reject();
    for (const key of [
      "participants",
      "program",
      "awards",
      "gallery",
      "partners",
    ]) {
      if (!Array.isArray(edition[key]) || edition[key].length > 200) reject();
    }
    if (!edition.participants.every((value) => typeof value === "string"))
      reject();
    if (
      !edition.program.every(
        (value) =>
          value &&
          ["day", "time", "title", "location"].every(
            (key) => typeof value[key] === "string",
          ),
      )
    )
      reject();
    if (
      !edition.gallery.every(
        (value) =>
          value &&
          typeof value.caption === "string" &&
          safeUrl(value.url, true),
      )
    )
      reject();
    if (
      !edition.partners.every(
        (value) =>
          value &&
          typeof value.name === "string" &&
          safeUrl(value.url) &&
          safeUrl(value.logo, true),
      )
    )
      reject();
  }
  if (!ids.has(data.currentEdition)) reject();
  for (const key of ["instagram", "facebook", "youtube"])
    if (!safeUrl(data.site[key])) reject();
}
