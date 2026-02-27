# Moteur de Quiz — Documentation

Ce moteur de quiz fonctionne entièrement dans le navigateur, sans serveur.  
Il utilise le **DSFR** (Système de Design de l'État) pour l'interface.

---

## Structure des fichiers

```
quiz-dsfr/
├── index.html          ← le moteur (à ouvrir dans un navigateur)
├── README.md           ← cette documentation
└── questions/          ← votre dossier de questions
    ├── question-01.md
    ├── question-01.webp         ← image de la question 01 (optionnelle)
    ├── question-01-reponse.webp ← image de la réponse 01 (optionnelle)
    ├── question-02.md
    └── ...
```

---

## Comment utiliser

1. Ouvrez `index.html` dans un navigateur (Chrome, Firefox, Edge…)
2. Cliquez sur la zone de chargement et sélectionnez votre dossier `questions/`
3. Cliquez sur **Démarrer le quiz**

> **Mode local** : vous pouvez distribuer l'ensemble du dossier `quiz-dsfr/` zippé.  
> L'utilisateur dézippe et ouvre simplement `index.html`.

---

## Format des fichiers MD

Chaque question est un fichier `.md` avec un en-tête YAML entre `---`.

### En-tête YAML (frontmatter)

| Champ        | Obligatoire | Description                                             |
|--------------|-------------|---------------------------------------------------------|
| `type`       | oui         | Type de question (voir ci-dessous)                      |
| `question`   | oui         | Texte de la question                                    |
| `points`     | non         | Points attribués (défaut : `1`)                         |
| `explication`| non         | Explication affichée après la réponse                   |
| `reponse`    | texte-libre | La bonne réponse attendue                               |
| `tolerance`  | non         | Mode de comparaison : `exacte` (défaut), `contient`, `regex` |

---

## Types de questions

### `qcm` — QCM une seule réponse

```markdown
---
type: qcm
question: "Dans quel roman Hugo décrit-il la bataille de Waterloo ?"
points: 1
explication: "C'est dans Les Misérables."
---

- Notre-Dame de Paris
- [x] Les Misérables
- Les Travailleurs de la mer
- Quatrevingt-treize
```

Marquez la bonne réponse avec `[x]`.  
Les réponses sont **mélangées aléatoirement** à chaque partie.

---

### `qcm-multiple` — QCM plusieurs réponses

```markdown
---
type: qcm-multiple
question: "Lesquelles sont des œuvres de Victor Hugo ?"
points: 2
---

- [x] Hernani
- Germinal
- [x] Les Contemplations
- Madame Bovary
```

Marquez toutes les bonnes réponses avec `[x]`.  
Score partiel accordé si au moins une bonne réponse sélectionnée.

---

### `vrai-faux` — Vrai ou Faux

```markdown
---
type: vrai-faux
question: "Victor Hugo est né à Besançon en 1802."
points: 1
explication: "Oui, le 26 février 1802."
---

[x] Vrai
Faux
```

La première ligne du corps est toujours **Vrai**, la seconde **Faux**.  
Marquez la bonne réponse avec `[x]`.

---

### `texte-libre` — Réponse saisie librement

```markdown
---
type: texte-libre
question: "En quelle année Victor Hugo est-il mort ?"
points: 1
reponse: "1885"
tolerance: exacte
explication: "Il est décédé le 22 mai 1885."
---
```

**Valeurs de `tolerance`** :
- `exacte` — correspondance exacte (insensible à la casse et aux accents)
- `contient` — la réponse doit contenir le mot attendu (ou l'inverse)
- `regex` — expression régulière (avancé)

---

### `ordre` — Remise en ordre (glisser-déposer)

```markdown
---
type: ordre
question: "Remettez ces romans dans l'ordre chronologique."
points: 2
explication: "Bug-Jargal 1826, Notre-Dame 1831, Les Misérables 1862, Quatrevingt-treize 1874."
---

- [3] Les Misérables
- [1] Bug-Jargal
- [4] Quatrevingt-treize
- [2] Notre-Dame de Paris
```

Le chiffre entre crochets `[N]` indique la **position correcte** (1 = premier).  
Les éléments sont mélangés à l'affichage. Score proportionnel au nombre d'éléments bien placés.

---

## Images

Les images sont **optionnelles**. Elles sont associées automatiquement par nom de fichier.

| Fichier                        | Rôle                              |
|-------------------------------|-----------------------------------|
| `question-01.webp` (ou .png, .jpg) | Affichée à droite de la question  |
| `question-01-reponse.webp`    | Affichée dans l'explication       |

> Les formats `.webp`, `.png`, `.jpg` et `.jpeg` sont supportés.

---

## Raccourcis clavier

| Touche          | Action                                  |
|-----------------|-----------------------------------------|
| `1`, `2`, `3`…  | Sélectionner une réponse (QCM, V/F)     |
| `Entrée`        | Valider (QCM multiple, texte libre)     |

---

## Export ZIP

Pour distribuer le quiz :

1. Placez vos fichiers `.md` et images dans le dossier `questions/`
2. Zippez l'ensemble du dossier `quiz-dsfr/`
3. Envoyez le ZIP — l'utilisateur dézippe et ouvre `index.html`

Aucune installation, aucun serveur requis.
