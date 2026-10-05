export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const e = escape;
const logo =
  '<img class="logo" src="/assets/logo-cidade-berco.png" alt="Cidade Berço" width="1645" height="1607">';
const organizerLogo =
  '<img class="afonsina-logo" src="/assets/logo-afonsina.png" alt="Brasão da Tuna Afonsina, organizadora do Cidade Berço" width="2511" height="2108" loading="lazy">';
const arrow = '<span aria-hidden="true">↗</span>';
const external = 'target="_blank" rel="noopener noreferrer"';
const links = [
  ["/", "Início"],
  ["/festival", "O festival"],
  ["/programa", "Programa"],
  ["/tunas", "Tunas"],
  ["/edicoes", "Edições"],
  ["/contactos", "Contactos"],
];
const button = (href, label, secondary = false) =>
  /* HTML */ `<a
    class="button ${secondary ? "secondary" : ""}"
    href="${e(href)}"
    >${label} ${arrow}</a
  >`;
const empty = (title, text) =>
  /* HTML */ `<div class="empty">
    <span class="eyebrow">Fique por perto</span>
    <h2>${title}</h2>
    <p>${text}</p>
    <a class="text-link" href="/contactos">Falar com a organização ${arrow}</a>
  </div>`;

function shell(data, path, title, content, { admin = false, csrf = "" } = {}) {
  const current = data.editions.find(
    (edition) => edition.id === data.currentEdition,
  );
  return /* HTML */ `<!doctype html>
    <html lang="pt-PT">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Cidade Berço — Festival de Tunas Académicas da Tuna Afonsina, em Guimarães. Programa, tunas, bilhetes e história do festival."
        />
        ${admin ? '<meta name="robots" content="noindex, nofollow">' : ""}
        ${csrf
          ? /* HTML */ `<meta name="csrf-token" content="${e(csrf)}" />`
          : ""}
        <meta name="theme-color" content="#242120" />
        <title>${e(title)} — Cidade Berço</title>
        <link
          rel="icon"
          href="/assets/logo-cidade-berco.png"
          type="image/png"
        />
        <link rel="stylesheet" href="/styles.css?v=direction-4" />
        <script src="/${admin ? "admin" : "site"}.js" defer></script>
      </head>
      <body>
        <a class="skip" href="#conteudo">Saltar para o conteúdo</a>
        <header class="site-header">
          <a href="/" class="brand" aria-label="Cidade Berço — início"
            >${logo}<span
              >TUNA AFONSINA<br /><strong>GUIMARÃES</strong></span
            ></a
          >
          <button
            class="menu-toggle"
            aria-expanded="false"
            aria-controls="navigation"
          >
            Menu <span>☰</span>
          </button>
          <nav id="navigation" aria-label="Navegação principal">
            ${links
              .map(
                ([href, name]) =>
                  /* HTML */ `<a
                    href="${href}"
                    ${path === href ? 'aria-current="page"' : ""}
                    >${name}</a
                  >`,
              )
              .join("")}<a class="nav-ticket" href="/bilhetes"
              >Bilhetes ${arrow}</a
            >
          </nav>
        </header>
        <main id="conteudo">${content}</main>
        <footer>
          <div class="footer-top">
            <div>
              <p class="eyebrow">Uma cidade. Muitas vozes.</p>
              <p class="footer-name">
                Até ao próximo<br /><i>Cidade Berço.</i>
              </p>
            </div>
            <div class="footer-organizer">
              ${organizerLogo}<span class="eyebrow">Uma organização</span>
              <p>Tuna Afonsina</p>
              <span class="muted"
                >Tuna de Engenharia da Universidade do Minho</span
              >
              <div class="socials">
                ${["instagram", "facebook", "youtube"]
                  .map((key) =>
                    data.site[key]
                      ? /* HTML */ `<a href="${e(data.site[key])}" ${external}
                          >${key[0].toUpperCase() + key.slice(1)} ${arrow}</a
                        >`
                      : "",
                  )
                  .join("")}
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <span
              >© ${current.year || new Date().getFullYear()} Tuna Afonsina ·
              Guimarães, Portugal</span
            ><a href="/contactos">Contactos</a>
          </div>
        </footer>
      </body>
    </html>`;
}

