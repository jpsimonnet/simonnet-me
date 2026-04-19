// scripts/fetch-notion-pages.cjs
// Fetches static pages (qui-suis-je, mentions, accessibilite) from Notion

require('dotenv').config();
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const PAGES = [
  { id: '347f9c97e6ff80e29f6fcaeb224dd850', slug: 'qui-suis-je' },
  { id: '347f9c97e6ff80558f69e63121857e12', slug: 'mentions' },
  { id: '347f9c97e6ff8073a0b2d64492275404', slug: 'accessibilite' },
];

async function fetchPage(pageId) {
  const page = await notion.pages.retrieve({ page_id: pageId });
  const title = page.properties.title?.title?.[0]?.plain_text || '';

  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);
  const content = mdString.parent || mdString;

  return { title, content };
}

async function fetchAllPages() {
  try {
    const results = {};

    for (const page of PAGES) {
      try {
        const data = await fetchPage(page.id);
        results[page.slug] = data;
        console.log(`✅ Page "${page.slug}" récupérée (${data.title})`);
      } catch (err) {
        console.warn(`⚠️ Échec page "${page.slug}": ${err.message}`);
        results[page.slug] = { title: page.slug, content: '' };
      }
    }

    const outputPath = path.join(__dirname, '../src/_data/notionPages.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`✅ ${Object.keys(results).length} page(s) exportée(s) !`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

fetchAllPages();
