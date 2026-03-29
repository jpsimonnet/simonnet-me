// scripts/fetch-notion-livres.cjs

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const sharp = require('sharp');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const NOTION_LIVRES_DATABASE_ID = 'ffff9c97e6ff80f795a5d8a5f0faa8e3';
const IMAGES_DIR = path.join(__dirname, '../src/assets/images/lectures');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadBuffer(response.headers.location).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadAndCompressImage(url, destPath) {
  const buffer = await downloadBuffer(url);
  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile(destPath);
}

async function fetchPageImage(pageId) {
  try {
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    const imageBlock = blocks.results.find((block) => block.type === 'image');
    if (!imageBlock) return null;

    const image = imageBlock.image;
    if (image.type === 'file') return image.file.url;
    if (image.type === 'external') return image.external.url;
    return null;
  } catch (error) {
    console.warn(`⚠️ Impossible de récupérer l'image pour ${pageId}:`, error.message);
    return null;
  }
}

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

    const livres = [];

    for (const page of pages) {
      const properties = page.properties;
      const notionId = page.id.replace(/-/g, '');

      // Fetch cover image from page content
      const imageUrl = await fetchPageImage(page.id);
      const imagePath = path.join(IMAGES_DIR, `${notionId}.webp`);

      if (imageUrl) {
        try {
          await downloadAndCompressImage(imageUrl, imagePath);
          console.log(`📷 Image téléchargée et compressée pour: ${properties.Nom?.title?.[0]?.plain_text}`);
        } catch (err) {
          console.warn(`⚠️ Échec téléchargement image: ${err.message}`);
        }
      }

      livres.push({
        Nom: properties.Nom?.title?.[0]?.plain_text || '',
        Auteur: properties.Auteur?.rich_text?.[0]?.plain_text || '',
        'En ligne': properties['En ligne']?.url || '',
        'Lu le': properties['Lu le']?.date?.start || '',
        Résumé: properties['Résumé']?.rich_text?.[0]?.plain_text || '',
        Type: properties.Type?.select?.name || '',
        id: notionId,
      });
    }

    const outputPath = path.join(__dirname, '../src/_data/livres.json');
    fs.writeFileSync(outputPath, JSON.stringify(livres, null, 2));
    console.log(`✅ ${livres.length} livre(s) exporté(s) !`);
  } catch (error) {
    console.error('Erreur lors de la récupération des livres:', error);
  }
}

fetchLivres();