const heading = (label, title, description) =>
  /* HTML */ `<section class="page-heading">
    <p class="eyebrow">${label}</p>
    <h1>${title}</h1>
    <p>${description}</p>
  </section>`;
const editionCard = (edition) =>
  /* HTML */ `<a class="edition-card" href="/edicoes/${e(edition.id)}">
    <div class="poster-frame">
      ${edition.poster
        ? /* HTML */ `<img
            src="${e(edition.poster)}"
            alt="Cartaz da ${e(edition.roman)} edição"
            loading="lazy"
            width="600"
            height="850"
          />`
        : /* HTML */ `<span>${e(edition.roman)}</span>`}<span class="card-arrow"
        >↗</span
      >
    </div>
    <div class="card-caption">
      <h3>${e(edition.roman)} Cidade Berço</h3>
      <span>${edition.year || "A anunciar"}</span>
    </div>
  </a>`;
const participants = (edition) =>
  /* HTML */ `<div class="tuna-list">
    ${edition.participants
      .map(
        (name, index) =>
          /* HTML */ `<article>
            <span class="list-number"
              >${String(index + 1).padStart(2, "0")}</span
            >
            <h2>${e(name)}</h2>
            <span class="tuna-symbol" aria-hidden="true">✦</span>
          </article>`,
      )
      .join("")}
  </div>`;
const schedule = (edition) =>
  /* HTML */ `<div class="schedule">
    ${edition.program
      .map(
        (item) =>
          /* HTML */ `<article>
            <div>
              <span class="eyebrow">${e(item.day)}</span>
              <strong>${e(item.time)}</strong>
            </div>
            <div>
              <h2>${e(item.title)}</h2>
              <p>${e(item.location)}</p>
            </div>
          </article>`,
      )
      .join("")}
  </div>`;

