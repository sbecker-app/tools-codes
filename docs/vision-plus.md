# OpenSpec — Jeu Plateforme 2.5D
## Version 1.0.0

---

# SECTION 1: METADATA

```yaml
openspec: 1.0.0
info:
  title: "Shadow Drift — Jeu Plateforme 2.5D"
  version: "1.0.0"
  description: |
    Jeu de plateforme/exploration 2.5D web avec système de 
    parallaxe SVG, éditeur de niveaux intégré et back-office.
  license: "Proprietary"
  authors:
    - name: "Seb"
      role: "Lead Developer"
  created: "2024-12-03"
  updated: "2024-12-03"
  status: "draft"
```

---

# SECTION 2: GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **Zone** | Région horizontale d'une salle où le joueur peut avancer/reculer |
| **Tile** | Unité graphique de base composant une zone (sol, mur, décor) |
| **Salle (Room)** | Espace de jeu complet contenant plusieurs zones |
| **Layer** | Couche de parallaxe (background, main, foreground) |
| **Macro View** | Vue d'ensemble du niveau (zones, connexions) |
| **Micro View** | Vue détaillée d'une zone (tiles, colliders) |
| **BO** | Back-Office — interface d'administration |
| **Stage Maker** | Éditeur de niveaux intégré |

---

# SECTION 3: ARCHITECTURE GLOBALE

## 3.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION PRINCIPALE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │              │    │              │    │              │         │
│   │   MODE JEU   │    │   MODE BO    │    │ STAGE MAKER  │         │
│   │   (Player)   │    │   (Admin)    │    │   (Editor)   │         │
│   │              │    │              │    │              │         │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘         │
│          │                   │                   │                  │
│          └───────────────────┼───────────────────┘                  │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      CORE ENGINE                             │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  Renderer │ Physics │ Collision │ Input │ Audio │ Storage   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      DATA LAYER                              │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  Rooms │ Zones │ Tiles │ Entities │ Assets │ Settings       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 3.2 Structure des dossiers

```
/shadow-drift
├── index.html                    # Point d'entrée
├── /public
│   └── /assets
│       ├── /svg                  # Assets vectoriels
│       │   ├── /player
│       │   ├── /tiles
│       │   ├── /elements
│       │   └── /ui
│       ├── /audio
│       │   ├── /sfx
│       │   └── /music
│       └── /fonts
│
├── /src
│   ├── main.js                   # Bootstrap application
│   ├── /config
│   │   ├── constants.js          # Constantes globales
│   │   ├── physics.config.js
│   │   └── controls.config.js
│   │
│   ├── /core                     # Moteur de jeu
│   │   ├── Engine.js
│   │   ├── GameLoop.js
│   │   ├── Renderer.js
│   │   ├── EventBus.js
│   │   └── StateManager.js
│   │
│   ├── /systems                  # Systèmes ECS-like
│   │   ├── PhysicsSystem.js
│   │   ├── CollisionSystem.js
│   │   ├── ParallaxSystem.js
│   │   ├── InputSystem.js
│   │   ├── AudioSystem.js
│   │   └── RoomSystem.js
│   │
│   ├── /entities
│   │   ├── Entity.js
│   │   ├── Player.js
│   │   └── /components
│   │       ├── Transform.js
│   │       ├── Velocity.js
│   │       ├── Collider.js
│   │       └── Sprite.js
│   │
│   ├── /modes                    # Modes d'application
│   │   ├── /game                 # Mode Jeu
│   │   │   ├── GameMode.js
│   │   │   ├── GameUI.js
│   │   │   └── GameHUD.js
│   │   │
│   │   ├── /backoffice           # Mode Back-Office
│   │   │   ├── BackOffice.js
│   │   │   ├── /pages
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── RoomManager.js
│   │   │   │   ├── AssetManager.js
│   │   │   │   └── Settings.js
│   │   │   └── /components
│   │   │       └── ...
│   │   │
│   │   └── /stagemaker           # Stage Maker
│   │       ├── StageMaker.js
│   │       ├── /views
│   │       │   ├── MacroView.js   # Vue zones
│   │       │   └── MicroView.js   # Vue tiles
│   │       ├── /tools
│   │       │   ├── SelectTool.js
│   │       │   ├── DrawTool.js
│   │       │   ├── EraseTool.js
│   │       │   ├── ZoneTool.js
│   │       │   └── ColliderTool.js
│   │       └── /panels
│   │           ├── TilePalette.js
│   │           ├── LayerPanel.js
│   │           ├── PropertiesPanel.js
│   │           └── ZonePanel.js
│   │
│   ├── /data                     # Modèles de données
│   │   ├── Room.js
│   │   ├── Zone.js
│   │   ├── Tile.js
│   │   ├── TileSet.js
│   │   └── LevelData.js
│   │
│   ├── /storage                  # Persistance
│   │   ├── StorageManager.js
│   │   ├── LocalAdapter.js
│   │   └── ExportAdapter.js
│   │
│   └── /utils
│       ├── math.js
│       ├── svg.js
│       └── helpers.js
│
├── /data                         # Données de jeu
│   ├── /rooms
│   │   ├── room_001.json
│   │   └── ...
│   ├── /tilesets
│   │   └── default.json
│   └── game.json                 # Config globale
│
└── /styles
    ├── main.css
    ├── game.css
    ├── backoffice.css
    └── stagemaker.css
```

