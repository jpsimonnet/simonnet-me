# Lecteur RSS

Lecteur de flux RSS/Atom en ligne, 100 % client-side, sans compte utilisateur. Interface conforme au [Système de Design de l'État (DSFR)](https://www.systeme-de-design.gouv.fr/).

## Fonctionnalités

- **Lecture de flux RSS 2.0 et Atom** avec parsing natif (DOMParser)
- **Écran d'accueil** proposant deux sélections de flux pré-configurées (183 ou 77 flux) ou l'import d'un fichier OPML personnel
- **Sidebar** avec catégories collapsibles et badges de compteurs non lus
- **Panneau de lecture** avec contenu HTML sanitisé (prévention XSS)
- **Filtres** : Tous / Non lus / Favoris
- **Recherche** par titre et résumé d'article
- **Marquer lu / non lu**, **favoris** (étoile)
- **Pagination** des articles
- **Navigation clavier** : `j` / `k` (article suivant/précédent), `r` (lu/non lu), `s` (favori), `o` (ouvrir l'original), `Échap` (fermer)
- **Import / Export OPML** pour partager ses abonnements
- **Sauvegarde / Restauration** complète au format JSON
- **Thème clair / sombre / système** (composant DSFR natif)
- **Nettoyage automatique** des articles anciens (configurable)

## Données et vie privée

**Aucune donnée ne quitte le navigateur.** Tout est stocké localement :

| Donnée | Stockage | Limite |
|--------|----------|--------|
| Préférences (thème, pagination, etc.) | localStorage | ~5 Mo |
| Articles, flux, catégories | IndexedDB | 50+ Mo |

Aucun cookie, aucun traceur, aucun compte utilisateur.

## Récupération des flux (CORS)

Les flux RSS étant hébergés sur des serveurs externes, l'application utilise une stratégie de détection automatique :

1. **Proxy PHP local** (`proxy.php`) — Si le serveur dispose de PHP, toutes les requêtes passent par ce relai (~50 lignes, zéro dépendance). Autonomie totale.
2. **Proxies publics** (fallback) — Si PHP n'est pas disponible (ex. GitLab Pages), l'application bascule automatiquement sur une chaîne de proxies : `allorigins.win` → `corsproxy.io`.

La détection est transparente pour l'utilisateur.

## Installation

Aucune dépendance à installer. Copier les fichiers sur n'importe quel serveur web.

### Serveur statique (GitLab Pages, Apache, Nginx…)

```bash
# Cloner le dépôt
git clone https://gitlab-forge.din.developpement-durable.gouv.fr/jean-philippe.simonnet/rss.git
cd rss

# Tester localement
python3 -m http.server 8080
# Ouvrir http://localhost:8080
```

Les flux seront récupérés via les proxies publics (pas de PHP).

### Serveur avec PHP

```bash
# Tester localement avec PHP
php -S localhost:8080
# Ouvrir http://localhost:8080
```

Le fichier `proxy.php` sera automatiquement détecté et utilisé comme relai CORS.

### GitLab Pages (CI/CD)

Le fichier `.gitlab-ci.yml` est inclus. Il suffit de pousser sur la branche `main` pour déclencher le déploiement automatique sur GitLab Pages.

## Structure du projet

```
rss/
├── index.html                  Page principale
├── proxy.php                   Proxy CORS PHP (optionnel)
├── accessibilite.html          Déclaration d'accessibilité
├── mentions-legales.html       Mentions légales
├── .gitlab-ci.yml              Pipeline GitLab Pages
└── source/
    ├── selection.opml          Sélection 1 : 183 flux (veille complète)
    ├── selection2.opml         Sélection 2 : 77 flux (veille France)
    ├── css/
    │   └── app.css             Styles de l'application
    ├── js/
    │   ├── app.js              Point d'entrée, événements, orchestration
    │   ├── storage.js          IndexedDB + localStorage
    │   ├── feed-fetcher.js     Détection proxy + chaîne de fallback
    │   ├── feed-parser.js      Parsing RSS 2.0 / Atom (DOMParser)
    │   ├── opml.js             Import / export OPML
    │   ├── ui.js               Rendu DOM (sidebar, articles, lecture)
    │   └── sanitizer.js        Sanitisation HTML (prévention XSS)
    ├── content/                Contenus Markdown des sous-pages
    ├── dsfr/                   Système de Design de l'État (bundle local)
    ├── marked.min.js           Conversion Markdown pour les sous-pages
    └── page.js                 Injection header/footer des sous-pages
```

## Technologies

- **JavaScript vanilla** — Aucun framework, aucun build, aucune dépendance npm
- **DSFR** — Système de Design de l'État, embarqué localement
- **IndexedDB** — Stockage structuré des articles côté client
- **DOMParser** — Parsing natif XML (RSS/Atom) et HTML (sanitisation)

## Sécurité

Le contenu HTML des flux RSS est **sanitisé par liste blanche** avant affichage :

- Tags autorisés : `p`, `a`, `img`, `h1`–`h6`, `ul`/`ol`/`li`, `table`, `blockquote`, `pre`, `code`…
- Attributs autorisés par tag (`href` pour `a`, `src`/`alt` pour `img`…)
- Suppression complète de `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<svg>`
- Blocage des protocoles `javascript:`, `data:text/html`, `vbscript:`
- Liens forcés en `target="_blank" rel="noopener noreferrer"`

## Sélections de flux pré-configurées

### Sélection 1 — Veille complète (183 flux)

Médias FR, Tech, IA, Environnement, Institutions, Open Data, Cybersécurité (France/EU/International), Dev/DevSecOps/Cloud.

### Sélection 2 — Veille France (77 flux)

Médias FR, Tech FR, Environnement, Ministères.

## Licence

[Licence Ouverte / Open Licence Etalab 2.0](https://github.com/etalab/licence-ouverte/blob/master/LO.md)
