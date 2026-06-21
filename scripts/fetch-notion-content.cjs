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
const n2m = new NotionToMarkdown({
  notionClient: notion,
  config: {
    parseChildPages: false,
    convertImagesToBase64: false,
  },
});

// Custom transformers for blocks not supported by default
// Video/embed transformer: convert Notion video and embed blocks to HTML
n2m.setCustomTransformer('video', async (block) => {
  const video = block.video;
  const url = video.type === 'external' ? video.external?.url : video.file?.url;
  if (!url) return '';

  const captionArr = video.caption || [];
  const caption = captionArr.map((t) => t.plain_text).join('');

  const embedUrl = toEmbedUrl(url);
  if (embedUrl) {
    const figCaption = caption ? `<figcaption>${caption}</figcaption>` : '';
    return `\n<figure class="video-embed"><iframe src="${embedUrl}" frameborder="0" allowfullscreen loading="lazy" title="${caption || 'Vidéo'}"></iframe>${figCaption}</figure>\n`;
  }

  return `\n<p><a href="${url}">${caption || url}</a></p>\n`;
});

n2m.setCustomTransformer('embed', async (block) => {
  const url = block.embed?.url;
  if (!url) return '';

  const captionArr = block.embed?.caption || [];
  const caption = captionArr.map((t) => t.plain_text).join('');

  const embedUrl = toEmbedUrl(url);
  if (embedUrl) {
    const figCaption = caption ? `<figcaption>${caption}</figcaption>` : '';
    return `\n<figure class="video-embed"><iframe src="${embedUrl}" frameborder="0" allowfullscreen loading="lazy" title="${caption || 'Contenu embarqué'}"></iframe>${figCaption}</figure>\n`;
  }

  return `\n<p><a href="${url}">${caption || url}</a></p>\n`;
});

function toEmbedUrl(url) {
  // YouTube
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  // Dailymotion
  m = url.match(/dailymotion\.com\/video\/([\w]+)/);
  if (m) return `https://www.dailymotion.com/embed/video/${m[1]}`;
  // Vimeo (supports vimeo.com/ID, vimeo.com/video/ID, player.vimeo.com/video/ID)
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  // PeerTube-style or other iframe-ready URLs
  if (url.includes('/embed/') || url.includes('/player/')) return url;
  return null;
}

// Image transformer: download image locally + parse caption directives
// Directives: ":right:", ":left:", ":center:" at start of caption
n2m.setCustomTransformer('image', async (block) => {
  const img = block.image;
  const url = img.type === 'file' ? img.file.url : img.external?.url;
  if (!url) return '';

  const captionArr = img.caption || [];
  const rawCaption = captionArr.map((t) => t.plain_text).join('');

  let floatClass = '';
  let caption = rawCaption;
  const match = caption.match(/^:(right|left|center)(?::\s*(.*))?$/s);
  if (match) {
    floatClass = `float-${match[1]}`;
    caption = match[2] || '';
  }

  // Download image locally (Notion URLs expire after ~1h)
  const ext = sharp ? 'webp' : (url.match(/\.(jpe?g|png|gif|webp)(\?|$)/i)?.[1] || 'jpg');
  const filename = `${block.id.replace(/-/g, '')}.${ext}`;
  const destPath = path.join(INLINE_IMAGES_DIR, filename);
  let localUrl = '';
  try {
    if (!(fs.existsSync(destPath) && fs.statSync(destPath).size > 100)) {
      await downloadImage(url, destPath);
    }
    localUrl = `/assets/images/notion-inline/${filename}`;
  } catch (err) {
    console.warn(`⚠️ Inline image: ${err.message}`);
    return '';
  }

  const alt = caption || '';
  const imgHtml = `<img src="${localUrl}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy">`;
  const figClass = floatClass ? ` class="${floatClass}"` : '';
  const figCaption = caption ? `<figcaption>${caption}</figcaption>` : '';

  return `\n<figure${figClass}>${imgHtml}${figCaption}</figure>\n`;
});