---

# SECTION 4: DATA MODELS

## 4.1 Room (Salle)

```typescript
interface Room {
  id: string;                     // "room_001"
  name: string;                   // "Caverne d'entrée"
  version: number;                // Version pour migrations
  
  dimensions: {
    width: number;                // Largeur totale en pixels
    height: number;               // Hauteur en pixels
  };
  
  // Zones de la salle
  zones: Zone[];
  
  // Points d'apparition
  spawns: {
    [key: string]: {
      x: number;
      y: number;
      direction: "left" | "right";
    };
  };
  
  // Connexions vers autres salles
  doors: Door[];
  
  // Layers de parallaxe
  parallaxLayers: ParallaxLayer[];
  
  // Ambiance
  ambiance: {
    backgroundColor: string;
    fogColor?: string;
    fogDensity?: number;
    lightLevel: "dark" | "dim" | "normal" | "bright";
  };
  
  // Métadonnées éditeur
  meta: {
    createdAt: string;
    updatedAt: string;
    author: string;
    tags: string[];
  };
}
```

## 4.2 Zone

```typescript
interface Zone {
  id: string;                     // "zone_001"
  name: string;                   // "Entrée principale"
  
  // Bounds de la zone dans la salle
  bounds: {
    x: number;                    // Position X dans la salle
    y: number;                    // Position Y dans la salle
    width: number;                // Largeur de la zone
    height: number;               // Hauteur de la zone
  };
  
  // Grille de tiles
  grid: {
    cellWidth: number;            // Taille d'une cellule (ex: 64)
    cellHeight: number;
    columns: number;              // Nombre de colonnes
    rows: number;                 // Nombre de lignes
  };
  
  // Tiles par layer
  layers: {
    background: TilePlacement[];  // Décor arrière
    terrain: TilePlacement[];     // Sol/murs (collidable)
    foreground: TilePlacement[];  // Décor avant
  };
  
  // Règles de navigation
  navigation: {
    canEnterFrom: ("left" | "right" | "top" | "bottom")[];
    canExitTo: ("left" | "right" | "top" | "bottom")[];
    scrollLock?: {
      horizontal: boolean;
      vertical: boolean;
    };
  };
  
  // Colliders custom (en plus des tiles)
  customColliders: Collider[];
  
  // Triggers et événements
  triggers: Trigger[];
}
```

## 4.3 Tile & TilePlacement

```typescript
interface Tile {
  id: string;                     // "tile_ground_01"
  name: string;                   // "Sol rocheux"
  
  // Source graphique
  source: {
    type: "svg" | "image";
    path: string;                 // Chemin vers l'asset
    viewBox?: string;             // Pour SVG
  };
  
  // Dimensions
  size: {
    width: number;
    height: number;
  };
  
  // Propriétés de collision
  collision: {
    enabled: boolean;
    type: "solid" | "platform" | "hazard" | "none";
    shape: "box" | "custom";
    customPath?: string;          // SVG path pour collision custom
  };
  
  // Variations (pour auto-tiling)
  variants?: {
    top: string;
    bottom: string;
    left: string;
    right: string;
    corner_tl: string;
    corner_tr: string;
    corner_bl: string;
    corner_br: string;
    inner_tl: string;
    inner_tr: string;
    inner_bl: string;
    inner_br: string;
  };
  
  // Tags pour filtrage
  tags: string[];                 // ["ground", "rock", "dark"]
}

interface TilePlacement {
  tileId: string;                 // Référence au tile
  gridX: number;                  // Position colonne
  gridY: number;                  // Position ligne
  
  // Transformations optionnelles
  transform?: {
    flipX?: boolean;
    flipY?: boolean;
    rotation?: 0 | 90 | 180 | 270;
  };
  
  // Override de propriétés
  overrides?: {
    collision?: boolean;
    opacity?: number;
    tint?: string;
  };
}
```

