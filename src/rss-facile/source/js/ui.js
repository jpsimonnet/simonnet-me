/**
 * ui.js — Rendu DOM : sidebar, liste d'articles, panneau de lecture, pagination.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)); };

  /* ── Ecran d'accueil ────────────────────────────────── */

  function showApp() {
    var el = $('#main-app');
    if (el) el.style.display = 'grid';
  }

  /* ── Sidebar ────────────────────────────────────────── */

  function renderSidebar(categories, feeds, unreadCounts) {
    var tree = $('#feed-tree');
    tree.innerHTML = '';
    unreadCounts = unreadCounts || { total: 0, byFeed: {}, byCategory: {} };

    // "Tous les articles"
    var allLi = document.createElement('li');
    allLi.className = 'fr-sidemenu__item';
    var allBadge = unreadCounts.total > 0
      ? ' <span class="fr-badge fr-badge--sm fr-badge--info feed-unread-badge">' + unreadCounts.total + '</span>'
      : '';
    allLi.innerHTML = '<a class="fr-sidemenu__link" href="#" data-view="all">'
      + 'Tous les articles' + allBadge + '</a>';
    tree.appendChild(allLi);

    categories.forEach(function (cat) {
      var catFeeds = feeds.filter(function (f) { return f.categoryId === cat.id; });
      catFeeds.sort(function (a, b) { return (a.title || '').localeCompare(b.title || ''); });
      if (catFeeds.length === 0) return;

      var li = document.createElement('li');
      li.className = 'fr-sidemenu__item';

      // Titre de categorie (cliquable pour filtrer)
      var catUnread = unreadCounts.byCategory[cat.id] || 0;
      var catBadge = catUnread > 0
        ? ' <span class="fr-badge fr-badge--sm fr-badge--info feed-unread-badge">' + catUnread + '</span>'
        : '';

      var btn = document.createElement('button');
      btn.className = 'fr-sidemenu__btn';
      btn.setAttribute('aria-expanded', cat.collapsed ? 'false' : 'true');
      btn.innerHTML = '<span class="fr-icon-folder-2-line fr-mr-1v" aria-hidden="true"></span>' + escHtml(cat.name) + catBadge;

      var collapse = document.createElement('div');
      collapse.style.display = cat.collapsed ? 'none' : '';

      // Toggle manuel (pas de fr-collapse pour eviter l'accordeon DSFR)
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        collapse.style.display = expanded ? 'none' : '';
      });

      var ul = document.createElement('ul');
      ul.className = 'fr-sidemenu__list';

      // Lien "tous" pour la categorie
      var catAllLi = document.createElement('li');
      catAllLi.className = 'fr-sidemenu__item';
      catAllLi.innerHTML = '<a class="fr-sidemenu__link" href="#" data-view="category:' + cat.id + '">Tous (' + catFeeds.length + ')</a>';
      ul.appendChild(catAllLi);

      catFeeds.forEach(function (feed) {
        var feedLi = document.createElement('li');
        feedLi.className = 'fr-sidemenu__item';
        var feedUnread = unreadCounts.byFeed[feed.id] || 0;
        var feedBadge = feedUnread > 0
          ? ' <span class="fr-badge fr-badge--sm feed-unread-badge">' + feedUnread + '</span>'
          : '';
        var feedIconHtml = feed.icon
          ? '<img class="feed-icon" src="' + escHtml(feed.icon) + '" alt="" width="16" height="16" loading="lazy" onerror="this.style.display=\'none\'">'
          : '';
        var errorHtml = feed.lastError
          ? ' <span class="fr-icon-warning-line feed-error-icon" aria-hidden="true" title="' + escHtml(feed.lastError) + '"></span>'
          : '';
        feedLi.innerHTML = '<a class="fr-sidemenu__link" href="#" data-view="feed:' + feed.id + '"'
          + ' title="' + escHtml(feed.title) + '">'
          + feedIconHtml + escHtml(truncate(feed.title, 30)) + errorHtml + feedBadge + '</a>';
        ul.appendChild(feedLi);
      });

      collapse.appendChild(ul);
      li.appendChild(btn);
      li.appendChild(collapse);
      tree.appendChild(li);
    });
  }

  function updateUnreadBadges(unreadCounts) {
    // Mettre a jour les badges sans reconstruire la sidebar
    $$('#feed-tree .fr-sidemenu__link').forEach(function (link) {
      var view = link.dataset.view;
      if (!view) return;
      var badge = link.querySelector('.feed-unread-badge');
      var count = 0;

      if (view === 'all') {
        count = unreadCounts.total || 0;
      } else if (view.startsWith('feed:')) {
        count = unreadCounts.byFeed[view.substring(5)] || 0;
      } else if (view.startsWith('category:')) {
        count = unreadCounts.byCategory[view.substring(9)] || 0;
      }

      if (count > 0) {
        if (badge) {
          badge.textContent = count;
        } else {
          var span = document.createElement('span');
          span.className = 'fr-badge fr-badge--sm fr-badge--info feed-unread-badge';
          span.textContent = count;
          link.appendChild(span);
        }
      } else if (badge) {
        badge.remove();
      }
    });

    // Badges des categories (sur les boutons)
    $$('#feed-tree .fr-sidemenu__btn').forEach(function (btn) {
      var collapse = btn.nextElementSibling;
      if (!collapse) return;
      var catLink = collapse.querySelector('[data-view^="category:"]');
      if (!catLink) return;
      var catId = catLink.dataset.view.substring(9);
      var count = unreadCounts.byCategory[catId] || 0;
      var badge = btn.querySelector('.feed-unread-badge');

      if (count > 0) {
        if (badge) {
          badge.textContent = count;
        } else {
          var span = document.createElement('span');
          span.className = 'fr-badge fr-badge--sm fr-badge--info feed-unread-badge';
          span.textContent = count;
          btn.appendChild(span);
        }
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function highlightActiveView(view) {
    $$('#feed-tree .fr-sidemenu__link').forEach(function (link) {
      if (link.dataset.view === view) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ── Populer le select de categories (modale ajout) ── */

  function populateCategorySelect(categories) {
    var sel = $('#new-feed-category');
    // Garder les 2 premieres options (Sans categorie + Nouvelle)
    while (sel.options.length > 2) sel.remove(sel.options.length - 1);
    // Inserer avant la derniere option (Nouvelle)
    categories.forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      sel.insertBefore(opt, sel.options[sel.options.length - 1]);
    });
  }

  /* ── Liste d'articles ───────────────────────────────── */

  function extractThumbnail(article) {
    // Priorite au champ thumbnail (media:content, media:thumbnail, enclosure)
    if (article.thumbnail) return article.thumbnail;
    // Sinon chercher la premiere image dans le contenu HTML
    var html = article.content || '';
    if (!html) return '';
    var match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && /^https?:\/\//i.test(match[1])) return match[1];
    return '';
  }

  function renderArticleList(articles, selectedId) {
    var container = $('#article-list');
    container.innerHTML = '';

    if (articles.length === 0) {
      container.innerHTML = '<div class="fr-callout fr-callout--brown-caramel fr-my-2w">'
        + '<p class="fr-callout__text">Aucun article à afficher. Cliquez sur « Actualiser » pour récupérer les flux.</p></div>';
      return;
    }

    articles.forEach(function (art) {
      var div = document.createElement('div');
      div.className = 'article-item'
        + (art.isRead ? ' article-item--read' : '')
        + (art.id === selectedId ? ' article-item--active' : '');
      div.setAttribute('role', 'article');
      div.setAttribute('tabindex', '0');
      div.dataset.articleId = art.id;

      var thumb = extractThumbnail(art);
      var thumbHtml = thumb
        ? '<img class="article-item__thumb" src="' + escHtml(thumb) + '" alt="" loading="lazy">'
        : '';

      var star = art.isStarred ? '<span class="fr-icon-star-fill fr-icon--sm" aria-label="Favori"></span> ' : '';
      div.innerHTML = thumbHtml
        + '<div class="article-item__body">'
        + '<div class="article-item__title">' + star + escHtml(art.title) + '</div>'
        + '<div class="article-item__meta">'
        + '<span class="fr-tag fr-tag--sm">' + escHtml(art.feedTitle || '') + '</span> '
        + '<time datetime="' + new Date(art.pubDate).toISOString() + '">' + formatDate(art.pubDate) + '</time>'
        + (art.author ? ' &mdash; ' + escHtml(art.author) : '')
        + '</div>'
        + '<div class="article-item__summary">' + escHtml(art.summary || '') + '</div>'
        + '</div>';
      container.appendChild(div);
    });
  }

  /* ── Pagination ─────────────────────────────────────── */

  function renderPagination(currentPage, totalPages) {
    var nav = $('#pagination-nav');
    var list = $('#pagination-list');

    if (totalPages <= 1) {
      nav.style.display = 'none';
      return;
    }

    nav.style.display = '';
    list.innerHTML = '';

    // Bouton precedent
    var prevLi = document.createElement('li');
    prevLi.innerHTML = '<a class="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"'
      + (currentPage <= 1 ? ' aria-disabled="true"' : ' href="#" data-page="' + (currentPage - 1) + '"')
      + '>Page précédente</a>';
    list.appendChild(prevLi);

    // Pages
    var start = Math.max(1, currentPage - 2);
    var end = Math.min(totalPages, currentPage + 2);

    for (var i = start; i <= end; i++) {
      var li = document.createElement('li');
      li.innerHTML = '<a class="fr-pagination__link" href="#" data-page="' + i + '"'
        + (i === currentPage ? ' aria-current="page"' : '') + '>' + i + '</a>';
      list.appendChild(li);
    }

    // Bouton suivant
    var nextLi = document.createElement('li');
    nextLi.innerHTML = '<a class="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"'
      + (currentPage >= totalPages ? ' aria-disabled="true"' : ' href="#" data-page="' + (currentPage + 1) + '"')
      + '>Page suivante</a>';
    list.appendChild(nextLi);
  }

  /* ── Panneau de lecture ─────────────────────────────── */

  function showArticle(article) {
    $('#reading-placeholder').style.display = 'none';
    $('#reading-content-wrap').style.display = 'block';

    $('#article-source').textContent = article.feedTitle || '';
    $('#article-title').textContent = article.title || 'Sans titre';
    $('#article-meta').innerHTML = '<time>' + formatDate(article.pubDate) + '</time>'
      + (article.author ? ' &mdash; ' + escHtml(article.author) : '');

    var content = RSS.sanitizer.sanitize(article.content || article.summary || '');

    // Ajouter l'image hero si thumbnail dispo et pas d'image dans le contenu
    var heroImg = '';
    var thumb = article.thumbnail || '';
    if (thumb && content.indexOf('<img') === -1) {
      heroImg = '<img src="' + escHtml(thumb) + '" alt="">';
    }

    $('#article-content').innerHTML = heroImg + (content || '<p class="fr-text--light">Aucun contenu disponible.</p>');

    $('#btn-open-original').href = article.link || '#';
    $('#btn-open-original').style.display = article.link ? '' : 'none';

    updateReadButton(article.isRead);
    updateStarButton(article.isStarred);

    // Responsive uniquement : activer le mode lecture
    if (window.innerWidth < 992) {
      var layout = $('.three-panel-layout');
      if (layout) layout.classList.add('reading-open');
    }

    // Scroll en haut du panneau
    var wrap = $('#reading-content-wrap');
    if (wrap) wrap.scrollTop = 0;
  }

  function clearReadingPane() {
    $('#reading-placeholder').style.display = '';
    $('#reading-content-wrap').style.display = 'none';
    $('#article-title').textContent = '';
    $('#article-meta').innerHTML = '';
    $('#article-content').innerHTML = '';
    $('#article-source').textContent = '';

    // Responsive : quitter le mode lecture
    var layout = $('.three-panel-layout');
    if (layout) layout.classList.remove('reading-open');
  }

  function updateReadButton(isRead) {
    var btn = $('#btn-toggle-read');
    var text = isRead ? 'Marquer comme non lu' : 'Marquer comme lu';
    btn.textContent = text;
    btn.className = isRead
      ? 'fr-btn fr-btn--sm fr-btn--tertiary fr-btn--icon-left fr-icon-mail-line fr-mb-0'
      : 'fr-btn fr-btn--sm fr-btn--tertiary fr-btn--icon-left fr-icon-mail-open-line fr-mb-0';
  }

  function updateStarButton(isStarred) {
    var btn = $('#btn-toggle-star');
    var text = isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris';
    btn.textContent = text;
    btn.className = isStarred
      ? 'fr-btn fr-btn--sm fr-btn--tertiary fr-btn--icon-left fr-icon-star-fill fr-mb-0'
      : 'fr-btn fr-btn--sm fr-btn--tertiary fr-btn--icon-left fr-icon-star-line fr-mb-0';
  }

  /* ── Statut et notifications ────────────────────────── */

  function setStatus(message) {
    $('#status-bar').textContent = message;
  }

  function showToast(message, type) {
    type = type || 'info';
    var container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }

  /* ── Progression (inline, non bloquante) ───────────── */

  function showProgress(show) {
    var el = $('#refresh-progress');
    if (el) el.style.display = show ? '' : 'none';
    if (show) {
      $('#progress-bar').style.width = '0%';
      $('#progress-text').textContent = 'Démarrage…';
      $('#progress-detail').textContent = '';
    }
  }

  function updateProgress(completed, total, feedTitle) {
    var pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    $('#progress-bar').style.width = pct + '%';
    $('#progress-text').textContent = completed + '/' + total + ' flux (' + pct + ' %)';
    $('#progress-detail').textContent = feedTitle || '';
  }

  /* ── Utilitaires ────────────────────────────────────── */

  function escHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function truncate(str, max) {
    if (!str || str.length <= max) return str || '';
    return str.substring(0, max) + '…';
  }

  function formatDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    var now = new Date();
    var diff = now - d;

    // Moins d'une heure
    if (diff < 3600000) {
      var mins = Math.floor(diff / 60000);
      return mins <= 1 ? 'À l\'instant' : 'Il y a ' + mins + ' min';
    }
    // Moins d'un jour
    if (diff < 86400000) {
      var hours = Math.floor(diff / 3600000);
      return 'Il y a ' + hours + 'h';
    }
    // Moins d'une semaine
    if (diff < 604800000) {
      var days = Math.floor(diff / 86400000);
      return 'Il y a ' + days + ' j';
    }
    // Plus ancien
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ── Page gestion des flux ─────────────────────────── */

  function showFeedSettings() {
    $('#main-app').style.display = 'none';
    var footer = document.querySelector('.fr-footer');
    if (footer) footer.style.display = 'none';
    $('#feed-settings-view').style.display = '';
    $('#preconfig-section').style.display = 'none';
  }

  function hideFeedSettings() {
    $('#feed-settings-view').style.display = 'none';
    $('#main-app').style.display = 'grid';
    var footer = document.querySelector('.fr-footer');
    if (footer) footer.style.display = '';
  }

  function renderFeedSettings(categories, feeds) {
    var container = $('#feed-settings-content');
    var html = '';

    // Filtrer les categories qui ont des feeds pour indexer correctement
    var visibleCats = categories.filter(function (cat) {
      return feeds.some(function (f) { return f.categoryId === cat.id; });
    });

    categories.forEach(function (cat) {
      var catFeeds = feeds.filter(function (f) { return f.categoryId === cat.id; });
      catFeeds.sort(function (a, b) { return (a.title || '').localeCompare(b.title || ''); });
      if (catFeeds.length === 0) return;

      var visibleIdx = visibleCats.indexOf(cat);
      var isFirst = visibleIdx === 0;
      var isLast = visibleIdx === visibleCats.length - 1;
      var enabledCount = catFeeds.filter(function (f) { return f.enabled !== false; }).length;

      html += '<div class="feed-settings-category">';
      html += '<div class="feed-settings-category__header">';
      html += '<div class="feed-settings-category__order">';
      html += '<button class="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-arrow-up-s-line fr-m-0"'
        + ' data-cat-move-up="' + cat.id + '"'
        + (isFirst ? ' disabled' : '') + ' title="Monter"></button>';
      html += '<button class="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-arrow-down-s-line fr-m-0"'
        + ' data-cat-move-down="' + cat.id + '"'
        + (isLast ? ' disabled' : '') + ' title="Descendre"></button>';
      html += '</div>';
      html += '<div class="fr-checkbox-group fr-checkbox-group--sm">';
      html += '<input type="checkbox" id="cat-check-' + cat.id + '" data-cat-toggle="' + cat.id + '"'
        + (enabledCount === catFeeds.length ? ' checked' : '') + '>';
      html += '<label class="fr-label" for="cat-check-' + cat.id + '"><span class="fr-icon-folder-2-line fr-mr-1v" aria-hidden="true"></span>' + escHtml(cat.name) + '</label>';
      html += '</div>';
      html += '<span class="feed-settings-category__count">' + enabledCount + '/' + catFeeds.length + ' actifs</span>';
      html += '</div>';

      html += '<table class="feed-settings-table">';
      catFeeds.forEach(function (feed) {
        var enabled = feed.enabled !== false;
        html += '<tr' + (enabled ? '' : ' class="feed-disabled"') + ' data-feed-row="' + feed.id + '">';
        html += '<td><div class="fr-checkbox-group fr-checkbox-group--sm">';
        html += '<input type="checkbox" id="feed-check-' + feed.id + '" data-feed-toggle="' + feed.id + '"'
          + (enabled ? ' checked' : '') + '>';
        html += '<label class="fr-label" for="feed-check-' + feed.id + '"></label>';
        html += '</div></td>';
        var iconHtml = feed.icon
          ? '<img class="feed-icon" src="' + escHtml(feed.icon) + '" alt="" width="16" height="16" loading="lazy" onerror="this.style.display=\'none\'"> '
          : '';
        html += '<td>' + iconHtml + escHtml(feed.title) + '<br><span class="feed-url">' + escHtml(feed.xmlUrl) + '</span></td>';
        html += '<td>';
        if (feed.htmlUrl) {
          var hostname = feed.htmlUrl;
          try { hostname = new URL(feed.htmlUrl).hostname; } catch (e) {}
          html += '<a href="' + escHtml(feed.htmlUrl) + '" target="_blank" rel="noopener noreferrer" '
            + 'class="fr-link fr-link--sm" title="Visiter le site">'
            + escHtml(hostname) + '</a>';
        }
        html += '</td>';
        html += '<td>'
          + '<button class="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-edit-line fr-m-0" '
          + 'data-feed-edit="' + feed.id + '" title="Modifier ce flux"></button>'
          + '<button class="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-delete-line fr-m-0" '
          + 'data-feed-delete="' + feed.id + '" title="Supprimer ce flux"></button>'
          + '</td>';
        html += '</tr>';
      });
      html += '</table>';
      html += '</div>';
    });

    // Flux sans categorie (personnels)
    var orphans = feeds.filter(function (f) {
      return !f.categoryId || !categories.some(function (c) { return c.id === f.categoryId; });
    });
    if (orphans.length > 0) {
      var enabledOrphans = orphans.filter(function (f) { return f.enabled !== false; }).length;
      html += '<div class="feed-settings-category">';
      html += '<div class="feed-settings-category__header">';
      html += '<div class="fr-checkbox-group fr-checkbox-group--sm">';
      html += '<input type="checkbox" id="cat-check-orphan" data-cat-toggle="orphan"'
        + (enabledOrphans === orphans.length ? ' checked' : '') + '>';
      html += '<label class="fr-label" for="cat-check-orphan"><span class="fr-icon-folder-2-line fr-mr-1v" aria-hidden="true"></span>Flux personnels</label>';
      html += '</div>';
      html += '<span class="feed-settings-category__count">' + enabledOrphans + '/' + orphans.length + ' actifs</span>';
      html += '</div>';

      html += '<table class="feed-settings-table">';
      orphans.forEach(function (feed) {
        var enabled = feed.enabled !== false;
        html += '<tr' + (enabled ? '' : ' class="feed-disabled"') + ' data-feed-row="' + feed.id + '">';
        html += '<td><div class="fr-checkbox-group fr-checkbox-group--sm">';
        html += '<input type="checkbox" id="feed-check-' + feed.id + '" data-feed-toggle="' + feed.id + '"'
          + (enabled ? ' checked' : '') + '>';
        html += '<label class="fr-label" for="feed-check-' + feed.id + '"></label>';
        html += '</div></td>';
        var iconHtml2 = feed.icon
          ? '<img class="feed-icon" src="' + escHtml(feed.icon) + '" alt="" width="16" height="16" loading="lazy" onerror="this.style.display=\'none\'"> '
          : '';
        html += '<td>' + iconHtml2 + escHtml(feed.title) + '<br><span class="feed-url">' + escHtml(feed.xmlUrl) + '</span></td>';
        html += '<td>';
        if (feed.htmlUrl) {
          var hostname2 = feed.htmlUrl;
          try { hostname2 = new URL(feed.htmlUrl).hostname; } catch (e) {}
          html += '<a href="' + escHtml(feed.htmlUrl) + '" target="_blank" rel="noopener noreferrer" '
            + 'class="fr-link fr-link--sm">' + escHtml(hostname2) + '</a>';
        }
        html += '</td>';
        html += '<td>'
          + '<button class="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-edit-line fr-m-0" '
          + 'data-feed-edit="' + feed.id + '" title="Modifier ce flux"></button>'
          + '<button class="fr-btn fr-btn--sm fr-btn--tertiary fr-icon-delete-line fr-m-0" '
          + 'data-feed-delete="' + feed.id + '" title="Supprimer ce flux"></button>'
          + '</td>';
        html += '</tr>';
      });
      html += '</table>';
      html += '</div>';
    }

    if (!html) {
      html = '<p class="fr-text--lg">Aucun flux configuré. Utilisez la sélection préconfigurée pour commencer.</p>';
    }

    container.innerHTML = html;
  }

  function renderPreconfigList(opmlFeeds, existingUrls) {
    var container = $('#preconfig-content');
    // Grouper par categorie
    var catMap = {};
    opmlFeeds.forEach(function (f) {
      var cat = f.categoryName || 'Sans catégorie';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(f);
    });

    var html = '';
    Object.keys(catMap).forEach(function (catName) {
      html += '<div class="preconfig-category">';
      html += '<p class="preconfig-category__title">' + escHtml(catName) + '</p>';
      catMap[catName].forEach(function (f) {
        var alreadyExists = existingUrls.indexOf(f.xmlUrl) !== -1;
        var uid = 'preconfig-' + btoa(f.xmlUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        html += '<div class="fr-checkbox-group fr-checkbox-group--sm">';
        html += '<input type="checkbox" id="' + uid + '" value="' + escHtml(f.xmlUrl) + '"'
          + ' data-preconfig-feed'
          + (alreadyExists ? ' checked disabled' : '') + '>';
        html += '<label class="fr-label" for="' + uid + '">' + escHtml(f.title)
          + (alreadyExists ? ' <em class="fr-text--xs">(déjà ajouté)</em>' : '') + '</label>';
        html += '</div>';
      });
      html += '</div>';
    });

    container.innerHTML = html;
  }

  /* ── File download ──────────────────────────────────── */

  function downloadFile(content, filename, mime) {
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ── Export ─────────────────────────────────────────── */

  window.RSS = window.RSS || {};
  window.RSS.ui = {
    showApp: showApp,
    renderSidebar: renderSidebar,
    updateUnreadBadges: updateUnreadBadges,
    highlightActiveView: highlightActiveView,
    populateCategorySelect: populateCategorySelect,
    renderArticleList: renderArticleList,
    renderPagination: renderPagination,
    showArticle: showArticle,
    clearReadingPane: clearReadingPane,
    updateReadButton: updateReadButton,
    updateStarButton: updateStarButton,
    setStatus: setStatus,
    showToast: showToast,
    showProgress: showProgress,
    updateProgress: updateProgress,
    showFeedSettings: showFeedSettings,
    hideFeedSettings: hideFeedSettings,
    renderFeedSettings: renderFeedSettings,
    renderPreconfigList: renderPreconfigList,
    downloadFile: downloadFile,
    escHtml: escHtml,
    formatDate: formatDate
  };
})();
