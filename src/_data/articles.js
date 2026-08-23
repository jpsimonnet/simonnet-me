// Tous les articles de la base d'actualités Notion, slugs dédoublonnés.
// Sert à générer les pages de détail /actualite/<slug>/.
import { chargerActualites } from "../_lib/actualites.js";

export default function () {
  return chargerActualites();
}
