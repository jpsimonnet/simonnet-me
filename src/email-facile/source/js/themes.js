'use strict';

(function () {

  /* ── Définition des thèmes (couleurs illustratives DSFR) ── */
  var THEMES = {
    'bleu-france': {
      name: 'Bleu France',
      hint: '#000091',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#000091',
        '--h2-color':             '#000091',
        '--h2-bg':                '#e8edff',
        '--h3-color':             '#000091',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#000091',
        '--border-color':         '#dddddd',
        '--header-border-color':  '#000091',
        '--font-size':            '16px'
      }
    },
    'green-tilleul-verveine': {
      name: 'Tilleul Verveine',
      hint: '#66673d',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#66673d',
        '--h2-color':             '#66673d',
        '--h2-bg':                '#fef7da',
        '--h3-color':             '#66673d',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#66673d',
        '--border-color':         '#e0dfc0',
        '--header-border-color':  '#66673d',
        '--font-size':            '16px'
      }
    },
    'green-bourgeon': {
      name: 'Bourgeon',
      hint: '#447049',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#447049',
        '--h2-color':             '#447049',
        '--h2-bg':                '#e6feda',
        '--h3-color':             '#447049',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#447049',
        '--border-color':         '#c0dece',
        '--header-border-color':  '#447049',
        '--font-size':            '16px'
      }
    },
    'green-emeraude': {
      name: 'Emeraude',
      hint: '#297254',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#297254',
        '--h2-color':             '#297254',
        '--h2-bg':                '#e3fdeb',
        '--h3-color':             '#297254',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#297254',
        '--border-color':         '#b8e0cc',
        '--header-border-color':  '#297254',
        '--font-size':            '16px'
      }
    },
    'green-menthe': {
      name: 'Menthe',
      hint: '#37635f',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#37635f',
        '--h2-color':             '#37635f',
        '--h2-bg':                '#dffdf7',
        '--h3-color':             '#37635f',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#37635f',
        '--border-color':         '#bde0db',
        '--header-border-color':  '#37635f',
        '--font-size':            '16px'
      }
    },
    'green-archipel': {
      name: 'Archipel',
      hint: '#006a6f',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#006a6f',
        '--h2-color':             '#006a6f',
        '--h2-bg':                '#e5fbfd',
        '--h3-color':             '#006a6f',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#006a6f',
        '--border-color':         '#b8e0e2',
        '--header-border-color':  '#006a6f',
        '--font-size':            '16px'
      }
    },
    'blue-ecume': {
      name: 'Ecume',
      hint: '#2f4077',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#2f4077',
        '--h2-color':             '#2f4077',
        '--h2-bg':                '#f4f6fe',
        '--h3-color':             '#2f4077',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#2f4077',
        '--border-color':         '#c8d0eb',
        '--header-border-color':  '#2f4077',
        '--font-size':            '16px'
      }
    },
    'blue-cumulus': {
      name: 'Cumulus',
      hint: '#3558a2',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#3558a2',
        '--h2-color':             '#3558a2',
        '--h2-bg':                '#f3f6fe',
        '--h3-color':             '#3558a2',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#3558a2',
        '--border-color':         '#c4d1ed',
        '--header-border-color':  '#3558a2',
        '--font-size':            '16px'
      }
    },
    'purple-glycine': {
      name: 'Glycine',
      hint: '#6e445a',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#6e445a',
        '--h2-color':             '#6e445a',
        '--h2-bg':                '#fef3fd',
        '--h3-color':             '#6e445a',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#6e445a',
        '--border-color':         '#dcc0d1',
        '--header-border-color':  '#6e445a',
        '--font-size':            '16px'
      }
    },
    'pink-macaron': {
      name: 'Macaron',
      hint: '#8d533e',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#8d533e',
        '--h2-color':             '#8d533e',
        '--h2-bg':                '#fef4f2',
        '--h3-color':             '#8d533e',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#8d533e',
        '--border-color':         '#e0c8c0',
        '--header-border-color':  '#8d533e',
        '--font-size':            '16px'
      }
    },
    'pink-tuile': {
      name: 'Tuile',
      hint: '#a94645',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#a94645',
        '--h2-color':             '#a94645',
        '--h2-bg':                '#fef4f3',
        '--h3-color':             '#a94645',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#a94645',
        '--border-color':         '#e0c0c0',
        '--header-border-color':  '#a94645',
        '--font-size':            '16px'
      }
    },
    'yellow-tournesol': {
      name: 'Tournesol',
      hint: '#716043',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#716043',
        '--h2-color':             '#716043',
        '--h2-bg':                '#fef6e3',
        '--h3-color':             '#716043',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#716043',
        '--border-color':         '#e0d5c0',
        '--header-border-color':  '#716043',
        '--font-size':            '16px'
      }
    },
    'yellow-moutarde': {
      name: 'Moutarde',
      hint: '#695240',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#695240',
        '--h2-color':             '#695240',
        '--h2-bg':                '#fef5e8',
        '--h3-color':             '#695240',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#695240',
        '--border-color':         '#e0d0c0',
        '--header-border-color':  '#695240',
        '--font-size':            '16px'
      }
    },
    'orange-terre-battue': {
      name: 'Terre battue',
      hint: '#755348',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#755348',
        '--h2-color':             '#755348',
        '--h2-bg':                '#fef4f2',
        '--h3-color':             '#755348',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#755348',
        '--border-color':         '#e0cbc5',
        '--header-border-color':  '#755348',
        '--font-size':            '16px'
      }
    },
    'brown-cafe-creme': {
      name: 'Cafe creme',
      hint: '#685c48',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#685c48',
        '--h2-color':             '#685c48',
        '--h2-bg':                '#fbf6ed',
        '--h3-color':             '#685c48',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#685c48',
        '--border-color':         '#ddd5c8',
        '--header-border-color':  '#685c48',
        '--font-size':            '16px'
      }
    },
    'brown-caramel': {
      name: 'Caramel',
      hint: '#845d48',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#845d48',
        '--h2-color':             '#845d48',
        '--h2-bg':                '#fbf5f2',
        '--h3-color':             '#845d48',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#845d48',
        '--border-color':         '#e0cfc5',
        '--header-border-color':  '#845d48',
        '--font-size':            '16px'
      }
    },
    'brown-opera': {
      name: 'Opera',
      hint: '#745b47',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#745b47',
        '--h2-color':             '#745b47',
        '--h2-bg':                '#fbf5f2',
        '--h3-color':             '#745b47',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#745b47',
        '--border-color':         '#ddcfc5',
        '--header-border-color':  '#745b47',
        '--font-size':            '16px'
      }
    },
    'beige-gris-galet': {
      name: 'Gris Galet',
      hint: '#6a6156',
      colors: {
        '--email-bg':             '#FFFFFF',
        '--text-color':           '#161616',
        '--primary-color':        '#6a6156',
        '--h2-color':             '#6a6156',
        '--h2-bg':                '#f9f6f2',
        '--h3-color':             '#6a6156',
        '--h4-color':             '#161616',
        '--h5-color':             '#161616',
        '--h6-color':             '#161616',
        '--link-color':           '#6a6156',
        '--border-color':         '#dad5ce',
        '--header-border-color':  '#6a6156',
        '--font-size':            '16px'
      }
    },
    'sobre': {
      name: 'Sobre',
      hint: 'Minimaliste',
      colors: {
        '--email-bg':             '#f7f7f7',
        '--text-color':           '#1a1a1a',
        '--primary-color':        '#333333',
        '--h2-color':             '#1a1a1a',
        '--h2-bg':                '#ececec',
        '--h3-color':             '#444444',
        '--h4-color':             '#1a1a1a',
        '--h5-color':             '#1a1a1a',
        '--h6-color':             '#1a1a1a',
        '--link-color':           '#1a1a1a',
        '--border-color':         '#cccccc',
        '--header-border-color':  '#666666',
        '--font-size':            '16px'
      }
    }
  };

  /* Variables gérées par les color pickers (ordre = ordre dans le CSS généré) */
  var MANAGED_VARS = [
    '--email-bg', '--text-color',
    '--primary-color',
    '--h2-color', '--h2-bg',
    '--h3-color', '--h4-color', '--h5-color', '--h6-color',
    '--link-color',
    '--border-color', '--header-border-color'
  ];

  function varToId(v) { return v.replace(/^--/, ''); }

  /* ── Lire les pickers et reconstruire le textarea CSS ── */
  function buildCssFromPickers() {
    if (typeof DEFAULT_CSS_VARS === 'undefined') return;
    var overrides = {};
    MANAGED_VARS.forEach(function (v) {
      var hex = document.getElementById('hex-' + varToId(v));
      if (hex && hex.value.trim()) overrides[v] = hex.value.trim();
    });
    var fsEl = document.getElementById('val-font-size');
    if (fsEl && fsEl.value.trim()) overrides['--font-size'] = fsEl.value.trim();

    var lines = [':root {'];
    for (var key in DEFAULT_CSS_VARS) {
      lines.push('  ' + key + ': ' + (overrides[key] || DEFAULT_CSS_VARS[key]) + ';');
    }
    lines.push('}');

    var textarea = document.getElementById('custom-css');
    if (textarea) {
      textarea.value = lines.join('\n');
      textarea.dispatchEvent(new Event('input'));
    }
  }

  /* ── Lire le textarea CSS et synchroniser les pickers ── */
  function syncPickersFromCss() {
    if (typeof parseCssVars !== 'function') return;
    var vars = parseCssVars();
    MANAGED_VARS.forEach(function (v) {
      var val = vars[v] || '';
      var id = varToId(v);
      var picker = document.getElementById('cp-' + id);
      var hex    = document.getElementById('hex-' + id);
      if (picker && /^#[0-9a-fA-F]{6}$/.test(val)) picker.value = val;
      if (hex) hex.value = val;
    });
    var fsEl = document.getElementById('val-font-size');
    if (fsEl) fsEl.value = vars['--font-size'] || '16px';
  }

  /* ── Appliquer un thème ── */
  function applyTheme(themeId) {
    var theme = THEMES[themeId];
    if (!theme) return;
    MANAGED_VARS.forEach(function (v) {
      var val = theme.colors[v];
      if (!val) return;
      var id = varToId(v);
      var picker = document.getElementById('cp-' + id);
      var hex    = document.getElementById('hex-' + id);
      if (picker && /^#[0-9a-fA-F]{6}$/.test(val)) picker.value = val;
      if (hex) hex.value = val;
    });
    var fsEl = document.getElementById('val-font-size');
    if (fsEl && theme.colors['--font-size']) fsEl.value = theme.colors['--font-size'];
    buildCssFromPickers();
    document.querySelectorAll('.theme-btn').forEach(function (btn) {
      btn.classList.toggle('theme-btn--active', btn.dataset.themeId === themeId);
    });
  }

  /* ── Générer les boutons de thèmes ── */
  function renderThemeCards() {
    var container = document.getElementById('theme-cards');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(THEMES).forEach(function (id) {
      var theme = THEMES[id];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-btn';
      btn.dataset.themeId = id;

      var swatches = document.createElement('span');
      swatches.className = 'theme-swatches';
      [theme.colors['--primary-color'], theme.colors['--h2-bg'], theme.colors['--email-bg']].forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'theme-swatch';
        s.style.background = c;
        swatches.appendChild(s);
      });

      var primaryColor = theme.colors['--primary-color'];
      btn.style.color = primaryColor;
      btn.style.borderColor = primaryColor;

      var label = document.createElement('span');
      label.className = 'theme-btn-label';
      label.textContent = theme.name;

      var hint = document.createElement('small');
      hint.className = 'theme-hint';
      hint.style.color = primaryColor;
      hint.style.opacity = '0.7';
      hint.textContent = theme.hint;

      btn.appendChild(swatches);
      btn.appendChild(label);
      btn.appendChild(hint);
      btn.addEventListener('click', function () { applyTheme(id); });
      container.appendChild(btn);
    });
  }

  /* ── Câbler les color pickers et hex inputs ── */
  function wireColorControls() {
    document.querySelectorAll('.cp-input').forEach(function (picker) {
      picker.addEventListener('input', function () {
        var hexEl = document.getElementById(this.id.replace(/^cp-/, 'hex-'));
        if (hexEl) hexEl.value = this.value;
        buildCssFromPickers();
      });
    });

    document.querySelectorAll('.hex-input').forEach(function (hex) {
      hex.addEventListener('input', function () {
        var picker = document.getElementById(this.id.replace(/^hex-/, 'cp-'));
        if (picker && /^#[0-9a-fA-F]{6}$/.test(this.value)) picker.value = this.value;
        if (/^#[0-9a-fA-F]{3,7}$/.test(this.value)) buildCssFromPickers();
      });
    });

    var fsEl = document.getElementById('val-font-size');
    if (fsEl) fsEl.addEventListener('input', buildCssFromPickers);

    document.querySelectorAll('.link-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = this.dataset.color;
        var picker = document.getElementById('cp-link-color');
        var hex    = document.getElementById('hex-link-color');
        if (picker) picker.value = c;
        if (hex)    hex.value    = c;
        buildCssFromPickers();
      });
    });
  }

  /* ── Exposer applyTheme globalement pour le modèle ── */
  window.applyTheme = applyTheme;

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    renderThemeCards();
    wireColorControls();
    syncPickersFromCss();

    /* Garder les pickers en sync quand on édite le CSS manuellement */
    var cssTextarea = document.getElementById('custom-css');
    if (cssTextarea) {
      cssTextarea.addEventListener('input', function () {
        clearTimeout(cssTextarea._syncTimer);
        cssTextarea._syncTimer = setTimeout(syncPickersFromCss, 250);
      });
    }

    /* Sync après reset CSS */
    var resetBtn = document.getElementById('btn-reset-css');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        setTimeout(syncPickersFromCss, 100);
      });
    }
  });

})();
