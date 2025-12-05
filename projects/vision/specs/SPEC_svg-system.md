# Spécifications - Système SVG

## Vue d'ensemble

Le projet Game 2.5D utilise une architecture **SVG-first** pour les éléments graphiques. Cette approche offre une scalabilité parfaite, des fichiers légers et une manipulation directe via CSS/JS.

---

## 1. Stratégie de Rendu

### 1.1 Approche hybride

| Composant | Technique | Raison |
|-----------|-----------|--------|
| **Backgrounds/Parallaxe** | SVG dans DOM | Scalable, léger, facile à éditer |
| **Personnages** | SVG modulaire + CSS animations | Fluide, contrôlable |
| **Effets spéciaux** | Canvas 2D | Performance pour particules |
| **UI** | SVG pur | Netteté parfaite |

### 1.2 Avantages SVG pour ce projet

| Avantage | Description |
|----------|-------------|
| Scalabilité parfaite | Pas de pixelisation, adapté à toutes les résolutions |
| Fichiers légers | Un SVG < PNG équivalent en taille |
| Manipulation DOM | Animation CSS/JS directe des éléments |
| Style "hand-painted" | Parfait pour l'esthétique du projet |
| Thématisation facile | Changement de couleurs via CSS variables |

---

## 2. Architecture des Fichiers

### 2.1 Structure des dossiers

```
assets/
├── svg/
│   ├── characters/              <- Personnages modulaires
│   │   ├── prince.svg
│   │   ├── princess.svg
│   │   └── robot.svg
│   ├── backgrounds/             <- Couches de parallaxe
│   │   ├── sky.svg
│   │   ├── mountains.svg
│   │   ├── trees-far.svg
│   │   └── trees-near.svg
│   ├── symbols/                 <- Éléments réutilisables
│   │   ├── common-defs.svg      <- Gradients, patterns partagés
│   │   └── sprite-parts.svg     <- Parties de personnages
│   └── ui/                      <- Interface utilisateur
│       ├── buttons.svg
│       ├── icons.svg
│       └── hud.svg
├── css/
│   └── animations/              <- Animations CSS des sprites
│       ├── character-idle.css
│       ├── character-walk.css
│       ├── character-run.css
│       └── character-jump.css
└── sprites/                     <- Fallback PNG si nécessaire
    └── ...
```

### 2.2 Conventions de nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Fichier SVG | `kebab-case.svg` | `prince-walk.svg` |
| ID dans SVG | `camelCase` | `id="princeHead"` |
| Classes CSS | `kebab-case` | `class="leg-front"` |
| Symboles | `kebab-case` | `id="character-head"` |
| Animations | `anim-{action}` | `anim-walk`, `anim-idle` |

---

## 3. Structure SVG des Personnages

### 3.1 Personnage modulaire (anatomie)

Chaque personnage est composé de parties articulées :

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96">
  <defs>
    <!-- Styles partagés -->
    <style>
      :root {
        --skin-color: #FFE4C4;
        --hair-color: #FFD700;
        --primary-color: #4169E1;
        --accent-color: #FFD700;
      }
      .skin { fill: var(--skin-color); }
      .hair { fill: var(--hair-color); }
      .primary { fill: var(--primary-color); }
      .accent { fill: var(--accent-color); }
    </style>

    <!-- Symboles des parties du corps -->
    <symbol id="head">...</symbol>
    <symbol id="body">...</symbol>
    <symbol id="arm">...</symbol>
    <symbol id="leg">...</symbol>
    <symbol id="accessory">...</symbol>
  </defs>

  <!-- Assemblage avec points d'articulation -->
  <g id="character" class="character-root">
    <!-- Membres arrière (z-index bas) -->
    <g class="arm-back" data-pivot="24,40">
      <use href="#arm"/>
    </g>
    <g class="leg-back" data-pivot="28,58">
      <use href="#leg"/>
    </g>

    <!-- Corps central -->
    <use href="#body"/>

    <!-- Membres avant (z-index haut) -->
    <g class="leg-front" data-pivot="36,58">
      <use href="#leg"/>
    </g>
    <g class="arm-front" data-pivot="40,40">
      <use href="#arm"/>
    </g>

    <!-- Accessoires animés -->
    <g class="accessory scarf" data-physics="wind">
      <use href="#accessory"/>
    </g>

    <!-- Tête (toujours au-dessus) -->
    <use href="#head"/>
  </g>
