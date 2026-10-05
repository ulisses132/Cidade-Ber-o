const feedback = document.querySelector("#feedback");
const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
let content;
let dirty = false;
let selected;
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

async function request(path, data) {
  const response = await fetch(path, {
    method: data === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf || "" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Ocorreu um erro.");
  return result;
}

function message(text, error = false) {
  feedback.textContent = text;
  feedback.classList.toggle("error", error);
}

document
  .querySelector("#login-form")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await request("/api/login", { password: event.target.password.value });
      location.reload();
    } catch (error) {
      message(error.message, true);
    }
  });

const field = (label, key, value, type = "text") =>
  /* HTML */ `<label
    >${label}<input name="${key}" type="${type}" value="${escape(value)}"
  /></label>`;
const area = (label, key, value, hint = "") =>
  /* HTML */ `<label
    >${label}<textarea name="${key}" rows="4">${escape(value)}</textarea>${hint
      ? /* HTML */ `<small>${hint}</small>`
      : ""}</label
  >`;

function collect() {
  if (!content) return;
  const edition = content.editions.find((item) => item.id === selected);
  const form = new FormData(document.querySelector("#content-form"));
  for (const key of [
    "roman",
    "dates",
    "venue",
    "description",
    "poster",
    "video",
    "ticketUrl",
    "ticketInfo",
  ])
    edition[key] = String(form.get(key) || "").trim();
  edition.year = form.get("year") ? Number(form.get("year")) : null;
  const lines = (key) =>
    String(form.get(key) || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  edition.participants = lines("participants");
  edition.awards = lines("awards");
  edition.program = lines("program").map((line) => {
    const [day = "", time = "", title = "", location = ""] = line
      .split("|")
      .map((text) => text.trim());
    return { day, time, title, location };
  });
  edition.gallery = lines("gallery").map((line) => {
    const [url = "", caption = ""] = line.split("|").map((text) => text.trim());
    return { url, caption };
  });
  edition.partners = lines("partners").map((line) => {
    const [name = "", url = "", logo = ""] = line
      .split("|")
      .map((text) => text.trim());
    return { name, url, logo };
  });
  if (form.get("isCurrent")) content.currentEdition = selected;
  for (const key of [
    "about",
    "email",
    "phone",
    "address",
    "instagram",
    "facebook",
    "youtube",
  ])
    content.site[key] = String(form.get(`site.${key}`) || "").trim();
}

function render() {
  const edition = content.editions.find((item) => item.id === selected);
  document.querySelector("#edition-select").innerHTML = [...content.editions]
    .sort((a, b) => b.number - a.number)
    .map(
      (item) =>
        /* HTML */ `<option
          value="${escape(item.id)}"
          ${item.id === selected ? "selected" : ""}
        >
          ${escape(item.roman)} ·
          ${item.year || "Sem ano"}${item.id === content.currentEdition
            ? " (atual)"
            : ""}
        </option>`,
    )
    .join("");
  document.querySelector("#editor").innerHTML = /* HTML */ ` <fieldset>
      <legend>A edição</legend>
      <label class="checkbox"
        ><input
          type="checkbox"
          name="isCurrent"
          ${selected === content.currentEdition ? "checked" : ""}
        />
        Mostrar esta edição como a edição atual do site</label
      >
      <div class="form-grid">
        ${field("Número romano", "roman", edition.roman)}${field(
          "Ano",
          "year",
          edition.year,
          "number",
        )}${field("Datas", "dates", edition.dates)}${field(
          "Local",
          "venue",
          edition.venue,
        )}
      </div>
      ${area("Apresentação", "description", edition.description)}
      ${field("Cartaz — endereço da imagem", "poster", edition.poster)}
      <small
        >Use um endereço https:// ou um ficheiro colocado em public/assets (ex.:
        /assets/cartaz-xxi.jpg).</small
      >
    </fieldset>
    <fieldset>
      <legend>Programa e tunas</legend>
      ${area(
        "Tunas participantes",
        "participants",
        edition.participants.join("\n"),
        "Uma tuna por linha.",
      )}
      ${area(
        "Programa",
        "program",
        edition.program
          .map((item) =>
            [item.day, item.time, item.title, item.location].join(" | "),
          )
          .join("\n"),
        "Uma atividade por linha: dia | hora | atividade | local. Ex.: Sexta-feira | 21:00 | Serenata | Largo da Oliveira",
      )}
    </fieldset>
    <fieldset>
      <legend>Bilhetes</legend>
      ${field("Link de venda na BOL", "ticketUrl", edition.ticketUrl, "url")}
      ${area("Informações sobre bilhetes", "ticketInfo", edition.ticketInfo)}
    </fieldset>
    <fieldset>
      <legend>Memórias e parceiros</legend>
      ${field("Vídeo ou playlist", "video", edition.video, "url")}
      ${area(
        "Prémios",
        "awards",
        edition.awards.join("\n"),
        "Um prémio por linha.",
      )}
      ${area(
        "Galeria",
        "gallery",
        edition.gallery
          .map((item) => `${item.url} | ${item.caption}`)
          .join("\n"),
        "Uma fotografia por linha: endereço da imagem | legenda.",
      )}
      ${area(
        "Parceiros",
        "partners",
        edition.partners
          .map((item) => `${item.name} | ${item.url} | ${item.logo}`)
          .join("\n"),
        "Um parceiro por linha: nome | link https:// | endereço do logótipo. Os dois endereços são opcionais.",
      )}
    </fieldset>
    <details>
      <summary>Informações gerais e contactos</summary>
      <fieldset>
        <legend>Comuns a todas as edições</legend>
        ${area("Sobre o festival", "site.about", content.site.about)}
        ${field("Email", "site.email", content.site.email, "email")}
        ${field("Telefone", "site.phone", content.site.phone)}
        ${field("Morada", "site.address", content.site.address)}
        ${["instagram", "facebook", "youtube"]
          .map((key) => field(key, `site.${key}`, content.site[key], "url"))
          .join("")}
      </fieldset>
    </details>`;
}

if (csrf) {
  request("/api/content")
    .then((data) => {
      content = data;
      selected = data.currentEdition;
      render();
    })
    .catch((error) => message(error.message, true));

  document
    .querySelector("#edition-select")
    .addEventListener("change", (event) => {
      collect();
      selected = event.target.value;
      render();
    });
  document.querySelector("#content-form").addEventListener("input", () => {
    dirty = true;
  });
  document
    .querySelector("#content-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      collect();
      const button = event.submitter;
      button.disabled = true;
      try {
        content = await request("/api/content", content);
        dirty = false;
        render();
        message("Alterações guardadas. O site já está atualizado.");
      } catch (error) {
        message(error.message, true);
      } finally {
        button.disabled = false;
      }
    });
  document.querySelector("#new-edition").addEventListener("click", () => {
    collect();
    const number = Math.max(...content.editions.map((item) => item.number)) + 1;
    let remaining = number;
    let roman = "";
    for (const [value, symbol] of [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ]) {
      while (remaining >= value) {
        roman += symbol;
        remaining -= value;
      }
    }
    const id = roman.toLowerCase();
    content.editions.push({
      id,
      number,
      roman,
      year: null,
      dates: "",
      venue: "",
      description: "",
      poster: "",
      participants: [],
      program: [],
      awards: [],
      gallery: [],
      partners: [],
      video: "",
      ticketUrl: "",
      ticketInfo: "",
      status: "upcoming",
    });
    selected = id;
    dirty = true;
    render();
    message("Nova edição preparada. Preencha os dados e guarde.");
  });
  document.querySelector("#logout").addEventListener("click", async () => {
    if (
      dirty &&
      !confirm("Existem alterações por guardar. Quer sair sem as guardar?")
    )
      return;
    await request("/api/logout", {});
    dirty = false;
    location.reload();
  });
  window.addEventListener("beforeunload", (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}

const menu = document.querySelector(".menu-toggle");
menu?.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  document.querySelector("#navigation").classList.toggle("open", open);
});
