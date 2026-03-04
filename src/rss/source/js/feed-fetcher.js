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

  function tryProxyChain(url, chain, index) {
    if (index >= chain.length) {
      return Promise.reject(new Error('Impossible de récupérer le flux : ' + url));
    }

    var proxy = chain[index];
    var fetchUrl = proxy.buildUrl(url);
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 15000);

    return fetch(fetchUrl, { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timeoutId);
        if (!res.ok) {
          // 4xx = URL probablement cassee, ne pas essayer les autres proxies
          if (res.status >= 400 && res.status < 500 && proxy.name !== 'direct') {
            throw new Error('HTTP ' + res.status);
          }
          throw new Error('HTTP ' + res.status);
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
        // Essayer le proxy suivant
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
    hasPhpProxy: function () { return hasPhpProxy; }
  };
})();
