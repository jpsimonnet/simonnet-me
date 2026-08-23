// Articles de la base d'actualités taggés « Outils » dans Notion.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const normalize = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default function () {
  const file = path.join(__dirname, "actualite.json");
  if (!fs.existsSync(file)) return [];

  const actualites = JSON.parse(fs.readFileSync(file, "utf8"));

  return actualites.filter(
    (item) => Array.isArray(item.tags) && item.tags.some((tag) => normalize(tag) === "outils")
  );
}
