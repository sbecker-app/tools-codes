# Composants Réutilisables - Game 2.5D

> Catalogue des composants partagés entre les 3 applications

---

## 1. Core Components

### 1.1 Component (Base)

**Fichier:** `shared/components/core/component.js`

```javascript
/**
 * Classe de base pour tous les composants
 * Fournit: lifecycle, events, DOM manipulation
 */
export class Component {
  static _idCounter = 0;

  constructor(options = {}) {
    this.id = options.id || `comp_${Component._idCounter++}`;
    this.element = null;
    this.parent = null;
    this.children = new Map();
    this._state = {};
    this._listeners = new Map();
  }

  // === LIFECYCLE ===

  mount(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    this.element = this._createElement();
    container.appendChild(this.element);
    this._bindEvents();
    this.onMount();
    return this;
  }

  unmount() {
    this.onUnmount();
    this._unbindEvents();
    this.element?.remove();
    this.element = null;
  }

  // Override in subclass
  onMount() {}
  onUnmount() {}
  onUpdate(prevState, newState) {}

  // === STATE ===

  get state() { return this._state; }

  setState(newState) {
    const prevState = { ...this._state };
    this._state = { ...this._state, ...newState };
    this.onUpdate(prevState, this._state);
    this._render();
  }

  // === RENDERING ===

  render() {
    return '<div></div>';
  }

  _createElement() {
    const template = document.createElement('template');
    template.innerHTML = this.render().trim();
    return template.content.firstChild;
  }

  _render() {
    if (!this.element) return;
    const newElement = this._createElement();
    this.element.replaceWith(newElement);
    this.element = newElement;
    this._bindEvents();
  }

  // === EVENTS ===

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    }
  }

  emit(event, data) {
    const handlers = this._listeners.get(event) || [];
    handlers.forEach(h => h(data));
  }

  _bindEvents() {}
  _unbindEvents() {}

  // === CHILDREN ===

  addChild(name, component) {
    component.parent = this;
    this.children.set(name, component);
    return component;
  }

  getChild(name) {
    return this.children.get(name);
  }

  removeChild(name) {
    const child = this.children.get(name);
    if (child) {
      child.unmount();
      this.children.delete(name);
    }
  }
}
```

---

### 1.2 EventEmitter

**Fichier:** `shared/components/core/event-emitter.js`

```javascript
/**
 * Gestion centralisée des événements
 * Pattern pub/sub pour découplage
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, callback, context = null) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event).push({ callback, context });
    return () => this.off(event, callback);
  }

  once(event, callback, context = null) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback.call(context, data);
    };
    return this.on(event, wrapper, context);
  }

  off(event, callback) {
    const listeners = this._events.get(event);
    if (!listeners) return;

    if (callback) {
      const idx = listeners.findIndex(l => l.callback === callback);
      if (idx > -1) listeners.splice(idx, 1);
    } else {
      this._events.delete(event);
    }
  }

  emit(event, data) {
    const listeners = this._events.get(event);
    if (!listeners) return;

    listeners.forEach(({ callback, context }) => {
      callback.call(context, data);
    });
  }

  clear() {
    this._events.clear();
  }
}

// Singleton global
export const globalEvents = new EventEmitter();
```

---

### 1.3 StateManager

**Fichier:** `shared/components/core/state-manager.js`

```javascript
/**
 * Gestionnaire d'état global (style Redux simplifié)
 */
export class StateManager {
  constructor(initialState = {}) {
    this._state = initialState;
    this._subscribers = [];
    this._history = [];
    this._maxHistory = 50;
  }

  getState() {
    return { ...this._state };
  }

  setState(updater) {
    const newState = typeof updater === 'function'
      ? updater(this._state)
      : { ...this._state, ...updater };

    // Save history for undo
    this._history.push({ ...this._state });
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    this._state = newState;
    this._notify();
  }

  subscribe(callback) {
    this._subscribers.push(callback);
    return () => {
      const idx = this._subscribers.indexOf(callback);
      if (idx > -1) this._subscribers.splice(idx, 1);
    };
  }

  undo() {
    if (this._history.length === 0) return false;
    this._state = this._history.pop();
    this._notify();
    return true;
  }

  _notify() {
    this._subscribers.forEach(cb => cb(this._state));
  }
}
```

