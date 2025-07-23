// Intégration avec Pagefind
let pagefind = null;
let originalMainContent = null;
let mainElement = null;

async function loadPagefind() {
  if (pagefind) return pagefind;
  
  try {
    pagefind = await import('/pagefind/pagefind.js');
    return pagefind;
  } catch (error) {
    console.error('Erreur lors du chargement de Pagefind:', error);
    return null;
  }
}

// Fonction de recherche avec Pagefind
async function performSearch(query) {
  if (!query.trim()) return [];
  
  const pf = await loadPagefind();
  if (!pf) return [];
  
  try {
    const search = await pf.search(query);
    const results = await Promise.all(
      search.results.map(async result => {
        const data = await result.data();
        return {
          url: data.url,
          title: data.meta.title || 'Sans titre',
          excerpt: data.excerpt || '',
        };
      })
    );
    return results;
  } catch (error) {
    console.error('Erreur de recherche:', error);
    return [];
  }
}

// Template HTML pour la page de recherche
function getSearchPageHTML() {
  return `
    <div class="search-page">
      <div class="search-header">
        <h1 class="search-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-search me-3" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
          Recherche
        </h1>
        
        <div class="search-input-wrapper">
          <div class="search-input-container">
            <input 
              type="text" 
              class="search-input" 
              id="search-input"
              placeholder="Rechercher dans tout le site..."
              autocomplete="off"
              autofocus
            >
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
          </div>
          
          <button class="btn btn-outline-secondary ms-3" id="close-search">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
            <span class="d-none d-md-inline ms-2">Fermer</span>
          </button>
        </div>
      </div>
      
      <div class="search-results" id="search-results">
        <div class="search-welcome">
          <div class="search-welcome-icon">🔍</div>
          <h3>Recherchez dans tout le site</h3>
          <p class="text-muted">Tapez votre recherche ci-dessus pour commencer</p>
          <div class="search-tips">
            <h6>Conseils de recherche :</h6>
            <ul class="list-unstyled text-muted small">
              <li>• Utilisez des mots-clés spécifiques</li>
              <li>• Essayez différentes variantes</li>
              <li>• Utilisez <kbd>Ctrl+K</kbd> pour ouvrir rapidement la recherche</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Fonction pour ouvrir la recherche
function openSearch() {
  // Sauvegarder le contenu actuel
  if (!originalMainContent) {
    originalMainContent = mainElement.innerHTML;
  }
  
  // Remplacer le contenu par la page de recherche
  mainElement.innerHTML = getSearchPageHTML();
  
  // Mettre à jour l'URL sans recharger la page
  history.pushState({ searchOpen: true }, 'Recherche', '/recherche');
  
  // Réattacher les event listeners
  attachSearchEventListeners();
  
  // Focus sur le champ de recherche
  setTimeout(() => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.focus();
  }, 100);
}

// Fonction pour fermer la recherche
function closeSearch() {
  if (originalMainContent) {
    mainElement.innerHTML = originalMainContent;
  }
  
  // Retourner à l'URL précédente
  history.back();
}

// Fonction pour afficher les résultats
async function displayResults(query) {
  const searchResults = document.getElementById('search-results');
  if (!searchResults || !query.trim()) {
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="search-welcome">
          <div class="search-welcome-icon">🔍</div>
          <h3>Recherchez dans tout le site</h3>
          <p class="text-muted">Tapez votre recherche ci-dessus pour commencer</p>
        </div>
      `;
    }
    return;
  }

  searchResults.innerHTML = `
    <div class="loading">
      <div class="spinner-border me-3" role="status"></div>
      <span>Recherche en cours...</span>
    </div>
  `;

  try {
    const results = await performSearch(query);

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">😕</div>
          <h3>Aucun résultat trouvé</h3>
          <p class="text-muted">Aucun résultat pour "<strong>${query}</strong>"</p>
          <div class="search-suggestions">
            <h6>Suggestions :</h6>
            <ul class="list-unstyled text-muted">
              <li>• Vérifiez l'orthographe de vos mots-clés</li>
              <li>• Essayez des termes plus généraux</li>
              <li>• Utilisez des synonymes</li>
            </ul>
          </div>
        </div>
      `;
      return;
    }

    const statsHtml = `
      <div class="search-stats">
        <strong>${results.length}</strong> résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''} pour "<strong>${query}</strong>"
      </div>
    `;

    const resultsHtml = results.map(result => `
      <article class="result-item">
        <h3 class="result-title">
          <a href="${result.url}">${result.title}</a>
        </h3>
        <div class="result-excerpt">${result.excerpt}</div>
        <div class="result-meta">
          <span class="result-url">${result.url}</span>
        </div>
      </article>
    `).join('');

    searchResults.innerHTML = `
      ${statsHtml}
      <div class="results-list">
        ${resultsHtml}
      </div>
    `;

  } catch (error) {
    searchResults.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erreur lors de la recherche</h3>
        <p class="text-muted">Une erreur s'est produite. Veuillez réessayer.</p>
        <button class="btn btn-primary" onclick="displayResults('${query}')">Réessayer</button>
      </div>
    `;
  }
}

// Debounce pour éviter trop de requêtes
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedSearch = debounce(displayResults, 300);

// Attacher les event listeners pour la page de recherche
function attachSearchEventListeners() {
  const searchInput = document.getElementById('search-input');
  const closeSearchBtn = document.getElementById('close-search');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }
  
  if (closeSearchBtn) {
    closeSearchBtn.addEventListener('click', closeSearch);
  }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Trouver l'élément main
  mainElement = document.querySelector('main');
  if (!mainElement) {
    console.error('Aucun élément <main> trouvé dans la page');
    return;
  }

  // Trouver le bouton d'ouverture de la recherche
  const openSearchBtn = document.getElementById('open-search');
  if (!openSearchBtn) {
    console.error('Bouton d\'ouverture de la recherche non trouvé');
    return;
  }

  // Event listener pour ouvrir la recherche
  openSearchBtn.addEventListener('click', openSearch);

  // Gestion du bouton retour du navigateur
  window.addEventListener('popstate', function(event) {
    if (event.state && event.state.searchOpen) {
      // On revient sur la recherche
      return;
    } else {
      // On ferme la recherche si elle est ouverte
      if (originalMainContent && mainElement.innerHTML !== originalMainContent) {
        mainElement.innerHTML = originalMainContent;
        originalMainContent = null;
      }
    }
  });

  // Raccourci clavier Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    
    // Fermer avec Escape si on est sur la page de recherche
    if (e.key === 'Escape' && document.getElementById('search-input')) {
      closeSearch();
    }
  });
});