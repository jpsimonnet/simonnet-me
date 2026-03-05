/**
 * feed-fetcher.js — Detection proxy PHP + chaine de proxies CORS publics.
 */
(function () {
  'use strict';

  var hasPhpProxy = false;
  var proxyCache = {}; // domaine → nom du proxy qui fonctionne
  var cancelFlag = false;

  var PROXIES = [
    { name: 'php', buildUrl: function (url) { return 'proxy.php?url=' + encodeURIComponent(url); } },
    { name: 'direct', buildUrl: function (url) { return url; } },
    { name: 'allorigins', buildUrl: function (url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); } },
    { name: 'corsproxy', buildUrl: function (url) { return 'https://corsproxy.io/?' + encodeURIComponent(url); } }
  ];

  /* ── Initialisation ─────────────────────────────────── */

  function init() {
    // Tester si proxy.php est disponible
    return fetch('proxy.php?check=1', { method: 'GET' })
      .then(function (res) {
        if (res.ok) {
          return res.text().then(function (t) {
            hasPhpProxy = t.trim() === 'ok';
          });
        }
      })
      .catch(function () {
        hasPhpProxy = false;
      });
  }

  /* ── Fetch d'un flux ────────────────────────────────── */

  function fetchFeed(url) {
    var domain = getDomain(url);
    var chain = getProxyChain(domain);

    return tryProxyChain(url, chain, 0);
  }

  function friendlyError(err) {
    var msg = err.message || String(err);
    if (err.name === 'AbortError' || msg.indexOf('abort') !== -1) return 'Délai d\'attente dépassé (15s)';
    if (msg.indexOf('Failed to fetch') !== -1 || msg.indexOf('NetworkError') !== -1) return 'Serveur inaccessible';
    if (msg.indexOf('HTTP 404') !== -1) return 'Flux introuvable (404)';
    if (msg.indexOf('HTTP 403') !== -1) return 'Accès refusé (403)';
    if (msg.indexOf('HTTP 401') !== -1) return 'Authentification requise (401)';
    if (msg.indexOf('HTTP 5') !== -1) return 'Erreur serveur (' + msg.replace('HTTP ', '') + ')';
    if (msg.indexOf('HTTP 4') !== -1) return 'Requête refusée (' + msg.replace('HTTP ', '') + ')';
    if (msg.indexOf('non-XML') !== -1) return 'Le flux ne renvoie pas du XML valide';
    if (msg.indexOf('Impossible') !== -1) return 'Aucun proxy n\'a pu atteindre le flux';
    return msg;
  }

  function tryProxyChain(url, chain, index) {
    if (index >= chain.length) {
      var e = new Error('Aucun proxy n\'a pu atteindre le flux');
      e.friendly = true;
      return Promise.reject(e);
    }

    var proxy = chain[index];
    var fetchUrl = proxy.buildUrl(url);
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 15000);

    return fetch(fetchUrl, { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timeoutId);
        if (!res.ok) {
          var err = new Error('HTTP ' + res.status);
          if (proxy.name === 'php') err.fatal = true;
          throw err;
        }
        return res.text();
      })
      .then(function (text) {
        // Verifier que c'est du XML
        if (!text || (!text.trim().startsWith('<?xml') && !text.trim().startsWith('<rss') && !text.trim().startsWith('<feed') && !text.trim().startsWith('<rdf'))) {
          throw new Error('Réponse non-XML');
        }
        // Memoriser le proxy qui marche pour ce domaine
        proxyCache[getDomain(url)] = proxy.name;
        return { text: text, proxyUsed: proxy.name };
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        // Arreter si erreur fatale (proxy PHP a deja tout essaye)
        if (err.fatal) {
          return Promise.reject(err);
        }
        // Sinon essayer le proxy suivant
        return tryProxyChain(url, chain, index + 1);
      });
  }

  /* ── Fetch en masse avec pool de concurrence ────────── */

  function fetchAllFeeds(feedList, onProgress) {
    cancelFlag = false;
    var completed = 0;
    var total = feedList.length;
    var results = [];
    var queue = feedList.slice();
    var maxConcurrent = 5;
    var active = 0;

    return new Promise(function (resolve) {
      function next() {
        if (cancelFlag || (queue.length === 0 && active === 0)) {
          resolve(results);
          return;
        }
        while (!cancelFlag && active < maxConcurrent && queue.length > 0) {
          active++;
          var feed = queue.shift();
          (function (f) {
            fetchFeed(f.xmlUrl)
              .then(function (res) {
                try {
                  var parsed = RSS.parser.parse(res.text, f.xmlUrl);
                  results.push({ feed: f, parsed: parsed, error: null });
                } catch (e) {
                  results.push({ feed: f, parsed: null, error: e.message });
                }
              })
              .catch(function (err) {
                results.push({ feed: f, parsed: null, error: err.message });
              })
              .finally(function () {
                active--;
                completed++;
                if (onProgress) onProgress(completed, total, f.title);
                next();
              });
          })(feed);
        }
      }
      next();
    });
  }

  function cancelFetch() {
    cancelFlag = true;
  }

  /* ── Utilitaires ────────────────────────────────────── */

  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  }

  function getProxyChain(domain) {
    var chain = [];

    // Si on a un proxy PHP, l'utiliser en premier
    if (hasPhpProxy) {
      chain.push(PROXIES[0]); // php
    }

    // Si on connait deja le proxy qui marche pour ce domaine
    var cached = proxyCache[domain];
    if (cached) {
      var cachedProxy = PROXIES.find(function (p) { return p.name === cached; });
      if (cachedProxy && chain.indexOf(cachedProxy) === -1) {
        chain.push(cachedProxy);
      }
    }

    // Ajouter les autres proxies dans l'ordre
    for (var i = 1; i < PROXIES.length; i++) { // skip php (index 0)
      if (chain.indexOf(PROXIES[i]) === -1) {
        chain.push(PROXIES[i]);
      }
    }

    return chain;
  }

  window.RSS = window.RSS || {};
  window.RSS.fetcher = {
    init: init,
    fetchFeed: fetchFeed,
    fetchAllFeeds: fetchAllFeeds,
    cancelFetch: cancelFetch,
    friendlyError: friendlyError,
    hasPhpProxy: function () { return hasPhpProxy; }
  };
})();
