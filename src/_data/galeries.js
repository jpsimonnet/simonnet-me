import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";
import markdownit from "markdown-it";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const md = markdownit();

const photosDir = path.join(__dirname, "..", "assets", "photos");

export default function () {
  if (!fs.existsSync(photosDir)) return [];

  const folders = fs.readdirSync(photosDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  const galeries = folders.map(folder => {
    const folderPath = path.join(photosDir, folder.name);
    const indexPath = path.join(folderPath, "index.md");

    if (!fs.existsSync(indexPath)) return null;

    const raw = fs.readFileSync(indexPath, "utf8");
    const { data, content } = matter(raw);

    const images = fs.readdirSync(folderPath)
      .filter(f => /\.(webp|jpg|jpeg|png|avif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const total = images.length;

    return {
      slug: folder.name,
      title: data.title || folder.name,
      description: data.description || "",
      date: data.date || "2024-01-01",
      body: content.trim() ? md.render(content) : "",
      thumbnail: `/assets/photos/${folder.name}/${data.thumbnail || images[0]}`,
      url: `/photos/${folder.name}/`,
      images: images.map((filename, i) => ({
        src: `/assets/photos/${folder.name}/${filename}`,
        alt: `${data.title || folder.name} — photo ${i + 1} sur ${total}`
      }))
    };
  }).filter(Boolean);

  return galeries.sort((a, b) => new Date(b.date) - new Date(a.date));
}