---

## 2. Rendering Components

### 2.1 SpriteRenderer

**Fichier:** `shared/components/rendering/sprite-renderer.js`

```javascript
/**
 * Rendu et animation de sprites
 * Supporte: spritesheet, animations, transformations
 */
export class SpriteRenderer {
  constructor(options = {}) {
    this.image = null;
    this.loaded = false;

    // Source rectangle (dans spritesheet)
    this.sourceX = options.sourceX || 0;
    this.sourceY = options.sourceY || 0;
    this.sourceWidth = options.sourceWidth || 0;
    this.sourceHeight = options.sourceHeight || 0;

    // Destination
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || 0;
    this.height = options.height || 0;

    // Transformations
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.anchorX = 0.5;
    this.anchorY = 1; // Ancre en bas par défaut

    // Animation
    this.animation = null;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.isPlaying = false;
  }

  async load(src) {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.onload = () => {
        this.loaded = true;
        if (!this.sourceWidth) this.sourceWidth = this.image.width;
        if (!this.sourceHeight) this.sourceHeight = this.image.height;
        if (!this.width) this.width = this.sourceWidth;
        if (!this.height) this.height = this.sourceHeight;
        resolve(this);
      };
      this.image.onerror = reject;
      this.image.src = src;
    });
  }

  setAnimation(animation) {
    this.animation = animation;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.isPlaying = true;
  }

  update(deltaTime) {
    if (!this.animation || !this.isPlaying) return;

    this.frameTime += deltaTime;
    const frameDuration = 1000 / this.animation.fps;

    if (this.frameTime >= frameDuration) {
      this.frameTime -= frameDuration;
      this.currentFrame++;

      if (this.currentFrame >= this.animation.frames.length) {
        if (this.animation.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.animation.frames.length - 1;
          this.isPlaying = false;
        }
      }

      // Update source from animation frame
      const frame = this.animation.frames[this.currentFrame];
      this.sourceX = frame.x;
      this.sourceY = frame.y;
      this.sourceWidth = frame.width;
      this.sourceHeight = frame.height;
    }
  }

  render(ctx) {
    if (!this.loaded) return;

    ctx.save();

    // Position avec ancre
    const px = this.x - this.width * this.anchorX;
    const py = this.y - this.height * this.anchorY;

    // Transformations
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.translate(-this.x, -this.y);

    // Dessin
    ctx.drawImage(
      this.image,
      this.sourceX, this.sourceY,
      this.sourceWidth, this.sourceHeight,
      px, py,
      this.width, this.height
    );

    ctx.restore();
  }

  // Helpers
  flipHorizontal() { this.scaleX *= -1; }
  flipVertical() { this.scaleY *= -1; }

  getBounds() {
    return {
      x: this.x - this.width * this.anchorX,
      y: this.y - this.height * this.anchorY,
      width: this.width,
      height: this.height
    };
  }
}
```

---

### 2.2 ParallaxLayer

**Fichier:** `shared/components/rendering/parallax-layer.js`

