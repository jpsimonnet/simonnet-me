/**
 * storage.js — IndexedDB pour les articles/flux/categories + localStorage pour les preferences.
 */
(function () {
  'use strict';

  var DB_NAME = 'rss_reader';
  var DB_VERSION = 1;
  var db = null;

  /* ── IndexedDB ──────────────────────────────────────── */

  function open() {
    if (db) return Promise.resolve(db);
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var d = e.target.result;

        // Store feeds
        if (!d.objectStoreNames.contains('feeds')) {
          var feedStore = d.createObjectStore('feeds', { keyPath: 'id' });
          feedStore.createIndex('by-category', 'categoryId', { unique: false });
          feedStore.createIndex('by-url', 'xmlUrl', { unique: true });
        }

        // Store articles
        if (!d.objectStoreNames.contains('articles')) {
          var artStore = d.createObjectStore('articles', { keyPath: 'id' });
          artStore.createIndex('by-feed', 'feedId', { unique: false });
          artStore.createIndex('by-category', 'categoryId', { unique: false });
          artStore.createIndex('by-date', 'pubDate', { unique: false });
          artStore.createIndex('by-read-date', ['isRead', 'pubDate'], { unique: false });
          artStore.createIndex('by-starred', 'isStarred', { unique: false });
        }

        // Store categories
        if (!d.objectStoreNames.contains('categories')) {
          d.createObjectStore('categories', { keyPath: 'id' });
        }
      };
      req.onsuccess = function (e) {
        db = e.target.result;
        resolve(db);
      };
      req.onerror = function (e) {
        reject(e.target.error);
      };
    });
  }

  function tx(stores, mode) {
    var t = db.transaction(stores, mode || 'readonly');
    return t;
  }

  function promisify(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  /* ── Categories ─────────────────────────────────────── */

  function getAllCategories() {
    return open().then(function () {
      return promisify(tx('categories').objectStore('categories').getAll());
    }).then(function (cats) {
      return cats.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    });
  }

  function saveCategory(cat) {
    return open().then(function () {
      return promisify(tx('categories', 'readwrite').objectStore('categories').put(cat));
    });
  }

  function removeCategory(catId) {
    return open().then(function () {
      return promisify(tx('categories', 'readwrite').objectStore('categories').delete(catId));
    });
  }

  /* ── Feeds ──────────────────────────────────────────── */

  function getAllFeeds() {
    return open().then(function () {
      return promisify(tx('feeds').objectStore('feeds').getAll());
    });
  }

  function getFeedsByCategory(categoryId) {
    return open().then(function () {
      var idx = tx('feeds').objectStore('feeds').index('by-category');
      return promisify(idx.getAll(categoryId));
    });
  }

  function saveFeed(feed) {
    return open().then(function () {
      return promisify(tx('feeds', 'readwrite').objectStore('feeds').put(feed));
    });
  }

  function toggleFeedEnabled(feedId, enabled) {
    return open().then(function () {
      var store = tx('feeds', 'readwrite').objectStore('feeds');
      return promisify(store.get(feedId)).then(function (feed) {
        if (!feed) return;
        feed.enabled = enabled;
        return promisify(store.put(feed));
      });
    });
  }

  function removeFeed(feedId) {
    return open().then(function () {
      var t = tx(['feeds', 'articles'], 'readwrite');
      t.objectStore('feeds').delete(feedId);
      // Supprimer aussi les articles de ce flux
      var idx = t.objectStore('articles').index('by-feed');
      var req = idx.openCursor(IDBKeyRange.only(feedId));
      req.onsuccess = function () {
        var cursor = req.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      return new Promise(function (resolve, reject) {
        t.oncomplete = resolve;
        t.onerror = function () { reject(t.error); };
      });
    });
  }

  function updateFeedMeta(feedId, meta) {
    return open().then(function () {
      var store = tx('feeds', 'readwrite').objectStore('feeds');
      return promisify(store.get(feedId)).then(function (feed) {
        if (!feed) return;
        Object.assign(feed, meta);
        return promisify(store.put(feed));
      });
    });
  }

  function getFeedByUrl(url) {
    return open().then(function () {
      var idx = tx('feeds').objectStore('feeds').index('by-url');
      return promisify(idx.get(url));
    });
  }

  /* ── Articles ───────────────────────────────────────── */

  function getArticles(opts) {
    opts = opts || {};
    return open().then(function () {
      var store = tx('articles').objectStore('articles');
      var results = [];

      return new Promise(function (resolve, reject) {
        var req;

        if (opts.feedId) {
          req = store.index('by-feed').openCursor(IDBKeyRange.only(opts.feedId));
        } else if (opts.categoryId) {
          req = store.index('by-category').openCursor(IDBKeyRange.only(opts.categoryId));
        } else if (opts.isStarred) {
          req = store.index('by-starred').openCursor(IDBKeyRange.only(1));
        } else {
          req = store.index('by-date').openCursor(null, 'prev');
        }

        req.onsuccess = function () {
          var cursor = req.result;
          if (!cursor) {
            // Tri, filtre et pagination
            results.sort(function (a, b) { return b.pubDate - a.pubDate; });

            if (opts.excludeFeedIds) {
              results = results.filter(function (a) { return !opts.excludeFeedIds[a.feedId]; });
            }

            if (opts.isRead === false) {
              results = results.filter(function (a) { return !a.isRead; });
            } else if (opts.isRead === true) {
              results = results.filter(function (a) { return a.isRead; });
            }

            if (opts.search) {
              var q = opts.search.toLowerCase();
              results = results.filter(function (a) {
                return (a.title || '').toLowerCase().indexOf(q) !== -1 ||
                       (a.summary || '').toLowerCase().indexOf(q) !== -1;
              });
            }

            var total = results.length;
            var offset = opts.offset || 0;
            var limit = opts.limit || 25;
            var paged = results.slice(offset, offset + limit);

            resolve({ articles: paged, total: total });
            return;
          }
          results.push(cursor.value);
          cursor.continue();
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function getArticleById(id) {
    return open().then(function () {
      return promisify(tx('articles').objectStore('articles').get(id));
    });
  }

  function saveArticles(articles) {
    return open().then(function () {
      var t = tx('articles', 'readwrite');
      var store = t.objectStore('articles');
      articles.forEach(function (art) {
        // Upsert : ne pas ecraser isRead/isStarred si l'article existe
        var getReq = store.get(art.id);
        getReq.onsuccess = function () {
          var existing = getReq.result;
          if (existing) {
            art.isRead = existing.isRead;
            art.isStarred = existing.isStarred;
          }
          store.put(art);
        };
      });
      return new Promise(function (resolve, reject) {
        t.oncomplete = resolve;
        t.onerror = function () { reject(t.error); };
      });
    });
  }

  function markRead(articleId, isRead) {
    return open().then(function () {
      var store = tx('articles', 'readwrite').objectStore('articles');
      return promisify(store.get(articleId)).then(function (art) {
        if (!art) return;
        art.isRead = isRead;
        return promisify(store.put(art));
      });
    });
  }

  function markAllRead(opts) {
    return open().then(function () {
      var t = tx('articles', 'readwrite');
      var store = t.objectStore('articles');
      var req;

      if (opts && opts.feedId) {
        req = store.index('by-feed').openCursor(IDBKeyRange.only(opts.feedId));
      } else if (opts && opts.categoryId) {
        req = store.index('by-category').openCursor(IDBKeyRange.only(opts.categoryId));
      } else {
        req = store.openCursor();
      }

      req.onsuccess = function () {
        var cursor = req.result;
        if (cursor) {
          var art = cursor.value;
          if (!art.isRead) {
            art.isRead = true;
            cursor.update(art);
          }
          cursor.continue();
        }
      };

      return new Promise(function (resolve, reject) {
        t.oncomplete = resolve;
        t.onerror = function () { reject(t.error); };
      });
    });
  }

  function toggleStar(articleId) {
    return open().then(function () {
      var store = tx('articles', 'readwrite').objectStore('articles');
      return promisify(store.get(articleId)).then(function (art) {
        if (!art) return false;
        art.isStarred = art.isStarred ? 0 : 1;
        return promisify(store.put(art)).then(function () {
          return art.isStarred;
        });
      });
    });
  }

  function deleteOldArticles(maxAgeDays) {
    var cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    var count = 0;
    return open().then(function () {
      var t = tx('articles', 'readwrite');
      var store = t.objectStore('articles');
      var req = store.index('by-date').openCursor(IDBKeyRange.upperBound(cutoff));
      req.onsuccess = function () {
        var cursor = req.result;
        if (cursor) {
          var art = cursor.value;
          if (!art.isStarred) {
            cursor.delete();
            count++;
          }
          cursor.continue();
        }
      };
      return new Promise(function (resolve, reject) {
        t.oncomplete = function () { resolve(count); };
        t.onerror = function () { reject(t.error); };
      });
    });
  }

  function countArticles(opts) {
    return getArticles(opts).then(function (result) {
      return result.total;
    });
  }

  /* ── Compteurs non-lus ──────────────────────────────── */

  function getUnreadCounts() {
    return open().then(function () {
      var store = tx('articles').objectStore('articles');
      return new Promise(function (resolve, reject) {
        var counts = { total: 0, byFeed: {}, byCategory: {} };
        var req = store.openCursor();
        req.onsuccess = function () {
          var cursor = req.result;
          if (!cursor) { resolve(counts); return; }
          var art = cursor.value;
          if (!art.isRead) {
            counts.total++;
            counts.byFeed[art.feedId] = (counts.byFeed[art.feedId] || 0) + 1;
            counts.byCategory[art.categoryId] = (counts.byCategory[art.categoryId] || 0) + 1;
          }
          cursor.continue();
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  /* ── Backup/Restore ─────────────────────────────────── */

  function exportAllData() {
    return open().then(function () {
      return Promise.all([
        promisify(tx('categories').objectStore('categories').getAll()),
        promisify(tx('feeds').objectStore('feeds').getAll()),
        promisify(tx('articles').objectStore('articles').getAll())
      ]);
    }).then(function (results) {
      return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        preferences: prefs.getAll(),
        categories: results[0],
        feeds: results[1],
        articles: results[2]
      });
    });
  }

  function importAllData(jsonString) {
    var data = JSON.parse(jsonString);
    return open().then(function () {
      // Effacer les stores existants
      return clearAllData();
    }).then(function () {
      return open();
    }).then(function () {
      var t = tx(['categories', 'feeds', 'articles'], 'readwrite');
      var catStore = t.objectStore('categories');
      var feedStore = t.objectStore('feeds');
      var artStore = t.objectStore('articles');

      (data.categories || []).forEach(function (c) { catStore.put(c); });
      (data.feeds || []).forEach(function (f) { feedStore.put(f); });
      (data.articles || []).forEach(function (a) { artStore.put(a); });

      if (data.preferences) {
        Object.keys(data.preferences).forEach(function (k) {
          prefs.set(k, data.preferences[k]);
        });
      }

      return new Promise(function (resolve, reject) {
        t.oncomplete = resolve;
        t.onerror = function () { reject(t.error); };
      });
    });
  }

  function clearAllData() {
    return open().then(function () {
      var t = tx(['categories', 'feeds', 'articles'], 'readwrite');
      t.objectStore('categories').clear();
      t.objectStore('feeds').clear();
      t.objectStore('articles').clear();
      localStorage.removeItem('rss_prefs');
      return new Promise(function (resolve, reject) {
        t.oncomplete = resolve;
        t.onerror = function () { reject(t.error); };
      });
    });
  }

  /* ── Preferences (localStorage) ─────────────────────── */

  var PREFS_KEY = 'rss_prefs';
  var DEFAULTS = {
    articlesPerPage: 25,
    maxArticleAgeDays: 90,
    defaultView: 'all'
  };

  var prefs = {
    getAll: function () {
      try {
        var stored = JSON.parse(localStorage.getItem(PREFS_KEY));
        return Object.assign({}, DEFAULTS, stored || {});
      } catch (e) {
        return Object.assign({}, DEFAULTS);
      }
    },
    get: function (key) {
      return this.getAll()[key];
    },
    set: function (key, value) {
      var all = this.getAll();
      all[key] = value;
      localStorage.setItem(PREFS_KEY, JSON.stringify(all));
    },
    reset: function () {
      localStorage.setItem(PREFS_KEY, JSON.stringify(DEFAULTS));
    }
  };

  /* ── Export ─────────────────────────────────────────── */

  window.RSS = window.RSS || {};
  window.RSS.db = {
    open: open,
    getAllCategories: getAllCategories,
    saveCategory: saveCategory,
    removeCategory: removeCategory,
    getAllFeeds: getAllFeeds,
    getFeedsByCategory: getFeedsByCategory,
    saveFeed: saveFeed,
    toggleFeedEnabled: toggleFeedEnabled,
    removeFeed: removeFeed,
    updateFeedMeta: updateFeedMeta,
    getFeedByUrl: getFeedByUrl,
    getArticles: getArticles,
    getArticleById: getArticleById,
    saveArticles: saveArticles,
    markRead: markRead,
    markAllRead: markAllRead,
    toggleStar: toggleStar,
    deleteOldArticles: deleteOldArticles,
    countArticles: countArticles,
    getUnreadCounts: getUnreadCounts,
    exportAllData: exportAllData,
    importAllData: importAllData,
    clearAllData: clearAllData
  };
  window.RSS.prefs = prefs;
})();
