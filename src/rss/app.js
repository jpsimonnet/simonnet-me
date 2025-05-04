
document.addEventListener("DOMContentLoaded", function () {
  const feedList = document.getElementById('feedList');
  const feedContent = document.getElementById('feedContent');
  const feedTitle = document.getElementById('feedTitle');
  const importBtn = document.getElementById('importBtn');
  const opmlFile = document.getElementById('opmlFile');
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggleSidebar');

  // Default feeds from your OPML file
  const defaultFeeds = [
    {
        "title": "Access42",
        "xmlUrl": "https://access42.net/blog/feed/"
    },
    {
        "title": "Alsacreations",
        "xmlUrl": "https://www.alsacreations.com/rss/actualites.xml"
    },
    {
        "title": "Blog Du Webdesign",
        "xmlUrl": "https://www.blogduwebdesign.com/blog/do/rss.xml"
    },
    {
        "title": "BlogNT",
        "xmlUrl": "https://www.blog-nouvelles-technologies.fr/feed/"
    },
    {
        "title": "Clubic",
        "xmlUrl": "https://www.clubic.com/feed/news.rss"
    },
    {
        "title": "France Info",
        "xmlUrl": "https://www.francetvinfo.fr/internet.rss"
    },
    {
        "title": "France Num",
        "xmlUrl": "https://www.francenum.gouv.fr/flux-rss-principal"
    },
    {
        "title": "Geeko",
        "xmlUrl": "https://geeko.lesoir.be/feed/"
    },
    {
        "title": "Geoffrey Dorne",
        "xmlUrl": "https://graphism.fr/feed/"
    },
    {
        "title": "Ideance",
        "xmlUrl": "https://ideance.net/blog/feed/"
    },
    {
        "title": "Infos Du Net",
        "xmlUrl": "https://www.infos-du-net.com/feed/"
    },
    {
        "title": "INSHEA",
        "xmlUrl": "https://inshea.fr/fr/flux-rss-global.xml?t=&utm_source=perplexity"
    },
    {
        "title": "Journal Du Net ",
        "xmlUrl": "https://www.journaldunet.com/rss/"
    },
    {
        "title": "Koena",
        "xmlUrl": "https://koena.net/feed/"
    },
    {
        "title": "La Revue Du Digital",
        "xmlUrl": "https://www.larevuedudigital.com/feed/"
    },
    {
        "title": "Le Big Data",
        "xmlUrl": "https://www.lebigdata.fr/feed"
    },
    {
        "title": "Le Monde Informatique",
        "xmlUrl": "https://www.lemondeinformatique.fr/flux-rss/thematique/toutes-les-actualites/rss.xml"
    },
    {
        "title": "Les numériques",
        "xmlUrl": "https://www.lesnumeriques.com/rss.xml"
    },
    {
        "title": "Nextimpact",
        "xmlUrl": "https://next.ink/feed/"
    },
    {
        "title": "Numérique Gouv",
        "xmlUrl": "https://www.numerique.gouv.fr/feed.actualites.xml"
    },
    {
        "title": "Opquast",
        "xmlUrl": "https://www.opquast.com/rss"
    },
    {
        "title": "Tanaguru",
        "xmlUrl": "https://www.tanaguru.com/blog/feed/"
    },
    {
        "title": "Temesis",
        "xmlUrl": "https://www.temesis.com/index.xml"
    },
    {
        "title": "Usabilis",
        "xmlUrl": "https://www.usabilis.com/blog/feed/"
    },
    {
        "title": "UX Republic",
        "xmlUrl": "https://www.ux-republic.com/feed/"
    },
    {
        "title": "Webdesignertrend",
        "xmlUrl": "https://www.webdesignertrends.com/feed/"
    },
    {
        "title": "- Actualités A la une",
        "xmlUrl": "https://www.usine-digitale.fr/rss"
    },
    {
        "title": "01net.com/",
        "xmlUrl": "https://www.01net.com/feed/"
    },
    {
        "title": "Archimag",
        "xmlUrl": "https://www.archimag.com/rss"
    },
    {
        "title": "BDM",
        "xmlUrl": "https://www.blogdumoderateur.com/feed/"
    },
    {
        "title": "Cafétech",
        "xmlUrl": "https://cafetech.fr/feed/"
    },
    {
        "title": "Frandroid",
        "xmlUrl": "https://www.frandroid.com/feed"
    },
    {
        "title": "Fredzone",
        "xmlUrl": "https://www.fredzone.org/feed/"
    },
    {
        "title": "futuretools",
        "xmlUrl": "https://www.futuretools.io/?pricing-model=free"
    },
    {
        "title": "https://outilsemail.com/",
        "xmlUrl": "https://outilsemail.com/feed/"
    },
    {
        "title": "InternetActu.net",
        "xmlUrl": "https://www.internetactu.net/feed/"
    },
    {
        "title": "journaldugeek",
        "xmlUrl": "https://www.journaldugeek.com/feed/"
    },
    {
        "title": "Korben",
        "xmlUrl": "https://korben.info/feed"
    },
    {
        "title": "La Quadrature du Net",
        "xmlUrl": "https://www.laquadrature.net/feed/"
    },
    {
        "title": "Les Outils Collaboratifs",
        "xmlUrl": "https://outilscollaboratifs.com/feed/"
    },
    {
        "title": "Les outils de veille",
        "xmlUrl": "https://outilsveille.com/feed/"
    },
    {
        "title": "Les Outils du Web",
        "xmlUrl": "https://allweb2.com/feed/"
    },
    {
        "title": "Les Outils Productivité",
        "xmlUrl": "https://outilsproductivite.com/feed/"
    },
    {
        "title": "Les Outils Tice",
        "xmlUrl": "https://outilstice.com/feed/"
    },
    {
        "title": "Numerama",
        "xmlUrl": "https://www.numerama.com/feed/"
    },
    {
        "title": "Open Culture",
        "xmlUrl": "https://www.openculture.com/feed"
    },
    {
        "title": "Opquast",
        "xmlUrl": "https://www.opquast.com/feed/"
    },
    {
        "title": "Pixels : Toute l’actualité sur Le Monde.fr.",
        "xmlUrl": "https://www.lemonde.fr/pixels/rss_full.xml"
    },
    {
        "title": "Presse Citron",
        "xmlUrl": "https://www.presse-citron.net/feed/"
    },
    {
        "title": "RSS | Usbek & Rica",
        "xmlUrl": "https://usbeketrica.com/fr/rss"
    },
    {
        "title": "Siècle Digital",
        "xmlUrl": "https://siecledigital.fr/feed/"
    },
    {
        "title": "Silicon",
        "xmlUrl": "https://www.silicon.fr/"
    },
    {
        "title": "zdnet.fr/",
        "xmlUrl": "https://www.zdnet.fr/"
    }



  ];

  // Check if feeds are stored in local storage, otherwise load default feeds
  let feeds = JSON.parse(localStorage.getItem('feeds')) || defaultFeeds;

  // Display feeds in the sidebar
  function displayFeeds() {
    feedList.innerHTML = ''; // Clear existing feeds
    feeds.forEach(feed => {
      const li = document.createElement('li');
      li.textContent = feed.title;
      li.addEventListener('click', () => {
        loadFeed(feed.xmlUrl);
        if (window.innerWidth <= 768) {
          toggleSidebar(); // Collapse sidebar on mobile after selecting a feed
        }
      });
      feedList.appendChild(li);
    });
  }

  // Fetch and display the selected feed
  function loadFeed(url) {
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
      .then(response => response.json())
      .then(data => {
        feedTitle.textContent = data.feed.title;
        feedContent.innerHTML = '';

        data.items.forEach(item => {
          const article = document.createElement('div');
          article.classList.add('article');

          // Check if there's a thumbnail or image in the article
          const image = item.thumbnail || (item.enclosure && item.enclosure.link) || '';

          article.innerHTML = `
            ${image ? `<img src="${image}" alt="${item.title}" class="article-image">` : ''}
            <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
            <p>${item.pubDate}</p>
            <p>${item.description}</p>
          `;
          feedContent.appendChild(article);
        });
      })
      .catch(error => console.error("Failed to load RSS feed:", error));
  }

  // Handle OPML file import
  importBtn.addEventListener('click', () => {
    const file = opmlFile.files[0];
    if (!file) {
      alert("Please select an OPML file to import.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const parser = new DOMParser();
      const xml = parser.parseFromString(e.target.result, "text/xml");
      const outlines = xml.querySelectorAll('outline');
      
      feeds = [];
      outlines.forEach(outline => {
        const title = outline.getAttribute('title');
        const xmlUrl = outline.getAttribute('xmlUrl');
        if (xmlUrl) {
          feeds.push({ title, xmlUrl });
        }
      });

      // Save feeds to local storage and update the UI
      localStorage.setItem('feeds', JSON.stringify(feeds));
      displayFeeds();
    };

    reader.readAsText(file);
  });

  // Sidebar toggle for mobile view
  toggleSidebarBtn.addEventListener('click', toggleSidebar);

  function toggleSidebar() {
    sidebar.classList.toggle('open');
  }

  // Display feeds on page load
  displayFeeds();
});
