/**
 * Rendu et animation de sprites
 * Supporte: images simples, spritesheets, animations
 */
export class SpriteRenderer {
  constructor(options = {}) {
    // Image source
    this.image = null;
    this.loaded = false;

    // Source rectangle (portion de l'image à afficher)
    this.sourceX = options.sourceX || 0;
    this.sourceY = options.sourceY || 0;
    this.sourceWidth = options.sourceWidth || 0;
    this.sourceHeight = options.sourceHeight || 0;

    // Position dans le monde
    this.x = options.x || 0;
    this.y = options.y || 0;

    // Taille d'affichage
    this.width = options.width || 0;
    this.height = options.height || 0;

    // Point d'ancrage (0-1, relatif à la taille)
    this.anchorX = options.anchorX ?? 0.5;
    this.anchorY = options.anchorY ?? 1; // Ancre en bas par défaut

    // Transformations
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.alpha = 1;

    // Animation
    this.animation = null;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.isPlaying = false;
    this.onAnimationEnd = null;

    // Visibilité
    this.visible = true;
  }

  // ═══════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Charge une image
   * @param {string} src - URL de l'image
   * @returns {Promise<SpriteRenderer>}
   */
  async load(src) {
    return new Promise((resolve, reject) => {
      this.image = new Image();

      this.image.onload = () => {
        this.loaded = true;

        // Dimensions par défaut si non spécifiées
        if (!this.sourceWidth) this.sourceWidth = this.image.width;
        if (!this.sourceHeight) this.sourceHeight = this.image.height;
        if (!this.width) this.width = this.sourceWidth;
        if (!this.height) this.height = this.sourceHeight;

        resolve(this);
      };

      this.image.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      this.image.src = src;
    });
  }

  /**
   * Définit l'image directement (si déjà chargée)
   * @param {HTMLImageElement} image
   */
  setImage(image) {
    this.image = image;
    this.loaded = true;

    if (!this.sourceWidth) this.sourceWidth = image.width;
    if (!this.sourceHeight) this.sourceHeight = image.height;
    if (!this.width) this.width = this.sourceWidth;
    if (!this.height) this.height = this.sourceHeight;
  }

  // ═══════════════════════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Définit et lance une animation
   * @param {Object} animation - Configuration de l'animation
   * @param {Array} animation.frames - [{x, y, width, height}, ...]
   * @param {number} animation.fps - Images par seconde
   * @param {boolean} [animation.loop=true] - Boucler l'animation
   */
  setAnimation(animation) {
    if (!animation || !animation.frames || animation.frames.length === 0) {
      this.animation = null;
      this.isPlaying = false;
      return;
    }

    this.animation = animation;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.isPlaying = true;

    // Appliquer la première frame
    this._applyFrame(0);
  }

  /**
   * Joue l'animation depuis le début
   */
  play() {
    if (this.animation) {
      this.currentFrame = 0;
      this.frameTime = 0;
      this.isPlaying = true;
    }
  }

  /**
   * Met en pause l'animation
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Reprend l'animation
   */
  resume() {
    if (this.animation) {
      this.isPlaying = true;
    }
  }

  /**
   * Arrête l'animation et revient à la première frame
   */
  stop() {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.frameTime = 0;
    if (this.animation) {
      this._applyFrame(0);
    }
  }

  /**
   * Applique une frame spécifique
   * @private
   */
  _applyFrame(frameIndex) {
    const frame = this.animation.frames[frameIndex];
    if (frame) {
      this.sourceX = frame.x;
      this.sourceY = frame.y;
      if (frame.width) this.sourceWidth = frame.width;
      if (frame.height) this.sourceHeight = frame.height;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UPDATE & RENDER
  // ═══════════════════════════════════════════════════════════════

  /**
   * Met à jour l'animation
   * @param {number} deltaTime - Temps écoulé en ms
   */
  update(deltaTime) {
    if (!this.animation || !this.isPlaying) return;

    this.frameTime += deltaTime;
    const frameDuration = 1000 / this.animation.fps;

    while (this.frameTime >= frameDuration) {
      this.frameTime -= frameDuration;
      this.currentFrame++;

      if (this.currentFrame >= this.animation.frames.length) {
        if (this.animation.loop !== false) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.animation.frames.length - 1;
          this.isPlaying = false;
          this.onAnimationEnd?.();
          break;
        }
      }

      this._applyFrame(this.currentFrame);
    }
  }

  /**
   * Dessine le sprite
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.loaded || !this.visible || this.alpha <= 0) return;

    ctx.save();

    // Position avec ancrage
    const drawX = this.x - this.width * this.anchorX * this.scaleX;
    const drawY = this.y - this.height * this.anchorY * this.scaleY;

    // Alpha
    if (this.alpha < 1) {
      ctx.globalAlpha = this.alpha;
    }

    // Transformations (rotation et scale autour du point d'ancrage)
    if (this.rotation !== 0 || this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scaleX, this.scaleY);
      ctx.translate(-this.x, -this.y);
    }

    // Dessin
    ctx.drawImage(
      this.image,
      this.sourceX,
      this.sourceY,
      this.sourceWidth,
      this.sourceHeight,
      drawX,
      drawY,
      this.width * Math.abs(this.scaleX),
      this.height * Math.abs(this.scaleY)
    );

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSFORMATIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Retourne le sprite horizontalement
   */
  flipHorizontal() {
    this.scaleX *= -1;
  }

  /**
   * Retourne le sprite verticalement
   */
  flipVertical() {
    this.scaleY *= -1;
  }

  /**
   * Définit la position
   * @param {number} x
   * @param {number} y
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Déplace le sprite
   * @param {number} dx
   * @param {number} dy
   */
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  // ═══════════════════════════════════════════════════════════════
  // BOUNDS & COLLISION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Retourne la bounding box du sprite
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getBounds() {
    return {
      x: this.x - this.width * this.anchorX,
      y: this.y - this.height * this.anchorY,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Vérifie si un point est dans le sprite
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  containsPoint(px, py) {
    const bounds = this.getBounds();
    return (
      px >= bounds.x &&
      px <= bounds.x + bounds.width &&
      py >= bounds.y &&
      py <= bounds.y + bounds.height
    );
  }

  /**
   * Vérifie la collision avec un autre sprite
   * @param {SpriteRenderer} other
   * @returns {boolean}
   */
  intersects(other) {
    const a = this.getBounds();
    const b = other.getBounds();

    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // CLONE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Clone le sprite
   * @returns {SpriteRenderer}
   */
  clone() {
    const sprite = new SpriteRenderer({
      sourceX: this.sourceX,
      sourceY: this.sourceY,
      sourceWidth: this.sourceWidth,
      sourceHeight: this.sourceHeight,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      anchorX: this.anchorX,
      anchorY: this.anchorY
    });

    sprite.image = this.image;
    sprite.loaded = this.loaded;
    sprite.rotation = this.rotation;
    sprite.scaleX = this.scaleX;
    sprite.scaleY = this.scaleY;
    sprite.alpha = this.alpha;
    sprite.visible = this.visible;

    if (this.animation) {
      sprite.animation = { ...this.animation };
    }

    return sprite;
  }
}