n2m.setCustomTransformer('callout', async (block) => {
  const text = (block.callout.rich_text || [])
    .map((t) => t.plain_text)
    .join('');
  const emoji = block.callout.icon?.emoji || '💡';
  return `> ${emoji} ${text}`;
});

n2m.setCustomTransformer('column_list', async (block) => {
  try {
    const children = await notion.blocks.children.list({ block_id: block.id });
    const cols = [];
    for (const col of children.results) {
      const colChildren = await n2m.blocksToMarkdown([col]);
      cols.push(n2m.toMarkdownString(colChildren).parent || '');
    }
    return cols.join('\n\n');
  } catch (e) {
    return '';
  }
});

n2m.setCustomTransformer('table', async (block) => {
  try {
    const children = await notion.blocks.children.list({ block_id: block.id });
    const rows = children.results.filter((c) => c.type === 'table_row');
    if (rows.length === 0) return '';
    const hasHeader = block.table?.has_column_header;

    const renderRow = (row) =>
      '| ' + (row.table_row.cells || [])
        .map((cell) => (cell || []).map((t) => t.plain_text).join('').replace(/\|/g, '\\|') || ' ')
        .join(' | ') + ' |';

    let out = '\n' + renderRow(rows[0]) + '\n';
    const colCount = rows[0].table_row.cells?.length || 0;
    if (hasHeader) {
      out += '|' + ' --- |'.repeat(colCount) + '\n';
    } else {
      out = '|' + ' --- |'.repeat(colCount) + '\n' + renderRow(rows[0]) + '\n' + '|' + ' --- |'.repeat(colCount) + '\n';
    }
    for (const row of rows.slice(1)) {
      out += renderRow(row) + '\n';
    }
    return out;
  } catch (e) {
    console.warn('⚠️ Table conversion failed:', e.message);
    return '';
  }
});

n2m.setCustomTransformer('toggle', async (block) => {
  const text = (block.toggle.rich_text || [])
    .map((t) => t.plain_text)
    .join('');
  try {
    const children = await notion.blocks.children.list({ block_id: block.id });
    const childMd = await n2m.blocksToMarkdown(children.results);
    const content = n2m.toMarkdownString(childMd).parent || '';
    return `<details><summary>${text}</summary>\n\n${content}\n\n</details>`;
  } catch (e) {
    return `**${text}**`;
  }
});

const DB_ID = '347f9c97e6ff80b29ff1caff138f55a1';
const IMAGES_DIR = path.join(__dirname, '../src/assets/images/notion');
const INLINE_IMAGES_DIR = path.join(__dirname, '../src/assets/images/notion-inline');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
if (!fs.existsSync(INLINE_IMAGES_DIR)) {
  fs.mkdirSync(INLINE_IMAGES_DIR, { recursive: true });
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
    await sharp(buffer).webp({ quality: 75 }).toFile(destPath);
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
    if (typeof mdString === 'string') return mdString;
    return (mdString && typeof mdString.parent === 'string') ? mdString.parent : '';
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
  // Extract rubrique from various possible field names and types
  const rubriqueField = props.Rubrique || props.Rubriques
                     || props.rubrique || props.rubriques
                     || props.Category || props.Categorie
                     || {};
  const rubrique = rubriqueField.select?.name
                || rubriqueField.multi_select?.[0]?.name
                || rubriqueField.rich_text?.[0]?.plain_text
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

    // Log detected properties and their types for debugging
    const props = pages[0].properties;
    console.log('🔍 Propriétés détectées:');
    for (const [name, value] of Object.entries(props)) {
      console.log(`   - ${name} (${value.type})`);
    }

    const interventions = [];
    const pagesData = {};

    for (const page of pages) {
      const entry = await processEntry(page);
      const rubNorm = entry.rubrique.toLowerCase().trim();

      console.log(`➡️  "${entry.title}" | slug=${entry.slug} | rubrique="${entry.rubrique}" | body=${entry.body.length} chars`);

      if (rubNorm === 'intervention' || rubNorm === 'interventions') {
        interventions.push(entry);
      } else {
        pagesData[entry.slug] = { title: entry.title, content: entry.body };
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

main().then(() => process.exit(0)).catch(() => process.exit(1));
