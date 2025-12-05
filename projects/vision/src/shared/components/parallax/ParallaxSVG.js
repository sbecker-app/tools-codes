import { SVGLoader } from '../loaders/SVGLoader.js';

/**
 * ParallaxSVG - Systeme de parallaxe avec couches SVG
 *
 * Gere plusieurs couches de backgrounds SVG avec effet de parallaxe.
 * Chaque couche se deplace a une vitesse differente selon sa profondeur.
 *
 * @example
 * const parallax = new ParallaxSVG(gameContainer);
 *
 * // Ajouter des couches (depth: 0.1 = lent, 1.0 = vitesse normale)
 * await parallax.addLayer('/assets/svg/backgrounds/sky.svg', 0.1);
 * await parallax.addLayer('/assets/svg/backgrounds/mountains.svg', 0.3);
 * await parallax.addLayer('/assets/svg/backgrounds/trees.svg', 0.7, { repeat: true });
 *
 * // Dans la game loop
 * function update() {
 *   parallax.update(camera.x, camera.y);
 * }
 */
export class ParallaxSVG {
  /**
   * @param {HTMLElement} container - Conteneur du jeu
   * @param {Object} options - Options globales
   * @param {number} [options.baseSpeed=1] - Multiplicateur de vitesse global
   */
  constructor(container, options = {}) {
    this.container = container;
    this.baseSpeed = options.baseSpeed || 1;

    // Liste des couches
    this.layers = [];

    // Position de la camera
    this.cameraX = 0;
    this.cameraY = 0;

    // Dimensions du viewport
    this.viewportWidth = container.clientWidth;
    this.viewportHeight = container.clientHeight;

    // Observer les changements de taille
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(container);

    // S'assurer que le conteneur est positionne
    const position = getComputedStyle(container).position;
    if (position === 'static') {
      container.style.position = 'relative';
    }

    // Overflow hidden pour cacher les depassements
    container.style.overflow = 'hidden';
  }

