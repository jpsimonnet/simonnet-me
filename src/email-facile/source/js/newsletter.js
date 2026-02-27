'use strict';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const DEFAULT_CSS_VARS = {
  '--email-bg': '#FFFFFF',
  '--text-color': '#161616',
  '--primary-color': '#000091',
  '--h2-bg': '#e8edff',
  '--h2-color': '#000091',
  '--h3-color': '#000091',
  '--h4-color': '#161616',
  '--h5-color': '#161616',
  '--h6-color': '#161616',
  '--link-color': '#000091',
  '--border-color': '#dddddd',
  '--header-border-color': '#000091',
  '--font-family': 'Marianne, Arial, Helvetica, sans-serif',
  '--font-size': '16px',
  '--line-height': '1.5',
  '--toc-bg': '#f8f9ff',
  '--toc-border': '#dddddd',
  '--hr-color': '#ddd'
};

function parseCssVars() {
  const el = $('#custom-css');
  const text = el ? el.value : '';
  const vars = Object.assign({}, DEFAULT_CSS_VARS);
  const re = /--([\w-]+)\s*:\s*([^;]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = '--' + m[1].trim();
    const val = m[2].trim();
    if (val && vars.hasOwnProperty(key)) {
      vars[key] = val;
    }
  }
  return vars;
}

function cssVar(name) {
  return parseCssVars()[name] || DEFAULT_CSS_VARS[name] || '';
}

function getDefaultCssText() {
  var lines = [':root {'];
  for (var key in DEFAULT_CSS_VARS) {
    lines.push('  ' + key + ': ' + DEFAULT_CSS_VARS[key] + ';');
  }
  lines.push('}');
  return lines.join('\n');
}

var _galleryCache = {}; // cache WebP par fichier : { "logo.webp": "data:image/webp;base64,..." }

function saveToStorage() {
  const data = {
    content: $('#content').value,
    sender: $('#sender').value,
    msgTitle: $('#msgTitle').value,
    campaign: $('#campaign').value,
    showBanner: $('#show-banner').checked,
    bannerImgData: $('#banner-img-data').value,
    bannerSource: $('#banner-source') ? $('#banner-source').value : '',
    showFooter: $('#show-footer').checked,
    footerContent: $('#footer-content-textarea').value,
    footerType: document.querySelector('input[name="footerType"]:checked').value,
    exportMode: document.querySelector('input[name="exportMode"]:checked').value,
    inputType: document.querySelector('input[name="inputType"]:checked').value,
    utms: $('#utms').checked,
    customCss: $('#custom-css') ? $('#custom-css').value : '',
    timestamp: new Date().toISOString()
  };

  try {
    sessionStorage.setItem('newsletter_autosave', JSON.stringify(data));
    const saves = JSON.parse(localStorage.getItem('newsletter_saves') || '[]');
    saves.unshift(data);
    if (saves.length > 10) saves.splice(10);
    localStorage.setItem('newsletter_saves', JSON.stringify(saves));
    const live = $('#copy-status');
    if (live) { 
      live.textContent = 'Configuration sauvegardee'; 
      setTimeout(() => { live.textContent = ''; }, 2000); 
    }
  } catch(e) {
    alert('Erreur lors de la sauvegarde : ' + e.message);
  }
}

function loadFromStorage() {
  try {
    const saves = JSON.parse(localStorage.getItem('newsletter_saves') || '[]');
    if (saves.length === 0) {
      alert('Aucune sauvegarde trouvee');
      return;
    }
    const data = saves[0];
    loadDataToForm(data);
    const live = $('#copy-status');
    if (live) { 
      live.textContent = 'Configuration chargee'; 
      setTimeout(() => { live.textContent = ''; }, 2000); 
    }
  } catch(e) {
    alert('Erreur lors du chargement : ' + e.message);
  }
}

function autoSave() {
  const data = {
    content: $('#content').value,
    sender: $('#sender').value,
    msgTitle: $('#msgTitle').value,
    campaign: $('#campaign').value,
    showBanner: $('#show-banner').checked,
    bannerImgData: $('#banner-img-data').value,
    bannerSource: $('#banner-source') ? $('#banner-source').value : '',
    showFooter: $('#show-footer').checked,
    footerContent: $('#footer-content-textarea').value,
    footerType: document.querySelector('input[name="footerType"]:checked').value,
    exportMode: document.querySelector('input[name="exportMode"]:checked').value,
    inputType: document.querySelector('input[name="inputType"]:checked').value,
    utms: $('#utms').checked,
    customCss: $('#custom-css') ? $('#custom-css').value : ''
  };
  
  try {
    sessionStorage.setItem('newsletter_autosave', JSON.stringify(data));
  } catch(e) {
    // Ignore silently for autosave
  }
}

function loadAutoSave() {
  try {
    const data = JSON.parse(sessionStorage.getItem('newsletter_autosave') || '{}');
    if (Object.keys(data).length === 0) return;
    loadDataToForm(data);
  } catch(e) {
    // Ignore errors for autosave
  }
}

function loadDataToForm(data) {
  $('#content').value = data.content || '';
  $('#sender').value = data.sender || '';
  $('#msgTitle').value = data.msgTitle || '';
  $('#campaign').value = data.campaign || 'sept-2025-actu';
  $('#show-banner').checked = data.showBanner || false;
  $('#banner-img-data').value = data.bannerImgData || '';
  if ($('#banner-source')) $('#banner-source').value = data.bannerSource || (data.bannerImgData ? 'upload' : '');
  $('#show-footer').checked = data.showFooter || false;
  $('#footer-content-textarea').value = data.footerContent || '';
  $('#utms').checked = data.utms !== false;

  if (data.customCss && $('#custom-css')) {
    $('#custom-css').value = data.customCss;
  }

  if (data.footerType) {
    const footerTypeRadio = document.querySelector(`input[name="footerType"][value="${data.footerType}"]`);
    if (footerTypeRadio) footerTypeRadio.checked = true;
  }

  if (data.exportMode) {
    const exportModeRadio = document.querySelector(`input[name="exportMode"][value="${data.exportMode}"]`);
    if (exportModeRadio) exportModeRadio.checked = true;
  }

  if (data.inputType) {
    const inputTypeRadio = document.querySelector(`input[name="inputType"][value="${data.inputType}"]`);
    if (inputTypeRadio) inputTypeRadio.checked = true;
  }

  updateBannerVisibility();
  updateFooterVisibility();
  highlightGalleryThumb($('#banner-source') ? $('#banner-source').value : '');
  updateBannerPreview(data.bannerImgData || '');
  const result = buildHtmlAndText();
  $('#preview-frame').srcdoc = result.html;
}

