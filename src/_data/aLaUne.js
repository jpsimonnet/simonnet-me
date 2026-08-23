// Articles de la base d'actualités taggés « A la une » dans Notion.
// Les enregistrements sans `tags` (ancien format du JSON) sont considérés
// comme « A la une » pour rester compatible avec les données déjà publiées.
import { chargerActualites, aPourTag } from "../_lib/actualites.js";

export default function () {
  return chargerActualites().filter(
    (item) => item.tags.length === 0 || aPourTag(item, "A la une")
  );
}
