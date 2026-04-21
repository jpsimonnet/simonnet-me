// scripts/fetch-notion-actualite.cjs

require('dotenv').config();
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

let sharp;
try { sharp = require('sharp'); } catch (e) { sharp = null; }

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion, config: { parseChildPages: false } });

const IMAGES_DIR = path.join(__dirname, '../src/assets/images/actualites');
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
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

async function downloadAndCompressImage(url, destPath) {
  const buffer = await downloadBuffer(url);
  if (sharp) {
    await sharp(buffer).resize(800, null, { withoutEnlargement: true }).webp({ quality: 85 }).toFile(destPath);
  } else {
    fs.writeFileSync(destPath, buffer);
  }
}

async function fetchAllPages(databaseId) {
  const pages = [];
  let cursor = undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      filter: {
        property: 'Type',
        multi_select: { contains: 'A la une' },
      },
      sorts: [{ property: 'Created', direction: 'descending' }],
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function fetchActualite() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const pages = await fetchAllPages(databaseId);

    if (pages.length === 0) {
      console.log('Aucune actualité "A la une" trouvée.');
      return;
    }

    console.log(`🔍 Propriétés détectées:`, Object.keys(pages[0].properties));

    const actualites = [];

    for (const page of pages) {
      const props = page.properties;
      const title = props.Nom?.title?.[0]?.plain_text || '';
      const url = props.URL?.url || '';
      const created = props.Created?.created_time || '';
      const summary = props['Résumé']?.rich_text?.[0]?.plain_text || '';

      // Image: try "URL image" (url), then "Image" (files), then "image" (files)
      let imageUrl = props['URL image']?.url || '';
      if (!imageUrl) {
        const filesField = props.Image || props.image;
        if (filesField?.files?.length > 0) {
          const f = filesField.files[0];
          imageUrl = f.file?.url || f.external?.url || '';
        }
      }

      const slug = slugify(title) || page.id.replace(/-/g, '').substring(0, 12);

      // Download and compress image locally
      let localImage = '';
      if (imageUrl) {
        const filename = `${slug}.webp`;
        const destPath = path.join(IMAGES_DIR, filename);
        try {
          await downloadAndCompressImage(imageUrl, destPath);
          localImage = `/assets/images/actualites/${filename}`;
        } catch (err) {
          console.warn(`⚠️ Image "${title}": ${err.message}`);
          localImage = imageUrl;
        }
      }

      // Fetch body from Notion page
      let body = '';
      try {
        const mdBlocks = await n2m.pageToMarkdown(page.id);
        const mdString = n2m.toMarkdownString(mdBlocks);
        body = (typeof mdString === 'string') ? mdString : (mdString?.parent || '');
      } catch (err) {
        // No body is fine
      }

      actualites.push({
        title,
        url,
        created,
        summary,
        image: localImage,
        slug,
        body,
      });
    }

    const outputPath = path.join(__dirname, '../src/_data/actualite.json');
    fs.writeFileSync(outputPath, JSON.stringify(actualites, null, 2));
    console.log(`✅ ${actualites.length} actualité(s) "A la une" exportée(s) !`);
  } catch (error) {
    console.error('Erreur lors de la récupération des actualités:', error);
  }
}

fetchActualite();