## 4.4 TileSet

```typescript
interface TileSet {
  id: string;                     // "tileset_cave"
  name: string;                   // "Caverne sombre"
  version: number;
  
  // Configuration de grille
  gridSize: {
    width: number;                // 64
    height: number;               // 64
  };
  
  // Tiles inclus
  tiles: Tile[];
  
  // Catégories pour l'UI
  categories: {
    id: string;
    name: string;
    tileIds: string[];
  }[];
  
  // Auto-tile rules
  autoTileRules?: AutoTileRule[];
  
  meta: {
    createdAt: string;
    updatedAt: string;
    thumbnail?: string;
  };
}
```

## 4.5 Collider

```typescript
interface Collider {
  id: string;
  type: "aabb" | "circle" | "polygon" | "one-way";
  
  // Pour AABB
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Pour Circle
  circle?: {
    x: number;
    y: number;
    radius: number;
  };
  
  // Pour Polygon
  polygon?: {
    points: { x: number; y: number }[];
  };
  
  // Layers de collision
  layer: number;                  // Bitmask
  mask: number;                   // Collide with layers
  
  // Propriétés
  properties: {
    solid: boolean;
    friction?: number;
    bounciness?: number;
    damage?: number;
  };
}
```

## 4.6 Door & Trigger

```typescript
interface Door {
  id: string;
  
  position: {
    x: number;
    y: number;
  };
  
  size: {
    width: number;
    height: number;
  };
  
  // Destination
  target: {
    roomId: string;
    spawnId: string;
  };
  
  // Transition
  transition: {
    type: "fade" | "slide" | "instant";
    duration: number;             // ms
  };
  
  // Conditions
  requirements?: {
    items?: string[];
    flags?: string[];
  };
  
  // Visuel
  visual: {
    sprite?: string;
    activeEffect?: string;
  };
}

interface Trigger {
  id: string;
  
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Type d'activation
  activationType: "enter" | "exit" | "stay" | "interact";
  
  // Actions déclenchées
  actions: TriggerAction[];
  
  // Conditions
  conditions?: {
    once: boolean;
    requireFlags?: string[];
  };
}

type TriggerAction = 
  | { type: "setFlag"; flag: string; value: boolean }
  | { type: "playSound"; soundId: string }
  | { type: "showDialog"; dialogId: string }
  | { type: "spawnEntity"; entityType: string; position: { x: number; y: number } }
  | { type: "cameraShake"; intensity: number; duration: number };
```

---

# SECTION 5: MODE JEU

## 5.1 États du jeu

