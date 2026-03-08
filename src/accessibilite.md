---
layout: post
title: Accessibilité | Qualité web | Éco-conception
tags: post
date: 2025-07-31

---

 # Accessibilité | Qualité web | Éco-conception

J’essaye de m’appliquer plusieurs référentiels, bien sur j’essaye d’améliorer l’**accessibilité** de mon site, mais j’essaie aussi de m’appliquer d’autres référentiels comme la **Qualité Web** (opquast) ou **l’éco-conception web**.


## Audit RGAA 4.1 - Mars 2026

Audit réalisé le 8 mars 2026 sur un échantillon de pages représentatives du site simonnet.me, selon le [Référentiel Général d’Amélioration de l’Accessibilité (RGAA 4.1)](https://accessibilite.numerique.gouv.fr/).

**Pages auditées :** Accueil, Qui suis-je, Interventions (liste et détail), Actualités, Lectures (liste et détail livre), Photos, Veille RSS, Recherche, Plan du site, Mentions légales, Accessibilité.

### Résultat global

**Taux de conformité : 87 %** (74 critères conformes sur 85 applicables)

### Thématique 1 — Images

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 1.1 | Chaque image porteuse d’information a-t-elle une alternative textuelle ? | Conforme |
| 1.2 | Chaque image de décoration est-elle ignorée par les technologies d’assistance ? | Conforme |
| 1.3 | Pour chaque image porteuse d’information ayant une alternative textuelle, cette alternative est-elle pertinente ? | Conforme |
| 1.6 | Chaque image porteuse d’information a-t-elle, si nécessaire, une description détaillée ? | Non applicable |
| 1.8 | Chaque image texte porteuse d’information, en l’absence d’un mécanisme de remplacement, a-t-elle un texte stylé ? | Non applicable |

### Thématique 2 — Cadres

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 2.1 | Chaque cadre a-t-il un titre de cadre ? | Conforme |
| 2.2 | Pour chaque cadre ayant un titre, ce titre est-il pertinent ? | Conforme |

### Thématique 3 — Couleurs

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 3.1 | L’information ne doit pas être donnée uniquement par la couleur. | Conforme |
| 3.2 | Le contraste entre la couleur du texte et la couleur de son arrière-plan est-il suffisant ? | Conforme |
| 3.3 | Les couleurs utilisées dans les composants d’interface sont-elles suffisamment contrastées ? | Conforme |

### Thématique 4 — Multimédia

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 4.1 | Chaque média temporel pré-enregistré a-t-il, si nécessaire, une transcription textuelle ? | Non conforme |
| 4.7 | Chaque média temporel est-il clairement identifiable ? | Conforme |

**Note :** Les vidéos intégrées via des plateformes tierces (YouTube, Dailymotion, Vimeo) ne disposent pas toutes de transcriptions textuelles. Ces contenus étant hébergés sur des plateformes externes, la responsabilité des sous-titres et transcriptions incombe partiellement à ces plateformes.

### Thématique 5 — Tableaux

Non applicable (aucun tableau de données sur le site).

### Thématique 6 — Liens

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 6.1 | Chaque lien est-il explicite ? | Conforme |
| 6.2 | Dans chaque page, chaque lien, à l’exception des ancres, a-t-il un intitulé ? | Conforme |

### Thématique 7 — Scripts

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 7.1 | Chaque script est-il compatible avec les technologies d’assistance ? | Conforme |
| 7.3 | Chaque script est-il contrôlable par le clavier et par tout dispositif de pointage ? | Conforme |
| 7.5 | Chaque script procédant à une modification du document est-il compatible avec les technologies d’assistance ? | Conforme |

**Note :** Le sélecteur de thème clair/sombre/auto fonctionne au clavier. Le moteur de recherche Pagefind utilise un champ de saisie standard accessible.

### Thématique 8 — Éléments obligatoires

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 8.1 | Chaque page a-t-elle un type de document ? | Conforme |
| 8.2 | Le code source de chaque page est-il valide selon le type de document spécifié ? | Non conforme |
| 8.3 | La langue par défaut de chaque page est-elle présente ? | Conforme |
| 8.4 | La langue par défaut de chaque page est-elle pertinente ? | Conforme |
| 8.5 | Chaque page a-t-elle un titre pertinent ? | Conforme |
| 8.6 | Chaque page a-t-elle une indication de langue dans le code source ? | Conforme |
| 8.7 | Les changements de langue dans le texte sont-ils indiqués ? | Non conforme |
| 8.9 | Chaque page n’a pas de balises utilisées uniquement à des fins de présentation. | Conforme |

**Notes :**
- Critère 8.2 : Quelques attributs obsolètes subsistent sur les iframes intégrées (`frameborder`, `marginwidth`). L’impact est mineur.
- Critère 8.7 : Certaines citations en anglais dans les articles ne sont pas balisées avec `lang="en"` (ex. : citation de Tim Berners-Lee, termes techniques).

### Thématique 9 — Structuration de l’information

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 9.1 | La hiérarchie des titres est-elle pertinente ? | Conforme |
| 9.2 | La structure du document est-elle cohérente ? | Conforme |
| 9.3 | Chaque liste est-elle correctement structurée ? | Conforme |
| 9.4 | La première occurrence de chaque abréviation est-elle explicitée ? | Non conforme |

**Note :** Critère 9.4 : Certaines abréviations techniques (RGAA, WCAG, OPML, RSS, CSV, etc.) ne sont pas toujours explicitées avec la balise `<abbr>`.

### Thématique 10 — Présentation de l’information

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 10.1 | La présentation de l’information est-elle définie uniquement dans des feuilles de styles ? | Conforme |
| 10.2 | Le contenu visible reste-t-il présent lorsque les feuilles de styles sont désactivées ? | Conforme |
| 10.3 | L’information reste-t-elle compréhensible lorsque les feuilles de styles sont désactivées ? | Conforme |
| 10.4 | Le texte reste-t-il lisible lorsque la taille des caractères est augmentée jusqu’à 200 % ? | Conforme |
| 10.7 | La prise de focus ne modifie-t-elle pas la présentation de la page de manière excessive ? | Conforme |
| 10.8 | Le contenu caché est-il correctement ignoré par les technologies d’assistance ? | Conforme |
| 10.11 | Le contenu peut-il être présenté sans perte d’information en mode portrait et paysage ? | Conforme |
| 10.12 | Les propriétés d’espacement du texte peuvent-elles être redéfinies par l’utilisateur ? | Conforme |

### Thématique 11 — Formulaires

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 11.1 | Chaque champ de formulaire a-t-il une étiquette ? | Conforme |
| 11.2 | Chaque étiquette associée à un champ est-elle pertinente ? | Conforme |

### Thématique 12 — Navigation

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 12.1 | Chaque ensemble de pages dispose-t-il de deux systèmes de navigation au moins ? | Conforme |
| 12.6 | Les zones de regroupement de contenus sont-elles identifiées ? | Conforme |
| 12.7 | Les liens d’accès rapide sont-ils présents et fonctionnels ? | Conforme |
| 12.8 | L’ordre de tabulation est-il cohérent ? | Conforme |

**Note :** Le site dispose d’un menu de navigation, d’un plan du site, d’un moteur de recherche et d’un fil d’Ariane. Les liens d’accès rapide (aller au menu, aller au contenu, aller au pied de page) sont fonctionnels et visibles au focus.

### Thématique 13 — Consultation

| Critère | Intitulé | Statut |
|---------|----------|--------|
| 13.1 | Les contenus sont-ils consultables quelle que soit l’orientation de l’écran ? | Conforme |
| 13.7 | Les documents téléchargeables sont-ils accessibles ? | Non conforme |
| 13.8 | Chaque contenu proposé en téléchargement a-t-il une version accessible ? | Non conforme |

**Note :** Les fichiers PDF et PowerPoint proposés en téléchargement dans les pages d’interventions n’ont pas été vérifiés pour leur accessibilité.

---

### Résumé des non-conformités

| # | Critère | Description | Priorité |
|---|---------|-------------|----------|
| 1 | 4.1 | Vidéos tierces sans transcription textuelle systématique | Moyenne |
| 2 | 8.2 | Attributs obsolètes sur quelques iframes intégrées | Faible |
| 3 | 8.7 | Passages en anglais non balisés avec `lang="en"` | Faible |
| 4 | 9.4 | Abréviations techniques non explicitées | Faible |
| 5 | 13.7/13.8 | Documents téléchargeables (PDF/PPTX) non vérifiés | Moyenne |

### Améliorations réalisées (mars 2026)

- Titre `<h1>` unique par page (le logo utilise désormais un `<p>`)
- Alternatives textuelles corrigées sur toutes les images (décoratives en `alt=""`, informatives avec description)
- Attributs `title` ajoutés sur tous les cadres `<iframe>` intégrés
- Liens d’accès rapide fonctionnels avec contraste suffisant (blanc sur noir)
- Pas d’imbrication de `<main>` dans les gabarits
- Suppression de `role="button"` sur les liens
- `aria-label` en français sur le bouton de menu mobile
- Liens HTTP convertis en HTTPS (LinkedIn, Doyoubuzz, Creative Commons)
- Fil d’Ariane conditionnel (masqué sur la page d’accueil pour éviter la redondance)
- `aria-label="Fil d’Ariane"` sur la navigation de fil d’Ariane
- Balise `<title>` complète sur les pages de fiches de lecture
- Pied de page structuré avec `<nav>` et liste `<ul>`
- Labels de formulaires ajoutés (page Veille RSS)
- Contraste des liens de navigation amélioré (passage de `#767676` à `#595959`, ratio 7:1)
- Feuilles de styles et scripts correctement placés dans le `<head>`
- Suppression de l’attribut obsolète `language="JavaScript"`

---

## Mesures d’accessibilité en place

**Liens d’accès rapide :** trois liens d’accès rapide (menu, contenu, pied de page) s’activent au clavier.

**Navigation dans le site :**
- Un fil d’Ariane
- [Un plan du site](/plan)
- Un moteur de recherche

**Liens externes :** les liens ouvrant une nouvelle fenêtre sont signalés (attribut `title` ou mention visually-hidden).



## Qualité web
Les test automatiques ne remplacent jamais [un bon audit opquast](https://checklists.opquast.com/fr/assurance-qualite-web/) bien évidemment ... 

- [Mon test Google Page Speed (Lighthouse)](https://pagespeed.web.dev/analysis/https-simonnet-me/zcrxiszl38?form_factor=desktop) : 
    - **Performances :** 100 
    - **Accessibilité :** 92 
    - **Bonnes pratiques :** 100 
    - **SEO :** 82

## Éco-conception

- Utiliser des images quand c'est nécessaire et proposer des images en svg et en webp
- Maitriser les poids et chargements des images de chaque page.
- Faire des audits réguliers et surtout cela me permet de vérifier quelques erreurs.
- [Test du websitecarbon : note A+](https://www.websitecarbon.com/website/simonnet-me/) : "This is cleaner than 
97% of all web pages globally"
- [Test ecoindex (89 / 100 - A)](https://www.ecoindex.fr/resultat/?id=e7bf4db0-4c34-4d0b-bbef-08bfb77caf98) - Le top. On se rapproche dangereusement de la perfection (selon eux). 