function clearAllData() {
  if (confirm('Etes-vous sur de vouloir effacer toutes les donnees sauvegardees ?')) {
    localStorage.removeItem('newsletter_saves');
    sessionStorage.removeItem('newsletter_autosave');
    
    $('#content').value = '# Bonjour !\n\nBienvenue dans la **newsletter**.\n\n- Point 1 : nouveau site\n- Point 2 : ateliers\n- Point 3 : inscriptions ouvertes\n\n[Consultez le programme](https://example.org/agenda)';
    $('#sender').value = '';
    $('#msgTitle').value = '';
    $('#campaign').value = 'sept-2025-actu';
    $('#show-banner').checked = false;
    $('#banner-img-data').value = '';
    if ($('#banner-source')) $('#banner-source').value = '';
    $('#show-footer').checked = false;
    $('#footer-content-textarea').value = '---\n\n**Newsletter de l\'organisation**\n\nContact: contact@example.org\nSite web: https://example.org\n\nPour vous desabonner, [cliquez ici](https://example.org/unsubscribe)';
    $('#utms').checked = true;
    if ($('#custom-css')) $('#custom-css').value = getDefaultCssText();

    document.querySelector('input[name="footerType"][value="md"]').checked = true;
    document.querySelector('input[name="exportMode"][value="web"]').checked = true;
    document.querySelector('input[name="inputType"][value="md"]').checked = true;

    updateBannerVisibility();
    updateFooterVisibility();
    const result = buildHtmlAndText();
    $('#preview-frame').srcdoc = result.html;
    
    const live = $('#copy-status');
    if (live) { 
      live.textContent = 'Donnees effacees'; 
      setTimeout(() => { live.textContent = ''; }, 2000); 
    }
  }
}

function getConfig(){
  return {
    senderName: $('#sender').value.trim(),
    msgTitle: $('#msgTitle').value.trim(),
    campaignName: $('#campaign').value.trim()
  };
}