```javascript
/**
 * Couche de parallaxe avec défilement différentiel
 * Supporte: répétition horizontale/verticale, multi-images
 */
export class ParallaxLayer {
  constructor(options = {}) {
    this.depth = options.depth || 0;
    this.speed = options.speed || 1;
    this.images = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.repeatX = options.repeatX !== false;
    this.repeatY = options.repeatY || false;
    this.width = options.width || 0;
    this.height = options.height || 0;
  }

  async addImage(src, x = 0, y = 0) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.push({ img, x, y });
        if (!this.width) this.width = img.width;
        if (!this.height) this.height = img.height;
        resolve(this);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  update(cameraX, cameraY) {
    // Calcul offset avec vitesse de parallaxe
    this.offsetX = -cameraX * this.speed;
    this.offsetY = -cameraY * this.speed;

    // Wrap pour répétition
    if (this.repeatX && this.width > 0) {
      this.offsetX = this.offsetX % this.width;
      if (this.offsetX > 0) this.offsetX -= this.width;
    }
    if (this.repeatY && this.height > 0) {
      this.offsetY = this.offsetY % this.height;
      if (this.offsetY > 0) this.offsetY -= this.height;
    }
  }

  render(ctx, viewportWidth, viewportHeight) {
    if (this.images.length === 0) return;

    ctx.save();

    for (const { img, x, y } of this.images) {
      if (this.repeatX) {
        // Dessiner en tuiles horizontales
        const startX = this.offsetX + x;
        const tilesNeeded = Math.ceil(viewportWidth / this.width) + 2;

        for (let i = 0; i < tilesNeeded; i++) {
          const drawX = startX + i * this.width;
          if (this.repeatY) {
            const startY = this.offsetY + y;
            const tilesY = Math.ceil(viewportHeight / this.height) + 2;
            for (let j = 0; j < tilesY; j++) {
              ctx.drawImage(img, drawX, startY + j * this.height);
            }
          } else {
            ctx.drawImage(img, drawX, this.offsetY + y);
          }
        }
      } else {
        ctx.drawImage(img, this.offsetX + x, this.offsetY + y);
      }
    }

    ctx.restore();
  }
}
```

---

### 2.3 Camera

**Fichier:** `shared/components/rendering/camera.js`

```javascript
/**
 * Caméra 2D avec suivi de cible et limites
 */
export class Camera {
  constructor(options = {}) {
    this.x = 0;
    this.y = 0;
    this.width = options.width || 800;
    this.height = options.height || 600;

    // Cible à suivre
    this.target = null;
    this.followSpeed = options.followSpeed || 0.1;
    this.deadZone = options.deadZone || { x: 100, y: 50 };

    // Limites du monde
    this.bounds = options.bounds || null;

    // Effets
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  setTarget(target) {
    this.target = target;
  }

  setBounds(minX, minY, maxX, maxY) {
    this.bounds = { minX, minY, maxX, maxY };
  }

  update(deltaTime) {
    // Suivi de cible
    if (this.target) {
      const targetX = this.target.x - this.width / 2;
      const targetY = this.target.y - this.height / 2;

      // Lerp pour mouvement fluide
      this.x += (targetX - this.x) * this.followSpeed;
      this.y += (targetY - this.y) * this.followSpeed;
    }

    // Clamp aux limites
    if (this.bounds) {
      this.x = Math.max(this.bounds.minX, Math.min(this.x, this.bounds.maxX - this.width));
      this.y = Math.max(this.bounds.minY, Math.min(this.y, this.bounds.maxY - this.height));
    }

    // Effet de shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime;
    }
  }

  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  getShakeOffset() {
    if (this.shakeDuration <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.shakeIntensity,
      y: (Math.random() - 0.5) * 2 * this.shakeIntensity
    };
  }

  applyTransform(ctx) {
    const shake = this.getShakeOffset();
    ctx.translate(-this.x + shake.x, -this.y + shake.y);
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    };
  }

  isVisible(x, y, width, height) {
    return !(
      x + width < this.x ||
      x > this.x + this.width ||
      y + height < this.y ||
      y > this.y + this.height
    );
  }
}
```

---

## 3. UI Components

### 3.1 Button

**Fichier:** `shared/components/ui/button.js`

```javascript
import { Component } from '../core/component.js';

/**
 * Bouton stylisé avec variantes
 */
export class Button extends Component {
  constructor(options = {}) {
    super(options);
    this._state = {
      text: options.text || 'Button',
      variant: options.variant || 'primary', // primary, secondary, danger
      size: options.size || 'medium', // small, medium, large
      disabled: options.disabled || false,
      loading: options.loading || false
    };
    this.onClick = options.onClick || (() => {});
  }

  render() {
    const { text, variant, size, disabled, loading } = this._state;
    const classes = [
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      disabled && 'btn--disabled',
      loading && 'btn--loading'
    ].filter(Boolean).join(' ');

    return `
      <button class="${classes}" ${disabled ? 'disabled' : ''}>
        ${loading ? '<span class="btn__spinner"></span>' : ''}
        <span class="btn__text">${text}</span>
      </button>
    `;
  }

  _bindEvents() {
    this.element?.addEventListener('click', (e) => {
      if (!this._state.disabled && !this._state.loading) {
        this.onClick(e);
        this.emit('click', e);
      }
    });
  }

  setLoading(loading) {
    this.setState({ loading });
  }

  setDisabled(disabled) {
    this.setState({ disabled });
  }
}
```

