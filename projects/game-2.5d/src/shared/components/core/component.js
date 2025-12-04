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
    this._state = options.state || {};
    this._listeners = new Map();
    this._domListeners = [];
  }

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Monte le composant dans un conteneur
   * @param {string|HTMLElement} container - Sélecteur ou élément
   * @returns {Component} this
   */
  mount(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) {
      throw new Error(`Container not found for component ${this.id}`);
    }

    this.element = this._createElement();
    container.appendChild(this.element);
    this._bindDOMEvents();
    this.onMount();

    return this;
  }

  /**
   * Démonte le composant
   */
  unmount() {
    this.onUnmount();
    this._unbindDOMEvents();

    // Démonter les enfants
    this.children.forEach(child => child.unmount());
    this.children.clear();

    this.element?.remove();
    this.element = null;
  }

  /**
   * Hook appelé après le montage
   * @virtual
   */
  onMount() {}

  /**
   * Hook appelé avant le démontage
   * @virtual
   */
  onUnmount() {}

  /**
   * Hook appelé après mise à jour de l'état
   * @virtual
   * @param {Object} prevState
   * @param {Object} newState
   */
  onUpdate(prevState, newState) {}

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Getter pour l'état
   */
  get state() {
    return { ...this._state };
  }

  /**
   * Met à jour l'état et re-rend le composant
   * @param {Object} newState - Propriétés à mettre à jour
   */
  setState(newState) {
    const prevState = { ...this._state };
    this._state = { ...this._state, ...newState };

    this.onUpdate(prevState, this._state);
    this._render();
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Retourne le HTML du composant
   * @virtual
   * @returns {string}
   */
  render() {
    return `<div data-component="${this.id}"></div>`;
  }

  /**
   * Crée l'élément DOM depuis le template
   * @private
   */
  _createElement() {
    const template = document.createElement('template');
    template.innerHTML = this.render().trim();
    const element = template.content.firstChild;
    element.dataset.componentId = this.id;
    return element;
  }

  /**
   * Re-rend le composant
   * @private
   */
  _render() {
    if (!this.element) return;

    this._unbindDOMEvents();
    const newElement = this._createElement();
    this.element.replaceWith(newElement);
    this.element = newElement;
    this._bindDOMEvents();
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENTS (Custom)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Écoute un événement custom
   * @param {string} event - Nom de l'événement
   * @param {Function} handler - Callback
   * @returns {Function} Fonction pour se désabonner
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(handler);

    return () => this.off(event, handler);
  }

  /**
   * Arrête d'écouter un événement
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    }
  }

  /**
   * Émet un événement custom
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    const handlers = this._listeners.get(event) || [];
    handlers.forEach(h => h(data));
  }

  // ═══════════════════════════════════════════════════════════════
  // DOM EVENTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Bind les événements DOM déclarés
   * Override dans les sous-classes pour ajouter des événements
   * @virtual
   */
  _bindDOMEvents() {}

  /**
   * Unbind les événements DOM
   * @private
   */
  _unbindDOMEvents() {
    this._domListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._domListeners = [];
  }

  /**
   * Helper pour ajouter un event listener tracké
   * @param {HTMLElement} element
   * @param {string} event
   * @param {Function} handler
   */
  _addDOMListener(element, event, handler) {
    element.addEventListener(event, handler);
    this._domListeners.push({ element, event, handler });
  }

  // ═══════════════════════════════════════════════════════════════
  // CHILDREN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Ajoute un composant enfant
   * @param {string} name - Identifiant unique de l'enfant
   * @param {Component} component
   * @returns {Component} L'enfant ajouté
   */
  addChild(name, component) {
    component.parent = this;
    this.children.set(name, component);
    return component;
  }

  /**
   * Récupère un composant enfant
   * @param {string} name
   * @returns {Component|undefined}
   */
  getChild(name) {
    return this.children.get(name);
  }

  /**
   * Supprime un composant enfant
   * @param {string} name
   */
  removeChild(name) {
    const child = this.children.get(name);
    if (child) {
      child.unmount();
      this.children.delete(name);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DOM HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Query selector dans le composant
   * @param {string} selector
   * @returns {HTMLElement|null}
   */
  $(selector) {
    return this.element?.querySelector(selector) || null;
  }

  /**
   * Query selector all dans le composant
   * @param {string} selector
   * @returns {NodeList}
   */
  $$(selector) {
    return this.element?.querySelectorAll(selector) || [];
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère un ID unique
   * @returns {string}
   */
  static generateId() {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
