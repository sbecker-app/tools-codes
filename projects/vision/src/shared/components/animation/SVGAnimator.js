/**
 * SVGAnimator - Systeme d'animation pour personnages SVG
 *
 * Gere les animations CSS des personnages SVG modulaires.
 * Les animations sont controlees via des classes CSS sur l'element racine.
 *
 * @example
 * const animator = new SVGAnimator(svgElement);
 *
 * // Definir des callbacks
 * animator.defineAnimation('walk', {
 *   onStart: () => console.log('Debut marche'),
 *   onEnd: () => console.log('Fin marche')
 * });
 *
 * // Jouer une animation
 * animator.play('walk');
 *
 * // Transition vers une autre animation
 * animator.transitionTo('run', 100);
 */
export class SVGAnimator {
  /**
   * @param {SVGElement} svgElement - Element SVG du personnage
   * @param {Object} options - Options de configuration
   * @param {string} [options.rootSelector='.character-root'] - Selecteur de l'element racine
   */
  constructor(svgElement, options = {}) {
    this.svg = svgElement;
    this.rootSelector = options.rootSelector || '.character-root';
    this.root = svgElement.querySelector(this.rootSelector);

    if (!this.root) {
      // Si pas d'element racine trouve, utiliser le SVG lui-meme
      this.root = svgElement;
      console.warn(`[SVGAnimator] Element racine '${this.rootSelector}' non trouve, utilisation du SVG`);
    }

    // Map des animations definies
    this.animations = new Map();

    // Etat actuel
    this.currentAnim = null;
    this.previousAnim = null;
    this.isPlaying = false;

    // Direction du personnage (pour flip horizontal)
    this.facingRight = true;

    // Bindings
    this._onAnimationEnd = this._onAnimationEnd.bind(this);

    // Ecouter les fins d'animation
    this.root.addEventListener('animationend', this._onAnimationEnd);
  }

  /**
   * Definir une animation avec ses callbacks
   * @param {string} name - Nom de l'animation (correspond a la classe CSS)
   * @param {Object} config - Configuration
   * @param {Function} [config.onStart] - Callback au debut
   * @param {Function} [config.onEnd] - Callback a la fin
   * @param {boolean} [config.loop=true] - Animation en boucle
   * @param {number} [config.duration] - Duree en ms (pour les animations JS)
   */
  defineAnimation(name, config = {}) {
    this.animations.set(name, {
      onStart: config.onStart || null,
      onEnd: config.onEnd || null,
      loop: config.loop !== false,
      duration: config.duration || null
    });
  }

  /**
   * Jouer une animation
   * @param {string} name - Nom de l'animation
   * @returns {boolean} - True si l'animation a demarre
   */
  play(name) {
    // Ne pas rejouer la meme animation
    if (this.currentAnim === name && this.isPlaying) {
      return false;
    }

    // Sauvegarder l'animation precedente
    this.previousAnim = this.currentAnim;

    // Retirer l'ancienne classe
    if (this.currentAnim) {
      this.root.classList.remove(this.currentAnim);
    }

    // Ajouter la nouvelle classe
    this.root.classList.add(name);
    this.currentAnim = name;
    this.isPlaying = true;

    // Appeler le callback onStart
    const anim = this.animations.get(name);
    if (anim?.onStart) {
      anim.onStart();
    }

    return true;
  }

  /**
   * Arreter l'animation courante
   */
  stop() {
    if (this.currentAnim) {
      this.root.classList.remove(this.currentAnim);

      const anim = this.animations.get(this.currentAnim);
      if (anim?.onEnd) {
        anim.onEnd();
      }
    }

    this.previousAnim = this.currentAnim;
    this.currentAnim = null;
    this.isPlaying = false;
  }

  /**
   * Mettre en pause l'animation courante
   */
  pause() {
    this.root.style.animationPlayState = 'paused';
    this.isPlaying = false;
  }

  /**
   * Reprendre l'animation en pause
   */
  resume() {
    this.root.style.animationPlayState = 'running';
    this.isPlaying = true;
  }

