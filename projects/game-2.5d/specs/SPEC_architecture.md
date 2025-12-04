# Architecture Détaillée - Game 2.5D

> Spécification technique de l'architecture des 3 applications

---

## 1. Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHARED LAYER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Components│ │  Utils   │ │  Styles  │ │  Types   │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    GAME     │      │ BACKOFFICE  │      │ STAGE MAKER │
│             │      │             │      │             │
│ - Engine    │      │ - Asset Mgr │      │ - Macro Ed  │
│ - Renderer  │      │ - Previewer │      │ - Micro Ed  │
│ - Input     │      │ - Exporter  │      │ - Exporter  │
│ - State     │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   DATA LAYER    │
                    │                 │
                    │ - levels/*.json │
                    │ - chars/*.json  │
                    │ - story/*.md    │
                    └─────────────────┘
```

---

## 2. Shared Components

### 2.1 Liste des Composants

```
shared/components/
├── core/
│   ├── component.js          # Classe de base
│   ├── event-emitter.js      # Gestion événements
│   └── state-manager.js      # Gestion état
├── rendering/
│   ├── sprite-renderer.js    # Rendu sprites
│   ├── parallax-layer.js     # Couche parallaxe
│   ├── camera.js             # Gestion caméra
│   └── animation-player.js   # Animations
├── ui/
│   ├── button.js             # Bouton stylisé
│   ├── modal.js              # Fenêtre modale
│   ├── dropdown.js           # Menu déroulant
│   ├── tabs.js               # Onglets
│   └── tooltip.js            # Infobulles
├── editors/
│   ├── asset-picker.js       # Sélecteur assets
│   ├── zone-editor.js        # Éditeur zones
│   ├── property-panel.js     # Panneau propriétés
│   └── grid-overlay.js       # Grille d'édition
└── game/
    ├── character-controller.js  # Contrôle perso
    ├── collision-system.js      # Collisions
    ├── level-loader.js          # Chargement niveaux
    └── input-handler.js         # Gestion inputs
```

### 2.2 Classe de Base Component

```javascript
// shared/components/core/component.js

export class Component {
  constructor(options = {}) {
    this.id = options.id || this._generateId();
    this.element = null;
    this.children = [];
    this.parent = null;
    this.state = {};
    this._eventListeners = [];
  }

  // Lifecycle
  mount(container) { /* ... */ }
  unmount() { /* ... */ }
  update(newState) { /* ... */ }

  // DOM
  render() { return ''; }
  querySelector(selector) { /* ... */ }

  // Events
  on(event, handler) { /* ... */ }
  off(event, handler) { /* ... */ }
  emit(event, data) { /* ... */ }

  // Cleanup
  destroy() { /* ... */ }
}
```

---

## 3. Application GAME

### 3.1 Structure
```
src/game/
├── index.html
├── main.js                 # Point d'entrée
├── styles/
│   ├── game.css            # Styles principaux
│   ├── ui.css              # Interface utilisateur
│   └── animations.css      # Animations CSS
├── engine/
│   ├── game-engine.js      # Boucle de jeu
│   ├── renderer.js         # Rendu principal
│   └── physics.js          # Physique simple
├── scenes/
│   ├── scene-manager.js    # Gestion scènes
│   ├── title-scene.js      # Écran titre
│   ├── select-scene.js     # Sélection perso
│   └── play-scene.js       # Scène de jeu
└── ui/
    ├── hud.js              # Heads-up display
    ├── pause-menu.js       # Menu pause
    └── dialog-box.js       # Boîte de dialogue
```

### 3.2 Game Engine

```javascript
// src/game/engine/game-engine.js

export class GameEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.scenes = new Map();
    this.currentScene = null;
    this.isRunning = false;
    this.lastTime = 0;
  }

  // Scenes
  addScene(name, scene) { /* ... */ }
  switchScene(name, data) { /* ... */ }

  // Game Loop
  start() {
    this.isRunning = true;
    this._gameLoop(0);
  }

  stop() {
    this.isRunning = false;
  }

  _gameLoop(timestamp) {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this._update(deltaTime);
    this._render();

    requestAnimationFrame((t) => this._gameLoop(t));
  }

  _update(deltaTime) {
    this.currentScene?.update(deltaTime);
  }

  _render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.currentScene?.render(this.ctx);
  }
}
```

### 3.3 Système de Navigation Multi-Mode

```javascript
// src/game/engine/navigation-system.js