function slugify(s){
  return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function markdownToHtml(md){
  let html = String(md||'');

  // Supprimer le front matter YAML (bloc --- ... --- en debut de document)
  html = html.replace(/^\s*---\n[\s\S]*?\n---\s*\n?/, '');

  // Traiter les listes D'ABORD (avant tout échappement)
  html = parseNestedLists(html);
  
  // Traiter les blockquotes AVANT l'échappement (style mise en exergue DSFR)
  const blockquoteBlocks = [];
  let bqIndex = 0;
  html = parseBlockquotes(html);
  html = html.replace(/<blockquote[\s\S]*?<\/blockquote>/g, (match) => {
    const placeholder = `___BLOCKQUOTE_${bqIndex}___`;
    blockquoteBlocks[bqIndex] = match;
    bqIndex++;
    return placeholder;
  });

  // Traiter les alertes DSFR (:::type ... :::) AVANT l'échappement
  const alertBlocks = [];
  let alrtIndex = 0;
  html = parseAlerts(html);
  html = html.replace(/<div class="fr-alert[\s\S]*?<\/div>\s*<\/div>/g, (match) => {
    const placeholder = `___ALERT_${alrtIndex}___`;
    alertBlocks[alrtIndex] = match;
    alrtIndex++;
    return placeholder;
  });

  // Traiter les tableaux markdown AVANT l'échappement
  const tableBlocks = [];
  let tbIndex = 0;
  html = parseMarkdownTables(html);
  html = html.replace(/<table[\s\S]*?<\/table>/g, (match) => {
    const placeholder = `___TABLE_${tbIndex}___`;
    tableBlocks[tbIndex] = match;
    tbIndex++;
    return placeholder;
  });

  // Marquer les balises HTML qu'on vient de créer (listes) et les <img> inline
  const htmlTags = [];
  let tagIndex = 0;
  html = html.replace(/(<\/?(?:ul|li)(?:\s[^>]*)?>|<img\s[^>]*\/?>)/g, (match) => {
    const placeholder = `___HTML_TAG_${tagIndex}___`;
    htmlTags[tagIndex] = match;
    tagIndex++;
    return placeholder;
  });
  
  // Autolinks markdown <https://...> - traiter avant l'échappement
  const autolinkTags = [];
  let alIndex = 0;
  html = html.replace(/<(https?:\/\/[^>\s]+)>/g, (_, url) => {
    const tag = '<a href="' + url + '">' + url + '</a>';
    const placeholder = `___AUTOLINK_${alIndex}___`;
    autolinkTags[alIndex] = tag;
    alIndex++;
    return placeholder;
  });

  // Support des exposants et indices - les traiter avant l'échappement
  const supSubTags = [];
  let supSubIndex = 0;
  
  // Exposants : <sup>texte</sup>
  html = html.replace(/<sup>([^<]+)<\/sup>/g, (match, content) => {
    const placeholder = `___SUP_SUB_TAG_${supSubIndex}___`;
    supSubTags[supSubIndex] = `<sup>${content}</sup>`;
    supSubIndex++;
    return placeholder;
  });
  
  // Indices : <sub>texte</sub>
  html = html.replace(/<sub>([^<]+)<\/sub>/g, (match, content) => {
    const placeholder = `___SUP_SUB_TAG_${supSubIndex}___`;
    supSubTags[supSubIndex] = `<sub>${content}</sub>`;
    supSubIndex++;
    return placeholder;
  });
  
  // Maintenant échapper le reste
  html = html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  
  // Restaurer les balises HTML des listes
  htmlTags.forEach((tag, index) => {
    html = html.replace(`___HTML_TAG_${index}___`, tag);
  });
  
  // Restaurer les balises sup/sub
  supSubTags.forEach((tag, index) => {
    html = html.replace(`___SUP_SUB_TAG_${index}___`, tag);
  });

  // Restaurer les autolinks
  autolinkTags.forEach((tag, index) => {
    html = html.replace(`___AUTOLINK_${index}___`, tag);
  });

  // Restaurer les blockquotes
  blockquoteBlocks.forEach((block, index) => {
    html = html.replace(`___BLOCKQUOTE_${index}___`, block);
  });

  // Restaurer les alertes DSFR
  alertBlocks.forEach((block, index) => {
    html = html.replace(`___ALERT_${index}___`, block);
  });

  // Restaurer les tableaux
  tableBlocks.forEach((block, index) => {
    html = html.replace(`___TABLE_${index}___`, block);
  });

  // Reste du traitement...
  var v = parseCssVars();
  html = html.replace(/^(?:---|\*\*\*|___)$/gm, '<hr style="border:0;border-top:1px solid ' + v['--hr-color'] + ';margin:20px 0;">');
  
  html = html.replace(/!\[([^\]]*)\]\(((?:https?:|data:)[^\)\s]+)\)/g, function(_,alt,url){
    return '<img src="'+url+'" alt="'+alt+'" style="max-width:100%;height:auto;display:block;margin:10px 0;">';
  });
  
  html = html
    .replace(/^######\s?(.+)$/gm, function(_,t){ return '<h6 style="color:' + v['--h6-color'] + ';font-size:0.8rem;font-weight:bold;margin:0.5rem 0;">'+t+'</h6>'; })
    .replace(/^#####\s?(.+)$/gm,  function(_,t){ return '<h5 style="color:' + v['--h5-color'] + ';font-size:0.875rem;font-weight:bold;margin:0.75rem 0;">'+t+'</h5>'; })
    .replace(/^####\s?(.+)$/gm,   function(_,t){ return '<h4 style="color:' + v['--h4-color'] + ';font-size:1rem;font-weight:bold;margin:1rem 0;">'+t+'</h4>'; })
    .replace(/^###\s?(.+)$/gm,    function(_,t){ return '<h3 style="color:' + v['--h3-color'] + '">'+t+'</h3>'; })
    .replace(/^##\s?(.+)$/gm,     function(_,t){ return '<h2 style="margin: 0 0 16px 0; font-size: 1.5rem !important; line-height: 2rem !important; background-color: ' + v['--h2-bg'] + '; color: ' + v['--h2-color'] + '; padding: 8px; margin:2rem 0">'+t+'</h2>'; })
    .replace(/^#\s?(.+)$/gm,      function(_,t){ return '<h1>'+t+'</h1>'; });

  html = html
    .replace(/\*\*(.+?)\*\*/g, function(_,t){ return '<strong>'+t+'</strong>'; })
    .replace(/\*(.+?)\*/g,     function(_,t){ return '<em>'+t+'</em>'; })
    .replace(/\[([^\]]+)\]\((https?:[^\s)]+)(?:\s+"([^"]*)")?\)/g, function(_,txt,url,title){ return '<a href="'+url+'"' + (title ? ' title="'+title+'"' : '') + '>'+txt+'</a>'; });

  html = html.replace(/^(?!<h\d|<ul|<li|<p|<\/|<blockquote|<img|<a|<div|<table|<tr|<td|<th|<hr|___TABLE|___ALERT)(.+)$/gm, '<p>$1</p>');
  
  return html;
}

function parseNestedLists(text) {
  const lines = text.split('\n');
  let result = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Détecter le début d'une liste
    if (/^[-*]\s+/.test(line)) {
      let listLines = [];
      
      // Collecter toutes les lignes de la liste
      while (i < lines.length) {
        const currentLine = lines[i];
        // Ligne de liste OU ligne indentée qui suit
        if (/^[-*]\s+/.test(currentLine) || (listLines.length > 0 && /^\s+[-*]\s+/.test(currentLine))) {
          listLines.push(currentLine);
          i++;
        } else {
          break;
        }
      }
      
      // Convertir en HTML
      result.push(convertListToHtml(listLines));
    } else {
      result.push(line);
      i++;
    }
  }
  
  return result.join('\n');
}

function convertListToHtml(lines) {
  let html = '';
  let currentLevel = 0;
  let openLists = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (!match) continue;
    
    const indent = match[1].length;
    const content = match[2];
    const level = Math.floor(indent / 4);
    
    // Fermer les listes si on remonte de niveau
    while (currentLevel > level) {
      html += '</li></ul>';
      openLists--;
      currentLevel--;
    }
    
    // Ouvrir une nouvelle liste si on descend de niveau
    if (level > currentLevel) {
      html += '<ul>';
      openLists++;
      currentLevel = level;
    } else if (i > 0) {
      // Fermer l'item précédent si on est au même niveau
      html += '</li>';
    }
    
    // Ouvrir la liste principale si nécessaire
    if (openLists === 0) {
      html += '<ul>';
      openLists++;
    }
    
    html += '<li>' + content;
  }
  
  // Fermer tous les éléments ouverts
  html += '</li>';
  while (openLists > 0) {
    html += '</ul>';
    openLists--;
  }
  
  return html;
}

function parseBlockquotes(text) {
  const lines = text.split('\n');
  let result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^>\s?/.test(line)) {
      let quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const content = quoteLines.join('<br>').trim();
      // Style mise en exergue DSFR (inline pour compatibilite email)
      result.push('<blockquote style="border-left:3px solid #000091;margin:1.5rem 0;padding:0 0 0 1rem;"><p style="font-size:1.25rem;line-height:1.75rem;margin:0;">' + content + '</p></blockquote>');
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

// Traitement markdown inline pour le contenu des cellules de tableau
function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:[^\s)]+)(?:\s+"([^"]*)")?\)/g, function(_, txt, url, title) {
      return '<a href="' + url + '"' + (title ? ' title="' + title + '"' : '') + '>' + txt + '</a>';
    });
}

