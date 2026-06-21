/**
 * app.js — Point d'entree, initialisation, evenements, orchestration.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)); };

  /* ── Etat global ────────────────────────────────────── */

  var state = {
    currentView: 'all',       // 'all' | 'feed:<id>' | 'category:<id>'
    currentFilter: 'all',     // 'all' | 'unread' | 'starred'
    currentPage: 1,
    searchQuery: '',
    selectedArticleId: null,
    isLoading: false
  };

  /* ── Initialisation ─────────────────────────────────── */

  window.addEventListener('DOMContentLoaded', function () {
    // Detecter le proxy PHP en parallele
    RSS.fetcher.init();

    // Toujours brancher les evenements, meme si le chargement des donnees echoue
    wireEvents();

    RSS.db.open().then(function () {
      return RSS.db.getAllCategories();
    }).then(function (cats) {
      if (cats.length === 0) {
        // Premier lancement : importer la selection preconfiguree
        return RSS.opml.loadBundled('selection.opml').then(function (data) {
          return importOPMLData(data);
        }).then(function () {
          return startApp();
        });
      } else {
        // Lancement normal
        RSS.ui.showApp();
        return refreshUI().then(function () {
          // Nettoyage des vieux articles
          var maxAge = RSS.prefs.get('maxArticleAgeDays');
          return RSS.db.deleteOldArticles(maxAge);
        });
      }
    }).catch(function (err) {
      console.error('Erreur initialisation :', err);
      RSS.ui.showToast('Erreur lors du chargement', 'error');
    });
  });

  function startApp() {
    RSS.ui.showApp();
    return refreshUI().then(function () {
      RSS.ui.showToast('Flux chargés ! Cliquez sur « Actualiser » pour récupérer les articles.', 'success');
    });
  }

  /* ── Import OPML → IndexedDB ────────────────────────── */

  function importOPMLData(data) {
    var catMap = {};
    var promises = [];

    // Creer les categories
    data.categories.forEach(function (catName, i) {
      var id = generateId();
      catMap[catName] = id;
      promises.push(RSS.db.saveCategory({
        id: id,
        name: catName,
        order: i,
        collapsed: false
      }));
    });

    // Assurer "Sans catégorie" existe
    if (!catMap['Sans catégorie']) {
      var scId = generateId();
      catMap['Sans catégorie'] = scId;
      promises.push(RSS.db.saveCategory({
        id: scId,
        name: 'Sans catégorie',
        order: 999,
        collapsed: false
      }));
    }

    return Promise.all(promises).then(function () {
      // Creer les flux (avec deduplication par URL)
      var feedPromises = [];
      var seenUrls = {};

      data.feeds.forEach(function (f) {
        if (!f.xmlUrl || seenUrls[f.xmlUrl]) return;
        seenUrls[f.xmlUrl] = true;

        feedPromises.push(RSS.db.saveFeed({
          id: generateId(),
          title: f.title,
          xmlUrl: f.xmlUrl,
          htmlUrl: f.htmlUrl || '',
          categoryId: catMap[f.categoryName] || catMap['Sans catégorie'],
          categoryName: f.categoryName || 'Sans catégorie',
          lastFetched: 0,
          lastError: null,
          articleCount: 0,
          unreadCount: 0
        }));
      });

      return Promise.all(feedPromises);
    });
  }

  /* ── Rafraichissement de l'UI ───────────────────────── */

  function refreshUI() {
    return Promise.all([
      RSS.db.getAllCategories(),
      RSS.db.getAllFeeds(),
      RSS.db.getUnreadCounts()
    ]).then(function (results) {
      var categories = results[0];
      var feeds = results[1];
      var unreadCounts = results[2];

      var activeFeeds = feeds.filter(function (f) { return f.enabled !== false; });
      RSS.ui.renderSidebar(categories, activeFeeds, unreadCounts);
      RSS.ui.highlightActiveView(state.currentView);
      RSS.ui.populateCategorySelect(categories);

      return refreshArticleList();
    });
  }

  function refreshArticleList() {
    return RSS.db.getAllFeeds().then(function (allFeeds) {
      var disabledIds = {};
      allFeeds.forEach(function (f) {
        if (f.enabled === false) disabledIds[f.id] = true;
      });

      var opts = {
        offset: (state.currentPage - 1) * RSS.prefs.get('articlesPerPage'),
        limit: RSS.prefs.get('articlesPerPage')
      };

      // Vue
      if (state.currentView.startsWith('feed:')) {
        opts.feedId = state.currentView.substring(5);
      } else if (state.currentView.startsWith('category:')) {
        opts.categoryId = state.currentView.substring(9);
      }

      // Filtre
      if (state.currentFilter === 'unread') {
        opts.isRead = false;
      } else if (state.currentFilter === 'starred') {
        opts.isStarred = true;
      }

      // Recherche
      if (state.searchQuery) {
        opts.search = state.searchQuery;
      }

      // Exclure les feeds desactives
      opts.excludeFeedIds = disabledIds;

      return RSS.db.getArticles(opts).then(function (result) {
        RSS.ui.renderArticleList(result.articles, state.selectedArticleId);

        var perPage = RSS.prefs.get('articlesPerPage');
        var totalPages = Math.ceil(result.total / perPage);
        RSS.ui.renderPagination(state.currentPage, totalPages);

        RSS.ui.setStatus(result.total + ' article' + (result.total > 1 ? 's' : ''));
      });
    });
  }

  /* ── Actualisation des flux ─────────────────────────── */

  function fetchAllFeeds() {
    if (state.isLoading) return;
    state.isLoading = true;

    RSS.db.getAllFeeds().then(function (allFeeds) {
      var feeds = allFeeds.filter(function (f) { return f.enabled !== false; });
      if (feeds.length === 0) {
        RSS.ui.showToast('Aucun flux actif à actualiser', 'info');
        state.isLoading = false;
        return;
      }

      RSS.ui.showProgress(true);
      RSS.ui.updateProgress(0, feeds.length, '');

      return RSS.fetcher.fetchAllFeeds(feeds, function (completed, total, title) {
        RSS.ui.updateProgress(completed, total, title);
      }).then(function (results) {
        RSS.ui.showProgress(false);

        var totalNew = 0;
        var errors = 0;
        var skipped = feeds.length - results.length; // flux ignores (annulation)
        var savePromises = [];

        results.forEach(function (r) {
          if (r.error || !r.parsed) {
            errors++;
            savePromises.push(RSS.db.updateFeedMeta(r.feed.id, {
              lastError: RSS.fetcher.friendlyError({ message: r.error || 'Erreur inconnue' }),
              lastFetched: Date.now()
            }));
            return;
          }

          var articles = r.parsed.articles.map(function (art) {
            return {
              id: r.feed.id + '::' + (art.guid || art.link || art.title),
              feedId: r.feed.id,
              feedTitle: r.feed.title || r.parsed.feed.title,
              categoryId: r.feed.categoryId,
              categoryName: r.feed.categoryName,
              guid: art.guid,
              title: art.title,
              link: art.link,
              author: art.author,
              pubDate: art.pubDate || Date.now(),
              summary: art.summary,
              content: art.content,
              thumbnail: art.thumbnail || '',
              isRead: false,
              isStarred: 0,
              fetchedAt: Date.now()
            };
          });

          totalNew += articles.length;
          savePromises.push(RSS.db.saveArticles(articles));
          savePromises.push(RSS.db.updateFeedMeta(r.feed.id, {
            lastFetched: Date.now(),
            lastError: null,
            articleCount: articles.length
          }));

          // Mettre a jour le titre du flux si manquant
          if (!r.feed.title || r.feed.title === r.feed.xmlUrl) {
            var newTitle = r.parsed.feed.title;
            if (newTitle) {
              savePromises.push(RSS.db.updateFeedMeta(r.feed.id, { title: newTitle }));
            }
          }

          // Sauver l'icone du flux (depuis le feed ou fallback favicon)
          var feedIcon = r.parsed.feed.icon || '';
          if (!feedIcon && r.feed.htmlUrl) {
            try {
              var origin = new URL(r.feed.htmlUrl).origin;
              feedIcon = origin + '/favicon.ico';
            } catch (e) {}
          }
          if (feedIcon && feedIcon !== r.feed.icon) {
            savePromises.push(RSS.db.updateFeedMeta(r.feed.id, { icon: feedIcon }));
          }
        });

        return Promise.all(savePromises).then(function () {
          var msg = totalNew + ' articles récupérés';
          if (errors > 0) msg += ' (' + errors + ' flux en erreur)';
          if (skipped > 0) msg += ' — Arrêté (' + skipped + ' flux restants)';
          RSS.ui.showToast(msg, errors > 0 || skipped > 0 ? 'info' : 'success');
          return refreshUI();
        });
      });
    }).catch(function (err) {
      console.error('Erreur actualisation :', err);
      RSS.ui.showProgress(false);
      RSS.ui.showToast('Erreur lors de l\'actualisation', 'error');
    }).finally(function () {
      state.isLoading = false;
    });
  }

  /* ── Evenements ─────────────────────────────────────── */

  function wireEvents() {
    // Actualiser
    $('#btn-refresh-all').addEventListener('click', fetchAllFeeds);

    // Sidebar : navigation par delegation
    $('#feed-tree').addEventListener('click', function (e) {
      var link = e.target.closest('[data-view]');
      if (!link) return;
      e.preventDefault();
      state.currentView = link.dataset.view;
      state.currentPage = 1;
      state.selectedArticleId = null;
      RSS.ui.clearReadingPane();
      RSS.ui.highlightActiveView(state.currentView);
      refreshArticleList();
    });

    // Liste d'articles : clic sur un article
    $('#article-list').addEventListener('click', function (e) {
      var item = e.target.closest('[data-article-id]');
      if (!item) return;
      selectArticle(item.dataset.articleId);
    });

    // Filtres
    $$('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.currentFilter = btn.dataset.filter;
        state.currentPage = 1;
        $$('[data-filter]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        refreshArticleList();
      });
    });

    // Recherche (debounce 300ms)
    var searchTimer;
    $('#search-input').addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.searchQuery = $('#search-input').value.trim();
        state.currentPage = 1;
        refreshArticleList();
      }, 300);
    });

    // Pagination
    $('#pagination-list').addEventListener('click', function (e) {
      var link = e.target.closest('[data-page]');
      if (!link || link.getAttribute('aria-disabled') === 'true') return;
      e.preventDefault();
      state.currentPage = parseInt(link.dataset.page, 10);
      refreshArticleList();
      var listEl = $('#article-list');
      if (listEl) listEl.scrollTop = 0;
    });

    // Tout marquer comme lu
    $('#btn-mark-all-read').addEventListener('click', function () {
      var opts = {};
      if (state.currentView.startsWith('feed:')) {
        opts.feedId = state.currentView.substring(5);
      } else if (state.currentView.startsWith('category:')) {
        opts.categoryId = state.currentView.substring(9);
      }
      RSS.db.markAllRead(opts).then(function () {
        RSS.ui.showToast('Articles marqués comme lus', 'success');
        return refreshUI();
      });
    });

    // Panneau de lecture : lu/non-lu
    $('#btn-toggle-read').addEventListener('click', function () {
      if (!state.selectedArticleId) return;
      RSS.db.getArticleById(state.selectedArticleId).then(function (art) {
        if (!art) return;
        return RSS.db.markRead(art.id, !art.isRead).then(function () {
          RSS.ui.updateReadButton(!art.isRead);
          return refreshUI();
        });
      });
    });

    // Panneau de lecture : favori
    $('#btn-toggle-star').addEventListener('click', function () {
      if (!state.selectedArticleId) return;
      RSS.db.toggleStar(state.selectedArticleId).then(function (isStarred) {
        RSS.ui.updateStarButton(isStarred);
        return refreshUI();
      });
    });

    // Annuler l'actualisation
    $('#btn-cancel-refresh').addEventListener('click', function () {
      RSS.fetcher.cancelFetch();
    });

    // Import OPML
    $('#btn-import-opml').addEventListener('click', function () {
      $('#opml-file-input').click();
    });
    $('#opml-file-input').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      readFileAsText(file).then(function (text) {
        var data = RSS.opml.parse(text);
        return importOPMLMerge(data);
      }).then(function (result) {
        RSS.ui.showToast(result.added + ' flux importés (' + result.skipped + ' doublons ignorés)', 'success');
        if ($('#feed-settings-view').style.display !== 'none') {
          openFeedSettings();
        }
        return refreshUI();
      }).catch(function (err) {
        RSS.ui.showToast('Erreur import OPML : ' + err.message, 'error');
      });
      this.value = '';
    });

    // Export OPML
    $('#btn-export-opml').addEventListener('click', function () {
      Promise.all([RSS.db.getAllCategories(), RSS.db.getAllFeeds()]).then(function (results) {
        var xml = RSS.opml.generate(results[0], results[1]);
        var date = new Date().toISOString().substring(0, 10);
        RSS.ui.downloadFile(xml, 'veille-rss-' + date + '.opml', 'text/xml');
        RSS.ui.showToast('OPML exporté', 'success');
      });
    });

    // Modale ajout de flux : categorie "Nouvelle"
    $('#new-feed-category').addEventListener('change', function () {
      $('#new-category-group').style.display =
        this.value === '__new__' ? '' : 'none';
    });

    // Ajouter un flux
    $('#btn-confirm-add-feed').addEventListener('click', handleAddFeed);

    // Ajouter une categorie
    $('#btn-add-category').addEventListener('click', function () {
      openModal('add-category-modal');
    });
    $('#btn-confirm-add-category').addEventListener('click', function () {
      var name = $('#add-category-name').value.trim();
      if (!name) {
        RSS.ui.showToast('Veuillez saisir un nom', 'error');
        return;
      }
      RSS.db.getAllCategories().then(function (cats) {
        return RSS.db.saveCategory({
          id: generateId(),
          name: name,
          order: cats.length,
          collapsed: false
        });
      }).then(function () {
        RSS.ui.showToast('Catégorie ajoutée', 'success');
        $('#add-category-name').value = '';
        closeModal('add-category-modal');
        openFeedSettings();
        return refreshUI();
      });
    });

    // Importer flux TXT
    $('#btn-import-txt').addEventListener('click', function () {
      // Peupler le select des categories
      RSS.db.getAllCategories().then(function (cats) {
        var select = $('#import-txt-category');
        select.innerHTML = '<option value="">Sans catégorie</option>';
        cats.forEach(function (c) {
          select.innerHTML += '<option value="' + c.id + '">' + RSS.ui.escHtml(c.name) + '</option>';
        });
        select.innerHTML += '<option value="__new__">+ Nouvelle catégorie</option>';
      });
      openModal('import-txt-modal');
    });
    $('#import-txt-category').addEventListener('change', function () {
      $('#import-txt-new-cat-group').style.display =
        this.value === '__new__' ? '' : 'none';
    });
    $('#btn-import-txt-file').addEventListener('click', function () {
      $('#txt-file-input').click();
    });
    $('#txt-file-input').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      readFileAsText(file).then(function (text) {
        $('#import-txt-content').value = text;
      });
      this.value = '';
    });
    $('#btn-confirm-import-txt').addEventListener('click', handleImportTxt);

    // Tout supprimer
    $('#btn-delete-all-feeds').addEventListener('click', function () {
      if (!confirm('Supprimer tous les flux et tous les articles ? Cette action est irréversible.')) return;
      RSS.db.clearAllData().then(function () {
        RSS.ui.showToast('Toutes les données supprimées', 'success');
        openFeedSettings();
        return refreshUI();
      });
    });

    // Editer un flux (delegation)
    $('#feed-settings-view').addEventListener('click', function (e) {
      var editBtn = e.target.closest('[data-feed-edit]');
      if (!editBtn) return;
      var feedId = editBtn.dataset.feedEdit;
      RSS.db.getAllFeeds().then(function (feeds) {
        var feed = feeds.filter(function (f) { return f.id === feedId; })[0];
        if (!feed) return;
        $('#edit-feed-id').value = feed.id;
        $('#edit-feed-title').value = feed.title || '';
        $('#edit-feed-url').value = feed.xmlUrl || '';
        $('#edit-feed-site').value = feed.htmlUrl || '';
        // Peupler le select categorie
        return RSS.db.getAllCategories().then(function (cats) {
          var select = $('#edit-feed-category');
          select.innerHTML = '<option value="">Sans catégorie</option>';
          cats.forEach(function (c) {
            var sel = c.id === feed.categoryId ? ' selected' : '';
            select.innerHTML += '<option value="' + c.id + '"' + sel + '>' + RSS.ui.escHtml(c.name) + '</option>';
          });
          openModal('edit-feed-modal');
        });
      });
    });
    $('#btn-confirm-edit-feed').addEventListener('click', function () {
      var feedId = $('#edit-feed-id').value;
      var title = $('#edit-feed-title').value.trim();
      var xmlUrl = $('#edit-feed-url').value.trim();
      var htmlUrl = $('#edit-feed-site').value.trim();
      var catId = $('#edit-feed-category').value;
      var catName = '';
      if (catId) {
        var opt = $('#edit-feed-category').selectedOptions[0];
        if (opt) catName = opt.textContent;
      }
      if (!xmlUrl) {
        RSS.ui.showToast('L\'URL du flux est obligatoire', 'error');
        return;
      }
      RSS.db.getAllFeeds().then(function (feeds) {
        var feed = feeds.filter(function (f) { return f.id === feedId; })[0];
        if (!feed) return;
        feed.title = title || feed.title;
        feed.xmlUrl = xmlUrl;
        feed.htmlUrl = htmlUrl;
        feed.categoryId = catId;
        feed.categoryName = catName;
        return RSS.db.saveFeed(feed);
      }).then(function () {
        RSS.ui.showToast('Flux modifié', 'success');
        closeModal('edit-feed-modal');
        openFeedSettings();
        return refreshUI();
      });
    });

    // Reglages
    $('#btn-backup').addEventListener('click', function () {
      RSS.db.exportAllData().then(function (json) {
        var date = new Date().toISOString().substring(0, 10);
        RSS.ui.downloadFile(json, 'rss-backup-' + date + '.json', 'application/json');
        RSS.ui.showToast('Sauvegarde téléchargée', 'success');
      });
    });

    $('#btn-restore').addEventListener('click', function () {
      $('#restore-file-input').click();
    });

    $('#restore-file-input').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      readFileAsText(file).then(function (text) {
        return RSS.db.importAllData(text);
      }).then(function () {
        RSS.ui.showToast('Données restaurées', 'success');
        return refreshUI();
      }).catch(function (err) {
        RSS.ui.showToast('Erreur restauration : ' + err.message, 'error');
      });
      this.value = '';
    });

    $('#btn-clear-data').addEventListener('click', function () {
      if (!confirm('Effacer toutes les données ? Cette action est irréversible.')) return;
      RSS.db.clearAllData().then(function () {
        RSS.ui.showToast('Données effacées', 'success');
        location.reload();
      });
    });

    // Gestion des flux (page plein ecran)
    $('#btn-feed-settings').addEventListener('click', function () {
      openFeedSettings();
    });

    $('#btn-back-from-settings').addEventListener('click', function () {
      RSS.ui.hideFeedSettings();
      refreshUI();
    });

    // Delegation sur la page reglages
    $('#feed-settings-view').addEventListener('change', function (e) {
      var feedToggle = e.target.dataset.feedToggle;
      if (feedToggle) {
        RSS.db.toggleFeedEnabled(feedToggle, e.target.checked).then(function () {
          // Mettre a jour le compteur de la categorie et la ligne
          var row = e.target.closest('tr');
          if (row) row.className = e.target.checked ? '' : 'feed-disabled';
          updateCategoryCounts();
        });
        return;
      }

      var catToggle = e.target.dataset.catToggle;
      if (catToggle) {
        var checked = e.target.checked;
        var container = e.target.closest('.feed-settings-category');
        var feedCheckboxes = container.querySelectorAll('[data-feed-toggle]');
        var promises = [];
        feedCheckboxes.forEach(function (cb) {
          cb.checked = checked;
          var row = cb.closest('tr');
          if (row) row.className = checked ? '' : 'feed-disabled';
          promises.push(RSS.db.toggleFeedEnabled(cb.dataset.feedToggle, checked));
        });
        Promise.all(promises).then(function () {
          updateCategoryCounts();
        });
        return;
      }
    });

    $('#feed-settings-view').addEventListener('click', function (e) {
      var deleteBtn = e.target.closest('[data-feed-delete]');
      if (deleteBtn) {
        var feedId = deleteBtn.dataset.feedDelete;
        if (!confirm('Supprimer ce flux et tous ses articles ?')) return;
        RSS.db.removeFeed(feedId).then(function () {
          var row = document.querySelector('[data-feed-row="' + feedId + '"]');
          if (row) row.remove();
          updateCategoryCounts();
          RSS.ui.showToast('Flux supprimé', 'success');
        });
        return;
      }

      var moveUp = e.target.closest('[data-cat-move-up]');
      var moveDown = e.target.closest('[data-cat-move-down]');
      if (moveUp || moveDown) {
        var catId = moveUp ? moveUp.dataset.catMoveUp : moveDown.dataset.catMoveDown;
        var direction = moveUp ? -1 : 1;
        moveCategoryOrder(catId, direction);
      }
    });

    // Revenir aux flux par defaut
    $('#btn-load-preconfig').addEventListener('click', function () {
      if (!confirm('Supprimer tous les flux actuels et réimporter la sélection par défaut ?')) return;
      RSS.db.clearAllData().then(function () {
        return RSS.opml.loadBundled('selection.opml');
      }).then(function (data) {
        return importOPMLData(data);
      }).then(function () {
        RSS.ui.showToast('Flux par défaut restaurés', 'success');
        openFeedSettings();
        return refreshUI();
      }).catch(function (err) {
        RSS.ui.showToast('Erreur : ' + err.message, 'error');
      });
    });

    // Sauver les preferences au changement
    $('#pref-articles-per-page').addEventListener('change', function () {
      RSS.prefs.set('articlesPerPage', parseInt(this.value, 10) || 25);
      refreshArticleList();
    });

    $('#pref-max-age').addEventListener('change', function () {
      RSS.prefs.set('maxArticleAgeDays', parseInt(this.value, 10) || 90);
    });

    // Charger les preferences dans les inputs
    $('#pref-articles-per-page').value = RSS.prefs.get('articlesPerPage');
    $('#pref-max-age').value = RSS.prefs.get('maxArticleAgeDays');

    // Navigation clavier
    document.addEventListener('keydown', handleKeyboard);

    // Colonnes redimensionnables
    initResizablePanels();
  }

  /* ── Selection d'un article ─────────────────────────── */

  function selectArticle(articleId) {
    state.selectedArticleId = articleId;
    RSS.db.getArticleById(articleId).then(function (art) {
      if (!art) return;
      RSS.ui.showArticle(art);
      // Marquer comme lu sans reconstruire la sidebar
      if (!art.isRead) {
        return RSS.db.markRead(art.id, true).then(function () {
          return RSS.db.getUnreadCounts().then(function (counts) {
            RSS.ui.updateUnreadBadges(counts);
          });
        });
      }
    });
  }

  /* ── Page gestion des flux ─────────────────────────── */

  function openFeedSettings() {
    Promise.all([RSS.db.getAllCategories(), RSS.db.getAllFeeds()]).then(function (results) {
      RSS.ui.renderFeedSettings(results[0], results[1]);
      RSS.ui.populateCategorySelect(results[0]);
      RSS.ui.showFeedSettings();
    });
  }

  function moveCategoryOrder(catId, direction) {
    RSS.db.getAllCategories().then(function (categories) {
      var idx = -1;
      for (var i = 0; i < categories.length; i++) {
        if (categories[i].id === catId) { idx = i; break; }
      }
      if (idx === -1) return;
      var targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= categories.length) return;

      // Echanger les ordres
      var tmpOrder = categories[idx].order;
      categories[idx].order = categories[targetIdx].order;
      categories[targetIdx].order = tmpOrder;

      return Promise.all([
        RSS.db.saveCategory(categories[idx]),
        RSS.db.saveCategory(categories[targetIdx])
      ]).then(function () {
        openFeedSettings();
      });
    });
  }

  function updateCategoryCounts() {
    // Mettre a jour les compteurs X/Y actifs dans chaque categorie
    var sections = document.querySelectorAll('.feed-settings-category');
    sections.forEach(function (section) {
      var checkboxes = section.querySelectorAll('[data-feed-toggle]');
      var total = checkboxes.length;
      var enabled = 0;
      checkboxes.forEach(function (cb) { if (cb.checked) enabled++; });
      var countEl = section.querySelector('.feed-settings-category__count');
      if (countEl) countEl.textContent = enabled + '/' + total + ' actifs';
      // Mettre a jour la checkbox categorie
      var catCb = section.querySelector('[data-cat-toggle]');
      if (catCb) catCb.checked = (enabled === total);
    });
  }

  /* ── Import OPML avec fusion (pas de doublons) ──────── */

  function importOPMLMerge(data) {
    var added = 0;
    var skipped = 0;

    return RSS.db.getAllCategories().then(function (existingCats) {
      var catMap = {};
      existingCats.forEach(function (c) { catMap[c.name] = c.id; });

      var catPromises = [];
      data.categories.forEach(function (catName, i) {
        if (!catMap[catName]) {
          var id = generateId();
          catMap[catName] = id;
          catPromises.push(RSS.db.saveCategory({
            id: id,
            name: catName,
            order: existingCats.length + i,
            collapsed: false
          }));
        }
      });

      return Promise.all(catPromises).then(function () { return catMap; });
    }).then(function (catMap) {
      var feedPromises = [];

      data.feeds.forEach(function (f) {
        if (!f.xmlUrl) return;
        feedPromises.push(
          RSS.db.getFeedByUrl(f.xmlUrl).then(function (existing) {
            if (existing) {
              skipped++;
              return;
            }
            added++;
            return RSS.db.saveFeed({
              id: generateId(),
              title: f.title,
              xmlUrl: f.xmlUrl,
              htmlUrl: f.htmlUrl || '',
              categoryId: catMap[f.categoryName] || catMap['Sans catégorie'] || '',
              categoryName: f.categoryName || 'Sans catégorie',
              lastFetched: 0,
              lastError: null,
              articleCount: 0,
              unreadCount: 0
            });
          })
        );
      });

      return Promise.all(feedPromises);
    }).then(function () {
      return { added: added, skipped: skipped };
    });
  }

  /* ── Ajout d'un flux ────────────────────────────────── */

  function handleImportTxt() {
    var text = $('#import-txt-content').value.trim();
    if (!text) {
      RSS.ui.showToast('Veuillez saisir ou importer des URLs', 'error');
      return;
    }

    var urls = text.split('\n').map(function (l) { return l.trim(); }).filter(function (l) {
      return l && /^https?:\/\//i.test(l);
    });

    if (urls.length === 0) {
      RSS.ui.showToast('Aucune URL valide trouvée', 'error');
      return;
    }

    var catSelect = $('#import-txt-category');
    var catId = catSelect.value;
    var catName = '';

    var catPromise;
    if (catId === '__new__') {
      catName = $('#import-txt-new-cat').value.trim();
      if (!catName) {
        RSS.ui.showToast('Veuillez saisir un nom de catégorie', 'error');
        return;
      }
      var newCatId = generateId();
      catPromise = RSS.db.getAllCategories().then(function (cats) {
        return RSS.db.saveCategory({
          id: newCatId, name: catName, order: cats.length, collapsed: false
        }).then(function () { return { id: newCatId, name: catName }; });
      });
    } else if (catId) {
      catName = catSelect.selectedOptions[0] ? catSelect.selectedOptions[0].textContent : '';
      catPromise = Promise.resolve({ id: catId, name: catName });
    } else {
      catPromise = Promise.resolve({ id: '', name: '' });
    }

    catPromise.then(function (cat) {
      var added = 0;
      var skipped = 0;
      var promises = [];
      return RSS.db.getAllFeeds().then(function (existingFeeds) {
        var existingUrls = {};
        existingFeeds.forEach(function (f) { existingUrls[f.xmlUrl] = true; });

        urls.forEach(function (url) {
          if (existingUrls[url]) {
            skipped++;
            return;
          }
          added++;
          promises.push(RSS.db.saveFeed({
            id: generateId(),
            title: url,
            xmlUrl: url,
            htmlUrl: '',
            categoryId: cat.id,
            categoryName: cat.name,
            lastFetched: 0,
            lastError: null,
            articleCount: 0,
            unreadCount: 0
          }));
        });

        return Promise.all(promises).then(function () {
          RSS.ui.showToast(added + ' flux ajoutés (' + skipped + ' doublons ignorés)', 'success');
          $('#import-txt-content').value = '';
          closeModal('import-txt-modal');
          openFeedSettings();
          return refreshUI();
        });
      });
    }).catch(function (err) {
      RSS.ui.showToast('Erreur : ' + err.message, 'error');
    });
  }

  function handleAddFeed() {
    var url = $('#new-feed-url').value.trim();
    if (!url) {
      RSS.ui.showToast('Veuillez saisir une URL', 'error');
      return;
    }

    var catSelect = $('#new-feed-category');
    var catId = catSelect.value;
    var catName = '';

    var promise;

    if (catId === '__new__') {
      catName = $('#new-category-name').value.trim();
      if (!catName) {
        RSS.ui.showToast('Veuillez saisir un nom de catégorie', 'error');
        return;
      }
      var newCatId = generateId();
      promise = RSS.db.saveCategory({
        id: newCatId,
        name: catName,
        order: 100,
        collapsed: false
      }).then(function () { return { id: newCatId, name: catName }; });
    } else if (catId) {
      promise = Promise.resolve({ id: catId, name: catSelect.options[catSelect.selectedIndex].textContent });
    } else {
      promise = Promise.resolve({ id: '', name: 'Sans catégorie' });
    }

    promise.then(function (cat) {
      return RSS.db.getFeedByUrl(url).then(function (existing) {
        if (existing) {
          RSS.ui.showToast('Ce flux existe déjà', 'error');
          return;
        }
        return RSS.db.saveFeed({
          id: generateId(),
          title: url,
          xmlUrl: url,
          htmlUrl: '',
          categoryId: cat.id,
          categoryName: cat.name,
          lastFetched: 0,
          lastError: null,
          articleCount: 0,
          unreadCount: 0
        }).then(function () {
          RSS.ui.showToast('Flux ajouté', 'success');
          $('#new-feed-url').value = '';
          $('#new-category-name').value = '';
          // Fermer la modale
          closeModal('add-feed-modal');
          // Rafraichir la page reglages si ouverte
          if ($('#feed-settings-view').style.display !== 'none') {
            openFeedSettings();
          }
          return refreshUI();
        });
      });
    }).catch(function (err) {
      RSS.ui.showToast('Erreur : ' + err.message, 'error');
    });
  }

  /* ── Navigation clavier ─────────────────────────────── */

  function handleKeyboard(e) {
    // Ne pas intercepter dans les inputs
    if (e.target.matches('input, textarea, select')) return;

    var articles = $$('[data-article-id]');
    if (articles.length === 0) return;

    var currentIndex = -1;
    if (state.selectedArticleId) {
      currentIndex = articles.findIndex(function (el) {
        return el.dataset.articleId === state.selectedArticleId;
      });
    }

    switch (e.key) {
      case 'j': // Article suivant
        e.preventDefault();
        if (currentIndex < articles.length - 1) {
          selectArticle(articles[currentIndex + 1].dataset.articleId);
        }
        break;
      case 'k': // Article precedent
        e.preventDefault();
        if (currentIndex > 0) {
          selectArticle(articles[currentIndex - 1].dataset.articleId);
        }
        break;
      case 'r': // Toggle lu/non-lu
        e.preventDefault();
        if (state.selectedArticleId) {
          $('#btn-toggle-read').click();
        }
        break;
      case 's': // Toggle favori
        e.preventDefault();
        if (state.selectedArticleId) {
          $('#btn-toggle-star').click();
        }
        break;
      case 'o': // Ouvrir l'original
        e.preventDefault();
        if (state.selectedArticleId) {
          var link = $('#btn-open-original');
          if (link.href && link.href !== '#') window.open(link.href, '_blank');
        }
        break;
      case 'Escape': // Fermer le panneau de lecture
        if (state.selectedArticleId) {
          state.selectedArticleId = null;
          RSS.ui.clearReadingPane();
          refreshArticleList();
        }
        break;
    }
  }

  /* ── Utilitaires modales DSFR ──────────────────────── */

  function openModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (typeof dsfr === 'function') {
      try { dsfr(el).modal.disclose(); return; } catch (e) {}
    }
    if (el.showModal) el.showModal();
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (typeof dsfr === 'function') {
      try { dsfr(el).modal.conceal(); return; } catch (e) {}
    }
    if (el.close) el.close();
  }

  /* ── Utilitaires ────────────────────────────────────── */

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsText(file);
    });
  }

  /* ── Redimensionnement des colonnes ────────────────── */

  function initResizablePanels() {
    var layout = $('#main-app');
    var divider1 = $('#divider-1');
    var divider2 = $('#divider-2');
    if (!layout || !divider1 || !divider2) return;

    // Charger les tailles sauvegardees
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('rss_panel_widths')); } catch (e) {}
    if (saved && saved.col1 && saved.col3) {
      layout.style.gridTemplateColumns = saved.col1 + 'px 4px ' + saved.col3 + 'px 4px 1fr';
    }

    function startDrag(dividerIndex, e) {
      e.preventDefault();
      var startX = e.clientX;
      var cols = layout.style.gridTemplateColumns || getComputedStyle(layout).gridTemplateColumns;
      var parts = cols.split(/\s+/).map(parseFloat);
      // parts: [col1, 4, col3, 4, col5]
      var startCol1 = parts[0];
      var startCol3 = parts[2];

      dividerIndex === 1 ? divider1.classList.add('panel-divider--active')
                         : divider2.classList.add('panel-divider--active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      function onMove(ev) {
        var dx = ev.clientX - startX;
        var newCol1 = startCol1;
        var newCol3 = startCol3;

        if (dividerIndex === 1) {
          newCol1 = Math.max(180, Math.min(500, startCol1 + dx));
        } else {
          newCol3 = Math.max(250, Math.min(800, startCol3 + dx));
        }

        layout.style.gridTemplateColumns = newCol1 + 'px 4px ' + newCol3 + 'px 4px 1fr';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        divider1.classList.remove('panel-divider--active');
        divider2.classList.remove('panel-divider--active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Sauvegarder
        var finalCols = layout.style.gridTemplateColumns.split(/\s+/).map(parseFloat);
        localStorage.setItem('rss_panel_widths', JSON.stringify({
          col1: finalCols[0], col3: finalCols[2]
        }));
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }

    divider1.addEventListener('mousedown', function (e) { startDrag(1, e); });
    divider2.addEventListener('mousedown', function (e) { startDrag(2, e); });
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, delay);
    };
  }
})();
