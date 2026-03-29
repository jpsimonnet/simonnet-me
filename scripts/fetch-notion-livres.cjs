// scripts/fetch-notion-livres.cjs

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const NOTION_LIVRES_DATABASE_ID = 'ffff9c97e6ff80f795a5d8a5f0faa8e3';

async function fetchAllPages() {
  const pages = [];
  let cursor = undefined;

  do {
    const response = await notion.databases.query({
      database_id: NOTION_LIVRES_DATABASE_ID,
      start_cursor: cursor,
      sorts: [
        {
          property: 'Lu le',
          direction: 'descending',
        },
      ],
    });

    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function fetchLivres() {
  try {
    const pages = await fetchAllPages();

    if (pages.length === 0) {
      console.log('Aucun livre trouvé.');
      return;
    }

    const livres = pages.map((page, index) => {
      const properties = page.properties;
      return {
        Nom: properties.Nom?.title?.[0]?.plain_text || '',
        Auteur: properties.Auteur?.rich_text?.[0]?.plain_text || '',
        'En ligne': properties['En ligne']?.url || '',
        'Lu le': properties['Lu le']?.date?.start || '',
        Résumé: properties['Résumé']?.rich_text?.[0]?.plain_text || '',
        Type: properties.Type?.select?.name || '',
        id: index + 1,
      };
    });

    const outputPath = path.join(__dirname, '../src/_data/livres.json');
    fs.writeFileSync(outputPath, JSON.stringify(livres, null, 2));
    console.log(`✅ ${livres.length} livre(s) exporté(s) !`);
  } catch (error) {
    console.error('Erreur lors de la récupération des livres:', error);
  }
}

fetchLivres();
