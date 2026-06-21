/**
 * feed-parser.js — Parsing RSS 2.0 / Atom via DOMParser natif.
 */
(function () {
  'use strict';

  function parse(xmlText, feedUrl) {
    // Nettoyer les espaces/BOM avant la declaration XML
    xmlText = xmlText.replace(/^[\s\uFEFF]+(<\?xml|<rss|<feed|<rdf)/i, '$1');

    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlText, 'text/xml');

    // Verifier les erreurs de parsing
    var parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML invalide : ' + parseError.textContent.substring(0, 200));
    }

    var root = doc.documentElement;
    var rootTag = root.tagName.toLowerCase();

    if (rootTag === 'rss' || rootTag === 'rdf:rdf' || rootTag === 'rdf') {
      return parseRSS(doc, feedUrl);
    } else if (rootTag === 'feed') {
      return parseAtom(doc, feedUrl);
    } else {
      throw new Error('Format de flux inconnu : ' + rootTag);
    }
  }

  /* ── RSS 2.0 / RSS 1.0 ─────────────────────────────── */

  function parseRSS(doc, feedUrl) {
    var channel = doc.querySelector('channel');
    var feed = {
      title: text(channel, 'title') || feedUrl,
      link: text(channel, 'link') || '',
      description: text(channel, 'description') || '',
      icon: getFeedIcon(channel)
    };

    var items = Array.from(doc.querySelectorAll('item'));
    var articles = items.map(function (item) {
      var content = getContentEncoded(item) || text(item, 'description') || '';
      var summary = text(item, 'description') || '';
      var rawDate = text(item, 'pubDate') || text(item, 'date');

      return {
        guid: text(item, 'guid') || text(item, 'link') || '',
        title: text(item, 'title') || 'Sans titre',
        link: text(item, 'link') || '',
        author: text(item, 'author') || getCreator(item) || '',
        pubDate: parseDate(rawDate),
        summary: stripHtml(summary).substring(0, 300),
        content: content,
        thumbnail: getThumbnail(item, content)
      };
    });

    return { feed: feed, articles: articles };
  }

  /* ── Atom ───────────────────────────────────────────── */

  function parseAtom(doc, feedUrl) {
    var feedEl = doc.documentElement;
    var feed = {
      title: text(feedEl, 'title') || feedUrl,
      link: getAtomLink(feedEl) || '',
      description: text(feedEl, 'subtitle') || '',
      icon: getAtomFeedIcon(feedEl)
    };

    var entries = Array.from(doc.querySelectorAll('entry'));
    var articles = entries.map(function (entry) {
      var content = text(entry, 'content') || text(entry, 'summary') || '';
      var rawDate = text(entry, 'published') || text(entry, 'updated');

      return {
        guid: text(entry, 'id') || getAtomLink(entry) || '',
        title: text(entry, 'title') || 'Sans titre',
        link: getAtomLink(entry) || '',
        author: text(entry, 'author > name') || '',
        pubDate: parseDate(rawDate),
        summary: stripHtml(text(entry, 'summary') || content).substring(0, 300),
        content: content,
        thumbnail: getThumbnail(entry, content)
      };
    });

    return { feed: feed, articles: articles };
  }

  /* ── Utilitaires ────────────────────────────────────── */

  function text(parent, selector) {
    if (!parent) return '';
    var el = parent.querySelector(selector);
    if (!el) return '';
    return el.textContent.trim();
  }

  function getContentEncoded(item) {
    // Methode 1 : querySelector avec echappement
    var el = item.querySelector('content\\:encoded, encoded');
    if (el) return el.textContent;

    // Methode 2 : getElementsByTagNameNS
    var ns = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded');
    if (ns.length > 0) return ns[0].textContent;

    // Methode 3 : iterer les enfants
    for (var i = 0; i < item.children.length; i++) {
      if (item.children[i].localName === 'encoded') return item.children[i].textContent;
    }
    return null;
  }

  function getCreator(item) {
    var el = item.querySelector('dc\\:creator, creator');
    if (el) return el.textContent.trim();
    var ns = item.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'creator');
    if (ns.length > 0) return ns[0].textContent.trim();
    return '';
  }

  function getThumbnail(item, content) {
    // 1. media:thumbnail
    var thumb = item.querySelector('thumbnail');
    if (thumb && thumb.getAttribute('url')) return thumb.getAttribute('url');
    var thumbNS = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail');
    if (thumbNS.length > 0 && thumbNS[0].getAttribute('url')) return thumbNS[0].getAttribute('url');

    // 2. media:content avec type image
    var mediaNS = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content');
    for (var i = 0; i < mediaNS.length; i++) {
      var url = mediaNS[i].getAttribute('url') || '';
      var type = mediaNS[i].getAttribute('type') || '';
      var medium = mediaNS[i].getAttribute('medium') || '';
      if (medium === 'image' || /^image\//i.test(type) || /\.(jpe?g|png|gif|webp|avif)/i.test(url)) {
        return url;
      }
    }

    // 3. enclosure avec type image
    var enclosures = item.querySelectorAll('enclosure');
    for (var j = 0; j < enclosures.length; j++) {
      var encType = enclosures[j].getAttribute('type') || '';
      var encUrl = enclosures[j].getAttribute('url') || '';
      if (/^image\//i.test(encType) || /\.(jpe?g|png|gif|webp|avif)/i.test(encUrl)) {
        return encUrl;
      }
    }

    // 4. Premiere image dans le contenu HTML
    if (content) {
      var match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && /^https?:\/\//i.test(match[1])) return match[1];
    }

    return '';
  }

  function getFeedIcon(channel) {
    if (!channel) return '';
    // RSS <image><url>
    var image = channel.querySelector('image > url');
    if (image && image.textContent.trim()) return image.textContent.trim();
    return '';
  }

  function getAtomFeedIcon(feedEl) {
    if (!feedEl) return '';
    // Atom <icon>
    var icon = feedEl.querySelector('icon');
    if (icon && icon.textContent.trim()) return icon.textContent.trim();
    // Atom <logo>
    var logo = feedEl.querySelector('logo');
    if (logo && logo.textContent.trim()) return logo.textContent.trim();
    return '';
  }

  function getAtomLink(el) {
    // Preferrer le lien avec rel="alternate" ou sans rel
    var links = el.querySelectorAll('link');
    var alternate = '';
    var first = '';
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      var rel = links[i].getAttribute('rel') || 'alternate';
      if (!first && href) first = href;
      if (rel === 'alternate' && href) { alternate = href; break; }
    }
    return alternate || first || '';
  }

  function parseDate(str) {
    if (!str) return 0;
    var d = new Date(str);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  window.RSS = window.RSS || {};
  window.RSS.parser = { parse: parse };
})();