</svg>
```

### 3.2 Points d'articulation

| Partie | Pivot (x, y) | Amplitude rotation |
|--------|--------------|-------------------|
| Tête | 32, 34 | -15° à +15° |
| Bras avant | 40, 40 | -45° à +45° |
| Bras arrière | 24, 40 | -45° à +45° |
| Jambe avant | 36, 58 | -30° à +30° |
| Jambe arrière | 28, 58 | -30° à +30° |
| Écharpe (base) | 32, 32 | Animation path |

### 3.3 Dimensions standard

| Type | Taille (px) | ViewBox |
|------|-------------|---------|
| Personnage debout | 64 x 96 | `0 0 64 96` |
| Personnage + véhicule | 128 x 96 | `0 0 128 96` |
| Robot | 64 x 64 | `0 0 64 64` |
| Tête seule | 32 x 32 | `0 0 32 32` |

---

## 4. Système d'Animation

### 4.1 Types d'animation supportés

| Type | Usage | Technique |
|------|-------|-----------|
| **Transform** | Rotation, scale, translate | CSS transform |
| **Path morphing** | Écharpe, cheveux | CSS d property (Chrome) / JS |
| **Opacity** | Apparition, disparition | CSS opacity |
| **Stroke** | Dessins progressifs | CSS stroke-dashoffset |

### 4.2 Animations CSS (préférées)

```css
/* Variables d'animation */
:root {
  --anim-idle-duration: 2s;
  --anim-walk-duration: 0.5s;
  --anim-run-duration: 0.35s;
  --anim-jump-duration: 0.6s;
}

/* Animation Idle */
@keyframes idle-breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.02); }
}

@keyframes idle-scarf {
  0%, 100% { d: path("M26,30 Q32,32 38,30 Q50,35 55,28"); }
  50% { d: path("M26,30 Q32,34 38,30 Q52,38 58,32"); }
}

.character-root.idle {
  animation: idle-breathe var(--anim-idle-duration) ease-in-out infinite;
}

.character-root.idle .scarf path {
  animation: idle-scarf var(--anim-idle-duration) ease-in-out infinite;
}

/* Animation Walk */
@keyframes walk-leg-front {
  0%, 100% { transform: rotate(-20deg); }
  50% { transform: rotate(20deg); }
}

@keyframes walk-leg-back {
  0%, 100% { transform: rotate(20deg); }
  50% { transform: rotate(-20deg); }
}

.character-root.walk .leg-front {
  transform-origin: 36px 58px;
  animation: walk-leg-front var(--anim-walk-duration) ease-in-out infinite;
}

.character-root.walk .leg-back {
  transform-origin: 28px 58px;
  animation: walk-leg-back var(--anim-walk-duration) ease-in-out infinite;
}
```

### 4.3 Animation JavaScript (contrôle précis)

Module `SVGAnimator` pour les animations complexes :

```javascript
// shared/components/animation/SVGAnimator.js
export class SVGAnimator {
  constructor(svgElement) {
    this.svg = svgElement;
    this.root = svgElement.querySelector('.character-root');
    this.animations = new Map();
    this.currentAnim = null;
    this.isPlaying = false;
  }

  /**
   * Définir une animation
   * @param {string} name - Nom de l'animation
   * @param {Object} config - Configuration
   */
  defineAnimation(name, config) {
    this.animations.set(name, {
      frames: config.frames,
      duration: config.duration,
      loop: config.loop ?? true,
      easing: config.easing ?? 'ease-in-out',
      onStart: config.onStart,
      onEnd: config.onEnd
    });
  }

  /**
   * Jouer une animation
   * @param {string} name - Nom de l'animation
   */
  play(name) {
    if (this.currentAnim === name && this.isPlaying) return;

    // Retirer l'ancienne classe d'animation
    if (this.currentAnim) {
      this.root.classList.remove(this.currentAnim);
    }

    // Ajouter la nouvelle
    this.root.classList.add(name);
    this.currentAnim = name;
    this.isPlaying = true;

    const anim = this.animations.get(name);
    if (anim?.onStart) anim.onStart();
  }

  /**
   * Arrêter l'animation courante
   */
  stop() {
    if (this.currentAnim) {
      this.root.classList.remove(this.currentAnim);
      const anim = this.animations.get(this.currentAnim);
      if (anim?.onEnd) anim.onEnd();
    }
    this.currentAnim = null;
    this.isPlaying = false;
  }

