// scripts/fetch-notion-actualite.cjs

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Init Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function fetchActualite() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        multi_select: {
          contains: 'A la une',
        },
      },
      sorts: [
        {
          property: 'Created',
          direction: 'descending',
        },
      ],
    });

    if (response.results.length === 0) {
      console.log('Aucune actualité "A la une" trouvée.');
      return;
    }

const actualites = response.results.map((page) => {
  const properties = page.properties;
  return {
    title: properties.Nom.title[0]?.plain_text || '',
    url: properties.URL.url || '',
    created: properties.Created.created_time || '',
    summary: properties.Résumé.rich_text[0]?.plain_text || '',
    image: properties['URL image'].url || '',
  };
});


const outputPath = path.join(__dirname, '../src/_data/actualite.json');


fs.writeFileSync(outputPath, JSON.stringify(actualites, null, 2));
console.log(`✅ ${actualites.length} actualité(s) "A la une" exportée(s) !`);


  } catch (error) {
    console.error('Erreur lors de la récupération de l’actualité:', error);
  }
}

fetchActualite();