function parseMarkdownTables(text) {
  var lines = text.split('\n');
  var result = [];
  var i = 0;
  var v = parseCssVars();
  var borderColor = v['--border-color'] || '#dddddd';
  var cellStyle = 'border:1px solid ' + borderColor + ';padding:8px 12px;text-align:left;';
  var headerCellStyle = cellStyle + 'background-color:' + (v['--primary-color'] || '#000091') + ';color:#ffffff;font-weight:bold;';

  while (i < lines.length) {
    // Detecter une ligne de tableau : commence par |
    if (/^\|(.+)\|$/.test(lines[i].trim())) {
      var tableLines = [];
      while (i < lines.length && /^\|(.+)\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // Il faut au moins 2 lignes (header + separateur) pour un tableau
      if (tableLines.length >= 2 && /^\|[\s:]*-+[\s:]*/.test(tableLines[1])) {
        // Chercher un titre en gras sur la ligne precedente pour en faire un caption
        var caption = '';
        if (result.length > 0) {
          var prevLine = result[result.length - 1].trim();
          // Ligne vide juste avant ? Regarder encore au-dessus
          var checkIdx = result.length - 1;
          if (prevLine === '' && checkIdx > 0) { checkIdx--; prevLine = result[checkIdx].trim(); }
          var boldMatch = prevLine.match(/^\*\*(.+)\*\*$/);
          if (boldMatch) {
            caption = boldMatch[1];
            result.splice(checkIdx, result.length - checkIdx);
          }
        }
        // Determiner l'alignement depuis la ligne de separateur
        var sepCells = tableLines[1].replace(/^\||\|$/g, '').split('|');
        var aligns = sepCells.map(function(sep) {
          sep = sep.trim();
          if (/^:-+:$/.test(sep)) return 'center';
          if (/^-+:$/.test(sep)) return 'right';
          return 'left';
        });
        // Header
        var headerCells = tableLines[0].replace(/^\||\|$/g, '').split('|');
        var tableHtml = '<table style="border-collapse:collapse;width:100%;margin:16px 0;font-family:' + (v['--font-family'] || 'Arial, sans-serif') + ';font-size:0.875rem;">';
        if (caption) {
          tableHtml += '<caption style="caption-side:top;text-align:left;font-weight:bold;font-size:1rem;padding:8px 0;color:' + (v['--text-color'] || '#161616') + ';">' + inlineMarkdown(caption) + '</caption>';
        }
        tableHtml += '<thead><tr>';
        for (var h = 0; h < headerCells.length; h++) {
          tableHtml += '<th style="' + headerCellStyle + 'text-align:' + (aligns[h] || 'left') + ';">' + inlineMarkdown(headerCells[h].trim()) + '</th>';
        }
        tableHtml += '</tr></thead>';
        // Body
        tableHtml += '<tbody>';
        for (var r = 2; r < tableLines.length; r++) {
          var cells = tableLines[r].replace(/^\||\|$/g, '').split('|');
          var rowBg = (r % 2 === 0) ? '#f6f6f6' : '#ffffff';
          tableHtml += '<tr>';
          for (var ci = 0; ci < cells.length; ci++) {
            tableHtml += '<td style="' + cellStyle + 'text-align:' + (aligns[ci] || 'left') + ';background-color:' + rowBg + ';">' + inlineMarkdown(cells[ci].trim()) + '</td>';
          }
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        result.push(tableHtml);
      } else {
        // Pas un vrai tableau, remettre les lignes telles quelles
        for (var j = 0; j < tableLines.length; j++) {
          result.push(tableLines[j]);
        }
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }
  return result.join('\n');
}

function parseAlerts(text) {
  // Emojis Unicode pour compatibilite maximale (Gmail bloque les SVG data URI)
  var dsfr = {
    info:    { bg: '#e8edff', border: '#0063cb', color: '#0063cb', label: 'Information', emoji: '\u2139\uFE0F' },
    success: { bg: '#b8fec9', border: '#18753c', color: '#18753c', label: 'Succ\u00e8s',  emoji: '\u2705' },
    warning: { bg: '#ffe9e6', border: '#b34000', color: '#b34000', label: 'Attention',    emoji: '\u26A0\uFE0F' },
    error:   { bg: '#ffe9e6', border: '#ce0500', color: '#ce0500', label: 'Erreur',       emoji: '\u274C' }
  };

  return text.replace(/:::\s*(info|warning|warn|danger|error|success|note)(?:\s*\|\s*([^\n]+))?\s*\n([\s\S]*?)\n:::/gm, function(_, type, titre, content) {
    var alertType = (type === 'danger') ? 'error' : (type === 'note') ? 'info' : (type === 'warn') ? 'warning' : type;
    var d = dsfr[alertType] || dsfr.info;
    var headerText = titre ? titre.trim() : d.label;

    return '<div class="fr-alert fr-alert--' + alertType + '" style="border-left:4px solid ' + d.border + ';background-color:' + d.bg + ';padding:16px;margin:16px 0;">' +
           '<div style="display:flex;align-items:center;margin-bottom:8px;">' +
             '<span style="font-size:20px;margin-right:8px;line-height:1;">' + d.emoji + '</span>' +
             '<span style="font-weight:bold;font-size:1rem;color:' + d.color + ';">' + headerText + '</span>' +
           '</div>' +
           '<div style="color:#161616;font-size:0.875rem;line-height:1.5;">' + content.trim() + '</div>' +
           '</div>';
  });
}

function normalizePhoneTarget(raw){
  var s = String(raw||'');
  if (/^00\d+/.test(s)) s = '+' + s.slice(2);
  var keep = [];
  for (var i=0;i<s.length;i++){ var ch = s[i]; if ((ch>='0'&&ch<='9')||ch==='+') keep.push(ch); }
  s = keep.join('');
  if (s[0] !== '+'){
    var digits = s.replace(/\D/g,'');
    if (digits.length===10 && digits[0]==='0'){ s = '+33' + digits.slice(1); }
    else { s = '+' + digits; }
  } else {
    s = '+' + s.slice(1).replace(/\D/g,'');
  }
  return s;
}

function linkifyOrphans(html){
  var parser = new DOMParser();
  var doc = parser.parseFromString(String(html||''), 'text/html');
  var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  var nodes = [], n;
  while ((n = walker.nextNode())){
    if (!n.parentNode) continue;
    var p = n.parentElement;
    if (p.closest('a,script,style,code,pre')) continue;
    if (!n.nodeValue || !n.nodeValue.trim()) continue;
    nodes.push(n);
  }
  var re = /(https?:\/\/[^\s<]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|(\+?\d[\d.\-\s()]{8,}\d)/g;
  nodes.forEach(function(node){
    var text = node.nodeValue, frag = doc.createDocumentFragment(), last = 0, m;
    while ((m = re.exec(text)) !== null){
      if (m.index > last) frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      var a = doc.createElement('a');
      if (m[1]){ a.setAttribute('href', m[1]); a.setAttribute('rel','noopener'); a.textContent = m[1]; }
      else if (m[2]){ a.setAttribute('href', 'mailto:' + m[2]); a.textContent = m[2]; }
      else if (m[3]){ var tel = normalizePhoneTarget(m[3]); a.setAttribute('href', 'tel:' + tel); a.textContent = m[3].replace(/\s+/g,' ').trim(); }
      frag.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  return doc.body.innerHTML;
}

function addMatomoTracking(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a[href]');
  const campaign = getConfig().campaignName || 'newsletter';
  links.forEach((link, i) => {
    try {
      const u = new URL(link.getAttribute('href'), location.origin);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        ['pk_campaign','pk_source','pk_medium','pk_content'].forEach(k => u.searchParams.delete(k));
        u.searchParams.set('pk_campaign', campaign);
        u.searchParams.set('pk_source', 'newsletter');
        u.searchParams.set('pk_medium', 'email');
        u.searchParams.set('pk_content', 'link-' + (i+1));
        link.setAttribute('href', u.toString());
        link.setAttribute('rel', 'noopener');
      }
    } catch(e) {}
  });
  return doc.body.innerHTML;
}

function getFooterFromUI(){
  const showFooter = $('#show-footer');
  if (!showFooter || !showFooter.checked) return '';
  
  const footerContent = $('#footer-content-textarea').value.trim();
  if (!footerContent) return '';
  
  const footerType = document.querySelector('input[name="footerType"]:checked').value;
  let footerHtml = '';
  
  if (footerType === 'md') {
    footerHtml = markdownToHtml(footerContent);
  } else {
    footerHtml = footerContent;
  }
  
  footerHtml = linkifyOrphans(footerHtml);
  
  return '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #dddddd;">' + footerHtml + '</div>';
}

function updateFooterVisibility(){
  const showFooter = $('#show-footer');
  const footerContent = $('#footer-content');

  if (showFooter && showFooter.checked) {
    footerContent.classList.add('visible');
  } else {
    footerContent.classList.remove('visible');
  }
}

function updateBannerVisibility(){
  const showBanner = $('#show-banner');
  const bannerContent = $('#banner-content');
  if (!bannerContent) return;
  if (showBanner && showBanner.checked) {
    bannerContent.classList.add('visible');
  } else {
    bannerContent.classList.remove('visible');
  }
}


function getBannerFromUI(){
  var show = $('#show-banner');
  if (!show || !show.checked) return '';
  var imgDataEl = $('#banner-img-data');
  var imgData = imgDataEl ? (imgDataEl.value || '').trim() : '';
  if (!imgData) return '';
  var imgStyle = 'display:block;border:0;outline:none;text-decoration:none;width:100%;height:auto;';
  return '<div style="margin:0;"><img src="' + imgData + '" alt="Banniere" style="' + imgStyle + '"></div>';
}

function createEmailTemplate(content, textAlt) {
  const { msgTitle, senderName } = getConfig();
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const safeTitle  = esc(msgTitle);
  const safeSender = esc(senderName);
  const currentBanner = getBannerFromUI();
  const currentFooter = getFooterFromUI();
  
  // Préparer la version texte
  const textVersion = String(textAlt||'').replace(/"/g, '\\"').replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');

  const v = parseCssVars();

  let emailContent = String(content||'')
    .replace(/<img((?:(?!alt=)[^>])*)>/g, '<img$1 alt="">')
    .replace(/<img /g, '<img style="display:block;border:0;outline:none;text-decoration:none;max-width:100%;height:auto;" ')
    .replace(/<a /g,   '<a style="color:' + v['--link-color'] + ';text-decoration:underline;" ');

  return '<!DOCTYPE html>'
  + '<html lang="fr"><head><meta charset="UTF-8">'
  + '<meta name="x-apple-disable-message-reformatting">'
  + '<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<title>' + safeTitle + '</title>'
  + '<meta name="text-version" content="' + textVersion + '">'
  + '<script type="text/plain" id="text-version">' + String(textAlt||'') + '</script>'
  + '</head>'
  + '<body style="margin:0;padding:0;background:' + v['--email-bg'] + ';">'
  + '<!-- Version texte alternative (copiez le contenu ci-dessous dans le champ texte de votre logiciel)'
  + '\n' + String(textAlt||'') + '\n'
  + 'Fin version texte -->'
  + '<div style="display:none;" class="text-version">'
  + '<pre style="white-space:pre-wrap;font-family:monospace;">' + esc(String(textAlt||'')) + '</pre>'
  + '</div>'
  + '<center style="width:100%;background:' + v['--email-bg'] + ';">'
    + '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:' + v['--email-bg'] + ';">'
      + '<tr><td align="center" style="padding:20px 0;">'
        + '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px;border-collapse:collapse;">'
          + ((safeSender || safeTitle) ?
              '<tr><td style="padding:0 20px 12px 20px;text-align:center;font-family:' + v['--font-family'] + ';">'
            + (safeSender ? ('<div style="font-weight:bold;">' + safeSender + '</div>') : '')
            + (safeTitle  ? ('<h1 style="margin:8px 0 0 0;font-size:20px;line-height:1.3;color:' + v['--primary-color'] + ';">' + safeTitle + '</h1>') : '')
            + '</td></tr>'
            : '')
          + (currentBanner ? '<tr><td style="padding:20px;text-align:left;">' + currentBanner + '</td></tr>' : '')
          + '<tr><td style="padding:20px;font-family:' + v['--font-family'] + ';font-size:' + v['--font-size'] + ';line-height:' + v['--line-height'] + ';color:' + v['--text-color'] + ';">'
            + emailContent
            + currentFooter
          + '</td></tr>'
          + '<tr><td style="padding:16px 20px;border-top:1px solid ' + v['--border-color'] + ';text-align:center;font-family:' + v['--font-family'] + ';font-size:13px;color:#444;">'
            + 'Cette newsletter vise la conformite accessibilite (RGAA).<br>'
            + 'Pour vous desabonner, utilisez le lien de gestion des preferences si disponible.'
          + '</td></tr>'
        + '</table>'
      + '</td></tr>'
    + '</table>'
  + '</center>'
  + '</body></html>';
}

function createWebTemplate(content){
  const { msgTitle, senderName } = getConfig();
  const currentBanner = getBannerFromUI();
  const currentFooter = getFooterFromUI();
  const v = parseCssVars();

  return '<!doctype html>' +
    '<html lang="fr"><head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + String(msgTitle||'').replace(/</g,'&lt;') + '</title>' +
      '<style>' +
      '  body{font-family:' + v['--font-family'] + ';line-height:' + v['--line-height'] + ';margin:0;background:' + v['--email-bg'] + ';color:' + v['--text-color'] + '}' +
      '  .container{width:100%;margin:0;padding:24px;box-sizing:border-box}' +
      '  header{margin-bottom:16px}' +
      '  header h1{font-size:1.5rem;margin:.5rem 0;color:' + v['--primary-color'] + '}' +
      '  img{max-width:100%;height:auto}' +
      '  a{color:' + v['--link-color'] + '}' +
      '</style>' +
    '</head><body>' +
      '<main class="container" role="main">' +
        ((senderName || msgTitle || currentBanner) ?
          '<header aria-label="En-tete">' +
            (senderName ? '<div>' + senderName + '</div>' : '') +
            (msgTitle ? '<h1>' + msgTitle + '</h1>' : '') +
            (currentBanner ? '<div aria-hidden="true" style="margin:1rem 0;">' + currentBanner + '</div>' : '') +
          '</header>'
        : '') +
        '<article>' + (content||'') + currentFooter + '</article>' +
      '</main>' +
    '</body></html>';
}


function toPlainText(src, isMarkdown){
  let text = String(src||'');
  if (!isMarkdown){
    text = text.replace(/<\/(?:p|div|li|h\d)>/gi, '\n')
               .replace(/<br\s*\/?\s*>/gi, '\n')
               .replace(/<[^>]+>/g, '')
               .replace(/&nbsp;/g,' ')
               .replace(/&amp;/g,'&')
               .replace(/&lt;/g,'<')
               .replace(/&gt;/g,'>');
  }
  text = text.replace(/https?:\/\/\S+/g, function(m){return '<' + m + '>';});
  var width = 72;
  return text.split('\n').map(function(line){
    var out=[]; var rest=line;
    while(rest.length>width){ out.push(rest.slice(0,width)); rest=rest.slice(width); }
    out.push(rest); return out.join('\n');
  }).join('\n');
}

function slugifyId(str){
  try {
    return String(str||'')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'') || 'section';
  } catch(e){
    return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'section';
  }
}

function injectHeadingIdsAndTOC(html){
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html||''), 'text/html');
  const h2s = Array.from(doc.querySelectorAll('h2'));
  const used = new Set();
  const items = [];
  
  // 1. Traiter tous les H2 et collecter les infos
  h2s.forEach(function(h2, index){
    const originalText = (h2.textContent||'').trim();
    
    var base = h2.getAttribute('id') || slugifyId(originalText);
    if (!base) base = 'section';
    var id = base; var n = 2;
    while (used.has(id)) { id = base + '-' + (n++); }
    used.add(id);
    
    const numero = (index + 1) + '. ';
    h2.textContent = numero + originalText;
    
    h2.setAttribute('id', id);
    items.push({id:id, text:originalText});
    
    // Ajouter le lien "retour au sommaire"
    var backLinkDiv = doc.createElement('div');
    backLinkDiv.style.cssText = 'text-align:right;margin-top:2rem;margin-bottom:0.5rem;';
    
    var backLink = doc.createElement('a');
    backLink.href = '#toc-nav';
    backLink.textContent = '↑ Retour au sommaire';
    backLink.style.cssText = 'font-size:0.9em;color:' + cssVar('--link-color') + ';text-decoration:none;';
    backLink.setAttribute('title', 'Retour au sommaire');
    
    backLinkDiv.appendChild(backLink);
    h2.parentNode.insertBefore(backLinkDiv, h2);
  });
  
  // 2. Créer le sommaire HTML
  if (items.length > 0){
    var cv = parseCssVars();
    var navHtml = '<div role="navigation" aria-label="Sommaire" class="toc" id="toc-nav" style="border:1px solid ' + cv['--toc-border'] + ';border-radius:8px;padding:12px;background:' + cv['--toc-bg'] + ';font-family:' + cv['--font-family'] + ';font-size:14px;line-height:1.5;margin-bottom:16px;">' +
                  '<div class="toc-title" style="font-weight:bold;margin-bottom:8px;">Sommaire</div>' +
                  '<ol style="margin:0 0 0 1rem;padding:0;">' +
                  items.map(function(it){
                    return '<li style="margin:4px 0;"><a href="#'+it.id+'" style="color:' + cv['--link-color'] + ';text-decoration:underline;">'+ it.text +'</a></li>';
                  }).join('') +
                  '</ol></div>';
    
    // 3. Chercher un placeholder [TOC] dans le contenu
    var tocPlaceholder = null;
    var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes('[TOC]')) {
        tocPlaceholder = node;
        break;
      }
    }
    
    if (tocPlaceholder) {
      // Remplacer [TOC] par le sommaire
      var tocContainer = doc.createElement('div');
      tocContainer.innerHTML = navHtml;
      
      // Si [TOC] est dans un <p>, remplacer tout le <p>
      var parentP = tocPlaceholder.parentElement;
      if (parentP && parentP.tagName === 'P') {
        parentP.parentNode.replaceChild(tocContainer.firstChild, parentP);
      } else {
        tocPlaceholder.parentNode.replaceChild(tocContainer.firstChild, tocPlaceholder);
      }
    } else {
      // Comportement par défaut : insérer après le H1
      var nav = doc.createElement('div');
      nav.innerHTML = navHtml;
      var h1 = doc.querySelector('h1');
      if (h1 && h1.parentNode) { 
        h1.insertAdjacentElement('afterend', nav.firstChild); 
      } else { 
        doc.body.insertBefore(nav.firstChild, doc.body.firstChild); 
      }
    }
  }
  
  return { content: doc.body.innerHTML };
}

function buildHtmlAndText(){
  var cfg = getConfig();

  var inputType = document.querySelector('input[name="inputType"]:checked').value;
  var isMarkdown = (inputType === 'md');
  var raw = $('#content').value;

  var htmlBody = isMarkdown ? markdownToHtml(raw) : raw;

  htmlBody = linkifyOrphans(htmlBody);
  if ($('#utms').checked){
    htmlBody = addMatomoTracking(htmlBody);
  }

  var tocRes = injectHeadingIdsAndTOC(htmlBody);
  if (tocRes && tocRes.content) { htmlBody = tocRes.content; }

  var exportMode = document.querySelector('input[name="exportMode"]:checked').value;

  var textContent = raw;
  const footerContent = $('#footer-content-textarea').value.trim();
  const showFooter = $('#show-footer').checked;
  if (showFooter && footerContent) {
    textContent += '\n\n' + footerContent;
  }
  
  var html = (exportMode === 'email') ? createEmailTemplate(htmlBody, textContent) : createWebTemplate(htmlBody);
  var text = toPlainText(isMarkdown ? textContent : htmlBody, isMarkdown);

  var base = slugify(cfg.campaignName || cfg.msgTitle || 'export');
  var filename = (exportMode === 'email') ? ('newsletter-' + base + '.html') : ('preview-' + base + '.html');
  return { html: html, text: text, filename: filename };
}

function copyToClipboard(text) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    alert('Copie automatique indisponible. Selectionnez et copiez manuellement.');
    return Promise.resolve();
  }
  return navigator.clipboard.writeText(text).then(function(){
    var live = $('#copy-status');
    if (live) { live.textContent = 'Contenu copie dans le presse-papiers'; setTimeout(function(){live.textContent='';},2000); }
  });
}