**CSS associé:** `shared/styles/components/button.css`

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

/* Variants */
.btn--primary {
  background: var(--color-primary);
  color: white;
}
.btn--primary:hover { filter: brightness(1.1); }

.btn--secondary {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.btn--danger {
  background: var(--color-danger);
  color: white;
}

/* Sizes */
.btn--small { padding: var(--space-xs) var(--space-sm); font-size: 0.875rem; }
.btn--large { padding: var(--space-md) var(--space-lg); font-size: 1.125rem; }

/* States */
.btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--loading .btn__text { opacity: 0.5; }

.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

### 3.2 Modal

**Fichier:** `shared/components/ui/modal.js`

```javascript
import { Component } from '../core/component.js';

/**
 * Fenêtre modale avec overlay
 */
export class Modal extends Component {
  constructor(options = {}) {
    super(options);
    this._state = {
      isOpen: false,
      title: options.title || '',
      content: options.content || '',
      showClose: options.showClose !== false,
      size: options.size || 'medium' // small, medium, large, fullscreen
    };
    this.onClose = options.onClose || (() => {});
  }

  render() {
    const { isOpen, title, content, showClose, size } = this._state;
    if (!isOpen) return '<div class="modal modal--hidden"></div>';

    return `
      <div class="modal modal--${size}">
        <div class="modal__overlay"></div>
        <div class="modal__container">
          <div class="modal__header">
            <h2 class="modal__title">${title}</h2>
            ${showClose ? '<button class="modal__close">&times;</button>' : ''}
          </div>
          <div class="modal__content">
            ${content}
          </div>
          <div class="modal__footer" data-slot="footer"></div>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    this.element?.querySelector('.modal__overlay')?.addEventListener('click', () => this.close());
    this.element?.querySelector('.modal__close')?.addEventListener('click', () => this.close());

    // ESC to close
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this._state.isOpen) this.close();
    };
    document.addEventListener('keydown', this._escHandler);
  }

  _unbindEvents() {
    document.removeEventListener('keydown', this._escHandler);
  }

  open() {
    this.setState({ isOpen: true });
    document.body.style.overflow = 'hidden';
    this.emit('open');
  }

  close() {
    this.setState({ isOpen: false });
    document.body.style.overflow = '';
    this.onClose();
    this.emit('close');
  }

  setContent(content) {
    this.setState({ content });
  }
}
```

---

### 3.3 Tabs

**Fichier:** `shared/components/ui/tabs.js`

```javascript
import { Component } from '../core/component.js';

/**
 * Composant onglets
 */
export class Tabs extends Component {
  constructor(options = {}) {
    super(options);
    this._state = {
      tabs: options.tabs || [], // [{ id, label, content }]
      activeTab: options.activeTab || options.tabs?.[0]?.id || null
    };
    this.onChange = options.onChange || (() => {});
  }

  render() {
    const { tabs, activeTab } = this._state;

    const tabHeaders = tabs.map(tab => `
      <button
        class="tabs__tab ${tab.id === activeTab ? 'tabs__tab--active' : ''}"
        data-tab-id="${tab.id}"
      >
        ${tab.label}
      </button>
    `).join('');

    const activeContent = tabs.find(t => t.id === activeTab)?.content || '';

    return `
      <div class="tabs">
        <div class="tabs__header">
          ${tabHeaders}
        </div>
        <div class="tabs__content">
          ${activeContent}
        </div>
      </div>
    `;
  }