  /**
   * Basculer vers une animation (avec transition)
   * @param {string} name - Nom de l'animation cible
   * @param {number} transitionTime - Durée de transition en ms
   */
  transitionTo(name, transitionTime = 100) {
    this.root.style.transition = `all ${transitionTime}ms`;
    this.play(name);
    setTimeout(() => {
      this.root.style.transition = '';
    }, transitionTime);
  }
}
```

### 4.4 Animations disponibles par personnage

| Animation | Prince | Princesse | Robot |
|-----------|--------|-----------|-------|
| `idle` | Respire, écharpe flotte | Respire, mèche de cheveux | Clignote, répare boulon |
| `walk` | Pas légers, écharpe ondule | Sautille, cheveux balancent | Roule ou ressort |
| `run` | Course, écharpe horizontale | Course, cheveux au vent | Roue rapide |
| `jump` | Bras levés | Bras levés, robe suit | Boost de gaz |
| `fall` | Agitation des membres | Cheveux remontent | Yeux surpris |

---

## 5. Système de Parallaxe SVG

### 5.1 Configuration des couches

| Depth | Vitesse | Contenu | Z-Index |
|-------|---------|---------|---------|
| 0.1 | 10% | Ciel, nuages lointains | 0 |
| 0.3 | 30% | Montagnes | 1 |
| 0.5 | 50% | Arbres lointains | 2 |
| 0.7 | 70% | Arbres proches | 3 |
| 1.0 | 100% | Sol, éléments jouables | 4 |
| 1.2 | 120% | Premier plan, décors | 5 |

### 5.2 Module ParallaxSVG

```javascript
// shared/components/parallax/ParallaxSVG.js
export class ParallaxSVG {
  constructor(container) {
    this.container = container;
    this.layers = [];
    this.cameraX = 0;
    this.cameraY = 0;
  }

  /**
   * Ajouter une couche de parallaxe
   * @param {string} svgUrl - URL du fichier SVG
   * @param {number} depth - Profondeur (0.1 = lent, 1.0 = normal)
   * @param {Object} options - Options supplémentaires
   */
  async addLayer(svgUrl, depth, options = {}) {
    const layer = document.createElement('div');
    layer.className = 'parallax-layer';
    layer.dataset.depth = depth;
    layer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: ${Math.floor((1 - depth) * 10)};
      will-change: transform;
      pointer-events: none;
    `;

    // Charger le SVG
    const response = await fetch(svgUrl);
    const svgContent = await response.text();
    layer.innerHTML = svgContent;

    // Configurer le SVG
    const svgEl = layer.querySelector('svg');
    if (svgEl) {
      svgEl.style.width = options.repeat ? `${options.repeatWidth || 200}%` : '100%';
      svgEl.style.height = '100%';
      svgEl.setAttribute('preserveAspectRatio', options.preserveAspectRatio || 'xMidYMid slice');
    }

    this.layers.push({
      element: layer,
      depth,
      offsetY: options.offsetY || 0
    });

    this.container.appendChild(layer);
    return layer;
  }

  /**
   * Mettre à jour la position de la caméra
   * @param {number} x - Position X de la caméra
   * @param {number} y - Position Y de la caméra (optionnel)
   */
  update(x, y = 0) {
    this.cameraX = x;
    this.cameraY = y;

    for (const layer of this.layers) {
      const offsetX = -this.cameraX * layer.depth;
      const offsetY = (-this.cameraY * layer.depth) + layer.offsetY;
      layer.element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    }
  }

  /**
   * Supprimer toutes les couches
   */
  clear() {
    for (const layer of this.layers) {
      layer.element.remove();
    }
    this.layers = [];
  }
}
```

### 5.3 Structure SVG d'une couche de background

```xml
<!-- assets/svg/backgrounds/mountains.svg -->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1920 1080"
     preserveAspectRatio="xMidYMax slice">

  <defs>
    <!-- Dégradé pour les montagnes -->
    <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#8B9DC3"/>
      <stop offset="100%" style="stop-color:#5D6D7E"/>
    </linearGradient>

    <!-- Pattern de texture -->
    <pattern id="rockTexture" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/>
    </pattern>
  </defs>

  <!-- Montagne principale -->
  <path d="M0,1080 L400,300 L800,600 L1200,200 L1600,500 L1920,400 L1920,1080 Z"
        fill="url(#mountainGradient)"/>

  <!-- Texture overlay -->
  <path d="M0,1080 L400,300 L800,600 L1200,200 L1600,500 L1920,400 L1920,1080 Z"
        fill="url(#rockTexture)"
        opacity="0.5"/>
</svg>
```

---

## 6. Chargement et Cache

### 6.1 SVGLoader

```javascript
// shared/components/loaders/SVGLoader.js
export class SVGLoader {
  static cache = new Map();

  /**
   * Charger un SVG (avec cache)
   * @param {string} url - URL du fichier SVG
   * @returns {Promise<string>} - Contenu SVG
   */
  static async load(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${url}`);
    }

    const content = await response.text();
    this.cache.set(url, content);
    return content;
  }

  /**
   * Charger plusieurs SVGs en parallèle
   * @param {Object} urls - Map de nom -> URL
   * @returns {Promise<Object>} - Map de nom -> contenu
   */
  static async loadMultiple(urls) {
    const entries = Object.entries(urls);
    const results = await Promise.all(
      entries.map(([name, url]) => this.load(url).then(content => [name, content]))
    );
    return Object.fromEntries(results);
  }

  /**
   * Injecter un SVG dans un élément
   * @param {string} url - URL du fichier SVG
   * @param {HTMLElement} container - Élément conteneur
   * @returns {Promise<SVGElement>} - Élément SVG injecté
   */
  static async inject(url, container) {
    const content = await this.load(url);
    container.innerHTML = content;
    return container.querySelector('svg');
  }

  /**
   * Vider le cache
   */
  static clearCache() {
    this.cache.clear();
  }
}
```

### 6.2 Préchargement des assets

```javascript
// Préchargement au démarrage du jeu
const svgsToPreload = {
  // Personnages
  'prince': '/assets/svg/characters/prince.svg',
  'princess': '/assets/svg/characters/princess.svg',
  'robot': '/assets/svg/characters/robot.svg',

  // Backgrounds
  'sky': '/assets/svg/backgrounds/sky.svg',
  'mountains': '/assets/svg/backgrounds/mountains.svg',
  'trees-far': '/assets/svg/backgrounds/trees-far.svg',
  'trees-near': '/assets/svg/backgrounds/trees-near.svg'
};