function readFileAsText(file){
  return new Promise(function(res, rej){ var r = new FileReader(); r.onload = function(){res(r.result);}; r.onerror = rej; r.readAsText(file, 'utf-8'); });
}

function readFileAsDataURL(file){
  return new Promise(function(res, rej){ var r = new FileReader(); r.onload = function(){res(r.result);}; r.onerror = rej; r.readAsDataURL(file); });
}

/* ══════════════════════════════════════
   Conversion image → WebP & galerie bandeaux
══════════════════════════════════════ */

function imageToWebpDataUri(source, opts) {
  opts = opts || {};
  var maxWidth = opts.maxWidth || 1500;
  var quality  = opts.quality  || 0.75;

  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = function() {
      var w = img.naturalWidth;
      var h = img.naturalHeight;
      if (w > maxWidth) {
        h = Math.round(h * (maxWidth / w));
        w = maxWidth;
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      var dataUri = canvas.toDataURL('image/webp', quality);
      if (dataUri.indexOf('data:image/webp') !== 0) {
        console.warn('WebP non supporte par ce navigateur, fallback PNG');
      }
      resolve(dataUri);
    };

    img.onerror = function() {
      reject(new Error('Echec du chargement de l\'image'));
    };

    if (opts.isSvgText) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(source, 'image/svg+xml');
      var svg = doc.documentElement;
      var vb = svg.getAttribute('viewBox');
      var renderW = maxWidth, renderH = maxWidth;
      if (vb) {
        var parts = vb.split(/[\s,]+/);
        if (parts.length >= 4) {
          var vbW = parseFloat(parts[2]), vbH = parseFloat(parts[3]);
          if (vbW > 0 && vbH > 0) renderH = Math.round(renderW * vbH / vbW);
        }
      }
      svg.setAttribute('width', String(renderW));
      svg.setAttribute('height', String(renderH));
      var serialized = new XMLSerializer().serializeToString(svg);
      var blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
      img.src = URL.createObjectURL(blob);
    } else if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}

