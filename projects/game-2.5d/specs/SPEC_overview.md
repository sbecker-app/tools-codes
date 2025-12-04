# Game 2.5D - Spécification Technique

> Version: 0.1.0
> Date: 2025-12-03
> Auteur: Simon Becker

---

## 1. Vision du Projet

### 1.1 Concept
Jeu d'aventure 2.5D avec effet de parallaxe et navigation multi-directionnelle. Le joueur incarne soit un prince (garçon blond aux yeux bleus) soit une princesse, accompagné d'un robot ami fidèle.

### 1.2 Objectifs Techniques
- **Pure JS/CSS** : Pas de framework lourd, code propre et modulaire
- **Composants réutilisables** : Architecture component-based
- **3 Applications** : Game, BackOffice, StageMaker
- **Évolutif** : Histoire et niveaux extensibles via données JSON/MD

---

## 2. Les 3 Applications

### 2.1 GAME (Jeu Principal)
```
Fonctionnalités:
├── Sélection du personnage (Prince/Princesse)
├── Navigation 2.5D (4 modes de déplacement)
├── Système de parallaxe multi-couches
├── Gestion des niveaux
└── Progression de l'histoire
```

### 2.2 BACKOFFICE (Gestion des Assets)
```
Fonctionnalités:
├── Bibliothèque de sprites
│   ├── Organisés par thème
│   ├── Organisés par mode (avancer/monter/descendre/reculer)
│   └── Organisés par catégorie (décor/personnage/objet)
├── Preview et édition des métadonnées
├── Import/Export de packs
└── Gestion des animations
```

### 2.3 STAGE MAKER (Éditeur de Niveaux)
```
Fonctionnalités:
├── Vue Macroscopique
│   ├── Définition des zones de navigation
│   ├── Points de transition (avancer/monter/descendre/reculer)
│   └── Flow du niveau
├── Vue Microscopique
│   ├── Placement des sprites de décor
│   ├── Configuration des couches de parallaxe
│   └── Placement des éléments interactifs
└── Export JSON du niveau
```

---

## 3. Modes de Navigation

### 3.1 Les 4 Directions
| Mode | Direction | Description | Caméra |
|------|-----------|-------------|--------|
| `FORWARD` | Avancer | Progression horizontale droite | Défilement horizontal |
| `BACKWARD` | Reculer | Retour horizontal gauche | Défilement horizontal inverse |
| `UP` | Monter | Escalade verticale | Défilement vertical haut |
| `DOWN` | Descendre | Descente verticale | Défilement vertical bas |

### 3.2 Zones de Transition
Chaque niveau définit des zones qui déclenchent un changement de mode de navigation.

```javascript
// Exemple de zone
{
  "id": "zone_001",
  "type": "TRANSITION",
  "from": "FORWARD",
  "to": "UP",
  "trigger": { "x": 1200, "y": 400, "width": 100, "height": 200 }
}
```

---

## 4. Personnages

### 4.1 Personnages Principaux

#### Le Prince
- **Apparence**: Garçon blond aux yeux bleus
- **Sprites requis**: idle, walk, climb, fall, interact
- **États**: 4 directions × états d'animation

#### La Princesse
- **Apparence**: Petite fille (design à définir)
- **Sprites requis**: idle, walk, climb, fall, interact
- **États**: 4 directions × états d'animation

#### Le Robot Ami
- **Rôle**: Compagnon PNJ
- **Comportement**: Suit le personnage principal, aide contextuelle
- **Sprites requis**: idle, follow, help, celebrate

### 4.2 Structure des Sprites
```
assets/sprites/characters/
├── prince/
│   ├── forward/
│   │   ├── idle.png
│   │   ├── walk_01.png ... walk_08.png
│   │   └── interact.png
│   ├── up/
│   ├── down/
│   └── backward/
├── princess/
│   └── (même structure)
└── robot/
    └── (structure adaptée)
```

---

## 5. Système de Parallaxe

### 5.1 Couches (Layers)
```
Couche 5 (arrière-plan lointain) ─── Vitesse: 0.1x
Couche 4 (arrière-plan proche)   ─── Vitesse: 0.3x
Couche 3 (décor milieu)          ─── Vitesse: 0.6x
Couche 2 (éléments proches)      ─── Vitesse: 0.9x
Couche 1 (sol/plateforme)        ─── Vitesse: 1.0x (référence)
Couche 0 (premier plan)          ─── Vitesse: 1.2x
```

### 5.2 Configuration par Zone
Chaque zone peut avoir sa propre configuration de parallaxe.

```javascript
{
  "zoneId": "forest_01",
  "parallax": {
    "layers": [
      { "depth": 5, "image": "sky.png", "speed": 0.1 },
      { "depth": 4, "image": "mountains.png", "speed": 0.3 },
      { "depth": 3, "image": "trees_far.png", "speed": 0.6 },
      { "depth": 2, "image": "trees_near.png", "speed": 0.9 },
      { "depth": 1, "image": "ground.png", "speed": 1.0 }
    ]
  }
}
```

---

## 6. Architecture Technique

