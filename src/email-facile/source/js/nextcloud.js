'use strict';

/**
 * nextcloud.js — Import de newsletters depuis un dossier Nextcloud partagé
 *
 * Les images sont embarquées en data URI directement dans le HTML
 * pour être autonomes (pas de dépendance à un serveur externe).
 */

(function () {

  const NC_URL_KEY = 'newsletter_nc_url';

  let zipCache = null;
  let zipFiles = {};

  // Restaurer l'URL sauvegardée
  const savedUrl = localStorage.getItem(NC_URL_KEY);
  if (savedUrl) {
    document.getElementById('nc-url').value = savedUrl;
  }

  // ── Convertir SVG en PNG data URI via canvas (Gmail bloque les SVG) ──
  function svgToPng(svgText) {
    return new Promise(function(resolve, reject) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(svgText, 'image/svg+xml');
      var svg = doc.documentElement;
      var vb = svg.getAttribute('viewBox');
      var w = 1500, h = 400;
      if (vb) {
        var parts = vb.split(/[\s,]+/);
        if (parts.length >= 4) {
          var vbW = parseFloat(parts[2]), vbH = parseFloat(parts[3]);
          if (vbW > 0 && vbH > 0) { h = Math.round(w * vbH / vbW); }
        }
      }
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      var serialized = new XMLSerializer().serializeToString(svg);
      var blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = function() { URL.revokeObjectURL(img.src); reject(new Error('SVG to PNG failed')); };
      img.src = URL.createObjectURL(blob);
    });
  }

  // ── Convertir un fichier DOCX (ArrayBuffer) en Markdown via mammoth + Turndown ──
  async function docxToMarkdown(arrayBuffer) {
    if (typeof mammoth === 'undefined') {
      throw new Error('La bibliothèque mammoth.js est introuvable.');
    }
    if (typeof TurndownService === 'undefined') {
      throw new Error('La bibliothèque turndown.js est introuvable.');
    }
    var result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
    if (result.messages && result.messages.length > 0) {
      console.info('[nextcloud] Avertissements mammoth:', result.messages);
    }

    // Supprimer les ancres bookmark vides (<a id="..."></a>) AVANT le parsing HTML :
    // dans le DOCX, les bookmarks sont imbriqués dans les hyperliens, ce qui produit
    // des <a> imbriqués invalides — le navigateur ferme alors le lien externe en premier,
    // laissant une ancre <a href> vide et le texte en dehors.
    var htmlStr = result.value.replace(/<a\s+id="[^"]*"\s*><\/a>/gi, '');

    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlStr;

    // Corriger les ancres vides résiduelles : <a href="url"></a>Texte → <a href="url">Texte</a>
    tempDiv.querySelectorAll('a[href]').forEach(function(a) {
      if (!a.textContent.trim()) {
        var next = a.nextSibling;
        if (next && next.nodeType === Node.TEXT_NODE && next.textContent.trim()) {
          a.textContent = next.textContent.trim();
          next.textContent = '';
        }
      }
    });

    // Aplatir les <p> à l'intérieur des cellules de tableau (td/th)
    // mammoth enveloppe le contenu de chaque cellule dans un <p>, ce qui
    // produit des sauts de ligne parasites dans le Markdown généré par Turndown
    tempDiv.querySelectorAll('td, th').forEach(function(cell) {
      var paras = cell.querySelectorAll('p');
      if (paras.length === 1) {
        cell.innerHTML = paras[0].innerHTML.trim();
      } else if (paras.length > 1) {
        cell.innerHTML = Array.from(paras).map(function(p) {
          return p.innerHTML.trim();
        }).filter(Boolean).join('<br>');
      }
    });

    // Convertir les marqueurs d'alerte et citations via le DOM
    // Gère 2 cas : marqueurs sur ligne séparée OU inline dans le même <p>
    // Ex: <p>[ATTENTION]Texte ici.[/ATTENTION]</p>  ou  <p>[INFO]</p> ... <p>[/INFO]</p>
    var alertMap = { 'INFO': 'info', 'SUCCES': 'success', 'ATTENTION': 'warn', 'ERREUR': 'error' };
    var alertTypes = 'INFO|SUCCES|ATTENTION|ERREUR';
    var inlineAlertRe = new RegExp('^\\[(' + alertTypes + ')\\]([\\s\\S]*?)\\[\\/\\1\\]$');

    Array.from(tempDiv.querySelectorAll('p')).forEach(function(p) {
      var text = p.textContent.trim();

      // Cas 1 : tout dans un seul <p> → [TYPE]contenu[/TYPE]
      var inlineMatch = text.match(inlineAlertRe);
      if (inlineMatch) {
        var wrapper = document.createDocumentFragment();
        var open = document.createElement('p');
        open.textContent = '::: ' + alertMap[inlineMatch[1]];
        var body = document.createElement('p');
        body.textContent = inlineMatch[2].trim();
        var close = document.createElement('p');
        close.textContent = ':::';
        wrapper.appendChild(open);
        wrapper.appendChild(body);
        wrapper.appendChild(close);
        p.parentNode.replaceChild(wrapper, p);
        return;
      }

      // Cas 2 : marqueur seul sur sa ligne
      var openMatch = text.match(new RegExp('^\\[(' + alertTypes + ')\\]$'));
      if (openMatch) { p.textContent = '::: ' + alertMap[openMatch[1]]; return; }
      var closeMatch = text.match(new RegExp('^\\[\\/(' + alertTypes + ')\\]$'));
      if (closeMatch) { p.textContent = ':::'; return; }

      // Citations inline : [CITATION]contenu[/CITATION]
      var citInline = text.match(/^\[CITATION\]([\s\S]*?)\[\/CITATION\]$/);
      if (citInline) {
        var bq = document.createElement('blockquote');
        var bp = document.createElement('p');
        bp.textContent = citInline[1].trim();
        bq.appendChild(bp);
        p.parentNode.replaceChild(bq, p);
        return;
      }
    });

    // Citations multi-<p> : <p>[CITATION]</p> ... <p>[/CITATION]</p>
    var paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    for (var ci = 0; ci < paragraphs.length; ci++) {
      if (paragraphs[ci].textContent.trim() === '[CITATION]') {
        var openP = paragraphs[ci];
        for (var cj = ci + 1; cj < paragraphs.length; cj++) {
          if (paragraphs[cj].textContent.trim() === '[/CITATION]') {
            var closeP = paragraphs[cj];
            var bq = document.createElement('blockquote');
            var next = openP.nextSibling;
            while (next && next !== closeP) {
              var toMove = next;
              next = next.nextSibling;
              bq.appendChild(toMove);
            }
            openP.parentNode.insertBefore(bq, openP);
            openP.remove();
            closeP.remove();
            break;
          }
        }
      }
    }

    var fixedHtml = tempDiv.innerHTML;

    var td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*' });
    if (typeof turndownPluginGfm !== 'undefined') {
      td.use(turndownPluginGfm.tables);
    }
    return td.turndown(fixedHtml);
  }

  // ── Fonction commune : charger un ZIP (blob) ──
  async function loadZipBlob(blob) {
    var zip = await JSZip.loadAsync(blob);
    zipCache = zip;
    zipFiles = {};

    zip.forEach(function (relativePath, entry) {
      if (!entry.dir) {
        zipFiles[relativePath] = entry;
      }
    });

    var importableFiles = Object.keys(zipFiles).filter(function (p) {
      return (/\.md$/i.test(p) || /\.docx$/i.test(p)) && !p.startsWith('.');
    }).sort();

    if (importableFiles.length === 0) {
      document.getElementById('nc-status').textContent = 'Aucun fichier Markdown ou DOCX trouvé dans le dossier.';
      document.getElementById('nc-file-picker').style.display = 'none';
      return;
    }

    var mdCount = importableFiles.filter(function (p) { return /\.md$/i.test(p); }).length;
    var docxCount = importableFiles.filter(function (p) { return /\.docx$/i.test(p); }).length;

    var select = document.getElementById('nc-file-select');
    select.innerHTML = '';
    importableFiles.forEach(function (path) {
      var opt = document.createElement('option');
      opt.value = path;
      var isDocx = /\.docx$/i.test(path);
      opt.textContent = (isDocx ? '[DOCX] ' : '[MD] ') + path.split('/').pop();
      select.appendChild(opt);
    });

    document.getElementById('nc-file-picker').style.display = 'block';

    var statusParts = [];
    if (mdCount > 0) statusParts.push(mdCount + ' Markdown');
    if (docxCount > 0) statusParts.push(docxCount + ' DOCX');
    document.getElementById('nc-status').textContent =
      importableFiles.length + ' fichier(s) trouvé(s) (' + statusParts.join(', ') + ').';

    var label = document.querySelector('label[for="nc-file-select"]');
    if (label) label.textContent = 'Fichier à importer';
  }

  // ── blob → data URL ──
  function blobToDataURL(blob, mime) {
    return new Promise(function (resolve, reject) {
      var typedBlob = new Blob([blob], { type: mime });
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(typedBlob);
    });
  }

  // ── Bouton "Charger le dossier" ──
  document.getElementById('btn-nc-fetch').addEventListener('click', async function (e) {
    e.preventDefault();
    var url = document.getElementById('nc-url').value.trim();
    if (!url) { alert('Veuillez saisir une URL Nextcloud.'); return; }

    localStorage.setItem(NC_URL_KEY, url);
    var status = document.getElementById('nc-status');
    status.textContent = 'Telechargement du dossier en cours...';

    var downloadURL = url.replace(/\/+$/, '') + '/download';

    try {
      var resp = await fetch(downloadURL);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var blob = await resp.blob();
      await loadZipBlob(blob);
    } catch (err) {
      console.warn('[nextcloud] Fetch direct echoue :', err.message);
      status.innerHTML = 'Acces direct impossible (CORS). <a href="' + downloadURL + '" target="_blank" rel="noopener">Telechargez le ZIP ici</a> puis importez-le ci-dessous.';
      document.getElementById('nc-zip-fallback').style.display = 'block';
    }
  });

  // ── Import manuel du ZIP (fallback CORS) ──
  document.getElementById('nc-zip-input').addEventListener('change', async function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var status = document.getElementById('nc-status');
    status.textContent = 'Extraction du ZIP...';
    try {
      await loadZipBlob(f);
    } catch (err) {
      status.textContent = 'Erreur : ' + err.message;
      console.error('[nextcloud]', err);
    }
  });

  // ── Import unifié DOCX / Markdown ──
  var importFileInput = document.getElementById('import-file');
  if (importFileInput) {
    importFileInput.addEventListener('change', async function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var status = document.getElementById('import-status');
      var isDocx = /\.docx$/i.test(f.name);

      if (isDocx) {
        if (status) status.textContent = 'Conversion en cours…';
        try {
          var arrayBuffer = await f.arrayBuffer();
          var md = await docxToMarkdown(arrayBuffer);
          document.getElementById('content').value = md;
          if (typeof buildHtmlAndText === 'function') {
            var result = buildHtmlAndText();
            document.getElementById('preview-frame').srcdoc = result.html;
          }
          if (status) status.textContent = 'Importé : ' + f.name;
        } catch (err) {
          if (status) status.textContent = 'Erreur : ' + err.message;
          console.error('[import] DOCX:', err);
        }
      } else {
        var reader = new FileReader();
        reader.onload = function () {
          document.getElementById('content').value = String(reader.result || '');
          if (typeof buildHtmlAndText === 'function') {
            var result = buildHtmlAndText();
            document.getElementById('preview-frame').srcdoc = result.html;
          }
          if (status) { status.textContent = 'Importé : ' + f.name; setTimeout(function(){ status.textContent = ''; }, 2000); }
        };
        reader.onerror = function () { if (status) status.textContent = 'Erreur de lecture'; };
        reader.readAsText(f);
      }

      e.target.value = '';
    });
  }

  // ── Bouton "Importer" (le .md ou .docx sélectionné) ──
  document.getElementById('btn-nc-load').addEventListener('click', async function (e) {
    e.preventDefault();
    var select = document.getElementById('nc-file-select');
    var selectedPath = select.value;
    if (!selectedPath || !zipCache) return;

    var status = document.getElementById('nc-status');
    status.textContent = 'Import en cours…';

    // ── Import DOCX ──
    if (/\.docx$/i.test(selectedPath)) {
      try {
        var arrayBuffer = await zipFiles[selectedPath].async('arraybuffer');
        var md = await docxToMarkdown(arrayBuffer);
        document.getElementById('content').value = md;
        if (typeof buildHtmlAndText === 'function') {
          var result = buildHtmlAndText();
          document.getElementById('preview-frame').srcdoc = result.html;
        }
        status.textContent = 'Importé (DOCX→MD) : ' + selectedPath.split('/').pop();
      } catch (err) {
        status.textContent = 'Erreur d\'import DOCX : ' + err.message;
        console.error('[nextcloud]', err);
      }
      return;
    }


    try {
      var mdContent = await zipFiles[selectedPath].async('string');
      var mdDir = selectedPath.substring(0, selectedPath.lastIndexOf('/') + 1);

      var bannerSvg = null;

      // Collecter toutes les images et les convertir en balises <img> avec data URI
      var imageRefs = [];
      var imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      var match;
      while ((match = imgRegex.exec(mdContent)) !== null) {
        imageRefs.push({ full: match[0], alt: match[1], src: match[2] });
      }

      for (var i = 0; i < imageRefs.length; i++) {
        var ref = imageRefs[i];
        var imgPath = mdDir + ref.src;
        var entry = zipFiles[imgPath] || zipFiles[ref.src];
        if (!entry) continue;

        var isLogo = /logo\.svg/i.test(ref.src);
        var isSvg = /\.svg$/i.test(ref.src);
        var isWebp = /\.webp$/i.test(ref.src);
        var isPng = /\.png$/i.test(ref.src);
        var isJpg = /\.jpe?g$/i.test(ref.src);

        if (isLogo && isSvg) {
          bannerSvg = await entry.async('string');
          mdContent = mdContent.replace(ref.full, '');
          continue;
        }

        // Convertir en data URI
        var dataUri;
        if (isSvg) {
          var svgText = await entry.async('string');
          // Convertir SVG en PNG via canvas (Gmail bloque les SVG data URI)
          try {
            dataUri = await svgToPng(svgText);
          } catch(e) {
            console.warn('[nextcloud] SVG->PNG fallback:', e);
            dataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
          }
        } else {
          var mime = isPng ? 'image/png' : isJpg ? 'image/jpeg' : isWebp ? 'image/webp' : 'application/octet-stream';
          var imgBlob = await entry.async('blob');
          dataUri = await blobToDataURL(imgBlob, mime);
        }

        // Remplacer la syntaxe markdown par une balise <img> directe
        // Le parser markdownToHtml protège les <img> de l'échappement HTML
        var imgTag = '<img src="' + dataUri + '" alt="' + (ref.alt || '') + '" style="max-width:100%;height:auto;display:block;margin:10px 0;">';
        mdContent = mdContent.replace(ref.full, imgTag);
      }

      mdContent = mdContent.replace(/^\s*\n\s*\n\s*\n/gm, '\n\n');
      document.getElementById('content').value = mdContent.trim();

      if (bannerSvg) {
        var bannerSvgEl = document.getElementById('banner-svg');
        if (bannerSvgEl) {
          bannerSvgEl.value = bannerSvg;
          bannerSvgEl.dataset.filledByUser = '1';
        }
        var imgDataEl = document.getElementById('banner-img-data');
        if (imgDataEl) imgDataEl.value = '';
      }

      if (typeof buildHtmlAndText === 'function') {
        var result = buildHtmlAndText();
        document.getElementById('preview-frame').srcdoc = result.html;
      }

      status.textContent = 'Importe : ' + selectedPath.split('/').pop();

    } catch (err) {
      status.textContent = 'Erreur d\'import : ' + err.message;
      console.error('[nextcloud]', err);
    }
  });

})();