```
┌─────────────────────────────────────────────────────────────────┐
│                      GAME STATE MACHINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐                                                   │
│   │  BOOT   │ ─────────────────────────────────────┐            │
│   └────┬────┘                                       │            │
│        │ assets loaded                              │            │
│        ▼                                            │            │
│   ┌─────────┐      start                           │            │
│   │  MENU   │ ─────────────┐                       │            │
│   └────┬────┘              │                       │            │
│        │                   ▼                       │            │
│        │              ┌─────────┐                  │            │
│        │              │ LOADING │ ◄────────────────┤            │
│        │              └────┬────┘   room change    │            │
│        │                   │                       │            │
│        │                   ▼                       │            │
│        │              ┌─────────┐                  │            │
│        └─────────────►│ PLAYING │ ─────────────────┤            │
│              resume   └────┬────┘                  │            │
│                            │                       │            │
│              ┌─────────────┼─────────────┐         │            │
│              │             │             │         │            │
│              ▼             ▼             ▼         │            │
│        ┌─────────┐   ┌─────────┐   ┌─────────┐    │            │
│        │ PAUSED  │   │  DEATH  │   │ DIALOG  │    │            │
│        └─────────┘   └─────────┘   └─────────┘    │            │
│                            │                       │            │
│                            ▼                       │            │
│                      ┌─────────┐                   │            │
│                      │GAME OVER│ ──────────────────┘            │
│                      └─────────┘     retry                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 5.2 Player States

```typescript
enum PlayerState {
  IDLE = "idle",
  WALKING = "walking",
  RUNNING = "running",
  JUMPING = "jumping",
  DOUBLE_JUMPING = "double_jumping",
  FALLING = "falling",
  GLIDING = "gliding",
  PARACHUTE = "parachute",
  JETPACK = "jetpack",
  LANDING = "landing",
  INTERACTING = "interacting",
  HURT = "hurt",
  DEAD = "dead"
}
```

## 5.3 Configuration physique

```javascript
const PHYSICS_CONFIG = {
  // Gravité
  gravity: {
    default: 0.8,
    gliding: 0.3,
    parachute: 0.15,
    jetpack: 0.4
  },
  
  // Vitesses max
  maxSpeed: {
    fall: 15,
    fallGliding: 5,
    fallParachute: 2,
    horizontal: 8,
    horizontalAir: 6
  },
  
  // Mouvement
  movement: {
    walkAcceleration: 0.8,
    runMultiplier: 1.5,
    airControl: 0.6,
    groundFriction: 0.85,
    airFriction: 0.95
  },
  
  // Saut
  jump: {
    force: 14,
    doubleJumpForce: 12,
    coyoteTime: 100,        // ms
    jumpBuffer: 150,        // ms
    variableHeight: true,
    cutoffMultiplier: 0.5
  },
  
  // Plané
  glide: {
    maxDuration: 2000,      // ms
    rechargeRate: 500,      // ms par seconde au sol
    horizontalBoost: 1.2
  },
  
  // Parachute
  parachute: {
    deployDelay: 150,       // ms
    horizontalDrift: 1.5
  },
  
  // Jetpack
  jetpack: {
    thrust: 1.5,
    maxFuel: 100,
    consumptionRate: 0.8,
    regenRate: 0.3,
    overheatCooldown: 2000  // ms
  }
};
```

## 5.4 Contrôles

```javascript
const CONTROLS_CONFIG = {
  keyboard: {
    left: ["ArrowLeft", "KeyA", "KeyQ"],
    right: ["ArrowRight", "KeyD"],
    jump: ["Space", "KeyW", "KeyZ"],
    parachute: ["ShiftLeft", "ShiftRight"],
    jetpack: ["KeyE"],
    interact: ["ArrowUp", "KeyF"],
    pause: ["Escape", "KeyP"]
  },
  
  gamepad: {
    // Standard Gamepad mapping
    left: { type: "axis", index: 0, threshold: -0.3 },
    right: { type: "axis", index: 0, threshold: 0.3 },
    jump: { type: "button", index: 0 },           // A / X
    parachute: { type: "button", index: 6 },      // LT / L2
    jetpack: { type: "button", index: 7 },        // RT / R2
    interact: { type: "button", index: 3 },       // Y / Triangle
    pause: { type: "button", index: 9 }           // Start
  },
  
  deadzone: 0.15
};
```

---

# SECTION 6: MODE BACK-OFFICE

## 6.1 Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACK-OFFICE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      HEADER                              │   │
│   │  Logo │ Navigation │ User │ Settings                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌────────────┬────────────────────────────────────────────┐   │
│   │            │                                             │   │
│   │  SIDEBAR   │              MAIN CONTENT                   │   │
│   │            │                                             │   │
│   │ Dashboard  │   ┌─────────────────────────────────────┐   │   │
│   │ Rooms      │   │                                     │   │   │
│   │ Tilesets   │   │         PAGE CONTENT                │   │   │
│   │ Assets     │   │                                     │   │   │
│   │ Entities   │   │                                     │   │   │
│   │ Audio      │   │                                     │   │   │
│   │ Settings   │   │                                     │   │   │
│   │ Export     │   │                                     │   │   │
│   │            │   └─────────────────────────────────────┘   │   │
│   │            │                                             │   │
│   └────────────┴────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 6.2 Pages

### Dashboard
- Statistiques du projet (nombre de salles, tiles, etc.)
- Accès rapide aux éléments récents
- Aperçu du monde (minimap)
- État de la progression

### Room Manager
- Liste des salles avec preview
- Actions CRUD sur les salles
- Lancement du Stage Maker
- Gestion des connexions entre salles

### TileSet Manager
- Import/création de tilesets
- Organisation des tiles par catégories
- Configuration des propriétés de collision
- Définition des règles d'auto-tile

### Asset Manager
- Bibliothèque d'assets SVG
- Upload et organisation
- Preview et édition basique
- Gestion des sprites et animations

### Entity Manager
- Configuration des entités (ennemis, objets)
- Définition des comportements
- Paramétrage des stats

### Audio Manager
- Gestion des SFX et musiques
- Configuration des ambiances par zone
- Test audio intégré

### Settings
- Configuration globale du jeu
- Paramètres physiques
- Contrôles par défaut
- Options d'export

### Export
- Export du projet complet
- Export partiel (salles sélectionnées)
- Formats supportés (JSON, binaire)
- Validation des données

---

# SECTION 7: STAGE MAKER

## 7.1 Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STAGE MAKER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ TOOLBAR                                                          │    │
│  │ [Select][Draw][Erase][Zone][Collider][Fill]│[Undo][Redo]│[Save] │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────┬───────────────────────────────────────┬──────────────┐    │
│  │          │                                        │              │    │
│  │  TILE    │                                        │  PROPERTIES  │    │
│  │ PALETTE  │                                        │    PANEL     │    │
│  │          │                                        │              │    │
│  │ ┌──────┐ │           CANVAS AREA                  │ Zone: zone_1 │    │
│  │ │ Cat1 │ │                                        │ Size: 1920x  │    │
│  │ ├──────┤ │   ┌─────────────────────────────┐     │              │    │
│  │ │[T][T]│ │   │                             │     │ ─────────── │    │
│  │ │[T][T]│ │   │      MACRO / MICRO VIEW     │     │              │    │
│  │ ├──────┤ │   │                             │     │ Collision:   │    │
│  │ │ Cat2 │ │   │                             │     │ [x] Enabled  │    │
│  │ ├──────┤ │   │                             │     │ Type: solid  │    │
│  │ │[T][T]│ │   └─────────────────────────────┘     │              │    │
│  │ │[T][T]│ │                                        │ ─────────── │    │
│  │ └──────┘ │                                        │              │    │
│  │          │                                        │ Layer:       │    │
│  └──────────┴───────────────────────────────────────┴──────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ LAYER PANEL                                                      │    │
│  │ [👁 Background] [👁 Terrain] [👁 Foreground] │ [+ Add Layer]      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ STATUS BAR                                                       │    │
│  │ View: Macro │ Zoom: 100% │ Grid: 64x64 │ Pos: (1024, 512)       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Macro View (Vue Zones)

Vue d'ensemble de la salle permettant de définir et organiser les zones.

### Fonctionnalités

| Fonction | Description |
|----------|-------------|
| **Créer Zone** | Dessiner un rectangle pour créer une nouvelle zone |
| **Redimensionner** | Ajuster les bounds d'une zone existante |
| **Déplacer** | Drag & drop des zones |
| **Connecter** | Définir les règles de navigation entre zones |
| **Propriétés** | Éditer nom, scrollLock, triggers |

### Représentation visuelle

```
┌─────────────────────────────────────────────────────────────────────┐
│                           MACRO VIEW                                 │
│                                                                      │
│   ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│   │                 │    │                 │    │                │  │
│   │    ZONE_001     │◄──►│    ZONE_002     │◄──►│   ZONE_003     │  │
│   │   "Entrée"      │    │   "Caverne"     │    │   "Sortie"     │  │
│   │                 │    │                 │    │                │  │
│   │   [12x8 tiles]  │    │   [20x10 tiles] │    │   [8x8 tiles]  │  │
│   │                 │    │                 │    │                │  │
│   └─────────────────┘    └────────┬────────┘    └────────────────┘  │
│                                   │                                  │
│                                   ▼                                  │
│                          ┌─────────────────┐                        │
│                          │    ZONE_004     │                        │
│                          │   "Sous-sol"    │                        │
│                          │   [15x12 tiles] │                        │
│                          └─────────────────┘                        │
│                                                                      │
│   ◄──► Navigation horizontale possible                              │
│    │   Navigation verticale possible                                │
│    ▼                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Actions disponibles

