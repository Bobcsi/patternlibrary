// ============================================================
// UI STRINGS (i18n)
// Static labels shown in the interface, per language.
// Keys: hu = Hungarian, en = English, es = Spanish
// ============================================================
const L = {
  hu: {
    title: "Mintakatalógus",
    intro: "Magyar népi hímzés motívumai",
    search: "Keresés név, tájegység vagy típus szerint",
    regions: "Minden tájegység",
    complex: "Minden komplexitás",
    types: "Minden típus",
    cx: "Komplexitás",
    type: "Típus",
    color: "Szín",
    download: "G-code letöltése",
    nog: "Ehhez a mintához nincs G-code.",
    png: "Kiegészítő PNG kép"
  },

  en: {
    title: "Pattern Library",
    intro: "Hungarian folk embroidery motifs",
    search: "Search by name, region or type",
    regions: "All regions",
    complex: "All complexity levels",
    types: "All types",
    cx: "Complexity",
    type: "Type",
    color: "Color",
    download: "Download G-code",
    nog: "No G-code is available for this pattern.",
    png: "Additional PNG image"
  },

  es: {
    title: "Catálogo de motivos",
    intro: "Motivos de bordado folclórico húngaro",
    search: "Buscar por nombre, región o tipo",
    regions: "Todas las regiones",
    complex: "Todos los niveles de complejidad",
    types: "Todos los tipos",
    cx: "Complejidad",
    type: "Tipo",
    color: "Color",
    download: "Descargar G-code",
    nog: "No hay G-code disponible para este motivo.",
    png: "Imagen PNG adicional"
  }
};

// ============================================================
// COMPLEXITY LABEL TRANSLATIONS
// Maps the raw Hungarian complexity values stored in the data
// (Egyszerű / Közepes / Összetett) to each display language.
// ============================================================
const C = {
  hu: {
    Egyszerű: "Egyszerű",
    Közepes: "Közepes",
    Összetett: "Összetett"
  },

  en: {
    Egyszerű: "Simple",
    Közepes: "Medium",
    Összetett: "Complex"
  },

  es: {
    Egyszerű: "Sencillo",
    Közepes: "Medio",
    Összetett: "Complejo"
  }
};

// ============================================================
// MOTIF TYPE LABEL TRANSLATIONS
// Maps raw Hungarian type values (virág/levél/szegély/állat)
// to each display language.
// ============================================================
const T = {
  hu: {
    virág: "virág",
    levél: "levél",
    szegély: "szegély",
    állat: "állat"
  },

  en: {
    virág: "flower",
    levél: "leaf",
    szegély: "border",
    állat: "animal"
  },

  es: {
    virág: "flor",
    levél: "hoja",
    szegély: "cenefa",
    állat: "animal"
  }
};

// ============================================================
// COLOR LABEL TRANSLATIONS
// Maps raw Hungarian color values to each display language.
// ============================================================
const K = {
  hu: {
    piros: "piros",
    zöld: "zöld",
    kék: "kék",
    rózsaszín: "rózsaszín"
  },

  en: {
    piros: "red",
    zöld: "green",
    kék: "blue",
    rózsaszín: "pink"
  },

  es: {
    piros: "rojo",
    zöld: "verde",
    kék: "azul",
    rózsaszín: "rosa"
  }
};

// ms: the loaded array of motif objects (fetched from motifs.json)
let ms = [];

// lang: current UI language, persisted in localStorage,
// defaulting to Hungarian if nothing has been saved yet
let lang = localStorage.getItem("catalogLanguage") || "hu";

// Shorthand for document.getElementById
const $ = id => document.getElementById(id);