export const NavigationMode = {
  FORWARD: 'forward',
  BACKWARD: 'backward',
  UP: 'up',
  DOWN: 'down'
};

export class NavigationSystem {
  constructor() {
    this.currentMode = NavigationMode.FORWARD;
    this.zones = [];
    this.currentZone = null;
  }

  setMode(mode) {
    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.emit('modeChanged', { previous: previousMode, current: mode });
  }

  // Directions selon le mode
  getMovementVector(input) {
    switch (this.currentMode) {
      case NavigationMode.FORWARD:
        return { x: input.horizontal, y: 0 };
      case NavigationMode.BACKWARD:
        return { x: -input.horizontal, y: 0 };
      case NavigationMode.UP:
        return { x: 0, y: -input.vertical };
      case NavigationMode.DOWN:
        return { x: 0, y: input.vertical };
    }
  }

  checkZoneTransition(position) {
    for (const zone of this.zones) {
      if (this._isInZone(position, zone.trigger)) {
        if (zone.toMode !== this.currentMode) {
          this.setMode(zone.toMode);
          return zone;
        }
      }
    }
    return null;
  }
}
```

---

## 4. Application BACKOFFICE

### 4.1 Structure
```
src/backoffice/
├── index.html
├── main.js
├── styles/
│   ├── backoffice.css
│   ├── asset-library.css
│   └── preview.css
├── modules/
│   ├── asset-manager.js      # Gestion assets
│   ├── sprite-editor.js      # Édition métadonnées
│   ├── animation-preview.js  # Preview animations
│   └── export-manager.js     # Export packs
├── views/
│   ├── library-view.js       # Vue bibliothèque
│   ├── detail-view.js        # Vue détaillée
│   └── import-view.js        # Vue import
└── services/
    ├── file-service.js       # Lecture fichiers
    └── storage-service.js    # Stockage local
```

### 4.2 Organisation des Assets

```javascript
// src/backoffice/modules/asset-manager.js

export const AssetCategory = {
  CHARACTER: 'character',
  DECOR: 'decor',
  OBJECT: 'object',
  EFFECT: 'effect',
  UI: 'ui'
};

export const AssetTheme = {
  FOREST: 'forest',
  CASTLE: 'castle',
  CAVE: 'cave',
  SKY: 'sky',
  VILLAGE: 'village'
};

export class AssetManager {
  constructor() {
    this.assets = new Map();
    this.filters = {
      category: null,
      theme: null,
      mode: null,
      search: ''
    };
  }

  // CRUD
  async loadAssets() { /* ... */ }
  addAsset(asset) { /* ... */ }
  updateAsset(id, updates) { /* ... */ }
  deleteAsset(id) { /* ... */ }

  // Filtres
  filterByCategory(category) { /* ... */ }
  filterByTheme(theme) { /* ... */ }
  filterByMode(mode) { /* ... */ }
  search(query) { /* ... */ }