function loadBannerGallery() {
  var container = $('#banner-gallery');
  if (!container) return;
  container.innerHTML = '<p class="muted small">Chargement…</p>';

  fetch('source/logos/logos.json', { cache: 'no-store' })
    .then(function(r) {
      if (!r.ok) throw new Error('logos.json non trouve');
      return r.json();
    })
    .then(function(items) {
      container.innerHTML = '';
      items.forEach(function(item) {
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'banner-thumb';
        btn.title = item.label;
        btn.dataset.file = item.file;

        var img = document.createElement('img');
        img.src = 'source/logos/' + item.file;
        img.alt = item.label;
        btn.appendChild(img);

        btn.addEventListener('click', function() {
          selectGalleryBanner(item.file);
        });

        var lbl = document.createElement('span');
        lbl.className = 'banner-thumb-label';
        lbl.textContent = item.label;

        wrapper.appendChild(btn);
        wrapper.appendChild(lbl);
        container.appendChild(wrapper);
      });

      var currentSource = $('#banner-source');
      if (currentSource && currentSource.value) {
        highlightGalleryThumb(currentSource.value);
      }
    })
    .catch(function(err) {
      console.warn('Galerie de bandeaux:', err);
      container.innerHTML = '<p class="muted small">Aucun bandeau disponible dans logos/</p>';
    });
}