  _bindEvents() {
    this.element?.querySelectorAll('.tabs__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tabId;
        this.setActiveTab(tabId);
      });
    });
  }

  setActiveTab(tabId) {
    if (tabId !== this._state.activeTab) {
      this.setState({ activeTab: tabId });
      this.onChange(tabId);
      this.emit('change', tabId);
    }
  }

  addTab(tab) {
    this.setState({
      tabs: [...this._state.tabs, tab]
    });
  }

  removeTab(tabId) {
    this.setState({
      tabs: this._state.tabs.filter(t => t.id !== tabId),
      activeTab: this._state.activeTab === tabId
        ? this._state.tabs[0]?.id
        : this._state.activeTab
    });
  }
}
```

---

## 4. Editor Components

### 4.1 AssetPicker

**Fichier:** `shared/components/editors/asset-picker.js`

```javascript
import { Component } from '../core/component.js';

/**
 * Sélecteur d'assets avec filtres et preview
 * Utilisé par: BackOffice, StageMaker
 */
export class AssetPicker extends Component {
  constructor(options = {}) {
    super(options);
    this._state = {
      assets: options.assets || [],
      selectedId: null,
      filter: {
        category: null,
        theme: null,
        mode: null,
        search: ''
      },
      viewMode: 'grid' // grid, list
    };
    this.onSelect = options.onSelect || (() => {});
  }

  get filteredAssets() {
    const { assets, filter } = this._state;
    return assets.filter(asset => {
      if (filter.category && asset.category !== filter.category) return false;
      if (filter.theme && asset.theme !== filter.theme) return false;
      if (filter.mode && !asset.modes.includes(filter.mode)) return false;
      if (filter.search) {
        const search = filter.search.toLowerCase();
        if (!asset.name.toLowerCase().includes(search) &&
            !asset.tags?.some(t => t.toLowerCase().includes(search))) {
          return false;
        }
      }
      return true;
    });
  }

  render() {
    const { selectedId, viewMode } = this._state;
    const assets = this.filteredAssets;

    return `
      <div class="asset-picker">
        <div class="asset-picker__toolbar">
          ${this._renderFilters()}
          ${this._renderViewToggle()}
        </div>
        <div class="asset-picker__grid asset-picker__grid--${viewMode}">
          ${assets.map(asset => `
            <div
              class="asset-picker__item ${asset.id === selectedId ? 'asset-picker__item--selected' : ''}"
              data-asset-id="${asset.id}"
            >
              <img src="${asset.thumbnail || asset.file}" alt="${asset.name}" />
              <span class="asset-picker__item-name">${asset.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  _renderFilters() {
    return `
      <div class="asset-picker__filters">
        <input
          type="text"
          class="asset-picker__search"
          placeholder="Rechercher..."
          value="${this._state.filter.search}"
        />
        <select class="asset-picker__filter" data-filter="category">
          <option value="">Toutes catégories</option>
          <option value="character">Personnages</option>
          <option value="decor">Décors</option>
          <option value="object">Objets</option>
        </select>
        <select class="asset-picker__filter" data-filter="theme">
          <option value="">Tous thèmes</option>
          <option value="forest">Forêt</option>
          <option value="castle">Château</option>
          <option value="cave">Caverne</option>
        </select>
      </div>
    `;
  }

  _renderViewToggle() {
    const { viewMode } = this._state;
    return `
      <div class="asset-picker__view-toggle">
        <button class="${viewMode === 'grid' ? 'active' : ''}" data-view="grid">▦</button>
        <button class="${viewMode === 'list' ? 'active' : ''}" data-view="list">☰</button>
      </div>
    `;
  }

  _bindEvents() {
    // Sélection
    this.element?.querySelectorAll('.asset-picker__item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.assetId;
        this.select(id);
      });
      item.addEventListener('dblclick', () => {
        const id = item.dataset.assetId;
        this.emit('confirm', this._state.assets.find(a => a.id === id));
      });
    });

    // Filtres
    this.element?.querySelector('.asset-picker__search')?.addEventListener('input', (e) => {
      this.setFilter('search', e.target.value);
    });

    this.element?.querySelectorAll('.asset-picker__filter').forEach(select => {
      select.addEventListener('change', (e) => {
        this.setFilter(e.target.dataset.filter, e.target.value || null);
      });
    });