  /**
   * Ajouter une couche de parallaxe
   * @param {string} svgUrl - URL du fichier SVG
   * @param {number} depth - Profondeur (0.0-1.0+, plus petit = plus lent)
   * @param {Object} options - Options de la couche
   * @param {boolean} [options.repeat=false] - Repeter horizontalement
   * @param {number} [options.repeatWidth=200] - Largeur en % si repeat
   * @param {number} [options.offsetY=0] - Decalage vertical en px
   * @param {string} [options.preserveAspectRatio='xMidYMax slice'] - Aspect ratio SVG
   * @param {string} [options.className] - Classe CSS additionnelle
   * @returns {Promise<Object>} - Reference de la couche
   */
  async addLayer(svgUrl, depth, options = {}) {
    // Creer le conteneur de la couche
    const layerDiv = document.createElement('div');
    layerDiv.className = 'parallax-layer';
    if (options.className) {
      layerDiv.classList.add(options.className);
    }

    // Calculer le z-index (plus la profondeur est faible, plus le z-index est bas)
    const zIndex = Math.floor((1 - Math.min(depth, 1)) * 10);

    // Styles de base
    layerDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: ${zIndex};
      will-change: transform;
      pointer-events: none;
      overflow: hidden;
    `;

    // Charger et injecter le SVG
    try {
      const svgContent = await SVGLoader.load(svgUrl);
      layerDiv.innerHTML = svgContent;

      // Configurer le SVG
      const svgEl = layerDiv.querySelector('svg');
      if (svgEl) {
        // Dimensions
        if (options.repeat) {
          svgEl.style.width = `${options.repeatWidth || 200}%`;
          svgEl.style.height = '100%';
        } else {
          svgEl.style.width = '100%';
          svgEl.style.height = '100%';
        }

        // Aspect ratio
        svgEl.setAttribute(
          'preserveAspectRatio',
          options.preserveAspectRatio || 'xMidYMax slice'
        );

        // Supprimer les dimensions fixes si presentes
        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');
      }
    } catch (error) {
      console.error(`[ParallaxSVG] Erreur chargement: ${svgUrl}`, error);
      layerDiv.innerHTML = `<!-- Erreur: ${svgUrl} -->`;
    }

    // Creer l'objet couche
    const layer = {
      element: layerDiv,
      depth: depth,
      offsetY: options.offsetY || 0,
      repeat: options.repeat || false,
      repeatWidth: options.repeatWidth || 200,
      url: svgUrl
    };

    // Ajouter au DOM et a la liste
    this.layers.push(layer);
    this.container.appendChild(layerDiv);

    // Appliquer la position initiale
    this._updateLayerPosition(layer);

    return layer;
  }

  /**
   * Ajouter plusieurs couches en parallele
   * @param {Array} layersConfig - Configuration des couches
   * @returns {Promise<Array>} - References des couches
   *
   * @example
   * await parallax.addLayers([
   *   { url: '/sky.svg', depth: 0.1 },
   *   { url: '/mountains.svg', depth: 0.3 },
   *   { url: '/trees.svg', depth: 0.7, options: { repeat: true } }
   * ]);
   */
  async addLayers(layersConfig) {
    const promises = layersConfig.map(config =>
      this.addLayer(config.url, config.depth, config.options || {})
    );

    return Promise.all(promises);
  }

  /**
   * Mettre a jour la position de toutes les couches
   * @param {number} x - Position X de la camera
   * @param {number} [y=0] - Position Y de la camera
   */
  update(x, y = 0) {
    this.cameraX = x;
    this.cameraY = y;

    for (const layer of this.layers) {
      this._updateLayerPosition(layer);
    }
  }

  /**
   * Mettre a jour la position d'une couche
   * @private
   */
  _updateLayerPosition(layer) {
    const offsetX = -this.cameraX * layer.depth * this.baseSpeed;
    const offsetY = (-this.cameraY * layer.depth * this.baseSpeed) + layer.offsetY;

    // Utiliser translate3d pour GPU acceleration
    layer.element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
  }

  /**
   * Obtenir une couche par son index
   * @param {number} index - Index de la couche
   * @returns {Object|null}
   */
  getLayer(index) {
    return this.layers[index] || null;
  }

  /**
   * Obtenir une couche par son URL
   * @param {string} url - URL du SVG
   * @returns {Object|null}
   */
  getLayerByUrl(url) {
    return this.layers.find(l => l.url === url) || null;
  }

  /**
   * Retirer une couche
   * @param {number|Object} layerOrIndex - Index ou reference de la couche
   */
  removeLayer(layerOrIndex) {
    let index;

    if (typeof layerOrIndex === 'number') {
      index = layerOrIndex;
    } else {
      index = this.layers.indexOf(layerOrIndex);
    }

    if (index >= 0 && index < this.layers.length) {
      const layer = this.layers[index];
      layer.element.remove();
      this.layers.splice(index, 1);
    }
  }

  /**
   * Modifier la profondeur d'une couche
   * @param {number|Object} layerOrIndex - Index ou reference
   * @param {number} newDepth - Nouvelle profondeur
   */
  setLayerDepth(layerOrIndex, newDepth) {
    const layer = typeof layerOrIndex === 'number'
      ? this.layers[layerOrIndex]
      : layerOrIndex;

    if (layer) {
      layer.depth = newDepth;
      // Mettre a jour le z-index
      const zIndex = Math.floor((1 - Math.min(newDepth, 1)) * 10);
      layer.element.style.zIndex = zIndex;
      // Mettre a jour la position
      this._updateLayerPosition(layer);
    }
  }

  /**
   * Modifier l'offset Y d'une couche
   * @param {number|Object} layerOrIndex - Index ou reference
   * @param {number} offsetY - Nouvel offset
   */
  setLayerOffsetY(layerOrIndex, offsetY) {
    const layer = typeof layerOrIndex === 'number'
      ? this.layers[layerOrIndex]
      : layerOrIndex;

    if (layer) {
      layer.offsetY = offsetY;
      this._updateLayerPosition(layer);
    }
  }

  /**
   * Appliquer un effet de teinte a une couche
   * @param {number|Object} layerOrIndex - Index ou reference
   * @param {string} color - Couleur de teinte
   * @param {number} [amount=0.5] - Intensite (0-1)
   */
  tintLayer(layerOrIndex, color, amount = 0.5) {
    const layer = typeof layerOrIndex === 'number'
      ? this.layers[layerOrIndex]
      : layerOrIndex;

    if (layer) {
      layer.element.style.filter = `
        drop-shadow(0 0 0 ${color})
        opacity(${1 - amount})
      `;
    }
  }

  /**
   * Gestionnaire de redimensionnement
   * @private
   */
  _onResize() {
    this.viewportWidth = this.container.clientWidth;
    this.viewportHeight = this.container.clientHeight;

    // Mettre a jour toutes les couches
    for (const layer of this.layers) {
      this._updateLayerPosition(layer);
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

  /**
   * Detruire l'instance
   */
  destroy() {
    this.clear();
    this._resizeObserver.disconnect();
    this.container = null;
  }

  /**
   * Nombre de couches
   * @returns {number}
   */
  get layerCount() {
    return this.layers.length;
  }
}

// Export par defaut
export default ParallaxSVG;