### 6.1 Structure des Dossiers
```
game-2.5d/
├── specs/                    # Spécifications (ce dossier)
├── docs/                     # Documentation technique
├── src/
│   ├── game/                 # Application jeu
│   │   ├── index.html
│   │   ├── main.js
│   │   └── styles/
│   ├── backoffice/           # Application BO
│   │   ├── index.html
│   │   ├── main.js
│   │   └── styles/
│   ├── stage-maker/          # Application éditeur
│   │   ├── index.html
│   │   ├── main.js
│   │   └── styles/
│   └── shared/               # Code partagé
│       ├── components/       # Composants réutilisables
│       ├── utils/            # Fonctions utilitaires
│       ├── styles/           # Styles partagés (CSS)
│       ├── types/            # Définitions TypeScript
│       └── assets/           # Assets communs
├── assets/
│   ├── sprites/              # Tous les sprites
│   ├── backgrounds/          # Fonds et parallaxe
│   ├── audio/                # Sons et musiques
│   └── fonts/                # Polices
└── data/
    ├── levels/               # Définitions des niveaux (JSON)
    ├── characters/           # Définitions des personnages
    └── story/                # Contexte narratif (Markdown)
```

### 6.2 Composants Partagés
| Composant | Description | Utilisé par |
|-----------|-------------|-------------|
| `ParallaxLayer` | Gestion d'une couche parallaxe | Game, StageMaker |
| `SpriteRenderer` | Affichage et animation de sprites | Game, BO, StageMaker |
| `ZoneEditor` | Édition de zones | StageMaker |
| `AssetPicker` | Sélecteur d'assets | BO, StageMaker |
| `CharacterPreview` | Preview personnage | Game, BO |
| `LevelMap` | Carte macroscopique | Game, StageMaker |

---

## 7. Format des Données

### 7.1 Définition d'un Niveau (JSON)
```json
{
  "id": "level_001",
  "name": "La Forêt Enchantée",
  "theme": "forest",
  "zones": [
    {
      "id": "zone_001",
      "mode": "FORWARD",
      "bounds": { "x": 0, "y": 0, "width": 3000, "height": 800 },
      "parallax": { /* config */ },
      "sprites": [ /* décor */ ],
      "transitions": [ /* points de changement de mode */ ]
    }
  ],
  "startPosition": { "zoneId": "zone_001", "x": 100, "y": 600 }
}
```

### 7.2 Définition d'un Personnage (JSON)
```json
{
  "id": "prince",
  "name": "Le Prince",
  "description": "Un jeune garçon blond aux yeux bleus",
  "sprites": {
    "forward": { "idle": "...", "walk": ["..."] },
    "up": { /* ... */ },
    "down": { /* ... */ },
    "backward": { /* ... */ }
  },
  "stats": {
    "speed": 5,
    "jumpHeight": 10
  }
}
```

### 7.3 Contexte Narratif (Markdown)
Les fichiers dans `data/story/` définissent l'univers:
- `STORY_world.md` - Description du monde
- `STORY_characters.md` - Background des personnages
- `STORY_chapters.md` - Chapitres de l'histoire

---

## 8. Phases de Développement

### Phase 1: Fondations
- [ ] Structure du projet
- [ ] Composants de base (SpriteRenderer, ParallaxLayer)
- [ ] Système de navigation basique
- [ ] Premier prototype jouable

### Phase 2: Outils
- [ ] BackOffice - Import/gestion sprites
- [ ] StageMaker - Vue macroscopique
- [ ] StageMaker - Vue microscopique
- [ ] Export/Import de niveaux

### Phase 3: Contenu
- [ ] Sprites des 3 personnages
- [ ] Premier niveau complet
- [ ] Système de dialogue
- [ ] Intégration de l'histoire

### Phase 4: Polish
- [ ] Effets visuels avancés
- [ ] Audio et musique
- [ ] Sauvegarde progression
- [ ] Tests et debug

---

## 9. Technologies

| Aspect | Choix | Raison |
|--------|-------|--------|
| Langage | JavaScript ES6+ | Compatibilité, pas de build requis |
| Styles | CSS3 (Custom Properties) | Thèmes, animations natives |
| Data | JSON + Markdown | Lisible, versionnable |
| Tests | Playwright | Tests E2E visuels |
| Base contexte | markdownDB | Gestion histoire/documentation |

---

## 10. Conventions de Code

### 10.1 Nommage
- **Fichiers**: `kebab-case.js`
- **Classes**: `PascalCase`
- **Fonctions**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **CSS**: `BEM` (Block__Element--Modifier)

### 10.2 Structure d'un Composant
```javascript
// sprite-renderer.js
export class SpriteRenderer {
  constructor(config) { /* ... */ }

  // Méthodes publiques
  render() { /* ... */ }
  update(deltaTime) { /* ... */ }

  // Méthodes privées (préfixe _)
  _calculateFrame() { /* ... */ }
}
```

---

## Annexes

### A. Glossaire
- **Sprite**: Image 2D représentant un élément visuel
- **Parallaxe**: Effet de profondeur par défilement différentiel
- **Zone**: Section d'un niveau avec son propre mode de navigation
- **Mode**: Direction de déplacement (FORWARD/UP/DOWN/BACKWARD)

### B. Références
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