  // Export
  exportPack(assetIds, name) { /* ... */ }
  importPack(file) { /* ... */ }
}
```

### 4.3 Format Métadonnées Asset

```json
{
  "id": "sprite_tree_001",
  "name": "Grand Chêne",
  "file": "decor/forest/tree_oak_01.png",
  "category": "decor",
  "theme": "forest",
  "modes": ["forward", "backward"],
  "dimensions": { "width": 128, "height": 256 },
  "anchor": { "x": 64, "y": 256 },
  "layers": [3],
  "collision": {
    "enabled": true,
    "box": { "x": 48, "y": 200, "width": 32, "height": 56 }
  },
  "animation": null,
  "tags": ["tree", "nature", "large"],
  "createdAt": "2025-12-03T10:00:00Z"
}
```

---

## 5. Application STAGE MAKER

### 5.1 Structure
```
src/stage-maker/
├── index.html
├── main.js
├── styles/
│   ├── stage-maker.css
│   ├── macro-editor.css
│   └── micro-editor.css
├── editors/
│   ├── macro-editor.js       # Vue macroscopique
│   ├── micro-editor.js       # Vue microscopique
│   ├── zone-painter.js       # Dessin zones
│   └── sprite-placer.js      # Placement sprites
├── tools/
│   ├── selection-tool.js
│   ├── paint-tool.js
│   ├── erase-tool.js
│   └── transition-tool.js
├── panels/
│   ├── zone-panel.js         # Propriétés zone
│   ├── layer-panel.js        # Gestion couches
│   ├── asset-panel.js        # Assets disponibles
│   └── properties-panel.js   # Propriétés sélection
└── services/
    ├── level-service.js      # CRUD niveaux
    ├── undo-service.js       # Undo/Redo
    └── export-service.js     # Export JSON
```

### 5.2 Vue Macroscopique

```javascript
// src/stage-maker/editors/macro-editor.js

export class MacroEditor {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.zones = [];
    this.selectedZone = null;
    this.tool = 'select';
    this.gridSize = 50;
  }

  // Zones
  createZone(type, bounds) {
    const zone = {
      id: this._generateId(),
      type: type, // FORWARD, UP, DOWN, BACKWARD
      bounds: bounds,
      color: this._getColorForType(type),
      connections: []
    };
    this.zones.push(zone);
    this.render();
    return zone;
  }

  // Connexions entre zones
  connectZones(fromId, toId, transitionPoint) {
    const from = this.zones.find(z => z.id === fromId);
    const to = this.zones.find(z => z.id === toId);

    from.connections.push({
      targetId: toId,
      point: transitionPoint,
      type: 'transition'
    });
  }

  // Rendu minimap
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawGrid();
    this._drawZones();
    this._drawConnections();
    this._drawSelection();
  }
}
```

### 5.3 Vue Microscopique

```javascript
// src/stage-maker/editors/micro-editor.js

export class MicroEditor {
  constructor(container) {
    this.container = container;
    this.currentZone = null;
    this.layers = [];
    this.sprites = [];
    this.selectedSprites = [];
    this.camera = { x: 0, y: 0, zoom: 1 };
  }

  // Chargement zone
  loadZone(zone) {
    this.currentZone = zone;
    this.sprites = [...zone.sprites];
    this.layers = [...zone.parallax.layers];
    this.render();
  }

  // Placement sprites
  placeSprite(assetId, position, layer) {
    const sprite = {
      id: this._generateId(),
      assetId: assetId,
      position: position,
      layer: layer,
      rotation: 0,
      scale: { x: 1, y: 1 },
      flipX: false,
      flipY: false
    };
    this.sprites.push(sprite);
    this._sortByLayer();
    this.render();
    return sprite;
  }

  // Configuration parallaxe
  setLayerSpeed(layerIndex, speed) {
    this.layers[layerIndex].speed = speed;
  }

  // Export zone
  exportZone() {
    return {
      ...this.currentZone,
      sprites: this.sprites,
      parallax: { layers: this.layers }
    };
  }
}
```

---

## 6. Flux de Données

### 6.1 Création d'un Niveau (Workflow)

```
1. BACKOFFICE: Importer/créer les sprites nécessaires
        │
        ▼
2. STAGE MAKER (Macro): Dessiner les zones et transitions
        │
        ▼
3. STAGE MAKER (Micro): Placer sprites et configurer parallaxe
        │
        ▼
4. Export: Générer level_xxx.json
        │
        ▼
