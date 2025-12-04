# OpenSpec — Level Creator
## Shadow Drift — Éditeur de niveaux

> Version: 1.1.0  
> Module: Stage Maker  
> Modes: Macro View / Micro View / Test Mode

---

# TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Mode Macro — Navigation Grid](#2-mode-macro--navigation-grid)
3. [Mode Micro — Block Editor](#3-mode-micro--block-editor)
4. [Mode Test — Playtest](#4-mode-test--playtest)
5. [Data Models](#5-data-models)
6. [UI Components](#6-ui-components)
7. [Actions & Tools](#7-actions--tools)
8. [Workflow](#8-workflow)
9. [Export Format](#9-export-format)

---

# 1. VUE D'ENSEMBLE

## 1.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LEVEL CREATOR                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────┐      ┌─────────────────────────┐          │
│   │                         │      │                         │          │
│   │      MODE MACRO         │ ←──→ │      MODE MICRO         │          │
│   │    (Navigation Grid)    │      │    (Block Editor)       │          │
│   │                         │      │                         │          │
│   └───────────┬─────────────┘      └─────────────────────────┘          │
│               │                                                          │
│               ▼                                                          │
│   ┌─────────────────────────┐                                           │
│   │      MODE TEST          │                                           │
│   │    (Playtest Level)     │                                           │
│   └─────────────────────────┘                                           │
│               │                                                          │
│   ┌───────────┴─────────────┐      ┌─────────────────────────┐          │
│   │ • Grille de blocs       │      │ • Terrain tiles         │          │
│   │ • Direction caméra      │      │ • Objets (random/manual)│          │
│   │ • Flow du niveau        │      │ • Décors (random/manual)│          │
│   │ • Connexions            │      │ • Portails              │          │
│   │ • History & Rollback    │      │                         │          │
│   └─────────────────────────┘      └─────────────────────────┘          │
│                                                                          │
│                              ▼                                           │
│                    ┌─────────────────────────┐                          │
│                    │      LEVEL DATA         │                          │
│                    │   (level.json export)   │                          │
│                    └─────────────────────────┘                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Concepts clés

| Concept | Description |
|---------|-------------|
| **Block** | Unité de base de la grille macro (ex: 320x180 pixels) |
| **Navigation** | Direction de progression dans un block (→ ← ↑ ↓) |
| **Camera Flow** | Mouvement de caméra déterminé par la navigation |
| **Terrain** | Type de sol/mur appliqué à un ou plusieurs tiles |
| **Placement** | Positionnement d'objets (manuel ou aléatoire) |
| **Portal** | Connexion entre deux points du niveau |
| **History** | Système d'historique avec Undo/Redo/Rollback |
| **Test Mode** | Mode de jeu intégré pour tester le niveau |

---

# 2. MODE MACRO — NAVIGATION GRID

## 2.1 Concept

Le mode Macro permet de définir la **structure globale** du niveau via une grille de blocs. Chaque bloc indique la **direction de progression** (mouvement caméra).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MACRO VIEW                                       │
│                                                                          │
│   Grid Size: 10 x 6 blocks                                              │
│   Block Size: 320 x 180 px                                              │
│   Total Level: 3200 x 1080 px                                           │
│                                                                          │
│   ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐        │
│   │     │     │     │     │     │     │     │     │     │     │  0     │
│   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤        │
│   │     │     │  ↓  │     │     │     │     │     │     │     │  1     │
│   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤        │
│   │ [S] │  →  │  →  │  →  │  ↓  │     │  ↑  │  ←  │  ←  │ [E] │  2     │
│   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤        │
│   │     │     │     │     │  →  │  →  │  →  │  ↑  │     │     │  3     │
│   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤        │
│   │     │     │     │     │     │     │     │     │     │     │  4     │
│   ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤        │
│   │     │     │     │     │     │     │     │     │     │     │  5     │
│   └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘        │
│     0     1     2     3     4     5     6     7     8     9             │
│                                                                          │
│   [S] = Spawn    [E] = Exit    → ← ↑ ↓ = Camera Direction               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Types de navigation

```typescript
enum NavigationDirection {
  NONE = "none",           // Block vide / non jouable
  FORWARD = "forward",     // → Avancer (droite)
  BACKWARD = "backward",   // ← Reculer (gauche)  
  UP = "up",               // ↑ Monter
  DOWN = "down",           // ↓ Descendre
  SPAWN = "spawn",         // Point de départ
  EXIT = "exit",           // Sortie du niveau
  JUNCTION = "junction"    // Croisement (multiple directions)
}
```

## 2.3 Block Data Model

```typescript
interface MacroBlock {
  // Position dans la grille
  gridX: number;
  gridY: number;
  
  // Navigation
  navigation: {
    primary: NavigationDirection;      // Direction principale
    secondary?: NavigationDirection;   // Direction alternative (junction)
    cameraLock?: {
      lockX: boolean;
      lockY: boolean;
    };
  };
  
  // Métadonnées
  meta: {
    name?: string;           // Nom optionnel du block
    tags?: string[];         // Tags pour filtrage
    isSecret?: boolean;      // Zone secrète
    isCheckpoint?: boolean;  // Point de sauvegarde
  };
  
  // État d'édition
  editorState: {
    isSelected: boolean;
    isHovered: boolean;
    hasContent: boolean;     // A du contenu en mode Micro
  };
}
```

## 2.4 Règles de navigation

### 2.4.1 Connexions valides

| Direction | Blocs connectés | Condition |
|-----------|-----------------|-----------|
| `forward` (→) | Block à droite | Navigation `forward`, `junction`, `up`, `down` |
| `backward` (←) | Block à gauche | Navigation `backward`, `junction`, `up`, `down` |
| `up` (↑) | Block au-dessus | Navigation `up`, `junction`, `forward`, `backward` |
| `down` (↓) | Block en-dessous | Navigation `down`, `junction`, `forward`, `backward` |

### 2.4.2 Validation du flow

```typescript
interface FlowValidation {
  isValid: boolean;
  errors: FlowError[];
  warnings: FlowWarning[];
  path: MacroBlock[];        // Chemin du spawn à l'exit
}

type FlowError = 
  | { type: "no_spawn"; message: string }
  | { type: "no_exit"; message: string }
  | { type: "unreachable_exit"; message: string }
  | { type: "dead_end"; block: MacroBlock }
  | { type: "disconnected"; blocks: MacroBlock[] };

type FlowWarning =
  | { type: "unreachable_block"; block: MacroBlock }
  | { type: "no_return_path"; message: string };
```

## 2.5 Camera Behavior

```typescript
interface CameraBehavior {
  // Mode de suivi
  followMode: "smooth" | "snap" | "fixed";
  
  // Vitesse de transition
  transitionSpeed: number;
  
  // Bounds par block
  blockBounds: {
    allowOverflow: boolean;    // Peut voir les blocks adjacents
    overflowAmount: number;    // Pixels de dépassement
  };
  
  // Transitions entre directions
  directionChange: {
    transitionType: "fade" | "slide" | "instant";
    transitionDuration: number;
  };
}
```

## 2.6 Macro Tools

| Tool | Raccourci | Description |
|------|-----------|-------------|
| **Select** | `V` | Sélectionner un ou plusieurs blocs |
| **Navigate** | `N` | Assigner une direction de navigation |
| **Connect** | `C` | Tracer une connexion entre blocs |
| **Spawn** | `S` | Placer le point de départ |
| **Exit** | `E` | Placer la sortie |
| **Erase** | `X` | Supprimer la navigation d'un bloc |
| **Fill** | `F` | Remplir une zone avec une direction |

---

# 3. MODE MICRO — BLOCK EDITOR

## 3.1 Concept

Le mode Micro permet d'éditer le **contenu détaillé** d'un bloc sélectionné en mode Macro.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MICRO VIEW                                       │
│  Block: [2,2] "Caverne d'entrée"                    Navigation: →       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │    │
│  │    ░░                                                      ░░    │    │
│  │    ░░    🔮         💎                        🌀 Portal    ░░    │    │
│  │    ░░    Crystal    Gem                                    ░░    │    │
│  │    ░░                                                      ░░    │    │
│  │    ░░         ┌────┐                    ┌────┐             ░░    │    │
│  │    ░░         │Plat│                    │Plat│             ░░    │    │
│  │    ░░         └────┘        🍄          └────┘             ░░    │    │
│  │    ░░                    Mushroom                          ░░    │    │
│  │    ░░                                                      ░░    │    │
│  │    ░░  👤 Spawn                                            ░░    │    │
│  │    ████████████████████████████████████████████████████████░░    │    │
│  │    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Layers: [✓] Terrain  [✓] Objects  [✓] Decor  [✓] Portals              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Sous-systèmes

### 3.2.1 Terrain System

```typescript
interface TerrainSystem {
  // Grille de tiles du terrain
  grid: {
    columns: number;        // Ex: 20 tiles
    rows: number;           // Ex: 12 tiles
    tileSize: number;       // Ex: 16px
  };
  
  // Types de terrain
  terrainTypes: TerrainType[];
  
  // Placements
  placements: TerrainPlacement[];
}

interface TerrainType {
  id: string;
  name: string;
  category: "ground" | "platform" | "wall" | "ceiling" | "slope";
  
  collision: {
    type: "solid" | "one-way" | "none";
    friction: number;
  };
  
  visual: {
    tilesetId: string;
    autoTile: boolean;
  };
}

interface TerrainPlacement {
  terrainTypeId: string;
  
  // Zone de placement (peut couvrir plusieurs tiles)
  zone: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  
  // Ou liste de tiles individuelles
  tiles?: { x: number; y: number }[];
}
```

### 3.2.2 Object Placement System

```typescript
interface ObjectPlacementSystem {
  // Mode de placement
  placementMode: "manual" | "random" | "pattern";
  
  // Objets placés
  objects: PlacedObject[];
  
  // Configuration random
  randomConfig?: RandomPlacementConfig;
}

interface PlacedObject {
  id: string;
  objectType: ObjectType;
  
  // Position
  position: {
    x: number;
    y: number;
  };
  
  // Source du placement
  placementSource: "manual" | "random";
  
  // Peut être repositionné après random
  isLocked: boolean;
  
  // Configuration spécifique
  config?: Record<string, any>;
}

type ObjectType = 
  | { category: "enemy"; enemyId: string }
  | { category: "collectible"; collectibleId: string }
  | { category: "boost"; boostId: string }
  | { category: "hazard"; hazardId: string }
  | { category: "interactive"; interactiveId: string };

interface RandomPlacementConfig {
  // Catégories à inclure
  categories: string[];
  
  // Densité (objets par 100x100 px)
  density: number;
  
  // Contraintes
  constraints: {
    minDistance: number;           // Distance min entre objets
    avoidTerrain: boolean;         // Éviter le terrain solide
    avoidEdges: number;            // Marge depuis les bords
    groundOnly: boolean;           // Seulement sur le sol
    airOnly: boolean;              // Seulement en l'air
  };
  
  // Probabilités par type
  weights: {
    [objectId: string]: number;    // Poids relatif
  };
  
  // Seed pour reproductibilité
  seed?: number;
}
```

### 3.2.3 Decor System

```typescript
interface DecorSystem {
  // Mode de placement
  placementMode: "manual" | "random" | "pattern";
  
  // Layers de décor
  layers: {
    background: DecorPlacement[];   // Derrière le terrain
    foreground: DecorPlacement[];   // Devant le terrain
  };
  
  // Configuration random
  randomConfig?: RandomDecorConfig;
}

interface DecorPlacement {
  id: string;
  decorId: string;
  
  position: {
    x: number;
    y: number;
  };
  
  // Transformations
  transform?: {
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    flipX?: boolean;
    flipY?: boolean;
  };
  
  // Parallax (pour background)
  parallax?: {
    depth: number;
  };
  
  placementSource: "manual" | "random";
  isLocked: boolean;
}

interface RandomDecorConfig {
  // Types de décors à placer
  decorTypes: string[];
  
  // Densité par layer
  density: {
    background: number;
    foreground: number;
  };
  
  // Contraintes
  constraints: {
    minDistance: number;
    clusterProbability: number;    // Probabilité de grouper
    clusterSize: { min: number; max: number };
  };
  
  // Variations
  variations: {
    allowFlip: boolean;
    allowScale: boolean;
    scaleRange: { min: number; max: number };
  };
  
  seed?: number;
}
```

### 3.2.4 Portal System

```typescript
interface PortalSystem {
  portals: Portal[];
  connections: PortalConnection[];
}

interface Portal {
  id: string;
  
  // Position dans le block
  position: {
    x: number;
    y: number;
  };
  
  // Dimensions
  size: {
    width: number;
    height: number;
  };
  
  // Type de portail
  type: "entrance" | "exit" | "bidirectional";
  
  // Visual
  visual: {
    sprite?: string;
    color: string;
    effect: "glow" | "particle" | "distort";
  };
  
  // Comportement
  behavior: {
    activationType: "touch" | "interact";
    preserveVelocity: boolean;
    cooldown: number;
  };
}

interface PortalConnection {
  id: string;
  
  // Portail source
  sourcePortalId: string;
  sourceBlockX: number;
  sourceBlockY: number;
  
  // Portail destination
  targetPortalId: string;
  targetBlockX: number;
  targetBlockY: number;
  
  // Direction
  isBidirectional: boolean;
  
  // Transition
  transition: {
    type: "instant" | "fade" | "zoom";
    duration: number;
  };
}
```

## 3.3 Placement Modes

### 3.3.1 Manual Placement

```typescript
interface ManualPlacement {
  mode: "manual";
  
  // Outils
  tools: {
    place: {
      action: "click";
      preview: boolean;
      snapToGrid: boolean;
      gridSize: number;
    };
    
    move: {
      action: "drag";
      constraints: "none" | "horizontal" | "vertical" | "grid";
    };
    
    delete: {
      action: "click" | "area";
    };
    
    duplicate: {
      action: "alt+drag";
      offset: { x: number; y: number };
    };
  };
  
  // Multi-sélection
  multiSelect: {
    enabled: boolean;
    modifier: "shift" | "ctrl";
  };
}
```

### 3.3.2 Random Placement

```typescript
interface RandomPlacement {
  mode: "random";
  
  // Workflow
  workflow: {
    // 1. Configurer les paramètres
    configure: RandomPlacementConfig;
    
    // 2. Générer le placement
    generate: () => PlacedObject[];
    
    // 3. Preview avant validation
    preview: boolean;
    
    // 4. Ajuster manuellement si besoin
    allowManualAdjust: boolean;
    
    // 5. Régénérer avec nouveau seed
    regenerate: (newSeed?: number) => void;
    
    // 6. Valider le placement
    validate: () => void;
  };
  
  // Historique des générations
  history: {
    maxSnapshots: number;
    snapshots: RandomSnapshot[];
  };
}

interface RandomSnapshot {
  seed: number;
  config: RandomPlacementConfig;
  result: PlacedObject[];
  timestamp: number;
}
```

### 3.3.3 Pattern Placement

```typescript
interface PatternPlacement {
  mode: "pattern";
  
  patterns: {
    // Lignes
    line: {
      direction: "horizontal" | "vertical" | "diagonal";
      spacing: number;
      count: number;
    };
    
    // Grille
    grid: {
      columns: number;
      rows: number;
      spacingX: number;
      spacingY: number;
    };
    
    // Arc
    arc: {
      centerX: number;
      centerY: number;
      radius: number;
      startAngle: number;
      endAngle: number;
      count: number;
    };
    
    // Cercle
    circle: {
      centerX: number;
      centerY: number;
      radius: number;
      count: number;
    };
    
    // Chemin
    path: {
      points: { x: number; y: number }[];
      spacing: number;
      alignToPath: boolean;
    };
  };
}
```

## 3.4 Terrain Multi-Selection

Sélectionner et appliquer un type de terrain à plusieurs tiles simultanément.

```typescript
interface TerrainMultiSelect {
  // Modes de sélection
  selectionMode: "single" | "rectangle" | "freeform" | "bucket";
  
  // Sélection courante
  selectedTiles: { x: number; y: number }[];
  
  // Actions
  actions: {
    // Appliquer un type de terrain
    applyTerrain: (terrainTypeId: string) => void;
    
    // Effacer le terrain
    clearTerrain: () => void;
    
    // Copier/Coller
    copy: () => void;
    paste: (offsetX: number, offsetY: number) => void;
    
    // Transformer
    flipHorizontal: () => void;
    flipVertical: () => void;
    rotate: (degrees: 90 | 180 | 270) => void;
  };
}
```

## 3.5 Micro Tools

| Tool | Raccourci | Description |
|------|-----------|-------------|
| **Select** | `V` | Sélectionner éléments |
| **Terrain Brush** | `B` | Peindre du terrain |
| **Terrain Rect** | `R` | Rectangle de terrain |
| **Terrain Bucket** | `G` | Remplir zone |
| **Object Place** | `O` | Placer un objet |
| **Decor Place** | `D` | Placer un décor |
| **Portal** | `P` | Créer un portail |
| **Eraser** | `E` | Supprimer éléments |
| **Random** | `Shift+R` | Ouvrir panel random |
| **Move** | `M` | Déplacer sélection |

---

# 4. DATA MODELS

## 4.1 Level Document

```typescript
interface LevelDocument {
  // Identifiants
  id: string;
  version: string;
  
  // Metadata
  metadata: LevelMetadata;
  
  // Grille Macro
  macroGrid: {
    width: number;          // Nombre de colonnes
    height: number;         // Nombre de lignes
    blockSize: {
      width: number;        // Pixels par block
      height: number;
    };
    blocks: MacroBlock[][];
  };
  
  // Contenu Micro par block
  microContent: {
    [blockKey: string]: MicroBlockContent;  // "x,y" -> content
  };
  
  // Connexions globales
  portals: PortalConnection[];
  
  // Ambiance globale
  ambiance: AmbianceConfig;
  
  // État éditeur
  editorState: EditorState;
}
```

## 4.2 Macro Block

```typescript
interface MacroBlock {
  // Coordonnées
  x: number;
  y: number;
  
  // Navigation
  navigation: NavigationDirection;
  secondaryNavigation?: NavigationDirection;
  
  // Flags spéciaux
  isSpawn: boolean;
  isExit: boolean;
  isCheckpoint: boolean;
  isSecret: boolean;
  
  // Camera
  camera: {
    lockX: boolean;
    lockY: boolean;
    zoomLevel?: number;
  };
  
  // Référence au contenu Micro
  hasMicroContent: boolean;
  
  // Meta
  name?: string;
  tags?: string[];
}
```

## 4.3 Micro Block Content

```typescript
interface MicroBlockContent {
  // Référence au block parent
  blockX: number;
  blockY: number;
  
  // Terrain
  terrain: {
    grid: (string | null)[][];   // ID du terrain par tile
    placements: TerrainPlacement[];
  };
  
  // Objets
  objects: PlacedObject[];
  
  // Décors
  decor: {
    background: DecorPlacement[];
    foreground: DecorPlacement[];
  };
  
  // Portails locaux
  portals: Portal[];
  
  // Spawn/Exit points
  spawnPoint?: { x: number; y: number };
  exitPoint?: { x: number; y: number };
  
  // Paramètres locaux
  localAmbiance?: Partial<AmbianceConfig>;
}
```

## 4.4 Editor State

```typescript
interface EditorState {
  // Mode actuel
  currentMode: "macro" | "micro";
  
  // Block actif en mode Micro
  activeBlock?: { x: number; y: number };
  
  // Outil actif
  activeTool: string;
  
  // Sélection
  selection: {
    macro: { x: number; y: number }[];
    micro: {
      tiles: { x: number; y: number }[];
      objects: string[];
      decor: string[];
    };
  };
  
  // Layers visibles
  visibleLayers: {
    terrain: boolean;
    objects: boolean;
    decor: boolean;
    portals: boolean;
    grid: boolean;
    navigation: boolean;
  };
  
  // Historique
  history: {
    undoStack: HistoryAction[];
    redoStack: HistoryAction[];
    maxSize: number;
  };
  
  // Clipboard
  clipboard: {
    type: "macro" | "micro" | "objects" | "terrain";
    data: any;
  } | null;
  
  // Préférences
  preferences: {
    gridSnap: boolean;
    gridSize: number;
    showCoordinates: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
  };
}
```

---

# 5. UI COMPONENTS

## 5.1 Layout principal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  [Mode: Macro ▼]  [Level: Cavern_01]  [Save] [Export] [Test] [Settings] │
├──────────────┬──────────────────────────────────────────┬───────────────┤
│              │                                          │               │
│   TOOLBAR    │                                          │   PROPERTIES  │
│              │                                          │               │
│  [Select]    │                                          │   Block Info  │
│  [Navigate]  │                                          │   ─────────── │
│  [Connect]   │           CANVAS                         │   Position    │
│  [Spawn]     │                                          │   Navigation  │
│  [Exit]      │                                          │   Camera      │
│  [Erase]     │                                          │               │
│              │                                          │   ─────────── │
│  ─────────── │                                          │               │
│              │                                          │   Quick Edit  │
│  PALETTE     │                                          │               │
│              │                                          │               │
│  (Micro)     │                                          │               │
│  Terrain     │                                          │               │
│  Objects     │                                          │               │
│  Decor       │                                          │               │
│              │                                          │               │
├──────────────┴──────────────────────────────────────────┴───────────────┤
│  STATUS BAR                                                              │
│  Mode: Macro | Grid: 10x6 | Block: 320x180 | Zoom: 100% | (2, 3)        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Toolbar Macro

```typescript
interface MacroToolbar {
  tools: [
    { id: "select", icon: "cursor", shortcut: "V", group: "main" },
    { id: "navigate", icon: "arrow-right", shortcut: "N", group: "main" },
    { id: "connect", icon: "link", shortcut: "C", group: "main" },
    { id: "spawn", icon: "flag", shortcut: "S", group: "special" },
    { id: "exit", icon: "door-open", shortcut: "E", group: "special" },
    { id: "checkpoint", icon: "save", shortcut: "K", group: "special" },
    { id: "erase", icon: "eraser", shortcut: "X", group: "edit" },
    { id: "fill", icon: "paint-bucket", shortcut: "F", group: "edit" },
  ];
  
  navigationPicker: {
    options: [
      { value: "forward", icon: "→", label: "Avancer" },
      { value: "backward", icon: "←", label: "Reculer" },
      { value: "up", icon: "↑", label: "Monter" },
      { value: "down", icon: "↓", label: "Descendre" },
      { value: "junction", icon: "✚", label: "Croisement" },
    ];
  };
}
```

## 5.3 Toolbar Micro

```typescript
interface MicroToolbar {
  // Groupe Terrain
  terrainTools: [
    { id: "terrain-brush", icon: "paintbrush", shortcut: "B" },
    { id: "terrain-rect", icon: "square", shortcut: "R" },
    { id: "terrain-bucket", icon: "paint-bucket", shortcut: "G" },
    { id: "terrain-line", icon: "minus", shortcut: "L" },
  ];
  
  // Groupe Objets
  objectTools: [
    { id: "object-place", icon: "cube", shortcut: "O" },
    { id: "object-random", icon: "dice", shortcut: "Shift+R" },
  ];
  
  // Groupe Décor
  decorTools: [
    { id: "decor-place", icon: "tree", shortcut: "D" },
    { id: "decor-random", icon: "sparkles", shortcut: "Shift+D" },
  ];
  
  // Groupe Portal
  portalTools: [
    { id: "portal-create", icon: "circle", shortcut: "P" },
    { id: "portal-link", icon: "link", shortcut: "Shift+P" },
  ];
  
  // Utilitaires
  utilTools: [
    { id: "select", icon: "cursor", shortcut: "V" },
    { id: "move", icon: "move", shortcut: "M" },
    { id: "eraser", icon: "eraser", shortcut: "E" },
  ];
}
```

## 5.4 Palette Panel

```typescript
interface PalettePanel {
  // Tabs
  tabs: [
    { id: "terrain", label: "Terrain" },
    { id: "objects", label: "Objets" },
    { id: "decor", label: "Décors" },
  ];
  
  // Filtres
  filters: {
    search: string;
    category: string;
    tags: string[];
  };
  
  // Items affichés
  items: PaletteItem[];
  
  // Sélection courante
  selectedItem: PaletteItem | null;
}

interface PaletteItem {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  tags: string[];
}
```

## 5.5 Properties Panel

```typescript
interface PropertiesPanel {
  // Contexte
  context: "macro_block" | "micro_object" | "micro_terrain" | "portal" | "none";
  
  // Contenu dynamique selon le contexte
  content: MacroBlockProperties | ObjectProperties | TerrainProperties | PortalProperties | null;
}

interface MacroBlockProperties {
  position: { x: number; y: number };
  navigation: NavigationDirection;
  secondaryNavigation?: NavigationDirection;
  camera: {
    lockX: boolean;
    lockY: boolean;
    zoomLevel: number;
  };
  flags: {
    isSpawn: boolean;
    isExit: boolean;
    isCheckpoint: boolean;
    isSecret: boolean;
  };
  name: string;
  tags: string[];
}

interface ObjectProperties {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  isLocked: boolean;
}
```

## 5.6 Random Placement Dialog

```typescript
interface RandomPlacementDialog {
  // Type de contenu
  contentType: "objects" | "decor";
  
  // Sélection des éléments
  elementSelection: {
    available: { id: string; name: string; weight: number }[];
    selected: string[];
  };
  
  // Paramètres
  parameters: {
    density: { value: number; min: 1; max: 50 };
    minDistance: { value: number; min: 0; max: 100 };
    seed: { value: number; randomize: () => void };
  };
  
  // Contraintes
  constraints: {
    groundOnly: boolean;
    avoidTerrain: boolean;
    avoidEdges: boolean;
    edgeMargin: number;
  };
  
  // Preview
  preview: {
    enabled: boolean;
    result: PlacedObject[];
    regenerate: () => void;
  };
  
  // Actions
  actions: {
    generate: () => void;
    apply: () => void;
    cancel: () => void;
  };
}
```

## 5.7 Portal Link Dialog

```typescript
interface PortalLinkDialog {
  // Portail source
  sourcePortal: {
    id: string;
    blockX: number;
    blockY: number;
    position: { x: number; y: number };
  };
  
  // Sélection destination
  destinationMode: "select_existing" | "create_new";
  
  // Portails disponibles
  availablePortals: Portal[];
  
  // Portail destination sélectionné
  targetPortal: Portal | null;
  
  // Options de connexion
  options: {
    bidirectional: boolean;
    transitionType: "instant" | "fade" | "zoom";
    transitionDuration: number;
    preserveVelocity: boolean;
  };
  
  // Actions
  actions: {
    link: () => void;
    cancel: () => void;
  };
}
```

---

# 6. ACTIONS & TOOLS

## 6.1 Macro Actions

```typescript
interface MacroActions {
  // Navigation
  setNavigation(blockX: number, blockY: number, direction: NavigationDirection): void;
  clearNavigation(blockX: number, blockY: number): void;
  fillNavigation(startX: number, startY: number, endX: number, endY: number, direction: NavigationDirection): void;
  
  // Special blocks
  setSpawn(blockX: number, blockY: number): void;
  setExit(blockX: number, blockY: number): void;
  setCheckpoint(blockX: number, blockY: number): void;
  toggleSecret(blockX: number, blockY: number): void;
  
  // Sélection
  selectBlock(blockX: number, blockY: number, addToSelection: boolean): void;
  selectArea(startX: number, startY: number, endX: number, endY: number): void;
  clearSelection(): void;
  
  // Édition
  deleteSelectedBlocks(): void;
  copySelection(): void;
  pasteSelection(targetX: number, targetY: number): void;
  
  // Grid
  resizeGrid(newWidth: number, newHeight: number): void;
  
  // Validation
  validateFlow(): FlowValidation;
  
  // Mode switch
  enterMicroMode(blockX: number, blockY: number): void;
}
```

## 6.2 Micro Actions

```typescript
interface MicroActions {
  // Terrain
  terrain: {
    paint(x: number, y: number, terrainTypeId: string): void;
    paintArea(tiles: { x: number; y: number }[], terrainTypeId: string): void;
    fill(startX: number, startY: number, terrainTypeId: string): void;
    erase(x: number, y: number): void;
    eraseArea(tiles: { x: number; y: number }[]): void;
  };
  
  // Objets
  objects: {
    place(objectType: ObjectType, x: number, y: number, config?: any): PlacedObject;
    move(objectId: string, newX: number, newY: number): void;
    delete(objectId: string): void;
    duplicate(objectId: string, offsetX: number, offsetY: number): PlacedObject;
    updateConfig(objectId: string, config: Partial<any>): void;
    lock(objectId: string, locked: boolean): void;
    
    // Random
    generateRandom(config: RandomPlacementConfig): PlacedObject[];
    applyRandomResult(objects: PlacedObject[]): void;
    clearRandom(): void;
  };
  
  // Décor
  decor: {
    place(decorId: string, layer: "background" | "foreground", x: number, y: number): DecorPlacement;
    move(placementId: string, newX: number, newY: number): void;
    delete(placementId: string): void;
    transform(placementId: string, transform: Partial<DecorTransform>): void;
    
    // Random
    generateRandom(config: RandomDecorConfig): DecorPlacement[];
    applyRandomResult(placements: DecorPlacement[]): void;
  };
  
  // Portails
  portals: {
    create(x: number, y: number, type: "entrance" | "exit" | "bidirectional"): Portal;
    delete(portalId: string): void;
    link(sourceId: string, targetId: string, targetBlockX: number, targetBlockY: number): PortalConnection;
    unlink(connectionId: string): void;
    updatePortal(portalId: string, updates: Partial<Portal>): void;
  };
  
  // Général
  exitToMacro(): void;
  navigateToBlock(direction: "left" | "right" | "up" | "down"): void;
}
```

## 6.3 History Actions

```typescript
interface HistoryActions {
  undo(): void;
  redo(): void;
  
  // Actions groupées
  beginGroup(name: string): void;
  endGroup(): void;
  
  // Gestion
  clear(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  
  // Snapshots
  createSnapshot(name: string): string;
  restoreSnapshot(snapshotId: string): void;
}
```

---

# 7. WORKFLOW

## 7.1 Création d'un niveau

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW: CRÉATION DE NIVEAU                         │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │  1. NOUVEAU NIVEAU   │
    │  - Nom               │
    │  - Taille grille     │
    │  - Block size        │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  2. MODE MACRO       │
    │  - Définir navigation│◄────────────────────┐
    │  - Placer spawn/exit │                     │
    │  - Valider flow      │                     │
    └──────────┬───────────┘                     │
               │                                  │
               ▼                                  │
    ┌──────────────────────┐                     │
    │  3. SÉLECTION BLOCK  │                     │
    │  - Double-clic       │                     │
    │  - Ou "Edit Block"   │                     │
    └──────────┬───────────┘                     │
               │                                  │
               ▼                                  │
    ┌──────────────────────┐                     │
    │  4. MODE MICRO       │                     │
    │                      │                     │
    │  4a. TERRAIN         │                     │
    │  - Peindre sol/murs  │                     │
    │  - Multi-sélection   │                     │
    │                      │                     │
    │  4b. OBJETS          │                     │
    │  - Manuel ou Random  │                     │
    │  - Ajuster positions │                     │
    │                      │                     │
    │  4c. DÉCOR           │                     │
    │  - Manuel ou Random  │                     │
    │  - Background/FG     │                     │
    │                      │                     │
    │  4d. PORTAILS        │                     │
    │  - Créer entrée      │                     │
    │  - Lier à sortie     │                     │
    └──────────┬───────────┘                     │
               │                                  │
               ▼                                  │
    ┌──────────────────────┐                     │
    │  5. RETOUR MACRO     │                     │
    │  - ESC ou bouton     │─────────────────────┘
    │  - Block suivant?    │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  6. TEST & EXPORT    │
    │  - Play test         │
    │  - Export .level.json│
    └──────────────────────┘
```

## 7.2 Workflow Random Placement

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  WORKFLOW: PLACEMENT ALÉATOIRE                           │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │  1. OUVRIR DIALOG    │
    │  - Shift+R (objets)  │
    │  - Shift+D (décor)   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  2. SÉLECTION ITEMS  │
    │  - Cocher éléments   │
    │  - Définir poids     │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  3. PARAMÈTRES       │
    │  - Densité           │
    │  - Distance min      │
    │  - Contraintes       │
    │  - Seed (optionnel)  │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  4. PREVIEW          │
    │  - Générer preview   │◄─────────┐
    │  - Visualiser résult │          │
    └──────────┬───────────┘          │
               │                       │
               ▼                       │
    ┌──────────────────────┐          │
    │  5. SATISFAIT?       │          │
    │                      │          │
    │  NON ──► Régénérer   │──────────┘
    │  OUI ──► Appliquer   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  6. AJUSTEMENT       │
    │  - Déplacer objets   │
    │  - Supprimer certains│
    │  - Lock positions    │
    └──────────────────────┘
```

## 7.3 Workflow Portails

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WORKFLOW: CRÉATION PORTAILS                         │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │  BLOCK A (Micro)     │
    │                      │
    │  1. Outil Portal (P) │
    │  2. Clic = Créer     │
    │  3. Type: Entrance   │
    │                      │
    │  [🌀 Portal_001]     │
    └──────────┬───────────┘
               │
               │  ESC (retour Macro)
               ▼
    ┌──────────────────────┐
    │  MACRO VIEW          │
    │                      │
    │  - Block A marqué    │
    │    avec portail      │
    │                      │
    │  - Double-clic sur   │
    │    Block B           │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  BLOCK B (Micro)     │
    │                      │
    │  1. Outil Portal (P) │
    │  2. Clic = Créer     │
    │  3. Type: Exit       │
    │                      │
    │  [🌀 Portal_002]     │
    └──────────┬───────────┘
               │
               │  Outil Link (Shift+P)
               ▼
    ┌──────────────────────┐
    │  LINK DIALOG         │
    │                      │
    │  Source: Portal_001  │
    │  Target: Portal_002  │
    │                      │
    │  [✓] Bidirectionnel  │
    │  Transition: Fade    │
    │                      │
    │  [Créer lien]        │
    └──────────────────────┘
```

---

# 4. MODE TEST — PLAYTEST

## 4.1 Vue d'ensemble

Le Mode Test permet de **jouer le niveau directement** depuis l'éditeur Macro pour valider le flow et la jouabilité avant d'ajouter le contenu détaillé en mode Micro.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ▶ TEST MODE        level_001_cavern                    [ESC] Exit Test  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐                                                           │
│  │ State:   │                                                           │
│  │ JUMPING  │                                                           │
│  ├──────────┤         ┌─────────────────┐                              │
│  │ Fuel:    │         │                 │                              │
│  │ ████░░░░ │         │    ████████     │  ← Plateforme               │
│  ├──────────┤         │                 │                              │
│  │ Glide:   │         │      ▓▓▓        │  ← Joueur                   │
│  │ ██████░░ │    ═════════════════════════════  ← Sol                  │
│  └──────────┘                                                           │
│                                                                          │
│  Controls: ← → Move | SPACE Jump | SHIFT Parachute | E Jetpack         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Génération automatique du niveau

Le Mode Test génère automatiquement les plateformes basées sur la grille Macro :

### Règles de génération

| Situation | Génération |
|-----------|------------|
| Bloc avec navigation | Sol plein (100% largeur) |
| Bloc avec voisin **en-dessous** | Sol avec trou central (35% | gap | 35%) |
| Bloc avec voisin **au-dessus** | Plateformes flottantes pour monter |
| Spawn | Position initiale du joueur |
| Exit | Zone de victoire |
| Checkpoint | Point de respawn |

### Exemple de génération

```
Grille Macro:                    Plateformes générées:
┌─────┬─────┬─────┐              
│  →  │  →  │  ↓  │              ████████████████████████████  sol plein
├─────┼─────┼─────┤                              ┌──┐
│     │     │  →  │                          ════    ════  sol avec trou
└─────┴─────┴─────┘                              └──┘ (pour descendre)
```

```typescript
function buildTestLevel() {
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const block = blocks[y][x];
      if (block.navigation === 'none') continue;
      
      const hasBlockBelow = y < gridHeight - 1 && blocks[y + 1][x].navigation !== 'none';
      const hasBlockAbove = y > 0 && blocks[y - 1][x].navigation !== 'none';
      
      if (hasBlockBelow) {
        // Sol avec trou pour descendre
        platforms.push({ x: blockX, width: blockW * 0.35, type: 'ground' });
        platforms.push({ x: blockX + blockW * 0.65, width: blockW * 0.35, type: 'ground' });
      } else {
        // Sol plein
        platforms.push({ x: blockX, width: blockW, type: 'ground' });
      }
      
      if (hasBlockAbove) {
        // Plateformes pour monter
        platforms.push({ x: blockX + 30, y: blockY + blockH * 0.65, type: 'platform' });
        platforms.push({ x: blockX + blockW - 120, y: blockY + blockH * 0.35, type: 'platform' });
      }
    }
  }
}
```

## 4.3 Contrôles du joueur

### Mouvements de base

| Touche | Action |
|--------|--------|
| `←` `→` ou `A` `D` | Déplacement horizontal |
| `SPACE` | Saut (1er appui) |
| `SPACE` (en l'air) | Double-saut (2ème appui) |
| `SPACE` (maintenu après double-saut) | Plané |
| `SHIFT` | Parachute (descente lente) |
| `E` | Jetpack |
| `ESC` | Quitter le mode test |

### États du joueur

```typescript
enum PlayerState {
  IDLE,        // Au sol, immobile
  WALKING,     // Au sol, en mouvement
  JUMPING,     // Premier saut
  DOUBLE_JUMP, // Second saut
  FALLING,     // Chute libre
  GLIDING,     // Plané (hold SPACE)
  PARACHUTE,   // Descente lente (SHIFT)
  JETPACK      // Propulsion (E)
}
```

## 4.4 Physique

### Paramètres

```typescript
const physics = {
  // Base
  gravity: 0.6,
  maxFallSpeed: 12,
  moveSpeed: 5,
  friction: 0.85,
  airFriction: 0.95,
  
  // Sauts
  jumpForce: 12,
  doubleJumpForce: 10,
  
  // Plané
  glideGravity: 0.15,
  glideMaxFall: 2,
  glideConsumption: 0.5,   // par frame
  glideRegen: 0.3,          // par frame au sol
  
  // Parachute
  parachuteGravity: 0.1,
  parachuteMaxFall: 1.5,
  
  // Jetpack
  jetpackThrust: 0.8,
  jetpackConsumption: 0.8,  // par frame
  jetpackRegen: 0.2         // par frame (hors utilisation)
};
```

### Ressources

| Ressource | Max | Consommation | Régénération |
|-----------|-----|--------------|--------------|
| **Fuel** (Jetpack) | 100 | 0.8/frame | 0.2/frame (auto) |
| **Glide Energy** | 100 | 0.5/frame | 0.6/frame (au sol) |

## 4.5 HUD

```
┌──────────────┐
│ State: IDLE  │  ← État actuel du joueur
├──────────────┤
│ Fuel: ████░░ │  ← Barre de carburant jetpack
├──────────────┤
│ Glide: █████ │  ← Barre d'énergie de plané
├──────────────┤
│ Pos: 450, 320│  ← Position en pixels
├──────────────┤
│ Block: 1, 2  │  ← Bloc actuel dans la grille
└──────────────┘
```

## 4.6 Victoire et Statistiques

Quand le joueur atteint l'Exit, un écran de victoire s'affiche :

```
┌────────────────────────────────┐
│                                │
│     🎉 Level Complete!         │
│                                │
│   ┌────────┬────────┬───────┐  │
│   │  1:42  │   23   │   2   │  │
│   │  Time  │ Jumps  │ Deaths│  │
│   └────────┴────────┴───────┘  │
│                                │
│   [↻ Restart]    [Exit]        │
│                                │
└────────────────────────────────┘
```

## 4.7 Système de Checkpoints

- Les checkpoints 💾 sont activés quand le joueur passe dessus
- En cas de mort (chute hors niveau), respawn au dernier checkpoint activé
- Si aucun checkpoint activé, respawn au Spawn initial

---

# 5. HISTORY & ROLLBACK

## 5.1 Système d'historique

Chaque action est enregistrée avec un nom descriptif :

```typescript
interface HistorySnapshot {
  blocks: string;      // JSON stringifié des blocs
  timestamp: number;   // Date.now()
  action: string;      // Nom de l'action
}
```

### Actions trackées

| Action | Description |
|--------|-------------|
| `set navigation` | Changement de direction d'un bloc |
| `erase block` | Suppression du contenu d'un bloc |
| `fill area` | Remplissage d'une zone |
| `set spawn` | Placement du point de départ |
| `set exit` | Placement de la sortie |
| `toggle checkpoint` | Ajout/suppression checkpoint |
| `toggle secret` | Ajout/suppression zone secrète |
| `resize grid` | Redimensionnement de la grille |
| `paint navigation` | Peinture par drag |
| `clear block` | Effacement via menu contextuel |

## 5.2 Undo / Redo / Rollback

| Action | Raccourci | Comportement |
|--------|-----------|--------------|
| **Undo** | `Ctrl+Z` | Annule la dernière action |
| **Redo** | `Ctrl+Y` | Rétablit l'action annulée |
| **Rollback** | `Ctrl+R` | Revient avant la dernière série d'actions similaires |

### Comportement du Rollback

Le Rollback est plus agressif que l'Undo :

1. Il identifie l'action courante
2. Il remonte l'historique en sautant les actions du même type
3. Il restaure l'état précédent cette série

```
Historique:
  [0] initial state
  [1] set navigation  ─┐
  [2] set navigation   │ Série groupée
  [3] set navigation  ─┘
  [4] set spawn       ← État actuel

Après Rollback: retour à [0] (avant toute la série de navigation)
```

---

# 6. VALIDATION

## 6.1 Règles de validation Macro

| Check | Description |
|-------|-------------|
| ✅ Spawn défini | Au moins un bloc marqué comme Spawn |
| ✅ Exit définie | Au moins un bloc marqué comme Exit |
| ✅ Chemin valide | Blocs adjacents connectés entre spawn et exit |

### Algorithme de validation du chemin

```typescript
function checkPath(): boolean {
  // BFS - tout bloc adjacent avec navigation est connecté
  const visited = new Set<string>();
  const queue = [spawnBlock];
  
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    if (x === exitBlock.x && y === exitBlock.y) return true;
    
    // Check 4 directions
    for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (inBounds(nx, ny) && blocks[ny][nx].navigation !== 'none') {
        if (!visited.has(`${nx},${ny}`)) {
          queue.push({ x: nx, y: ny });
          visited.add(`${nx},${ny}`);
        }
      }
    }
  }
  return false;
}
```

> **Note**: Les directions (→ ← ↑ ↓) sont des indications visuelles pour la caméra. La connexion est basée sur l'adjacence des blocs, pas sur la direction pointée.

---

# 7. EXPORT FORMAT

## 8.1 Format complet

Le niveau est exporté au format `.level.json` selon le schema défini dans `LEVEL_DEFINITION_SCHEMA.md`.

```json
{
  "metadata": {
    "id": "level_001",
    "name": "The Forgotten Cavern",
    "version": "1.0.0",
    "dimensions": {
      "width": 3200,
      "height": 1080
    },
    "gridInfo": {
      "columns": 10,
      "rows": 6,
      "blockWidth": 320,
      "blockHeight": 180
    },
    "spawn": { "x": 150, "y": 600 },
    "exit": { "x": 3050, "y": 650, "targetLevel": "level_002" }
  },
  
  "navigationGrid": [
    ["none", "none", "none", "none", "none", "none", "none", "none", "none", "none"],
    ["none", "none", "down", "none", "none", "none", "none", "none", "none", "none"],
    ["spawn", "forward", "forward", "forward", "down", "none", "up", "backward", "backward", "exit"],
    ["none", "none", "none", "none", "forward", "forward", "forward", "up", "none", "none"],
    ["none", "none", "none", "none", "none", "none", "none", "none", "none", "none"],
    ["none", "none", "none", "none", "none", "none", "none", "none", "none", "none"]
  ],
  
  "blocks": {
    "0,2": {
      "terrain": { /* ... */ },
      "objects": [ /* ... */ ],
      "decor": { /* ... */ },
      "portals": []
    },
    "1,2": { /* ... */ },
    "2,1": { /* ... */ },
    "2,2": { /* ... */ }
    // ... autres blocks avec contenu
  },
  
  "portalConnections": [
    {
      "id": "conn_001",
      "source": { "portalId": "portal_001", "block": "2,2" },
      "target": { "portalId": "portal_002", "block": "7,2" },
      "bidirectional": true,
      "transition": { "type": "fade", "duration": 300 }
    }
  ],
  
  "ambiance": {
    "global": { /* ... */ },
    "parallax": [ /* ... */ ],
    "particles": { /* ... */ },
    "audio": { /* ... */ }
  }
}
```

## 8.2 Conversion Navigation → Platforms

Lors de l'export, la grille de navigation est convertie en plateformes et bounds de caméra :

```typescript
function convertNavigationToGameData(grid: NavigationDirection[][]): GameLevelData {
  const platforms: Platform[] = [];
  const cameraBounds: CameraBound[] = [];
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const nav = grid[y][x];
      
      if (nav !== "none") {
        // Créer les bounds de caméra pour ce block
        cameraBounds.push({
          x: x * blockWidth,
          y: y * blockHeight,
          width: blockWidth,
          height: blockHeight,
          allowedDirections: getConnectedDirections(grid, x, y)
        });
      }
    }
  }
  
  return { platforms, cameraBounds };
}
```

---

# ANNEXES

## A. Keyboard Shortcuts

### Mode Macro

| Shortcut | Action |
|----------|--------|
| `V` | Outil Sélection |
| `N` | Outil Navigation |
| `C` | Outil Connexion |
| `S` | Placer Spawn |
| `E` | Placer Exit |
| `K` | Placer Checkpoint |
| `H` | Placer Secret |
| `X` | Effacer |
| `F` | Remplir |
| `Enter` | Entrer en mode Micro |
| `Ctrl+S` | Sauvegarder / Exporter |
| `Ctrl+Z` | Undo (annuler) |
| `Ctrl+Y` | Redo (refaire) |
| `Ctrl+R` | **Rollback** (annuler série) |
| `←` `→` `↑` `↓` | Changer direction de navigation |

### Mode Test

| Shortcut | Action |
|----------|--------|
| `←` `→` ou `A` `D` | Déplacement |
| `SPACE` | Saut / Double-saut / Plané |
| `SHIFT` | Parachute |
| `E` | Jetpack |
| `ESC` | Quitter le mode test |

### Mode Micro

| Shortcut | Action |
|----------|--------|
| `V` | Outil Sélection |
| `B` | Pinceau Terrain |
| `R` | Rectangle Terrain |
| `G` | Remplissage Terrain |
| `O` | Placer Objet |
| `D` | Placer Décor |
| `P` | Créer Portail |
| `Shift+P` | Lier Portails |
| `Shift+R` | Random Objets |
| `Shift+D` | Random Décor |
| `E` | Effacer |
| `M` | Déplacer |
| `ESC` | Retour Macro |
| `←→↑↓` | Block adjacent |

## B. Validation Rules

### Macro

- [x] Un seul spawn
- [x] Au moins une exit
- [x] Chemin valide spawn → exit (blocs adjacents connectés)
- [ ] ~~Pas de blocks isolés dans le chemin~~ (supprimé - trop restrictif)
- [ ] ~~Connexions cohérentes entre blocks adjacents~~ (supprimé - directions = indication visuelle)

> **Note v1.1**: Les règles de connexion strictes ont été supprimées. Les directions servent uniquement d'indication pour la caméra, pas de contrainte de gameplay.

### Micro

- [ ] Pas d'objets hors bounds
- [ ] Portails liés correctement
- [ ] Terrain de sol pour spawn/exit
- [ ] Pas de collision d'objets

---

*OpenSpec Level Creator — Shadow Drift v1.1.0*