```typescript
interface MacroViewActions {
  // Zones
  createZone(bounds: Bounds): Zone;
  deleteZone(zoneId: string): void;
  resizeZone(zoneId: string, newBounds: Bounds): void;
  moveZone(zoneId: string, position: Point): void;
  duplicateZone(zoneId: string): Zone;
  
  // Navigation
  setNavigation(
    fromZone: string, 
    toZone: string, 
    direction: Direction
  ): void;
  removeNavigation(fromZone: string, direction: Direction): void;
  
  // Sélection
  selectZone(zoneId: string): void;
  multiSelect(zoneIds: string[]): void;
  
  // View
  zoomIn(): void;
  zoomOut(): void;
  fitToScreen(): void;
  centerOnZone(zoneId: string): void;
}
```

## 7.3 Micro View (Vue Tiles)

Vue détaillée d'une zone pour placer les tiles et définir les colliders.

### Fonctionnalités

| Fonction | Description |
|----------|-------------|
| **Paint** | Placer des tiles avec le pinceau |
| **Erase** | Supprimer des tiles |
| **Fill** | Remplir une région |
| **Select** | Sélectionner et déplacer des tiles |
| **Copy/Paste** | Copier des portions de la grille |
| **Auto-tile** | Placement intelligent avec règles |

### Représentation visuelle

