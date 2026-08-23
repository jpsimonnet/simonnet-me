// Lecture partagée de la base d'actualités Notion (src/_data/actualite.json).
// Toutes les pages qui exploitent ces données passent par ici, pour que les
// listes (« À la une », « Outils ») et les pages de détail utilisent
// exactement les mêmes slugs.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, "..", "_data", "actualite.json");

// Comparaison de tags insensible à la casse et aux accents (« À la une » = « A la une »)
export const normaliser = (valeur) =>
  String(valeur).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const slugifier = (texte) =>
  String(texte)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);

export const aPourTag = (item, tag) =>
  item.tags.some((t) => normaliser(t) === normaliser(tag));

// Deux articles Notion peuvent porter le même titre : sans suffixe, leurs pages
// de détail s'écriraient au même endroit et Eleventy échoue
// (« Output conflict: multiple input files are writing to… »).
export function chargerActualites() {
  if (!fs.existsSync(SOURCE)) return [];

  const items = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const occurrences = new Map();

  return items.map((item, index) => {
    const base = item.slug || slugifier(item.title) || `article-${index + 1}`;
    const rang = (occurrences.get(base) || 0) + 1;
    occurrences.set(base, rang);

    return {
      ...item,
      tags: Array.isArray(item.tags) ? item.tags : [],
      slug: rang === 1 ? base : `${base}-${rang}`,
    };
  });
}