function selectGalleryBanner(filename) {
  if (_galleryCache[filename]) {
    applyBannerData(_galleryCache[filename], 'gallery:' + filename);
    return;
  }

  var isSvg = /\.svg$/i.test(filename);
  var url = 'source/logos/' + filename;

  var promise;
  if (isSvg) {
    promise = fetch(url).then(function(r) { return r.text(); })
      .then(function(svgText) {
        return imageToWebpDataUri(svgText, { maxWidth: 1500, quality: 0.75, isSvgText: true });
      });
  } else {
    promise = imageToWebpDataUri(url, { maxWidth: 1500, quality: 0.75 });
  }

  promise.then(function(webpUri) {
    _galleryCache[filename] = webpUri;
    applyBannerData(webpUri, 'gallery:' + filename);
  }).catch(function(err) {
    console.error('Conversion bandeau:', err);
  });
}

function applyBannerData(webpDataUri, sourceValue) {
  var hidden = $('#banner-img-data');
  if (hidden) hidden.value = webpDataUri;

  var source = $('#banner-source');
  if (source) source.value = sourceValue;

  highlightGalleryThumb(sourceValue);
  updateBannerPreview(webpDataUri);

  autoSave();
  try {
    var result = buildHtmlAndText();
    $('#preview-frame').srcdoc = result.html;
  } catch(e) { console.error(e); }
}

function highlightGalleryThumb(sourceValue) {
  $$('.banner-thumb').forEach(function(btn) {
    var isActive = sourceValue === 'gallery:' + btn.dataset.file;
    btn.classList.toggle('banner-thumb--active', isActive);
  });
}

function updateBannerPreview(dataUri) {
  var previewDiv = $('#banner-preview');
  var previewImg = $('#banner-preview-img');
  if (!previewDiv || !previewImg) return;
  if (dataUri) {
    previewImg.src = dataUri;
    previewDiv.style.display = 'block';
  } else {
    previewDiv.style.display = 'none';
  }
}