```
┌─────────────────────────────────────────────────────────────────────┐
│                           MICRO VIEW                                 │
│                           Zone: "Caverne"                            │
│                                                                      │
│   Layer: [Terrain]                                                   │
│                                                                      │
│   0   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15    │
│   ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐ │
│ 0 │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤ │
│ 1 │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤ │
│ 2 │   │   │   │   │███│███│███│███│███│   │   │   │   │   │   │   │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤ │
│ 3 │   │   │   │   │   │   │   │   │   │   │   │███│███│   │   │   │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤ │
│ 4 │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤ │
│ 5 │███│███│   │   │   │   │   │   │   │   │   │   │   │███│███│███│ │
│   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤ │
│ 6 │███│███│███│███│███│███│███│███│███│███│███│███│███│███│███│███│ │
│   └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘ │
│                                                                      │
│   ███ = Tile placé (avec collision)                                 │
│   [ ] = Cellule vide                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Actions disponibles

```typescript
interface MicroViewActions {
  // Tiles
  placeTile(gridX: number, gridY: number, tileId: string): void;
  eraseTile(gridX: number, gridY: number): void;
  fillArea(startX: number, startY: number, tileId: string): void;
  
  // Selection
  selectTiles(bounds: GridBounds): TilePlacement[];
  copySelection(): void;
  pasteSelection(gridX: number, gridY: number): void;
  deleteSelection(): void;
  
  // Transforms
  flipSelectionH(): void;
  flipSelectionV(): void;
  rotateSelection(degrees: 90 | 180 | 270): void;
  
  // Colliders
  toggleCollision(gridX: number, gridY: number): void;
  drawCustomCollider(points: Point[]): void;
  
  // Layers
  setActiveLayer(layer: string): void;
  toggleLayerVisibility(layer: string): void;
  
  // View
  setZoom(level: number): void;
  pan(deltaX: number, deltaY: number): void;
  toggleGridOverlay(): void;
  toggleColliderOverlay(): void;
}
```

## 7.4 Tools

### Tool Interface

```typescript
interface EditorTool {
  id: string;
  name: string;
  icon: string;
  shortcut: string;
  cursor: string;
  
  // Lifecycle
  activate(): void;
  deactivate(): void;
  
  // Events
  onMouseDown(event: EditorMouseEvent): void;
  onMouseMove(event: EditorMouseEvent): void;
  onMouseUp(event: EditorMouseEvent): void;
  onKeyDown(event: KeyboardEvent): void;
  
  // Rendering
  renderPreview(ctx: CanvasRenderingContext2D): void;
}
```

### Tools disponibles

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Select** | V | Sélection et manipulation |
| **Draw** | B | Placement de tiles (brush) |
| **Erase** | E | Suppression de tiles |
| **Fill** | G | Remplissage de zone |
| **Zone** | Z | Création/édition de zones (Macro) |
| **Collider** | C | Édition des colliders custom |
| **Spawn** | S | Placement des points d'apparition |
| **Door** | D | Placement des portes |
| **Trigger** | T | Placement des triggers |

## 7.5 Panels

### Tile Palette

```typescript
interface TilePalettePanel {
  // État
  currentTileSet: TileSet;
  selectedTile: Tile | null;
  selectedCategory: string;
  searchQuery: string;
  
  // Actions
  selectTile(tileId: string): void;
  setCategory(categoryId: string): void;
  search(query: string): void;
  changeTileSet(tileSetId: string): void;
}
```

### Layer Panel

```typescript
interface LayerPanel {
  layers: {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
  }[];
  
