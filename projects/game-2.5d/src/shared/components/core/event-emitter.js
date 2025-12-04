/**
 * Gestion centralisée des événements
 * Pattern pub/sub pour découplage entre composants
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  /**
   * Écoute un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction appelée
   * @param {Object} [context=null] - Contexte this pour le callback
   * @returns {Function} Fonction pour se désabonner
   */
  on(event, callback, context = null) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }

    const listener = { callback, context };
    this._events.get(event).push(listener);

    // Retourne une fonction pour se désabonner
    return () => this.off(event, callback);
  }

  /**
   * Écoute un événement une seule fois
   * @param {string} event
   * @param {Function} callback
   * @param {Object} [context=null]
   * @returns {Function} Fonction pour se désabonner
   */
  once(event, callback, context = null) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback.call(context, data);
    };
    return this.on(event, wrapper, context);
  }

  /**
   * Arrête d'écouter un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} [callback] - Si omis, supprime tous les listeners
   */
  off(event, callback) {
    if (!callback) {
      // Supprimer tous les listeners de cet événement
      this._events.delete(event);
      return;
    }

    const listeners = this._events.get(event);
    if (!listeners) return;

    const idx = listeners.findIndex(l => l.callback === callback);
    if (idx > -1) {
      listeners.splice(idx, 1);
    }

    // Nettoyer si plus de listeners
    if (listeners.length === 0) {
      this._events.delete(event);
    }
  }

  /**
   * Émet un événement
   * @param {string} event - Nom de l'événement
   * @param {*} [data] - Données à passer aux listeners
   */
  emit(event, data) {
    const listeners = this._events.get(event);
    if (!listeners) return;

    // Copie pour éviter les problèmes si un listener se désabonne
    [...listeners].forEach(({ callback, context }) => {
      try {
        callback.call(context, data);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Vérifie si un événement a des listeners
   * @param {string} event
   * @returns {boolean}
   */
  hasListeners(event) {
    const listeners = this._events.get(event);
    return listeners && listeners.length > 0;
  }

  /**
   * Retourne le nombre de listeners pour un événement
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    const listeners = this._events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Supprime tous les listeners
   */
  clear() {
    this._events.clear();
  }

  /**
   * Liste tous les événements avec listeners
   * @returns {string[]}
   */
  eventNames() {
    return [...this._events.keys()];
  }
}

/**
 * Instance globale pour la communication inter-composants
 * Usage: import { globalEvents } from './event-emitter.js'
 */
export const globalEvents = new EventEmitter();

// Événements globaux prédéfinis
export const GameEvents = {
  // Navigation
  MODE_CHANGED: 'game:modeChanged',
  ZONE_ENTERED: 'game:zoneEntered',
  ZONE_EXITED: 'game:zoneExited',

  // Character
  CHARACTER_SELECTED: 'game:characterSelected',
  CHARACTER_MOVED: 'game:characterMoved',
  CHARACTER_JUMPED: 'game:characterJumped',

  // Game state
  GAME_STARTED: 'game:started',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
  GAME_STOPPED: 'game:stopped',

  // Level
  LEVEL_LOADED: 'game:levelLoaded',
  LEVEL_COMPLETED: 'game:levelCompleted',

  // UI
  DIALOG_OPENED: 'ui:dialogOpened',
  DIALOG_CLOSED: 'ui:dialogClosed',
  MENU_OPENED: 'ui:menuOpened',
  MENU_CLOSED: 'ui:menuClosed'
};