    // View toggle
    this.element?.querySelectorAll('.asset-picker__view-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setState({ viewMode: btn.dataset.view });
      });
    });
  }

  select(assetId) {
    this.setState({ selectedId: assetId });
    const asset = this._state.assets.find(a => a.id === assetId);
    this.onSelect(asset);
    this.emit('select', asset);
  }

  setFilter(key, value) {
    this.setState({
      filter: { ...this._state.filter, [key]: value }
    });
  }

  setAssets(assets) {
    this.setState({ assets });
  }
}
```

---

### 4.2 PropertyPanel

**Fichier:** `shared/components/editors/property-panel.js`

```javascript
import { Component } from '../core/component.js';

/**
 * Panneau d'édition de propriétés
 * Génère dynamiquement les champs selon le schéma
 */
export class PropertyPanel extends Component {
  constructor(options = {}) {
    super(options);
    this._state = {
      schema: options.schema || [],
      values: options.values || {},
      title: options.title || 'Propriétés'
    };
    this.onChange = options.onChange || (() => {});
  }

  render() {
    const { schema, values, title } = this._state;

    const fields = schema.map(field => this._renderField(field, values[field.key])).join('');

    return `
      <div class="property-panel">
        <div class="property-panel__header">
          <h3>${title}</h3>
        </div>
        <div class="property-panel__body">
          ${fields || '<p class="property-panel__empty">Aucune sélection</p>'}
        </div>
      </div>
    `;
  }

  _renderField(field, value) {
    const { key, label, type, options, min, max, step } = field;

    let input = '';
    switch (type) {
      case 'text':
        input = `<input type="text" data-key="${key}" value="${value || ''}" />`;
        break;
      case 'number':
        input = `<input type="number" data-key="${key}" value="${value || 0}" min="${min}" max="${max}" step="${step || 1}" />`;
        break;
      case 'checkbox':
        input = `<input type="checkbox" data-key="${key}" ${value ? 'checked' : ''} />`;
        break;
      case 'select':
        input = `
          <select data-key="${key}">
            ${options.map(opt => `
              <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>
            `).join('')}
          </select>
        `;
        break;
      case 'color':
        input = `<input type="color" data-key="${key}" value="${value || '#000000'}" />`;
        break;
      case 'range':
        input = `
          <input type="range" data-key="${key}" value="${value || min}" min="${min}" max="${max}" step="${step || 1}" />
          <span class="property-panel__range-value">${value || min}</span>
        `;
        break;
    }

    return `
      <div class="property-panel__field">
        <label class="property-panel__label">${label}</label>
        <div class="property-panel__input">${input}</div>
      </div>
    `;
  }

  _bindEvents() {
    this.element?.querySelectorAll('input, select').forEach(input => {
      const event = input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(event, (e) => {
        const key = e.target.dataset.key;
        let value;

        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else if (e.target.type === 'number' || e.target.type === 'range') {
          value = parseFloat(e.target.value);
        } else {
          value = e.target.value;
        }

        // Update range display
        if (e.target.type === 'range') {
          e.target.nextElementSibling.textContent = value;
        }

        this._state.values[key] = value;
        this.onChange(key, value, this._state.values);
        this.emit('change', { key, value, values: this._state.values });
      });
    });
  }

  setValues(values) {
    this.setState({ values });
  }

  setSchema(schema) {
    this.setState({ schema });
  }

  getValue(key) {
    return this._state.values[key];
  }
}
```

---

## 5. Game Components

### 5.1 CharacterController

**Fichier:** `shared/components/game/character-controller.js`

```javascript
import { SpriteRenderer } from '../rendering/sprite-renderer.js';

/**
 * Contrôleur de personnage jouable
 * Gère: mouvement, animations, collisions
 */
export class CharacterController {
  constructor(options = {}) {
    this.sprite = new SpriteRenderer(options.sprite);
    this.x = options.x || 0;
    this.y = options.y || 0;

    // Physique
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = options.speed || 5;
    this.jumpForce = options.jumpForce || 12;
    this.gravity = options.gravity || 0.5;

    // État
    this.isGrounded = false;
    this.isJumping = false;
    this.facingRight = true;
    this.currentMode = 'forward'; // forward, backward, up, down

    // Animations
    this.animations = options.animations || {};
    this.currentAnimation = 'idle';

    // Input
    this.input = { left: false, right: false, up: false, down: false, jump: false };
  }

