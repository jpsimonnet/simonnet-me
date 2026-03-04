/**
 * sanitizer.js — Sanitisation HTML par liste blanche pour le contenu RSS.
 * Previent les attaques XSS en n'autorisant qu'un sous-ensemble de tags/attributs.
 */
(function () {
  'use strict';

  var ALLOWED_TAGS = {
    'p': true, 'br': true, 'hr': true,
    'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true,
    'strong': true, 'b': true, 'em': true, 'i': true, 'u': true, 'small': true,
    'a': true, 'img': true,
    'ul': true, 'ol': true, 'li': true,
    'blockquote': true, 'pre': true, 'code': true,
    'table': true, 'thead': true, 'tbody': true, 'tr': true, 'th': true, 'td': true,
    'figure': true, 'figcaption': true,
    'div': true, 'span': true, 'sup': true, 'sub': true, 'dl': true, 'dt': true, 'dd': true
  };

  var ALLOWED_ATTRS = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'width', 'height', 'title'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan']
  };

  var DANGEROUS_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form',
    'input', 'textarea', 'select', 'button', 'svg', 'math', 'link', 'meta', 'base'];

  function sanitize(html) {
    if (!html) return '';
    var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    var root = doc.body.firstChild;
    if (!root) return '';
    walkAndClean(root);
    return root.innerHTML;
  }

  function walkAndClean(node) {
    var toRemove = [];
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (child.nodeType === 1) {
        var tag = child.tagName.toLowerCase();

        if (DANGEROUS_TAGS.indexOf(tag) !== -1) {
          toRemove.push(child);
          continue;
        }

        if (!ALLOWED_TAGS[tag]) {
          // Tag inconnu : conserver le texte enfant
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          toRemove.push(child);
          continue;
        }

        // Nettoyer les attributs
        var allowed = ALLOWED_ATTRS[tag] || [];
        var attrs = Array.from(child.attributes);
        for (var j = 0; j < attrs.length; j++) {
          var name = attrs[j].name.toLowerCase();
          if (allowed.indexOf(name) === -1 || name.indexOf('on') === 0) {
            child.removeAttribute(attrs[j].name);
          }
        }

        // Securiser les liens
        if (tag === 'a') {
          var href = (child.getAttribute('href') || '').trim();
          if (!/^https?:\/\//i.test(href) && !href.startsWith('#') && !href.startsWith('mailto:')) {
            child.removeAttribute('href');
          }
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }

        // Securiser les images
        if (tag === 'img') {
          var src = (child.getAttribute('src') || '').trim();
          if (!/^https?:\/\//i.test(src) && !/^data:image\//i.test(src)) {
            toRemove.push(child);
            continue;
          }
        }

        walkAndClean(child);
      }
    }
    for (var k = 0; k < toRemove.length; k++) {
      if (toRemove[k].parentNode) {
        toRemove[k].parentNode.removeChild(toRemove[k]);
      }
    }
  }

  window.RSS = window.RSS || {};
  window.RSS.sanitizer = { sanitize: sanitize };
})();
