# Spécifications - Game (Jeu Principal)

## Vue d'ensemble

Le **Game** est l'application principale du projet Game 2.5D. C'est un jeu d'aventure en scrolling horizontal avec effet de parallaxe et navigation multi-directionnelle.

---

## 1. Écran Titre

### 1.1 Éléments visuels
- **Titre** : "Game 2.5D" affiché en grand
- **Sous-titre** : "Une aventure en 2.5D"
- **Fond animé** : Effet de parallaxe subtil en arrière-plan

### 1.2 Menu principal
| Bouton | Action | Raccourci |
|--------|--------|-----------|
| Jouer | Navigue vers la sélection de personnage | `Enter` |
| Options | Ouvre le menu des options | `O` |
| Crédits | Affiche les crédits | `C` |

### 1.3 Comportements
- Le premier bouton est focusé par défaut
- Navigation au clavier avec `Tab` et `Flèches`
- Animation de hover sur les boutons

---

## 2. Sélection de Personnage

### 2.1 Personnages disponibles
| Personnage | Description | Couleur thème |
|------------|-------------|---------------|
| **Prince** | Garçon blond aux yeux bleus | `#4a90d9` (bleu) |
| **Princesse** | Jeune fille courageuse | `#d94a90` (rose) |

### 2.2 Interface
- Deux cartes de personnages côte à côte
- Preview animée du personnage sélectionné
- Description du personnage au survol
- Bouton "Commencer" activé après sélection
- Bouton "Retour" pour revenir au menu

### 2.3 Interactions
- Clic ou touche `1`/`2` pour sélectionner
- Animation de sélection (bordure, scale)
- Son de validation à la sélection

---

## 3. Gameplay

### 3.1 Système de navigation

Le jeu utilise 4 modes de navigation définis dans les zones du niveau :

| Mode | Direction | Contrôles | Couleur |
|------|-----------|-----------|---------|
| `FORWARD` | Droite | `→` ou `D` pour avancer | Bleu `#4a90d9` |
| `BACKWARD` | Gauche | `←` ou `A` pour reculer | Orange `#f39c12` |
| `UP` | Haut | `↑` ou `W` pour monter | Vert `#2ecc71` |
| `DOWN` | Bas | `↓` ou `S` pour descendre | Rouge `#e74c3c` |

### 3.2 Contrôles

#### Mouvements
| Touche | Action |
|--------|--------|
| `←` `→` ou `A` `D` | Déplacement horizontal |
| `↑` `↓` ou `W` `S` | Déplacement vertical (en mode UP/DOWN) |
| `Espace` | Saut (en mode FORWARD/BACKWARD) |

#### Système
| Touche | Action |
|--------|--------|
| `Escape` | Pause / Menu |
| `F3` | Afficher/masquer debug |

### 3.3 Physique

```javascript
// Constantes de physique
speed: 5,        // Vitesse de déplacement
jumpForce: 12,   // Force de saut
gravity: 0.5,    // Gravité appliquée
friction: 0.8    // Friction au sol
```

### 3.4 Caméra
- Suivi smooth du personnage (lerp 0.1)
- Limites de caméra basées sur le niveau
- Offset vertical pour anticiper les mouvements

---

## 4. Système de Parallaxe

### 4.1 Couches

| Depth | Vitesse | Description |
|-------|---------|-------------|
| 5 | 0.1 | Arrière-plan lointain (ciel) |
| 4 | 0.3 | Montagnes |
| 3 | 0.5 | Arbres lointains |
| 2 | 0.7 | Arbres proches |
| 1 | 1.0 | Sol / Éléments jouables |
| 0 | 1.2 | Premier plan (décors) |

### 4.2 Configuration
- Chaque couche peut avoir plusieurs images
- Répétition horizontale configurable
- Offset Y personnalisable par couche

### 4.3 Implémentation SVG (recommandée)

Le système de parallaxe utilise des **fichiers SVG** pour un rendu scalable et performant.

#### Structure DOM