export function renderPage(data, path) {
  const current = data.editions.find(
    (edition) => edition.id === data.currentEdition,
  );
  const archives = data.editions
    .filter((edition) => edition.number < current.number)
    .sort((a, b) => b.number - a.number);
  const date = current.dates || "Datas a anunciar";
  let title;
  let content;

  if (path === "/") {
    title = `${current.roman} edição`;
    content = /* HTML */ `<section class="hero">
        <div class="hero-top">
          <span class="eyebrow">Festival de Tunas Académicas</span>
          <span class="eyebrow">Guimarães · Portugal</span>
        </div>
        <div class="hero-content">
          <div class="hero-copy">
            <p class="edition-label">
              <span> </span> ${e(current.roman)} edição ·
              ${current.year || "Em breve"}
            </p>
            <h1>Onde a cidade<br />se faz <i>canção.</i></h1>
            <p class="hero-description">${e(current.description)}</p>
            <div class="hero-actions">
              ${button("/programa", "Descobrir a edição")}${button(
                "/festival",
                "O nosso festival",
                true,
              )}
            </div>
          </div>
          <div class="hero-art">
            <div class="arch" aria-hidden="true"></div>
            <span class="roman" aria-hidden="true">${e(current.roman)}</span
            >${current.poster
              ? /* HTML */ `<img
                  class="current-poster"
                  src="${e(current.poster)}"
                  alt="Cartaz da ${e(current.roman)} edição"
                />`
              : logo}<span class="art-caption"
              >MÚSICA · TRADIÇÃO · ENCONTRO</span
            >
          </div>
        </div>
        <div class="hero-bottom">
          <div>
            <span class="eyebrow">Marque na agenda</span>
            <strong
              >${e(date)}${current.year ? ` · ${current.year}` : ""}</strong
            >
          </div>
          <div>
            <span class="eyebrow">O palco</span>
            <strong
              >${e(
                current.venue || "Guimarães · Centro Cultural Vila Flor",
              )}</strong
            >
          </div>
          <a href="/bilhetes">Bilhetes ${arrow}</a>
        </div>
      </section>
      <section class="intro section">
        <p class="eyebrow">Desde 1999, de coração cheio</p>
        <div>
          <h2>Há encontros que ficam.<br /><i>Este tem casa.</i></h2>
          <p>${e(data.site.about)}</p>
          <a class="text-link" href="/festival"
            >Conheça a nossa história ${arrow}</a
          >
        </div>
        <span class="intro-number"
          >${String(archives.length).padStart(2, "0")}<small
            >edições de histórias</small
          ></span
        >
      </section>
      <section class="archive-section section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Memórias que continuam a soar</p>
            <h2>O nosso <i>arquivo.</i></h2>
          </div>
          <a class="text-link" href="/edicoes">Todas as edições ${arrow}</a>
        </div>
        <div class="edition-grid">
          ${archives.slice(0, 3).map(editionCard).join("")}
        </div>
      </section>`;
  } else if (path === "/festival") {
    title = "O festival";
    content =
      heading(
        "A nossa história",
        "Um festival.<br><i>Uma cidade inteira.</i>",
        "Da academia para os palcos de Guimarães. Desde 1999.",
      ) +
      /* HTML */ `<section class="story section">
          <div class="story-emblem">
            ${logo}<span>EST. 1999 — GUIMARÃES</span>
          </div>
          <div>
            <p class="eyebrow">Cidade Berço</p>
            <h2>Feito de música.<br /><i>Vivido em conjunto.</i></h2>
            <p>${e(data.site.about)}</p>
            <p>
              Organizado pela Tuna Afonsina, o festival é um ponto de encontro
              entre tunas, público e cidade. Cada edição acrescenta novas vozes
              a uma história que continuamos a construir.
            </p>
            ${button("/edicoes", "Percorrer as edições")}
          </div>
        </section>
        <section class="organizer section">
          ${organizerLogo}
          <p class="eyebrow">Quem faz acontecer</p>
          <h2>Tuna Afonsina</h2>
          <p>Tuna de Engenharia da Universidade do Minho</p>
          <a class="text-link" href="https://afonsina.com/" ${external}
            >Conhecer a Afonsina ${arrow}</a
          >
        </section>`;
  } else if (path === "/programa") {
    title = "Programa";
    content =
      heading(
        `${e(current.roman)} edição · ${e(date)}`,
        "Os dias.<br><i>As nossas noites.</i>",
        `${current.year || "Ano a anunciar"} · ${e(current.venue || "Local a anunciar")}`,
      ) +
      /* HTML */ `<section class="section">
        ${current.program.length
          ? schedule(current)
          : empty(
              "O programa está a ser preparado.",
              "Os horários e as atividades serão publicados aqui assim que estiverem confirmados.",
            )}
      </section>`;
  } else if (path === "/tunas") {
    title = "Tunas participantes";
    content =
      heading(
        `${e(current.roman)} edição`,
        "As vozes<br><i>deste encontro.</i>",
        "As tunas que vão dar música à próxima edição do Cidade Berço.",
      ) +
      /* HTML */ `<section class="section">
        ${current.participants.length
          ? participants(current)
          : empty(
              "Em breve, as tunas convidadas.",
              "Estamos a preparar o próximo encontro. Acompanhe os anúncios da Tuna Afonsina.",
            )}
        <div class="host">
          <span class="eyebrow">Tuna anfitriã</span>
          <h2>Tuna Afonsina</h2>
          <p>Guimarães · Universidade do Minho</p>
        </div>
      </section>`;
  } else if (path === "/bilhetes") {
    title = "Bilhetes";
    content =
      heading(
        `${e(current.roman)} edição · ${e(date)}`,
        "O seu lugar<br><i>nesta história.</i>",
        "Viva o Cidade Berço connosco.",
      ) +
      /* HTML */ `<section class="section ticket-section">
        <div class="ticket">
          <div>
            <p class="eyebrow">${e(current.roman)} Cidade Berço</p>
            <h2>${e(date)}</h2>
            <p>
              ${e(current.venue || "Centro Cultural Vila Flor")} ·
              ${current.year || ""}
            </p>
          </div>
          <div>
            <p>
              ${e(
                current.ticketInfo ||
                  "A venda de bilhetes ainda não foi anunciada. O acesso à bilheteira ficará disponível nesta página.",
              )}
            </p>
            ${current.ticketUrl
              ? /* HTML */ `<a
                    class="button"
                    href="${e(current.ticketUrl)}"
                    ${external}
                    >Comprar na BOL ${arrow}</a
                  >
                  <small>Abre a bilheteira BOL numa nova janela.</small>`
              : '<span class="status-pill">Bilhetes brevemente</span>'}
          </div>
        </div>
      </section>`;
  } else if (path === "/edicoes") {
    title = "Edições anteriores";
    content =
      heading(
        "O arquivo · desde 1999",
        "Vinte edições.<br><i>Tantas memórias.</i>".replace(
          "Vinte",
          archives.length === 20 ? "Vinte" : String(archives.length),
        ),
        "Cartazes, tunas e momentos de cada edição. Uma história para revisitar.",
      ) +
      /* HTML */ `<section class="section">
        <div class="archive-toolbar">
          <label for="archive-search">Encontrar uma edição</label>
          <input
            id="archive-search"
            type="search"
            placeholder="Pesquisar ano ou edição…"
          />
          <span id="archive-count">${archives.length} edições</span>
        </div>
        <div class="edition-grid archive-grid">
          ${archives.map(editionCard).join("")}
        </div>
        <p id="no-results" hidden>Nenhuma edição encontrada.</p>
        <p class="source-note">
          Arquivo reunido a partir do
          <a href="https://afonsina.com/cidade-berco/" ${external}
            >site oficial da Tuna Afonsina</a
          >.
        </p>
      </section>`;
  } else if (path.startsWith("/edicoes/")) {
    const edition = data.editions.find(
      (item) => item.id === path.split("/")[2],
    );
    if (!edition) return null;
    title = `${edition.roman} edição · ${edition.year || ""}`;
    content =
      heading(
        `O arquivo · ${edition.year || "Em breve"}`,
        `${e(edition.roman)}<br><i>Cidade Berço.</i>`,
        e(edition.dates),
      ) +
      /* HTML */ `<section class="section edition-detail">
          <div>
            ${edition.poster
              ? /* HTML */ `<img
                  class="detail-poster"
                  src="${e(edition.poster)}"
                  alt="Cartaz da ${e(edition.roman)} edição"
                />`
              : ""}
          </div>
          <div>
            <p class="eyebrow">
              ${edition.year || ""} · ${e(edition.venue || "Guimarães")}
            </p>
            ${edition.description
              ? /* HTML */ `<p>${e(edition.description)}</p>`
              : ""}
            <h2>As tunas.</h2>
            ${participants(edition)}${edition.video
              ? /* HTML */ `<a
                  class="button"
                  href="${e(edition.video)}"
                  ${external}
                  >Rever os momentos ${arrow}</a
                >`
              : ""}${edition.program.length ? schedule(edition) : ""}${edition
              .awards.length
              ? /* HTML */ `<h2>Prémios</h2>
                  <ul>
                    ${edition.awards
                      .map((award) => /* HTML */ `<li>${e(award)}</li>`)
                      .join("")}
                  </ul>`
              : ""}
          </div>
        </section>
        ${edition.gallery.length
          ? /* HTML */ `<section class="section gallery">
              ${edition.gallery
                .map(
                  (photo) =>
                    /* HTML */ `<figure>
                      <img
                        src="${e(photo.url)}"
                        alt="${e(photo.caption)}"
                        loading="lazy"
                      />
                      <figcaption>${e(photo.caption)}</figcaption>
                    </figure>`,
                )
                .join("")}
            </section>`
          : ""}
        <section class="section">
          ${button("/edicoes", "Voltar ao arquivo", true)}
        </section>`;
  } else if (path === "/contactos") {
    title = "Contactos";
    content = /* HTML */ `
      <section class="contact-page">
        <div class="contact-intro">
          <p class="eyebrow">Cidade Berço · Contactos</p>
          <h1>O encontro<br />começa <i>aqui.</i></h1>
          <p class="contact-lead">
            Uma dúvida, uma ideia ou vontade de fazer parte? Fale diretamente
            com a organização.
          </p>
          <div class="contact-identity">
            ${organizerLogo}
            <div>
              <span class="eyebrow">Quem está deste lado</span>
              <h2>Tuna Afonsina</h2>
              <p>Tuna de Engenharia da<br />Universidade do Minho</p>
            </div>
          </div>
        </div>
        <div class="contact-panel">
          <p class="eyebrow">Estamos à distância de uma mensagem</p>
          <a class="contact-method" href="mailto:${e(data.site.email)}">
            <span class="contact-index">01</span>
            <div>
              <span class="eyebrow">Email</span>
              <h2>${e(data.site.email)}</h2>
              <p>Festival, bilhetes e parcerias</p>
            </div>
            ${arrow}
          </a>
          <section class="direction-contacts" aria-labelledby="direction-title">
            <h2 id="direction-title" class="eyebrow">
              Direção da Tuna Afonsina
            </h2>
            <ul class="direction-list">
              ${(data.site.direction || [])
                .map(
                  (person) => /* HTML */ `
                    <li>
                      <a href="tel:+351${e(person.phone.replace(/\D/g, ""))}">
                        <span class="direction-name">${e(person.name)}</span>
                        <span class="direction-phone"
                          >${e(person.phone)}
                          <span aria-hidden="true">↗</span></span
                        >
                      </a>
                    </li>
                  `,
                )
                .join("")}
            </ul>
          </section>
          <div class="contact-address">
            <span class="eyebrow">A nossa casa · Guimarães</span>
            <p>${e(data.site.address)}</p>
          </div>
          <div class="contact-networks">
            <span class="eyebrow">Acompanhe a Afonsina</span>
            <div class="socials">
              ${["instagram", "facebook", "youtube"]
                .filter((key) => data.site[key])
                .map(
                  (key) =>
                    /* HTML */ `<a href="${e(data.site[key])}" ${external}
                      >${key === "youtube"
                        ? "YouTube"
                        : key[0].toUpperCase() + key.slice(1)}
                      ${arrow}</a
                    >`,
                )
                .join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  } else {
    return null;
  }
  if (current.partners.length && path === "/")
    content += /* HTML */ `<section class="section partners">
      <p class="eyebrow">Ao nosso lado</p>
      <div>
        ${current.partners
          .map(
            (partner) =>
              /* HTML */ `<a
                href="${e(partner.url || "/contactos")}"
                ${external}
                >${partner.logo
                  ? /* HTML */ `<img
                      src="${e(partner.logo)}"
                      alt="${e(partner.name)}"
                    />`
                  : e(partner.name)}</a
              >`,
          )
          .join("")}
      </div>
    </section>`;
  return shell(data, path, title, content);
}

export function renderAdmin(data, activeSession) {
  const content = activeSession
    ? `${heading("Área de gestão", "O próximo capítulo.", "Atualize os conteúdos e mantenha todas as edições no arquivo.")}<section class="section admin-layout">
    <aside>
    <label for="edition-select">Edição a editar</label>
    <select id="edition-select">
    </select>
    <button id="new-edition" class="button secondary">Criar edição</button>
    <a class="text-link" href="/" target="_blank">Ver o site ↗</a>
    <button id="logout" class="quiet-button">Terminar sessão</button>
    </aside>
    <div>
    <form id="content-form">
    <div id="editor">
    </div>
    <div class="save-bar">
    <button class="button" type="submit">Guardar alterações</button>
    <p id="feedback" role="status" aria-live="polite">
    </p>
    </div>
    </form>
    </div>
    </section>`
    : `${heading("Área de gestão", "Bem-vindo de volta.", "Acesso reservado à organização.")}<section class="section login-section">
    <form id="login-form">
    <label for="password">Palavra-passe</label>
    <input type="password" id="password" name="password" autocomplete="current-password" required>
    <button class="button">Entrar</button>
    <p id="feedback" role="status">
    </p>
    <small>Primeiro acesso? Execute <code>npm run setup</code> no terminal do projeto.</small>
    </form>
    </section>`;
  return shell(data, "/admin", "Gestão", content, {
    admin: true,
    csrf: activeSession?.csrf,
  });
}

export const render404 = (data) =>
  shell(
    data,
    "",
    "Página não encontrada",
    heading(
      "404",
      "Este caminho<br><i>não tem palco.</i>",
      "A página que procura não existe.",
    ) +
      /* HTML */ `<section class="section">
        ${button("/", "Voltar ao início")}
      </section>`,
  );