  setInput(input) {
    this.input = { ...this.input, ...input };
  }

  update(deltaTime, navigationMode) {
    this.currentMode = navigationMode;

    // Mouvement selon le mode
    switch (navigationMode) {
      case 'forward':
      case 'backward':
        this._updateHorizontal(deltaTime);
        break;
      case 'up':
      case 'down':
        this._updateVertical(deltaTime);
        break;
    }

    // Mise à jour sprite
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.scaleX = this.facingRight ? 1 : -1;
    this.sprite.update(deltaTime);
  }

  _updateHorizontal(deltaTime) {
    // Mouvement horizontal
    if (this.input.left) {
      this.velocityX = -this.speed;
      this.facingRight = false;
    } else if (this.input.right) {
      this.velocityX = this.speed;
      this.facingRight = true;
    } else {
      this.velocityX *= 0.8; // Friction
    }

    // Saut
    if (this.input.jump && this.isGrounded) {
      this.velocityY = -this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
    }

    // Gravité
    this.velocityY += this.gravity;

    // Appliquer vélocité
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Animation
    this._updateAnimation();
  }

  _updateVertical(deltaTime) {
    // Mouvement vertical (escalade)
    if (this.input.up) {
      this.velocityY = -this.speed;
    } else if (this.input.down) {
      this.velocityY = this.speed;
    } else {
      this.velocityY *= 0.8;
    }

    // Mouvement horizontal limité
    if (this.input.left) {
      this.velocityX = -this.speed * 0.5;
      this.facingRight = false;
    } else if (this.input.right) {
      this.velocityX = this.speed * 0.5;
      this.facingRight = true;
    } else {
      this.velocityX *= 0.8;
    }

    this.x += this.velocityX;
    this.y += this.velocityY;

    this._updateAnimation();
  }

  _updateAnimation() {
    let newAnim = 'idle';

    if (this.isJumping && this.velocityY < 0) {
      newAnim = 'jump';
    } else if (!this.isGrounded && this.velocityY > 0) {
      newAnim = 'fall';
    } else if (Math.abs(this.velocityX) > 0.5 || Math.abs(this.velocityY) > 0.5) {
      newAnim = this.currentMode === 'up' || this.currentMode === 'down' ? 'climb' : 'walk';
    }

    if (newAnim !== this.currentAnimation) {
      this.currentAnimation = newAnim;
      const animKey = `${this.currentMode}_${newAnim}`;
      if (this.animations[animKey]) {
        this.sprite.setAnimation(this.animations[animKey]);
      }
    }
  }

  render(ctx) {
    this.sprite.render(ctx);
  }

  getBounds() {
    return this.sprite.getBounds();
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  onGroundCollision(groundY) {
    this.y = groundY;
    this.velocityY = 0;
    this.isGrounded = true;
    this.isJumping = false;
  }
}
```

---

## 6. Index des Exports

**Fichier:** `shared/components/index.js`

```javascript
// Core
export { Component } from './core/component.js';
export { EventEmitter, globalEvents } from './core/event-emitter.js';
export { StateManager } from './core/state-manager.js';

// Rendering
export { SpriteRenderer } from './rendering/sprite-renderer.js';
export { ParallaxLayer } from './rendering/parallax-layer.js';
export { Camera } from './rendering/camera.js';

// UI
export { Button } from './ui/button.js';
export { Modal } from './ui/modal.js';
export { Tabs } from './ui/tabs.js';

// Editors
export { AssetPicker } from './editors/asset-picker.js';
export { PropertyPanel } from './editors/property-panel.js';

// Game
export { CharacterController } from './game/character-controller.js';
```

---

## Annexe: Dépendances entre Composants

```
Component (base)
├── Button
├── Modal
├── Tabs
├── AssetPicker
└── PropertyPanel

EventEmitter (standalone)
└── globalEvents (singleton)

StateManager (standalone)

SpriteRenderer (standalone)
└── CharacterController (utilise)

ParallaxLayer (standalone)

Camera (standalone)
```