  /**
   * Transition douce vers une autre animation
   * @param {string} name - Nom de l'animation cible
   * @param {number} [transitionTime=100] - Duree de transition en ms
   */
  transitionTo(name, transitionTime = 100) {
    // Appliquer une transition CSS temporaire
    this.root.style.transition = `all ${transitionTime}ms ease-out`;

    this.play(name);

    // Retirer la transition apres le delai
    setTimeout(() => {
      this.root.style.transition = '';
    }, transitionTime);
  }

  /**
   * Changer la direction du personnage (flip horizontal)
   * @param {boolean} facingRight - True = regarde a droite
   */
  setDirection(facingRight) {
    if (this.facingRight === facingRight) return;

    this.facingRight = facingRight;

    if (facingRight) {
      this.svg.style.transform = '';
    } else {
      this.svg.style.transform = 'scaleX(-1)';
    }
  }

  /**
   * Basculer la direction
   */
  flipDirection() {
    this.setDirection(!this.facingRight);
  }

  /**
   * Obtenir l'animation courante
   * @returns {string|null}
   */
  getCurrentAnimation() {
    return this.currentAnim;
  }

  /**
   * Verifier si une animation est en cours
   * @returns {boolean}
   */
  isAnimating() {
    return this.isPlaying;
  }

  /**
   * Verifier si une animation specifique est active
   * @param {string} name - Nom de l'animation
   * @returns {boolean}
   */
  isPlayingAnimation(name) {
    return this.currentAnim === name && this.isPlaying;
  }

  /**
   * Obtenir un element du SVG par selecteur
   * @param {string} selector - Selecteur CSS
   * @returns {Element|null}
   */
  getElement(selector) {
    return this.svg.querySelector(selector);
  }

  /**
   * Appliquer un style a un element du SVG
   * @param {string} selector - Selecteur CSS
   * @param {Object} styles - Styles a appliquer
   */
  setElementStyle(selector, styles) {
    const element = this.svg.querySelector(selector);
    if (element) {
      Object.assign(element.style, styles);
    }
  }

  /**
   * Modifier une variable CSS du personnage
   * @param {string} name - Nom de la variable (sans --)
   * @param {string} value - Valeur
   */
  setCSSVariable(name, value) {
    this.svg.style.setProperty(`--${name}`, value);
  }

  /**
   * Changer la couleur d'une partie du personnage
   * @param {string} part - Nom de la partie (ex: 'hair', 'skin', 'primary')
   * @param {string} color - Couleur (hex, rgb, etc.)
   */
  setColor(part, color) {
    this.setCSSVariable(`${part}-color`, color);
  }

  /**
   * Gestionnaire interne pour les fins d'animation
   * @private
   */
  _onAnimationEnd(event) {
    const anim = this.animations.get(this.currentAnim);

    if (anim && !anim.loop) {
      // Animation non-boucle terminee
      if (anim.onEnd) {
        anim.onEnd();
      }
      this.isPlaying = false;
    }
  }

  /**
   * Nettoyer l'instance
   */
  destroy() {
    this.stop();
    this.root.removeEventListener('animationend', this._onAnimationEnd);
    this.animations.clear();
    this.svg = null;
    this.root = null;
  }
}

/**
 * Factory pour creer des animateurs avec configurations predefinies
 */
export class SVGAnimatorFactory {
  /**
   * Creer un animateur pour un personnage standard
   * @param {SVGElement} svg - Element SVG
   * @returns {SVGAnimator}
   */
  static createCharacterAnimator(svg) {
    const animator = new SVGAnimator(svg);

    // Definir les animations standard
    animator.defineAnimation('idle', { loop: true });
    animator.defineAnimation('walk', { loop: true });
    animator.defineAnimation('run', { loop: true });
    animator.defineAnimation('jump', { loop: false });
    animator.defineAnimation('fall', { loop: true });

    // Demarrer en idle
    animator.play('idle');

    return animator;
  }

  /**
   * Creer un animateur pour le robot
   * @param {SVGElement} svg - Element SVG
   * @returns {SVGAnimator}
   */
  static createRobotAnimator(svg) {
    const animator = new SVGAnimator(svg);

    // Animations specifiques au robot
    animator.defineAnimation('idle', { loop: true });
    animator.defineAnimation('move', { loop: true });
    animator.defineAnimation('fly', { loop: true });
    animator.defineAnimation('transform', { loop: false });

    animator.play('idle');

    return animator;
  }
}

// Export par defaut
export default SVGAnimator;
