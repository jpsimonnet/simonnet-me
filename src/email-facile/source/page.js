/**
 * page.js — Génère le header/footer DSFR et injecte le contenu Markdown.
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
                <p class="fr-logo">République <br>Française</p>
              </div>
            </div>
            <div class="fr-header__service">
              <a href="./index.html" title="Accueil - Email-Facile">
                <p class="fr-header__service-title">Email-Facile</p>
              </a>
              <p class="fr-header__service-tagline">Créez vos e-mails facilement au format DSFR</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>`;

  /* ── Footer HTML ────────────────────────────────────── */
  const footer = `
  <footer class="fr-footer" role="contentinfo" id="footer">
    <div class="fr-container">
      <div class="fr-footer__body">
        <div class="fr-footer__brand fr-enlarge-link">
          <a href="./index.html" title="Retour à l'accueil du site - Email-Facile">
            <p class="fr-logo">République <br>Française</p>
          </a>
        </div>
        <div class="fr-footer__content">
          <p class="fr-footer__content-desc">Ce site est géré par la DNUM</p>
          <ul class="fr-footer__content-list">
            <li class="fr-footer__content-item">
              <a class="fr-footer__content-link" target="_blank" href="https://legifrance.gouv.fr"
                 aria-label="legifrance.gouv.fr — Nouvelle fenêtre" rel="noopener">legifrance.gouv.fr</a>
            </li>
            <li class="fr-footer__content-item">
              <a class="fr-footer__content-link" target="_blank" href="https://gouvernement.fr"
                 aria-label="gouvernement.fr — Nouvelle fenêtre" rel="noopener">gouvernement.fr</a>
            </li>
            <li class="fr-footer__content-item">
              <a class="fr-footer__content-link" target="_blank" href="https://service-public.fr"
                 aria-label="service-public.fr — Nouvelle fenêtre" rel="noopener">service-public.fr</a>
            </li>
            <li class="fr-footer__content-item">
              <a class="fr-footer__content-link" target="_blank" href="https://data.gouv.fr"
                 aria-label="data.gouv.fr — Nouvelle fenêtre" rel="noopener">data.gouv.fr</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="fr-footer__bottom">
        <ul class="fr-footer__bottom-list">
          <li class="fr-footer__bottom-item">
            <a class="fr-footer__bottom-link" href="./accessibilite.html">Accessibilité : non conforme</a>
          </li>
          <li class="fr-footer__bottom-item">
            <a class="fr-footer__bottom-link" href="./mentions-legales.html">Mentions légales</a>
          </li>
        </ul>
        <div class="fr-footer__bottom-copy">
          <p>Sauf mention contraire, tous les contenus de ce site sont sous
            <a href="https://github.com/etalab/licence-ouverte/blob/master/LO.md" target="_blank"
               aria-label="licence etalab-2.0 — Nouvelle fenêtre" rel="noopener">licence etalab-2.0</a></p>
        </div>
      </div>
    </div>
  </footer>`;

  /* ── Rendu ──────────────────────────────────────────── */
  const container = document.getElementById("content");
  if (!container) return;

  const mdFile = container.getAttribute("data-src");
  if (!mdFile) return;

  // Injecter header avant le <main>
  const main = document.querySelector("main") || container.parentElement;
  main.insertAdjacentHTML("beforebegin", header);

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

  // Injecter footer après le <main>
  main.insertAdjacentHTML("afterend", footer);

  // Marquer le lien courant dans le footer
  var currentPage = location.pathname.split("/").pop();
  document.querySelectorAll(".fr-footer__bottom-link").forEach(function (link) {
    if (link.getAttribute("href").indexOf(currentPage) !== -1) {
      link.setAttribute("aria-current", "page");
    }
  });
})();