5. GAME: Charger et jouer le niveau
```

### 6.2 Format Export Niveau Complet

```json
{
  "version": "1.0",
  "id": "level_001",
  "meta": {
    "name": "La Forêt Enchantée",
    "theme": "forest",
    "difficulty": 1,
    "estimatedTime": "5min",
    "author": "SB",
    "createdAt": "2025-12-03"
  },
  "zones": [
    {
      "id": "zone_001",
      "mode": "FORWARD",
      "bounds": { "x": 0, "y": 0, "width": 3000, "height": 800 },
      "parallax": {
        "layers": [
          { "depth": 5, "asset": "bg_sky", "speed": 0.1, "repeat": true },
          { "depth": 4, "asset": "bg_mountains", "speed": 0.3 },
          { "depth": 3, "asset": "bg_trees_far", "speed": 0.6 },
          { "depth": 1, "asset": "ground_forest", "speed": 1.0 }
        ]
      },
      "sprites": [
        { "id": "s001", "assetId": "tree_001", "pos": [200, 500], "layer": 2 },
        { "id": "s002", "assetId": "rock_003", "pos": [450, 650], "layer": 1 }
      ],
      "transitions": [
        { "to": "zone_002", "trigger": { "x": 2900, "y": 0, "w": 100, "h": 800 } }
      ]
    },
    {
      "id": "zone_002",
      "mode": "UP",
      "bounds": { "x": 0, "y": 0, "width": 800, "height": 2000 },
      "parallax": { /* ... */ },
      "sprites": [ /* ... */ ],
      "transitions": [
        { "to": "zone_003", "trigger": { "x": 0, "y": 0, "w": 800, "h": 100 } }
      ]
    }
  ],
  "spawn": {
    "zoneId": "zone_001",
    "position": { "x": 100, "y": 600 }
  },
  "storyTriggers": [
    { "zoneId": "zone_001", "position": { "x": 500, "y": 600 }, "dialogId": "intro_001" }
  ]
}
```

---

## 7. CSS Architecture

### 7.1 Variables Globales

```css
/* shared/styles/variables.css */

:root {
  /* Colors */
  --color-primary: #4a90d9;
  --color-secondary: #2ecc71;
  --color-danger: #e74c3c;
  --color-warning: #f39c12;

  /* Backgrounds */
  --bg-dark: #1a1a2e;
  --bg-medium: #16213e;
  --bg-light: #0f3460;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.3);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
}
```

### 7.2 BEM Naming Convention

```css
/* Exemple: Asset Card */

.asset-card { /* Block */ }
.asset-card__image { /* Element */ }
.asset-card__title { /* Element */ }
.asset-card__meta { /* Element */ }
.asset-card--selected { /* Modifier */ }
.asset-card--dragging { /* Modifier */ }
```

---

## 8. Tests avec Playwright

### 8.1 Structure Tests

```
tests/
├── e2e/
│   ├── game/
│   │   ├── navigation.spec.js
│   │   └── character-selection.spec.js
│   ├── backoffice/
│   │   ├── asset-import.spec.js
│   │   └── asset-filter.spec.js
│   └── stage-maker/
│       ├── zone-creation.spec.js
│       └── sprite-placement.spec.js
├── visual/
│   ├── snapshots/
│   └── parallax-rendering.spec.js
└── fixtures/
    ├── test-level.json
    └── test-assets/
```

### 8.2 Exemple Test E2E

```javascript
// tests/e2e/game/navigation.spec.js

import { test, expect } from '@playwright/test';

test.describe('Navigation System', () => {
  test('should change mode when entering transition zone', async ({ page }) => {
    await page.goto('/game/');

    // Start game
    await page.click('[data-testid="start-button"]');
    await page.click('[data-testid="character-prince"]');

    // Move forward until transition
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(16);
    }

    // Verify mode changed to UP
    const modeIndicator = page.locator('[data-testid="mode-indicator"]');
    await expect(modeIndicator).toHaveText('UP');
  });
});
```

---

## Annexe: Diagramme des Classes Principales

```
┌─────────────────┐     ┌─────────────────┐
│   GameEngine    │────▶│  SceneManager   │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Renderer     │     │     Scene       │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ ParallaxLayer   │     │   Character     │
└─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ SpriteRenderer  │◀────│NavigationSystem │
└─────────────────┘     └─────────────────┘
```
