/**
 * page.js — Génère le header DSFR et injecte le contenu Markdown.
 *
 * Utilisation dans une page HTML :
 *   <div id="content" data-src="./source/content/mentions-legales.md"></div>
 *   <script src="./source/marked.min.js"></script>
 *   <script src="./source/page.js"></script>
 */

(function () {
  "use strict";

  /* ── Header HTML ────────────────────────────────────── */
  const header = `
  <header role="banner" class="fr-header">
    <div class="fr-header__body">
      <div class="fr-container">
        <div class="fr-header__body-row">
          <div class="fr-header__brand fr-enlarge-link">
            <div class="fr-header__brand-top">
              <div class="fr-header__logo">
                <span class="fr-icon-mail-line" aria-hidden="true"></span>
              </div>
            </div>
            <div class="fr-header__service">
              <a href="./index.html" title="Accueil - Email-Facile">
                <p class="fr-header__service-title">Email-Facile</p>
              </a>
              <p class="fr-header__service-tagline">Créez vos e-mails facilement au format DSFR</p>
            </div>
          </div>
          <div class="fr-header__tools">
            <div class="fr-header__tools-links">
              <ul class="fr-btns-group">
                <li>
                  <a class="fr-btn fr-btn--sm fr-icon-eye-line" href="./accessibilite.html">Accessibilité</a>
                </li>
                <li>
                  <a class="fr-btn fr-btn--sm fr-icon-scales-3-line" href="./mentions-legales.html">Mentions légales</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>`;

  /* ── Rendu ──────────────────────────────────────────── */
  const container = document.getElementById("content");
  if (!container) return;

  const mdFile = container.getAttribute("data-src");
  if (!mdFile) return;

  // Injecter header avant le <main>
  const main = document.querySelector("main") || container.parentElement;
  main.insertAdjacentHTML("beforebegin", header);

  // Marquer le lien courant dans le header
  var currentPage = location.pathname.split("/").pop();
  document.querySelectorAll(".fr-header .fr-btns-group a").forEach(function (link) {
    if (link.getAttribute("href").indexOf(currentPage) !== -1) {
      link.setAttribute("aria-current", "page");
    }
  });

  // Charger et convertir le Markdown
  fetch(mdFile)
    .then(function (res) {
      if (!res.ok) throw new Error("Impossible de charger " + mdFile);
      return res.text();
    })
    .then(function (md) {
      container.innerHTML = marked.parse(md);

      // Ajouter les classes DSFR aux éléments générés
      container.querySelectorAll("h1").forEach(function (el) {
        el.classList.add("fr-h2", "fr-mb-4w");
      });
      container.querySelectorAll("h2").forEach(function (el) {
        el.classList.add("fr-h4", "fr-mt-4w");
      });
      container.querySelectorAll("a").forEach(function (el) {
        if (el.hostname && el.hostname !== location.hostname) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
        }
      });

      // Lien retour accueil
      var back = document.createElement("p");
      back.className = "fr-mt-4w";
      back.innerHTML =
        '<a class="fr-link fr-link--icon-left fr-icon-arrow-left-line" href="./index.html">Retour à l\'accueil</a>';
      container.appendChild(back);
    })
    .catch(function (err) {
      container.innerHTML =
        '<div class="fr-callout fr-callout--red-marianne"><p>' +
        err.message +
        "</p></div>";
    });
})();
