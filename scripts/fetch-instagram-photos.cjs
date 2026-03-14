// scripts/fetch-instagram-photos.cjs
// Récupère les photos Instagram via l'API Graph et les regroupe par hashtag
//
// Prérequis :
// 1. Convertir votre compte Instagram en compte Business ou Creator (gratuit)
// 2. Créer une application Facebook sur https://developers.facebook.com
// 3. Générer un token d'accès longue durée (60 jours)
// 4. Configurer les variables d'environnement INSTAGRAM_ACCESS_TOKEN et INSTAGRAM_HASHTAGS
//
// Usage : node scripts/fetch-instagram-photos.cjs

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_HASHTAGS = process.env.INSTAGRAM_HASHTAGS; // ex: "tokyo,architecture,streetart"
const INSTAGRAM_LIMIT = parseInt(process.env.INSTAGRAM_LIMIT || '100', 10);

async function fetchAllMedia(accessToken, limit) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  let url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${Math.min(limit, 100)}&access_token=${accessToken}`;
  const allMedia = [];

  while (url && allMedia.length < limit) {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur API Instagram : ${JSON.stringify(error)}`);
    }
    const data = await response.json();
    allMedia.push(...(data.data || []));
    url = data.paging?.next || null;
  }

  return allMedia.slice(0, limit);
}

function extractHashtags(caption) {
  if (!caption) return [];
  const matches = caption.match(/#(\w+)/g);
  return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
}

function groupByHashtags(media, targetHashtags) {
  const albums = {};

  for (const tag of targetHashtags) {
    albums[tag] = {
      hashtag: tag,
      label: `#${tag}`,
      photos: []
    };
  }

  for (const item of media) {
    if (item.media_type === 'VIDEO') continue; // On ne garde que les images
    const hashtags = extractHashtags(item.caption);
    for (const tag of targetHashtags) {
      if (hashtags.includes(tag.toLowerCase())) {
        albums[tag].photos.push({
          id: item.id,
          url: item.media_url,
          thumbnail: item.thumbnail_url || item.media_url,
          permalink: item.permalink,
          caption: (item.caption || '').replace(/#\w+/g, '').trim(),
          date: item.timestamp
        });
      }
    }
  }

  // Ne retourner que les albums qui ont des photos, triés par date de la plus récente photo
  return Object.values(albums)
    .filter(album => album.photos.length > 0)
    .map(album => ({
      ...album,
      photos: album.photos.sort((a, b) => new Date(b.date) - new Date(a.date))
    }));
}

async function main() {
  const outputPath = path.join(__dirname, '../src/_data/instagram.json');

  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.log('⚠️  INSTAGRAM_ACCESS_TOKEN non défini.');
    console.log('   Le fichier instagram.json existant sera conservé.');
    console.log('   Pour configurer l\'API Instagram :');
    console.log('   1. Convertissez votre compte en Business/Creator');
    console.log('   2. Créez une app Facebook sur https://developers.facebook.com');
    console.log('   3. Ajoutez INSTAGRAM_ACCESS_TOKEN dans votre .env');
    return;
  }

  if (!INSTAGRAM_HASHTAGS) {
    console.log('⚠️  INSTAGRAM_HASHTAGS non défini.');
    console.log('   Ajoutez INSTAGRAM_HASHTAGS="tag1,tag2,tag3" dans votre .env');
    return;
  }

  const targetHashtags = INSTAGRAM_HASHTAGS.split(',').map(h => h.trim().toLowerCase());
  console.log(`📸 Récupération des photos Instagram...`);
  console.log(`🏷️  Hashtags recherchés : ${targetHashtags.map(h => '#' + h).join(', ')}`);

  try {
    const media = await fetchAllMedia(INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_LIMIT);
    console.log(`📷 ${media.length} médias récupérés depuis Instagram`);

    const albums = groupByHashtags(media, targetHashtags);

    const totalPhotos = albums.reduce((sum, a) => sum + a.photos.length, 0);
    console.log(`🗂️  ${albums.length} album(s) créé(s) avec ${totalPhotos} photo(s) au total`);

    for (const album of albums) {
      console.log(`   #${album.hashtag} : ${album.photos.length} photo(s)`);
    }

    fs.writeFileSync(outputPath, JSON.stringify(albums, null, 2));
    console.log(`✅ Données exportées dans ${outputPath}`);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération Instagram :', error.message);
    process.exit(1);
  }
}

main();