  activeLayer: string;
  
  // Actions
  setActiveLayer(layerId: string): void;
  toggleVisibility(layerId: string): void;
  toggleLock(layerId: string): void;
  setOpacity(layerId: string, opacity: number): void;
  reorderLayers(fromIndex: number, toIndex: number): void;
  addLayer(name: string): void;
  deleteLayer(layerId: string): void;
}
```

### Properties Panel

Affiche et permet d'éditer les propriétés de l'élément sélectionné.

```typescript
interface PropertiesPanel {
  // Contexte
  selectionType: "none" | "zone" | "tile" | "door" | "trigger" | "collider";
  selection: any;
  
  // Actions
  updateProperty(path: string, value: any): void;
}
```

### Zone Panel (Macro View)

```typescript
interface ZonePanel {
  zones: Zone[];
  selectedZone: Zone | null;
  
  // Actions
  selectZone(zoneId: string): void;
  renameZone(zoneId: string, name: string): void;
  deleteZone(zoneId: string): void;
  editZone(zoneId: string): void;  // Switch to Micro View
}
```

---

# SECTION 8: SYSTEMS

## 8.1 Parallax System

```typescript
interface ParallaxSystem {
  layers: ParallaxLayer[];
  cameraPosition: Point;
  viewportSize: Size;
  
  // Configuration
  config: {
    smoothing: number;        // Lissage du mouvement
    verticalParallax: boolean; // Parallaxe vertical activé
  };
  
  // Methods
  update(cameraTarget: Point, deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  
  // Layer management
  addLayer(layer: ParallaxLayer): void;
  removeLayer(layerId: string): void;
  setLayerDepth(layerId: string, depth: number): void;
}

interface ParallaxLayer {
  id: string;
  depth: number;              // 0 = fixe, 1 = vitesse caméra, >1 = premier plan
  content: SVGElement | HTMLImageElement;
  repeat: {
    x: boolean;
    y: boolean;
  };
  offset: Point;
  blur?: number;              // Flou pour effet de profondeur
  opacity?: number;
}
```

## 8.2 Collision System

```typescript
interface CollisionSystem {
  // Spatial partitioning
  spatialHash: SpatialHash;
  
  // Colliders registry
  staticColliders: Collider[];
  dynamicColliders: Collider[];
  
  // Methods
  update(): void;
  
  // Queries
  checkCollision(a: Collider, b: Collider): CollisionResult | null;
  queryPoint(point: Point, layers?: number): Collider[];
  queryRect(rect: Rect, layers?: number): Collider[];
  raycast(origin: Point, direction: Vector, maxDistance: number): RaycastHit | null;
  
  // Registration
  addCollider(collider: Collider, isDynamic: boolean): void;
  removeCollider(colliderId: string): void;
}

interface CollisionResult {
  colliderA: Collider;
  colliderB: Collider;
  penetration: Vector;
  contactPoint: Point;
  normal: Vector;
}

interface RaycastHit {
  collider: Collider;
  point: Point;
  normal: Vector;
  distance: number;
}
```

## 8.3 Room System

```typescript
interface RoomSystem {
  currentRoom: Room | null;
  loadedRooms: Map<string, Room>;
  
  // Loading
  loadRoom(roomId: string): Promise<void>;
  unloadRoom(roomId: string): void;
  preloadRoom(roomId: string): Promise<void>;  // Préchargement
  
  // Transitions
  transitionTo(
    roomId: string, 
    spawnId: string, 
    transition: TransitionType
  ): Promise<void>;
  
  // Zone management
  getCurrentZone(): Zone;
  getZoneAt(position: Point): Zone | null;
  
  // Events
  onRoomLoaded: Signal<Room>;
  onRoomUnloaded: Signal<string>;
  onZoneChanged: Signal<Zone>;
}
```

---

# SECTION 9: STORAGE & EXPORT

## 9.1 Storage Manager

```typescript
interface StorageManager {
  // Adapters
  localAdapter: LocalStorageAdapter;
  fileAdapter: FileSystemAdapter;
  
  // Project operations
  saveProject(): Promise<void>;
  loadProject(): Promise<ProjectData>;
  
  // Room operations
  saveRoom(room: Room): Promise<void>;
  loadRoom(roomId: string): Promise<Room>;
  deleteRoom(roomId: string): Promise<void>;
  
