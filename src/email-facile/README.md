# Email-Facile

## Creez vos e-mails facilement au format DSFR

Email-Facile est un outil en ligne qui permet de creer des newsletters et des e-mails professionnels respectant la charte graphique de l'Etat (DSFR). Il fonctionne entierement dans votre navigateur : aucune installation, aucun serveur, aucune donnee envoyee a l'exterieur.

---

## A qui s'adresse cet outil ?

Email-Facile est concu pour les agents et agentes des administrations publiques qui souhaitent envoyer des newsletters ou des communications par e-mail avec un rendu professionnel, sans avoir besoin de competences techniques en HTML ou en programmation.

---

## Fonctionnalites

### 1. Rediger son contenu simplement

Vous redigez votre newsletter en **Markdown**, un format de texte simple et lisible. Pas besoin de connaitre le HTML : vous ecrivez votre texte normalement, et Email-Facile s'occupe de le transformer en un e-mail mis en forme.

Par exemple, pour mettre un mot en **gras**, il suffit d'ecrire `**mot**`. Pour creer un lien, on ecrit `[texte du lien](https://adresse-du-site.fr)`.

Un contenu par defaut est fourni pour vous guider lors de votre premiere utilisation.

### 2. Importer un document existant

Vous avez deja redige votre contenu dans un autre format ? Email-Facile accepte :

- Les fichiers **Word** (.docx) : votre document est automatiquement converti
- Les fichiers **Markdown** (.md, .txt) : ils sont importes directement
- L'import depuis un **dossier partage BNUM / Nextcloud** : collez le lien de partage et choisissez le fichier a importer

### 3. Visualiser le resultat en temps reel

L'interface propose deux onglets :

- **Voir le code Markdown** : pour rediger et modifier votre contenu
- **Voir l'apercu de l'e-mail** : pour visualiser le rendu final tel qu'il apparaitra dans la boite mail de vos destinataires

Chaque modification est repercutee instantanement dans l'apercu.

### 4. Choisir un theme de couleurs

Plus de **20 themes de couleurs** sont disponibles, tous issus de la palette officielle du DSFR :

- Bleu France, Emeraude, Archipel, Tournesol, Glycine, Macaron, Tuile, Menthe, et bien d'autres
- Le theme **Sobre** pour un rendu minimaliste en noir et blanc

Il suffit de cliquer sur un theme pour l'appliquer instantanement a votre newsletter.

### 5. Personnaliser les couleurs en detail

Pour aller plus loin, vous pouvez ajuster chaque couleur individuellement :

- **Fond et texte** de l'e-mail
- **Couleur de chaque niveau de titre** (H1 a H6)
- **Couleur des liens**
- **Couleur des bordures**
- **Taille de la police**

Chaque reglage se fait via un selecteur de couleur visuel ou en saisissant directement un code couleur.

### 6. Ajouter un bandeau d'en-tete

Vous pouvez ajouter une image de bandeau en haut de votre newsletter :

- **Galerie de bandeaux** : plusieurs bandeaux pre-enregistres sont disponibles
- **Import personnalise** : importez votre propre image (SVG, PNG, JPG ou WEBP)
- Un apercu du bandeau s'affiche avant validation

### 7. Ajouter un pied de page (footer)

Un pied de page personnalisable peut etre ajoute en bas de votre newsletter. Il contient generalement :

- Le nom de votre organisation
- Les coordonnees de contact
- Un lien de desabonnement

Le contenu du footer se redige en Markdown ou en HTML selon votre preference.

### 8. Suivre les clics avec Matomo

Email-Facile integre le **marquage Matomo** pour suivre les performances de vos envois. En cochant l'option correspondante, chaque lien de votre newsletter sera automatiquement enrichi avec des parametres de suivi :

- **Expediteur** : le nom de l'emetteur
- **Titre** : l'objet du message
- **Nom de campagne** : un identifiant pour retrouver facilement les statistiques (par exemple : `sept-2025-actu`)

Cela vous permet ensuite de mesurer dans Matomo combien de personnes ont clique sur chaque lien.

### 9. Sommaire automatique

Email-Facile genere automatiquement un **sommaire** (table des matieres) a partir de vos titres de niveau 2. Chaque section est numerotee et un lien "Retour au sommaire" est ajoute apres chaque section pour faciliter la navigation.

### 10. Exporter et partager

Plusieurs options d'export sont disponibles :

- **Copier le HTML** : copie le code HTML de l'e-mail dans votre presse-papier, pret a etre colle dans votre outil d'envoi
- **Copier le Markdown** : copie la version texte brut
- **Telecharger le HTML** : telecharge le fichier HTML et le fichier CSS associe sur votre ordinateur

Le HTML genere est **optimise pour les clients de messagerie** : il utilise une mise en page en tableaux et des styles integres directement dans le code, ce qui garantit un affichage correct dans Outlook, Gmail, Thunderbird et les autres logiciels de messagerie.

### 11. Sauvegarder et reprendre plus tard

- **Sauvegarder** : enregistre votre travail en cours dans votre navigateur
- **Charger** : retrouvez vos 10 dernieres sauvegardes et reprenez la ou vous vous etiez arrete(e)
- **Sauvegarde automatique** : votre travail est sauvegarde automatiquement pendant la session en cours

Vos donnees restent sur votre ordinateur et ne sont jamais envoyees a un serveur.

### 12. Accessibilite

Email-Facile respecte les normes d'accessibilite (RGAA) :

- Navigation complete au clavier
- Compatible avec les lecteurs d'ecran
- Contrastes de couleurs conformes aux standards
- Une version texte brut est generee en complement du HTML pour les messageries qui n'affichent pas le HTML

---

## Comment utiliser Email-Facile ?

1. **Ouvrez** l'application dans votre navigateur
2. **Redigez** votre contenu dans la zone de texte, ou **importez** un fichier Word / Markdown
3. **Choisissez** un theme de couleurs ou personnalisez les couleurs
4. **Ajoutez** un bandeau et/ou un pied de page si vous le souhaitez
5. **Configurez** le suivi Matomo si necessaire
6. **Previsualisez** le resultat dans l'onglet "Apercu"
7. **Exportez** : copiez le HTML ou telechargez les fichiers

---

## Formats de texte Markdown pris en charge

| Ce que vous ecrivez | Ce que cela produit |
| --- | --- |
| `# Titre principal` | Un titre de niveau 1 |
| `## Sous-titre` | Un titre de niveau 2 |
| `**texte en gras**` | **texte en gras** |
| `*texte en italique*` | *texte en italique* |
| `[lien](https://...)` | Un lien cliquable |
| `- element` | Une liste a puces |
| `> citation` | Un bloc de citation mis en exergue |
| `---` | Une ligne de separation |

Les tableaux, les alertes (info, succes, avertissement, erreur) et les images sont egalement pris en charge.

---

## Donnees et confidentialite

- Aucune donnee n'est envoyee a un serveur exterieur
- Tout le traitement se fait localement dans votre navigateur
- Les sauvegardes sont stockees dans votre navigateur (localStorage)
- Vous pouvez effacer toutes les donnees a tout moment via le bouton "Effacer tout"
