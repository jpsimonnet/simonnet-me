// scripts/fetch-notion-content.cjs
// Unified fetcher: one Notion database, split by "Rubrique" field

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
const n2m = new NotionToMarkdown({ notionClient: notion });

const DB_ID = '347f9c97e6ff80b29ff1caff138f55a1';
const IMAGES_DIR = path.join(__dirname, '../src/assets/images/notion');

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

async function downloadImage(url, destPath) {
  const buffer = await downloadBuffer(url);
  if (sharp) {
    await sharp(buffer).webp({ quality: 85 }).toFile(destPath);
  } else {
    fs.writeFileSync(destPath, buffer);
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchAllEntries() {
  const pages = [];
  let cursor = undefined;

  do {
    const response = await notion.databases.query({
      database_id: DB_ID,
      start_cursor: cursor,
      sorts: [{ property: 'Date', direction: 'descending' }],
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function fetchPageBody(pageId) {
  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    return mdString.parent || mdString;
  } catch (err) {
    console.warn(`⚠️ Body: ${err.message}`);
    return '';
  }
}

async function fetchCoverImage(pageId) {
  try {
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    const imageBlock = blocks.results.find((b) => b.type === 'image');
    if (!imageBlock) return null;
    const img = imageBlock.image;
    if (img.type === 'file') return img.file.url;
    if (img.type === 'external') return img.external.url;
    return null;
  } catch (e) {
    return null;
  }
}

async function processEntry(page) {
  const props = page.properties;

  const title = props.Nom?.title?.[0]?.plain_text
             || props.Name?.title?.[0]?.plain_text
             || '';
  const date = props.Date?.date?.start || '';
  const description = props.Description?.rich_text?.[0]?.plain_text || '';
  const slugProp = props.Slug?.rich_text?.[0]?.plain_text || '';
  const slug = slugProp || slugify(title);
  const rubrique = props.Rubrique?.select?.name
                || props.rubrique?.select?.name
                || '';
  const imageUrlProp = props.Image?.url
                    || props.Image?.files?.[0]?.file?.url
                    || props.Image?.files?.[0]?.external?.url
                    || props['URL image']?.url
                    || '';

  const body = await fetchPageBody(page.id);

  let coverPath = '';
  const coverUrl = imageUrlProp || await fetchCoverImage(page.id);
  if (coverUrl) {
    const ext = sharp ? 'webp' : 'jpg';
    const filename = `${slug}.${ext}`;
    const destPath = path.join(IMAGES_DIR, filename);
    try {
      await downloadImage(coverUrl, destPath);
      coverPath = `/assets/images/notion/${filename}`;
    } catch (err) {
      console.warn(`⚠️ Image "${title}": ${err.message}`);
    }
  }

  return { title, date, description, slug, rubrique, image: coverPath, body };
}

async function main() {
  try {
    const pages = await fetchAllEntries();

    if (pages.length === 0) {
      console.log('Aucune entrée trouvée dans la base.');
      return;
    }

    // Log detected properties for debugging
    const props = pages[0].properties;
    console.log('🔍 Propriétés détectées:', Object.keys(props));

    const interventions = [];
    const pagesData = {};

    for (const page of pages) {
      const entry = await processEntry(page);
      const rubNorm = entry.rubrique.toLowerCase().trim();

      if (rubNorm === 'intervention') {
        interventions.push(entry);
        console.log(`📋 Intervention: ${entry.title}`);
      } else {
        pagesData[entry.slug] = { title: entry.title, content: entry.body };
        console.log(`📄 Page: ${entry.title} (slug: ${entry.slug})`);
      }
    }

    const interventionsPath = path.join(__dirname, '../src/_data/notionInterventions.json');
    fs.writeFileSync(interventionsPath, JSON.stringify(interventions, null, 2));

    const pagesPath = path.join(__dirname, '../src/_data/notionPages.json');
    fs.writeFileSync(pagesPath, JSON.stringify(pagesData, null, 2));

    console.log(`✅ ${interventions.length} intervention(s) + ${Object.keys(pagesData).length} page(s) exportée(s) !`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

main();
