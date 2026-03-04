/**
 * opml.js — Import/export OPML. Parse recursif pour gerer les sous-categories.
 */
(function () {
  'use strict';

  function parse(xmlText) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlText, 'text/xml');
    var body = doc.querySelector('body');
    if (!body) throw new Error('OPML invalide : pas de <body>');

    var categories = [];
    var feeds = [];

    Array.from(body.children).forEach(function (outline) {
      if (outline.getAttribute('xmlUrl')) {
        // Flux sans categorie
        feeds.push(outlineToFeed(outline, 'Sans catégorie'));
      } else {
        // Noeud de categorie
        var catName = outline.getAttribute('text') || outline.getAttribute('title') || 'Sans catégorie';
        if (categories.indexOf(catName) === -1) categories.push(catName);
        collectFeeds(outline, catName, categories, feeds);
      }
    });

    return { categories: categories, feeds: feeds };
  }

  function collectFeeds(parentOutline, categoryName, categories, feeds) {
    Array.from(parentOutline.children).forEach(function (child) {
      if (child.tagName !== 'outline') return;
      if (child.getAttribute('xmlUrl')) {
        feeds.push(outlineToFeed(child, categoryName));
      } else if (child.children.length > 0) {
        // Sous-categorie → aplatir
        var subName = categoryName + ' > ' + (child.getAttribute('text') || child.getAttribute('title') || '');
        if (categories.indexOf(subName) === -1) categories.push(subName);
        collectFeeds(child, subName, categories, feeds);
      }
    });
  }

  function outlineToFeed(outline, categoryName) {
    return {
      title: outline.getAttribute('text') || outline.getAttribute('title') || 'Sans titre',
      xmlUrl: outline.getAttribute('xmlUrl') || '',
      htmlUrl: outline.getAttribute('htmlUrl') || '',
      categoryName: categoryName
    };
  }

  /* ── Generation OPML ────────────────────────────────── */

  function generate(categories, feeds) {
    var lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<opml version="2.0">',
      '  <head>',
      '    <title>Lecteur RSS - Export</title>',
      '    <dateCreated>' + new Date().toUTCString() + '</dateCreated>',
      '  </head>',
      '  <body>'
    ];

    categories.forEach(function (cat) {
      var catFeeds = feeds.filter(function (f) { return f.categoryName === cat.name; });
      if (catFeeds.length === 0) return;
      lines.push('    <outline text="' + escXml(cat.name) + '">');
      catFeeds.forEach(function (f) {
        lines.push('      <outline type="rss" text="' + escXml(f.title) + '"'
          + ' xmlUrl="' + escXml(f.xmlUrl) + '"'
          + (f.htmlUrl ? ' htmlUrl="' + escXml(f.htmlUrl) + '"' : '') + '/>');
      });
      lines.push('    </outline>');
    });

    lines.push('  </body>', '</opml>');
    return lines.join('\n');
  }

  function escXml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  /* ── Chargement des OPML bundles ────────────────────── */

  function loadBundled(filename) {
    return fetch('./source/' + filename)
      .then(function (res) {
        if (!res.ok) throw new Error('Fichier OPML non trouvé : ' + filename);
        return res.text();
      })
      .then(function (text) {
        return parse(text);
      });
  }

  window.RSS = window.RSS || {};
  window.RSS.opml = {
    parse: parse,
    generate: generate,
    loadBundled: loadBundled
  };
})();
