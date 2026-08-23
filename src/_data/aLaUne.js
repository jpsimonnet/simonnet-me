// Articles de la base d'actualités taggés « A la une » dans Notion.
// Les enregistrements sans `tags` (ancien format du JSON) sont considérés
// comme « A la une » pour rester compatible avec les données déjà publiées.
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

  return actualites.filter((item) => {
    if (!Array.isArray(item.tags) || item.tags.length === 0) return true;
    return item.tags.some((tag) => normalize(tag) === "a la une");
  });
}