// Escapes HTML-sensitive characters to prevent injection when
// interpolating dynamic strings into innerHTML templates
const esc = s =>
  String(s ?? "").replace(
    /[&<>"]/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[c])
  );

// Resolves a translated field for a given motif `m` and key `k`.
// Looks first at the motif's own per-language i18n block
// (m.i18n[lang]), falling back to Hungarian, then to raw
// top-level fields on the motif itself.
function tr(m, k) {
  const d = m.i18n?.[lang] || m.i18n?.hu || {};

  if (k === "cx" || k === "complexity") {
    return d.complexity || m.complexity || "";
  }

  if (k === "type") {
    return d.type || m.type || "";
  }

  if (k === "color") {
    return d.color || m.color || "";
  }

  if (k === "region") {
    return d.region || m.region || "";
  }

  if (k === "description") {
    return d.description || "";
  }

  // Generic fallback for any other key (e.g. "name")
  return d[k] || m[k] || "";
}

// Switches the active UI language, persists the choice,
// updates the <html lang> attribute, highlights the active
// language button, and re-renders the catalog with new labels.
function setLang(x) {
  lang = x;

  localStorage.setItem("catalogLanguage", x);
  document.documentElement.lang = x;

  document
    .querySelectorAll("[data-lang]")
    .forEach(b =>
      b.classList.toggle("active", b.dataset.lang === x)
    );

  render();
}

// Re-renders the whole catalog grid: updates static UI text,
// applies the current search query and filter selections,
// and rebuilds the card list from the filtered motifs.
function render() {
  const l = L[lang];

  // Update static page text for the current language
  $("pageTitle").textContent = l.title;
  $("pageIntro").textContent = l.intro;
  $("search").placeholder = l.search;

  // Update the "all ___" placeholder option text in each filter
  $("regionFilter").options[0].text = l.regions;
  $("complexityFilter").options[0].text = l.complex;
  $("typeFilter").options[0].text = l.types;

  // Read current filter/search state from the DOM
  const q = $("search").value.toLowerCase();
  const r = $("regionFilter").value;
  const c = $("complexityFilter").value;
  const t = $("typeFilter").value;

  // Filter motifs by search text (name/region/type/color) and
  // by the selected region/complexity/type, then render cards
  $("catalog").innerHTML = ms
    .filter(
      m =>
        (
          !q ||
          [tr(m, "name"), m.region, m.type, m.color]
            .join(" ")
            .toLowerCase()
            .includes(q)
        ) &&
        (!r || m.region === r) &&
        (!c || m.complexity === c) &&
        (!t || m.type === t)
    )
    .map(
      m => `
        <article
          class="card"
          onclick="this.classList.toggle('flipped')"
        >
          <div class="card-inner">

            <div class="card-front">
              <div class="art">
                <img src="${m.svg}" alt="">
              </div>

              <div class="tag">
                ${esc(tr(m, "region"))}
              </div>

              <h3>
                ${esc(tr(m, "name"))}
              </h3>

              <div>
                ${esc(tr(m, "type"))}
                ·
                ${esc(tr(m, "color"))}
              </div>

              <small>
                ${l.cx}: ${esc(tr(m, "cx"))}
              </small>
            </div>

            <div class="card-back">
              <h3>
                ${esc(tr(m, "name"))}
              </h3>

              ${
                m.png
                  ? `
                    <div class="additional">
                      <h4>${l.png}</h4>
                      <img src="${m.png}" alt="">
                    </div>
                  `
                  : ""
              }

              <p>
                ${esc(tr(m, "description"))}
              </p>

              <p>
                <b>${l.cx}:</b>
                ${esc(tr(m, "cx"))}
                <br>

                <b>${l.type}:</b>
                ${esc(tr(m, "type"))}
                <br>

                <b>${l.color}:</b>
                ${esc(tr(m, "color"))}
              </p>

              ${
                m.gcode
                  ? `
                    <a
                      class="btn"
                      href="${m.gcode}"
                      download
                      onclick="event.stopPropagation()"
                    >
                      ${l.download}
                    </a>
                  `
                  : `
                    <p>${l.nog}</p>
                  `
              }
            </div>

          </div>
        </article>
      `
    )
    .join("");
}

// Populates the region/complexity/type <select> dropdowns based
// on the distinct values found in the loaded motif data, using
// the current language's labels and translation tables.
function filters() {
  const rs = [...new Set(ms.map(m => m.region))].sort();
  const cs = [...new Set(ms.map(m => m.complexity))];
  const ts = [...new Set(ms.map(m => m.type))];

  $("regionFilter").innerHTML =
    '<option value="">' +
    L[lang].regions +
    "</option>" +
    rs
      .map(x => `<option>${esc(x)}</option>`)
      .join("");

  $("complexityFilter").innerHTML =
    '<option value="">' +
    L[lang].complex +
    "</option>" +
    cs
      .map(
        x =>
          `<option value="${esc(x)}">${esc(
            C[lang][x] || x
          )}</option>`
      )
      .join("");

  $("typeFilter").innerHTML =
    '<option value="">' +
    L[lang].types +
    "</option>" +
    ts
      .map(
        x =>
          `<option value="${esc(x)}">${esc(
            T[lang][x] || x
          )}</option>`
      )
      .join("");
}

// ============================================================
// INITIAL LOAD
// Fetches the motif data, builds the filter dropdowns, wires up
// event handlers for search/filters/language buttons, renders
// the initial view, and (if the QRCode library is available)
// draws a QR code linking to the current page URL.
// ============================================================
fetch("data/motifs.json")
  .then(r => r.json())
  .then(x => {
    ms = x;

    filters();

    // Re-render on any change to search box or filter dropdowns
    [
      "search",
      "regionFilter",
      "complexityFilter",
      "typeFilter"
    ].forEach(id => {
      $(id).oninput = render;
    });

    // Wire up language switch buttons (elements with data-lang attr)
    document
      .querySelectorAll("[data-lang]")
      .forEach(b => {
        b.onclick = () => {
          filters();
          setLang(b.dataset.lang);
        };
      });

    // Apply the stored/default language on first load
    setLang(lang);

    // Optional QR code linking to this page, if the library is loaded
    if (window.QRCode) {
      QRCode.toCanvas(
        location.href,
        {
          width: 120,
          margin: 1
        },
        (e, c) => {
          if (!e) {
            $("qr").appendChild(c);
          }
        }
      );
    }
  });