// Boutons principaux
$('#btn-import-file').addEventListener('click', function(){
  $('#import-file').click();
});

$('#btn-download').addEventListener('click', function(e){
  e.preventDefault();
  var result = buildHtmlAndText();
  // Telecharger le HTML
  var blob = new Blob([result.html], {type:'text/html;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = result.filename;
  a.click();
  URL.revokeObjectURL(a.href);
  // Telecharger le CSS en meme temps
  var cssEl = $('#custom-css');
  if (cssEl && cssEl.value.trim()) {
    var cssBlob = new Blob([cssEl.value], {type:'text/css;charset=utf-8'});
    var cssBase = result.filename.replace(/\.html$/, '');
    var a2 = document.createElement('a');
    a2.href = URL.createObjectURL(cssBlob);
    a2.download = cssBase + '.css';
    setTimeout(function(){ a2.click(); URL.revokeObjectURL(a2.href); }, 200);
  }
});

$('#btn-copy-html').addEventListener('click', function(e){
  e.preventDefault();
  var result = buildHtmlAndText();
  copyToClipboard(result.html);
});

$('#btn-copy-text').addEventListener('click', function(e){
  e.preventDefault();
  var result = buildHtmlAndText();
  copyToClipboard(result.text);
});

$('#btn-save').addEventListener('click', function(e){
  e.preventDefault();
  saveToStorage();
});

$('#btn-load').addEventListener('click', function(e){
  e.preventDefault();
  loadFromStorage();
});

$('#btn-clear').addEventListener('click', function(e){
  e.preventDefault();
  clearAllData();
});

$('#show-banner').addEventListener('change', function(){
  updateBannerVisibility();
  autoSave();
  var result = buildHtmlAndText();
  $('#preview-frame').srcdoc = result.html;
});

$('#show-footer').addEventListener('change', function(){
  updateFooterVisibility();
  autoSave();
  var result = buildHtmlAndText();
  $('#preview-frame').srcdoc = result.html;
});


$('#banner-file').addEventListener('change', function(e){
  var f = e.target.files && e.target.files[0];
  if (!f) return;
  var show = $('#show-banner');
  if (show) show.checked = true;
  updateBannerVisibility();

  var isSvg = f.type === 'image/svg+xml';
  var isImage = isSvg || /^image\/(png|jpeg|webp)$/.test(f.type) || /\.(png|jpe?g|webp|svg)$/i.test(f.name);
  if (!isImage) {
    alert('Format non pris en charge. Utilisez SVG, PNG, JPG ou WEBP.');
    return;
  }

  var promise;
  if (isSvg) {
    promise = readFileAsText(f).then(function(svgText) {
      return imageToWebpDataUri(svgText, { maxWidth: 1500, quality: 0.75, isSvgText: true });
    });
  } else {
    promise = readFileAsDataURL(f).then(function(dataUrl) {
      return imageToWebpDataUri(dataUrl, { maxWidth: 1500, quality: 0.75 });
    });
  }

  promise.then(function(webpUri) {
    applyBannerData(webpUri, 'upload');
    var live = $('#copy-status');
    if (live) { live.textContent = 'Bandeau importe et converti en WebP'; setTimeout(function(){live.textContent='';},1500); }
  }).catch(function(err) {
    console.error(err);
    alert('Echec de l\'import du bandeau');
  });

  e.target.value = '';
});

['show-banner','sender','msgTitle','campaign','utms','footer-content-textarea','content','custom-css'].forEach(function(id){
  var el = $('#' + id);
  if (!el) return;
  var update = function(){ 
    autoSave();
    var result = buildHtmlAndText(); 
    $('#preview-frame').srcdoc = result.html; 
  };
  el.addEventListener('input', update);
  el.addEventListener('change', update);
});

$('#btn-reset-css').addEventListener('click', function(e){
  e.preventDefault();
  var el = $('#custom-css');
  if (el) {
    el.value = getDefaultCssText();
    autoSave();
    var result = buildHtmlAndText();
    $('#preview-frame').srcdoc = result.html;
    var live = $('#copy-status');
    if (live) { live.textContent = 'Styles reinitialises'; setTimeout(function(){live.textContent='';},2000); }
  }
});

$('#css-file-input').addEventListener('change', function(e){
  var f = e.target.files && e.target.files[0];
  if (!f) return;
  readFileAsText(f).then(function(txt){
    var el = $('#custom-css');
    if (el) {
      el.value = String(txt || '');
      autoSave();
      var result = buildHtmlAndText();
      $('#preview-frame').srcdoc = result.html;
      var live = $('#copy-status');
      if (live) { live.textContent = 'CSS importe : ' + f.name; setTimeout(function(){live.textContent='';},2000); }
    }
  }).catch(function(){ alert('Echec de l\'import CSS'); });
  e.target.value = '';
});

$$('input[name="footerType"], input[name="exportMode"], input[name="inputType"]').forEach(function(radio){
  radio.addEventListener('change', function(){
    autoSave();
    var result = buildHtmlAndText();
    $('#preview-frame').srcdoc = result.html;
  });
});

window.addEventListener('DOMContentLoaded', function(){
  loadAutoSave();
  updateBannerVisibility();
  updateFooterVisibility();
  loadBannerGallery();

  // Appliquer le bandeau par defaut si aucun n'est stocke
  var sourceEl = $('#banner-source');
  var imgDataEl = $('#banner-img-data');
  if ((!sourceEl || !sourceEl.value) && (!imgDataEl || !imgDataEl.value)) {
    selectGalleryBanner('logo.webp');
  } else {
    updateBannerPreview(imgDataEl ? imgDataEl.value : '');
  }

  try {
    var result = buildHtmlAndText();
    $('#preview-frame').srcdoc = result.html;
  } catch(e){
    var live = $('#copy-status');
    if (live) { live.textContent = 'Erreur lors du rendu initial : ' + (e && e.message ? e.message : e); }
    console.error(e);
  }
});

setInterval(function(){
  if (document.hasFocus()) {
    autoSave();
  }
}, 30000);

window.addEventListener('beforeunload', function(e){
  autoSave();
});

console.log('Newsletter Generator charge avec footer personnalise et sauvegarde automatique.');