// Dans l'écran de chargement
await SVGLoader.loadMultiple(svgsToPreload);
```

---

## 7. Optimisations

### 7.1 Performance DOM

| Technique | Usage |
|-----------|-------|
| `will-change: transform` | Sur les éléments animés |
| `transform: translate3d()` | Force GPU acceleration |
| `pointer-events: none` | Sur les couches non-interactives |
| `<use href="">` | Réutiliser les symboles |

### 7.2 Réduction de la taille

| Technique | Impact |
|-----------|--------|
| Optimisation avec SVGO | -30% à -60% |
| Suppression des métadonnées | -5% à -10% |
| Simplification des paths | -10% à -20% |
| Utilisation de symboles | Évite la duplication |

### 7.3 Configuration SVGO recommandée

```javascript
// svgo.config.js
module.exports = {
  plugins: [
    'preset-default',
    'removeDimensions',
    {
      name: 'removeAttrs',
      params: {
        attrs: ['data-name', 'xmlns:xlink']
      }
    },
    {
      name: 'addClassesToSVGElement',
      params: {
        className: 'svg-icon'
      }
    }
  ]
};
```

---

## 8. Intégration avec le Jeu

### 8.1 Initialisation dans Game

```javascript
// game/src/Game.js
import { SVGAnimator } from '/shared/components/animation/SVGAnimator.js';
import { ParallaxSVG } from '/shared/components/parallax/ParallaxSVG.js';
import { SVGLoader } from '/shared/components/loaders/SVGLoader.js';

class Game {
  async init() {
    // Charger les assets SVG
    await this.loadSVGAssets();

    // Initialiser la parallaxe
    this.parallax = new ParallaxSVG(this.gameContainer);
    await this.setupParallax();

    // Initialiser le personnage
    await this.setupCharacter();
  }

  async setupParallax() {
    await this.parallax.addLayer('/assets/svg/backgrounds/sky.svg', 0.1);
    await this.parallax.addLayer('/assets/svg/backgrounds/mountains.svg', 0.3);
    await this.parallax.addLayer('/assets/svg/backgrounds/trees-far.svg', 0.5, { repeat: true });
    await this.parallax.addLayer('/assets/svg/backgrounds/trees-near.svg', 0.7, { repeat: true });
  }

  async setupCharacter() {
    // Injecter le SVG du personnage
    const characterContainer = document.querySelector('#character-container');
    const svg = await SVGLoader.inject('/assets/svg/characters/prince.svg', characterContainer);

    // Créer l'animateur
    this.characterAnimator = new SVGAnimator(svg);
    this.characterAnimator.play('idle');
  }

  update() {
    // Mettre à jour la parallaxe selon la position du joueur
    this.parallax.update(this.player.x, this.player.y);

    // Mettre à jour l'animation selon l'état
    if (this.player.isMoving) {
      this.characterAnimator.play(this.player.isRunning ? 'run' : 'walk');
    } else {
      this.characterAnimator.play('idle');
    }
  }
}
```

---

## 9. Compatibilité

### 9.1 Navigateurs supportés

| Navigateur | Version min | Notes |
|------------|-------------|-------|
| Chrome | 80+ | Support complet |
| Firefox | 75+ | Support complet |
| Safari | 13+ | Path animation limitée |
| Edge | 80+ | Support complet |

### 9.2 Fallbacks

Pour les navigateurs sans support CSS `d` property :

```javascript
// Détection du support
const supportsCSSdProperty = CSS.supports('d', 'path("")');

if (!supportsCSSdProperty) {
  // Utiliser Web Animations API ou JS direct
  const path = element.querySelector('path');
  path.animate([
    { d: 'path("M0,0 ...")' },
    { d: 'path("M0,10 ...")' }
  ], {
    duration: 2000,
    iterations: Infinity
  });
}
```

---

*Dernière mise à jour: 2025-12-05*
