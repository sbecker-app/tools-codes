/**
 * Couche de parallaxe avec défilement différentiel
 * Supporte: répétition horizontale/verticale, multi-images
 */
export class ParallaxLayer {
  constructor(options = {}) {
    // Profondeur (0 = premier plan, plus élevé = arrière-plan)
    this.depth = options.depth || 0;

    // Vitesse de défilement relative (1 = même vitesse que la caméra)
    this.speed = options.speed ?? 1;

    // Images de la couche
    this.images = [];

    // Offset calculé
    this.offsetX = 0;
    this.offsetY = 0;

    // Répétition
    this.repeatX = options.repeatX !== false;
    this.repeatY = options.repeatY || false;

    // Dimensions totales de la couche
    this.width = options.width || 0;
    this.height = options.height || 0;

    // Visibilité
    this.visible = true;
    this.alpha = 1;
  }

  // ═══════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Ajoute une image à la couche
   * @param {string} src - URL de l'image
   * @param {number} [x=0] - Position X dans la couche
   * @param {number} [y=0] - Position Y dans la couche
   * @returns {Promise<ParallaxLayer>}
   */
  async addImage(src, x = 0, y = 0) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.images.push({ img, x, y, width: img.width, height: img.height });

        // Mettre à jour les dimensions
        if (!this.width || this.width < img.width) {
          this.width = img.width;
        }
        if (!this.height || this.height < img.height) {
          this.height = img.height;
        }

        resolve(this);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load parallax image: ${src}`));
      };

      img.src = src;
    });
  }

  /**
   * Ajoute une image déjà chargée
   * @param {HTMLImageElement} img
   * @param {number} [x=0]
   * @param {number} [y=0]
   */
  addLoadedImage(img, x = 0, y = 0) {
    this.images.push({ img, x, y, width: img.width, height: img.height });

    if (!this.width || this.width < img.width) {
      this.width = img.width;
    }
    if (!this.height || this.height < img.height) {
      this.height = img.height;
    }
  }

  /**
   * Vide toutes les images
   */
  clearImages() {
    this.images = [];
    this.width = 0;
    this.height = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // UPDATE & RENDER
  // ═══════════════════════════════════════════════════════════════

  /**
   * Met à jour l'offset en fonction de la position de la caméra
   * @param {number} cameraX - Position X de la caméra
   * @param {number} cameraY - Position Y de la caméra
   */
  update(cameraX, cameraY) {
    // Calcul de l'offset avec la vitesse de parallaxe
    this.offsetX = -cameraX * this.speed;
    this.offsetY = -cameraY * this.speed;

    // Wrap pour répétition horizontale
    if (this.repeatX && this.width > 0) {
      this.offsetX = this.offsetX % this.width;
      if (this.offsetX > 0) {
        this.offsetX -= this.width;
      }
    }

    // Wrap pour répétition verticale
    if (this.repeatY && this.height > 0) {
      this.offsetY = this.offsetY % this.height;
      if (this.offsetY > 0) {
        this.offsetY -= this.height;
      }
    }
  }

  /**
   * Dessine la couche
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} viewportWidth - Largeur de la zone visible
   * @param {number} viewportHeight - Hauteur de la zone visible
   */
  render(ctx, viewportWidth, viewportHeight) {
    if (!this.visible || this.images.length === 0 || this.alpha <= 0) return;

    ctx.save();

    if (this.alpha < 1) {
      ctx.globalAlpha = this.alpha;
    }

    for (const { img, x, y } of this.images) {
      if (this.repeatX) {
        // Calculer combien de tuiles sont nécessaires
        const tilesNeeded = Math.ceil(viewportWidth / this.width) + 2;
        const startX = this.offsetX + x;

        for (let i = 0; i < tilesNeeded; i++) {
          const drawX = startX + i * this.width;

          if (this.repeatY) {
            const tilesY = Math.ceil(viewportHeight / this.height) + 2;
            const startY = this.offsetY + y;

            for (let j = 0; j < tilesY; j++) {
              const drawY = startY + j * this.height;
              ctx.drawImage(img, drawX, drawY);
            }
          } else {
            ctx.drawImage(img, drawX, this.offsetY + y);
          }
        }
      } else if (this.repeatY) {
        const tilesY = Math.ceil(viewportHeight / this.height) + 2;
        const startY = this.offsetY + y;

        for (let j = 0; j < tilesY; j++) {
          ctx.drawImage(img, this.offsetX + x, startY + j * this.height);
        }
      } else {
        // Pas de répétition
        ctx.drawImage(img, this.offsetX + x, this.offsetY + y);
      }
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // VISIBILITY
  // ═══════════════════════════════════════════════════════════════

  /**
   * Affiche la couche
   */
  show() {
    this.visible = true;
  }

  /**
   * Cache la couche
   */
  hide() {
    this.visible = false;
  }

  /**
   * Bascule la visibilité
   */
  toggle() {
    this.visible = !this.visible;
  }

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Définit la vitesse de parallaxe
   * @param {number} speed
   */
  setSpeed(speed) {
    this.speed = speed;
  }

  /**
   * Définit la profondeur
   * @param {number} depth
   */
  setDepth(depth) {
    this.depth = depth;
  }
}

/**
 * Gestionnaire de couches de parallaxe
 * Gère l'ordre de rendu et les mises à jour
 */
export class ParallaxManager {
  constructor() {
    /** @type {ParallaxLayer[]} */
    this.layers = [];
  }

  /**
   * Ajoute une couche
   * @param {ParallaxLayer} layer
   */
  addLayer(layer) {
    this.layers.push(layer);
    this._sortLayers();
  }

  /**
   * Supprime une couche
   * @param {ParallaxLayer} layer
   */
  removeLayer(layer) {
    const idx = this.layers.indexOf(layer);
    if (idx > -1) {
      this.layers.splice(idx, 1);
    }
  }

  /**
   * Supprime toutes les couches
   */
  clearLayers() {
    this.layers = [];
  }

  /**
   * Trie les couches par profondeur (arrière-plan d'abord)
   * @private
   */
  _sortLayers() {
    this.layers.sort((a, b) => b.depth - a.depth);
  }

  /**
   * Met à jour toutes les couches
   * @param {number} cameraX
   * @param {number} cameraY
   */
  update(cameraX, cameraY) {
    for (const layer of this.layers) {
      layer.update(cameraX, cameraY);
    }
  }

  /**
   * Dessine toutes les couches
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} viewportWidth
   * @param {number} viewportHeight
   */
  render(ctx, viewportWidth, viewportHeight) {
    for (const layer of this.layers) {
      layer.render(ctx, viewportWidth, viewportHeight);
    }
  }

  /**
   * Retourne une couche par sa profondeur
   * @param {number} depth
   * @returns {ParallaxLayer|undefined}
   */
  getLayerByDepth(depth) {
    return this.layers.find(l => l.depth === depth);
  }
}
