/**
 * SVGLoader - Chargement et cache des fichiers SVG
 *
 * Permet de charger, cacher et injecter des SVG dans le DOM.
 *
 * @example
 * // Charger un SVG
 * const svgContent = await SVGLoader.load('/assets/svg/prince.svg');
 *
 * // Charger plusieurs SVGs
 * const svgs = await SVGLoader.loadMultiple({
 *   prince: '/assets/svg/characters/prince.svg',
 *   sky: '/assets/svg/backgrounds/sky.svg'
 * });
 *
 * // Injecter dans un conteneur
 * const svgElement = await SVGLoader.inject('/assets/svg/prince.svg', container);
 */
export class SVGLoader {
  // Cache statique pour les SVG charges
  static cache = new Map();

  /**
   * Charger un fichier SVG (avec cache)
   * @param {string} url - URL du fichier SVG
   * @returns {Promise<string>} - Contenu SVG en string
   */
  static async load(url) {
    // Verifier le cache
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erreur chargement SVG: ${url} (${response.status})`);
      }

      const content = await response.text();

      // Valider que c'est bien du SVG
      if (!content.includes('<svg')) {
        throw new Error(`Fichier invalide (pas de SVG): ${url}`);
      }

      // Mettre en cache
      this.cache.set(url, content);

      return content;
    } catch (error) {
      console.error(`[SVGLoader] Erreur:`, error);
      throw error;
    }
  }

  /**
   * Charger plusieurs SVGs en parallele
   * @param {Object<string, string>} urls - Map de nom -> URL
   * @returns {Promise<Object<string, string>>} - Map de nom -> contenu SVG
   */
  static async loadMultiple(urls) {
    const entries = Object.entries(urls);

    const results = await Promise.all(
      entries.map(async ([name, url]) => {
        const content = await this.load(url);
        return [name, content];
      })
    );

    return Object.fromEntries(results);
  }

  /**
   * Injecter un SVG dans un element conteneur
   * @param {string} url - URL du fichier SVG
   * @param {HTMLElement} container - Element conteneur
   * @param {Object} options - Options d'injection
   * @param {string} [options.className] - Classe CSS a ajouter au SVG
   * @param {Object} [options.attributes] - Attributs a ajouter au SVG
   * @returns {Promise<SVGElement>} - Element SVG injecte
   */
  static async inject(url, container, options = {}) {
    const content = await this.load(url);

    // Injecter le contenu
    container.innerHTML = content;

    // Recuperer l'element SVG
    const svg = container.querySelector('svg');

    if (!svg) {
      throw new Error(`Pas d'element SVG trouve dans: ${url}`);
    }

    // Appliquer les options
    if (options.className) {
      svg.classList.add(...options.className.split(' '));
    }

    if (options.attributes) {
      for (const [key, value] of Object.entries(options.attributes)) {
        svg.setAttribute(key, value);
      }
    }

    return svg;
  }

  /**
   * Creer un element SVG a partir d'une URL (sans l'injecter)
   * @param {string} url - URL du fichier SVG
   * @returns {Promise<SVGElement>} - Element SVG cree
   */
  static async createElement(url) {
    const content = await this.load(url);

    // Parser le SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'image/svg+xml');

    // Verifier les erreurs de parsing
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`Erreur de parsing SVG: ${url}`);
    }

    return doc.documentElement;
  }

  /**
   * Cloner un SVG deja charge
   * @param {string} url - URL du fichier SVG (doit etre en cache)
   * @returns {SVGElement|null} - Clone de l'element SVG ou null si non trouve
   */
  static clone(url) {
    if (!this.cache.has(url)) {
      console.warn(`[SVGLoader] SVG non en cache: ${url}`);
      return null;
    }

    const content = this.cache.get(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'image/svg+xml');

    return doc.documentElement.cloneNode(true);
  }

  /**
   * Precharger une liste de SVGs
   * @param {string[]} urls - Liste d'URLs a precharger
   * @param {Function} [onProgress] - Callback de progression (loaded, total)
   * @returns {Promise<void>}
   */
  static async preload(urls, onProgress = null) {
    let loaded = 0;
    const total = urls.length;

    await Promise.all(
      urls.map(async (url) => {
        await this.load(url);
        loaded++;
        if (onProgress) {
          onProgress(loaded, total);
        }
      })
    );
  }

  /**
   * Verifier si un SVG est en cache
   * @param {string} url - URL du fichier SVG
   * @returns {boolean}
   */
  static isCached(url) {
    return this.cache.has(url);
  }

  /**
   * Obtenir un SVG du cache
   * @param {string} url - URL du fichier SVG
   * @returns {string|null} - Contenu SVG ou null
   */
  static get(url) {
    return this.cache.get(url) || null;
  }

  /**
   * Vider le cache
   */
  static clearCache() {
    this.cache.clear();
  }

  /**
   * Retirer un SVG specifique du cache
   * @param {string} url - URL du fichier SVG
   */
  static uncache(url) {
    this.cache.delete(url);
  }

  /**
   * Obtenir la taille du cache
   * @returns {number}
   */
  static get cacheSize() {
    return this.cache.size;
  }
}

// Export par defaut
export default SVGLoader;
