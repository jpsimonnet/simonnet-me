// Articles de la base d'actualités taggés « Outils » dans Notion.
import { chargerActualites, aPourTag } from "../_lib/actualites.js";

export default function () {
  return chargerActualites().filter((item) => aPourTag(item, "Outils"));
}