  // Asset operations
  saveAsset(asset: Asset): Promise<void>;
  loadAsset(assetId: string): Promise<Asset>;
  
  // Auto-save
  enableAutoSave(intervalMs: number): void;
  disableAutoSave(): void;
}
```

## 9.2 Export Formats

```typescript
interface ExportManager {
  // Formats
  exportJSON(options: ExportOptions): Promise<Blob>;
  exportBinary(options: ExportOptions): Promise<Blob>;
  
  // Partiel
  exportRooms(roomIds: string[]): Promise<Blob>;
  exportTileSets(tileSetIds: string[]): Promise<Blob>;
  
  // Validation
  validateProject(): ValidationResult;
}

interface ExportOptions {
  includeAssets: boolean;
  minify: boolean;
  compress: boolean;
  targetPlatform: "web" | "desktop" | "all";
}
```

---

# SECTION 10: EVENTS & SIGNALS

## 10.1 Event Bus

```typescript
interface EventBus {
  // Game events
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, data?: any): void;
  once(event: string, handler: Function): void;
}

// Events principaux
type GameEvents = {
  // Player
  "player:jump": { position: Point };
  "player:land": { position: Point; fallDistance: number };
  "player:hurt": { damage: number; source: string };
  "player:death": { position: Point };
  
  // Room
  "room:enter": { roomId: string; spawnId: string };
  "room:exit": { roomId: string };
  "zone:enter": { zoneId: string };
  "zone:exit": { zoneId: string };
  
  // Game
  "game:pause": {};
  "game:resume": {};
  "game:save": {};
  
  // Editor
  "editor:tool:changed": { toolId: string };
  "editor:selection:changed": { selection: any };
  "editor:history:push": { action: HistoryAction };
};
```

---

# SECTION 11: ROADMAP

## Phase 1: Core Engine (Semaine 1-2)
- [ ] Structure projet et build system
- [ ] Game loop avec delta time
- [ ] Système de rendu SVG
- [ ] Input Manager (clavier + manette)
- [ ] Player basique (mouvement, saut)

## Phase 2: Physics & Collision (Semaine 3)
- [ ] Système physique complet
- [ ] Collision AABB et one-way platforms
- [ ] Double-saut, plané, parachute
- [ ] Jetpack (module)

## Phase 3: World System (Semaine 4)
- [ ] Chargement de salles JSON
- [ ] Système de zones
- [ ] Parallaxe multi-layer
- [ ] Transitions entre salles

## Phase 4: Stage Maker MVP (Semaine 5-6)
- [ ] Interface Macro View
- [ ] Création/édition de zones
- [ ] Interface Micro View
- [ ] Tile palette et placement
- [ ] Layer management

## Phase 5: Back-Office MVP (Semaine 7)
- [ ] Dashboard
- [ ] Room Manager
- [ ] TileSet Manager
- [ ] Sauvegarde/chargement

## Phase 6: Polish & Content (Semaine 8+)
- [ ] Animations joueur
- [ ] Effets visuels et particules
- [ ] Audio system
- [ ] Niveaux de démonstration

---

# SECTION 12: ANNEXES

## 12.1 Keyboard Shortcuts (Stage Maker)

| Shortcut | Action |
|----------|--------|
| **Ctrl+S** | Sauvegarder |
| **Ctrl+Z** | Annuler |
| **Ctrl+Y** | Refaire |
| **Ctrl+C** | Copier |
| **Ctrl+V** | Coller |
| **Ctrl+X** | Couper |
| **Delete** | Supprimer sélection |
| **Space+Drag** | Pan view |
| **Scroll** | Zoom |
| **Tab** | Switch Macro/Micro |
| **1-9** | Sélection layer rapide |
| **G** | Toggle grille |
| **H** | Toggle colliders |

## 12.2 File Format Versions

```typescript
const FILE_VERSIONS = {
  project: "1.0.0",
  room: "1.0.0",
  tileset: "1.0.0",
  entity: "1.0.0"
};
```

## 12.3 Performance Targets

| Metric | Target |
|--------|--------|
| FPS (Gameplay) | 60 stable |
| FPS (Editor) | 30+ |
| Room Load | < 500ms |
| Save Operation | < 200ms |
| Memory (Gameplay) | < 150MB |
| Memory (Editor) | < 300MB |

---

*OpenSpec v1.0.0 — Shadow Drift*
*Créé le 3 décembre 2024*
