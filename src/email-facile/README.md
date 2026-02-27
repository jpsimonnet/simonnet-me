# Aide - Email Facile

Bienvenue dans Email Facile, votre outil pour creer de belles newsletters en quelques clics.

Tout se passe dans votre navigateur : vos donnees restent sur votre ordinateur et ne sont jamais envoyees a l'exterieur.

---

## Comment ecrire mon contenu ?

Vous ecrivez votre texte dans la zone de saisie de l'onglet **Voir le code Markdown**. Le Markdown est un format de texte tres simple : vous tapez votre texte normalement, et l'outil le transforme automatiquement en un e-mail mis en forme.

Voici les mises en forme disponibles :

| Ce que vous ecrivez | Ce que cela produit |
| --- | --- |
| `# Mon titre` | Un titre principal |
| `## Sous-titre` | Un sous-titre |
| `**texte en gras**` | **texte en gras** |
| `*texte en italique*` | *texte en italique* |
| `[cliquez ici](https://...)` | Un lien cliquable |
| `- premier element` | Une liste a puces |
| `> une citation` | Un bloc de citation mis en valeur |
| `---` | Une ligne de separation |

Les tableaux et les images sont egalement pris en charge.

### Les alertes

Vous pouvez inserer des encadres colores pour attirer l'attention. Copiez l'exemple souhaite et remplacez le texte par le votre.

**Information** (encadre bleu) :

::: info
Ceci est une information utile pour vos lecteurs.
:::

```
::: info
Votre texte ici.
:::
```

**Succes** (encadre vert) :

::: success
Bonne nouvelle ! L'inscription a bien ete prise en compte.
:::

```
::: success
Votre texte ici.
:::
```

**Avertissement** (encadre orange) :

::: warn
Attention : la date limite de depot est fixee au 15 mars.
:::

```
::: warn
Votre texte ici.
:::
```

**Erreur** (encadre rouge) :

::: error
Important : ce service sera indisponible le 2 avril.
:::

```
::: error
Votre texte ici.
:::
```

### Le sommaire automatique

Inserez `[TOC]` a l'endroit ou vous souhaitez voir apparaitre un sommaire. Il sera genere automatiquement a partir de vos sous-titres.

---

## Comment importer un document existant ?

Si vous avez deja redige votre contenu ailleurs, vous pouvez l'importer directement :

- **Fichier Word** (.docx) : votre document est converti automatiquement
- **Fichier texte** (.md, .txt) : importe directement
- **Depuis un dossier partage Nextcloud** : collez le lien de partage et choisissez votre fichier

Cliquez sur le bouton **Importer** en haut de la page pour acceder a ces options.

### Les alertes et citations dans un fichier Word

Pour creer des encadres colores dans un document Word, encadrez votre texte avec des marqueurs entre crochets :

- `[INFO]` ... `[/INFO]` pour un encadre bleu (information)
- `[SUCCES]` ... `[/SUCCES]` pour un encadre vert (succes)
- `[ATTENTION]` ... `[/ATTENTION]` pour un encadre orange (avertissement)
- `[ERREUR]` ... `[/ERREUR]` pour un encadre rouge (erreur)
- `[CITATION]` ... `[/CITATION]` pour un bloc de citation

Chaque marqueur doit etre seul sur sa ligne. Exemples dans votre fichier Word :

```
[INFO]
Ceci est une information importante pour vos lecteurs.
[/INFO]
```

```
[ATTENTION]
La date limite de depot est fixee au 15 mars.
[/ATTENTION]
```

```
[CITATION]
Cette phrase sera affichee en bloc de citation.
[/CITATION]
```

A l'import, ces marqueurs seront automatiquement convertis en encadres colores ou en citations.

---

## Comment voir le resultat ?

Cliquez sur l'onglet **Voir l'apercu de l'e-mail** pour visualiser votre newsletter telle qu'elle apparaitra dans la boite mail de vos destinataires. Chaque modification est repercutee instantanement.

---

## Comment choisir un theme de couleurs ?

Dans la section **Themes**, cliquez sur l'un des themes proposes pour l'appliquer a votre newsletter. Plus de 20 themes sont disponibles : Bleu France, Emeraude, Tournesol, Glycine, Tuile, et bien d'autres.

Si vous souhaitez aller plus loin, la section **Personnaliser les couleurs** vous permet d'ajuster individuellement chaque couleur : fond, texte, titres, liens et bordures.

---

## Comment ajouter un bandeau en haut ?

Cochez **Ajouter un bandeau personnalise** dans la zone de saisie. Vous pourrez alors :

- Choisir parmi les bandeaux proposes dans la galerie
- Ou importer votre propre image

Un apercu s'affiche pour verifier le rendu avant validation.

---

## Comment ajouter un pied de page ?

Cochez **Ajouter un footer personnalise** dans la zone de saisie. Redigez ensuite le contenu de votre pied de page : nom de votre organisation, coordonnees, lien de desabonnement, etc.

---

## Comment exporter ma newsletter ?

Plusieurs options sont disponibles dans la section **Exporter** :

- **Copier** : copie le contenu pret a etre colle dans votre outil d'envoi
- **Telecharger** : enregistre les fichiers sur votre ordinateur

Le resultat est optimise pour s'afficher correctement dans tous les logiciels de messagerie (Outlook, Gmail, Thunderbird...).

---

## Comment sauvegarder mon travail ?

- **Sauvegarde automatique** : votre travail est sauvegarde en continu pendant votre session
- **Sauvegarder** : enregistre manuellement votre newsletter pour la retrouver plus tard
- **Charger** : retrouvez vos 10 dernieres sauvegardes

Pour repartir de zero, utilisez le bouton **Effacer tout**.

---

## Le suivi des clics (Matomo)

Si vous souhaitez mesurer combien de personnes cliquent sur les liens de votre newsletter, cochez l'option **Matomo** et renseignez :

- Le nom de l'expediteur
- Le titre du message
- Un nom de campagne (par exemple : `mars-2026-actu`)

Les liens seront automatiquement enrichis pour le suivi statistique.