```html
<div id="game-container">
  <!-- Couches de parallaxe (générées par ParallaxSVG) -->
  <div class="parallax-layer" data-depth="0.1" style="z-index: 0">
    <svg><!-- sky.svg --></svg>
  </div>
  <div class="parallax-layer" data-depth="0.3" style="z-index: 1">
    <svg><!-- mountains.svg --></svg>
  </div>
  <!-- ... autres couches -->

  <!-- Couche de jeu -->
  <div id="game-layer" style="z-index: 4">
    <!-- Personnage, obstacles, etc. -->
  </div>
</div>
```

#### Fichiers backgrounds SVG

```
assets/svg/backgrounds/
├── sky.svg              <- Depth 0.1 (ciel, nuages)
├── mountains.svg        <- Depth 0.3 (montagnes)
├── trees-far.svg        <- Depth 0.5 (arbres lointains)
├── trees-near.svg       <- Depth 0.7 (arbres proches)
└── foreground.svg       <- Depth 1.2 (premier plan)
```

#### Module ParallaxSVG

```javascript
import { ParallaxSVG } from '/shared/components/parallax/ParallaxSVG.js';

const parallax = new ParallaxSVG(gameContainer);
await parallax.addLayer('/assets/svg/backgrounds/sky.svg', 0.1);
await parallax.addLayer('/assets/svg/backgrounds/mountains.svg', 0.3);
// ...

// Dans la game loop
parallax.update(camera.x, camera.y);
```

> **Voir aussi** : `SPEC_svg-system.md` pour l'architecture complète du système SVG.

---

## 5. Robot Compagnon

### 5.1 Comportement
- Suit le personnage avec un délai (lerp 0.05)
- Se positionne à côté du personnage (80px)
- Change de côté selon la direction du personnage

### 5.2 Interactions futures
- Dialogues contextuels
- Aide au joueur
- Indices pour les puzzles

---

## 6. Interface en jeu (HUD)

### 6.1 Éléments affichés
- Indicateur de mode de navigation actuel
- Zone actuelle (nom/ID)
- Mini-map (future)

### 6.2 Debug (F3)
```
FPS: 60
Position: X, Y
Velocity: VX, VY
Camera: CX, CY
Mode: FORWARD
Grounded: true
```

---

## 7. Menu Pause

### 7.1 Options
| Bouton | Action |
|--------|--------|
| Reprendre | Ferme le menu, continue le jeu |
| Options | Ouvre les paramètres |
| Quitter | Retour au menu principal |

### 7.2 Comportement
- Le jeu est figé pendant la pause
- Overlay semi-transparent sur le jeu
- Navigation clavier/souris

---

## 8. Chargement de Niveaux

### 8.1 Format JSON
```json
{
  "version": "1.0",
  "id": "level_001",
  "meta": {
    "name": "Forêt Enchantée",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "sequence": [
    {
      "id": "zone_1",
      "order": 0,
      "mode": "FORWARD",
      "length": 100,
      "parallax": { "layers": [] },
      "sprites": []
    }
  ],
  "spawn": {
    "zoneId": "zone_1",
    "position": { "x": 100, "y": 100 }
  }
}
```

### 8.2 Transitions entre zones
- Détection automatique de la sortie de zone
- Changement de mode de navigation
- Animation de transition (fade/slide)

---

## 9. Audio (Future)

### 9.1 Catégories
| Catégorie | Exemples |
|-----------|----------|
| Musique | Thème principal, ambiance niveau |
| SFX | Pas, saut, collision |
| UI | Clic, sélection, validation |

### 9.2 Contrôles
- Volume global
- Volume musique
- Volume effets
- Mute/Unmute

---

## 10. Sauvegarde (Future)

### 10.1 Données sauvegardées
- Personnage sélectionné
- Niveau actuel
- Position dans le niveau
- Progression globale

### 10.2 Stockage
- LocalStorage pour sauvegarde rapide
- Export/Import JSON pour sauvegarde complète

---

## 11. Performances

### 11.1 Cibles
| Métrique | Cible |
|----------|-------|
| FPS | 60 stable |
| Temps de chargement | < 2s |
| Mémoire | < 100MB |

### 11.2 Optimisations
- Culling des éléments hors écran
- Pooling des objets fréquents
- Lazy loading des assets
