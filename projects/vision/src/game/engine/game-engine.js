/**
 * Moteur de jeu principal
 * Gère la boucle de jeu, les scènes et le rendu
 */
import { EventEmitter, GameEvents } from '../../shared/components/core/event-emitter.js';

export class GameEngine extends EventEmitter {
  constructor(canvasId) {
    super();

    // Canvas et contexte
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }
    this.ctx = this.canvas.getContext('2d');

    // Dimensions
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Scènes
    this.scenes = new Map();
    this.currentScene = null;
    this.currentSceneName = null;

    // État
    this.isRunning = false;
    this.isPaused = false;

    // Timing
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;

    // Input state
    this.keys = new Set();
    this.keysJustPressed = new Set();
    this.keysJustReleased = new Set();

    // Bind des événements clavier
    this._bindInputEvents();

    // Animation frame ID pour pouvoir l'annuler
    this._rafId = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // SCENES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Ajoute une scène
   * @param {string} name - Nom unique de la scène
   * @param {Object} scene - Instance de la scène
   */
  addScene(name, scene) {
    scene.engine = this;
    this.scenes.set(name, scene);
  }

  /**
   * Change de scène
   * @param {string} name - Nom de la scène
   * @param {Object} [data] - Données à passer à la scène
   */
  switchScene(name, data = {}) {
    const scene = this.scenes.get(name);
    if (!scene) {
      console.error(`Scene not found: ${name}`);
      return;
    }

    // Quitter la scène actuelle
    if (this.currentScene) {
      this.currentScene.onExit?.();
    }

    // Entrer dans la nouvelle scène
    this.currentScene = scene;
    this.currentSceneName = name;
    this.currentScene.onEnter?.(data);

    console.log(`🎬 Scene: ${name}`);
  }

  /**
   * Retourne la scène actuelle
   * @returns {Object|null}
   */
  getScene(name) {
    return this.scenes.get(name) || null;
  }

  // ═══════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════

  /**
   * Démarre le jeu
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    this.emit(GameEvents.GAME_STARTED);
    this._gameLoop(this.lastTime);

    console.log('🎮 Game started');
  }

  /**
   * Arrête le jeu
   */
  stop() {
    this.isRunning = false;

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    this.emit(GameEvents.GAME_STOPPED);
    console.log('🛑 Game stopped');
  }

  /**
   * Met en pause
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    this.emit(GameEvents.GAME_PAUSED);
    console.log('⏸️ Game paused');
  }

  /**
   * Reprend le jeu
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    this.lastTime = performance.now();
    this.emit(GameEvents.GAME_RESUMED);

    console.log('▶️ Game resumed');
  }

  /**
   * Boucle de jeu principale
   * @private
   */
  _gameLoop(timestamp) {
    if (!this.isRunning) return;

    // Calcul du delta time
    this.deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // FPS counter
    this.frameCount++;
    this.fpsUpdateTime += this.deltaTime;
    if (this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }

    // Update (sauf si en pause)
    if (!this.isPaused) {
      this._update(this.deltaTime);
    }

    // Render (toujours, même en pause)
    this._render();

    // Reset input states
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();

    // Prochain frame
    this._rafId = requestAnimationFrame((t) => this._gameLoop(t));
  }

  /**
   * Mise à jour de la logique
   * @private
   */
  _update(deltaTime) {
    this.currentScene?.update?.(deltaTime, this);
  }

  /**
   * Rendu
   * @private
   */
  _render() {
    // Clear
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render scene
    this.currentScene?.render?.(this.ctx, this);

    // Debug overlay (si activé)
    if (this._debugMode) {
      this._renderDebug();
    }
  }

  /**
   * Rendu du debug overlay
   * @private
   */
  _renderDebug() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 120, 50);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${this.fps}`, 20, 28);
    this.ctx.fillText(`Delta: ${this.deltaTime.toFixed(1)}ms`, 20, 44);
    this.ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // INPUT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Bind des événements clavier
   * @private
   */
  _bindInputEvents() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.keysJustPressed.add(e.code);
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.keysJustReleased.add(e.code);
    });

    // Reset quand la fenêtre perd le focus
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  /**
   * Vérifie si une touche est enfoncée
   * @param {string} keyCode - Code de la touche (ex: 'ArrowRight')
   * @returns {boolean}
   */
  isKeyDown(keyCode) {
    return this.keys.has(keyCode);
  }

  /**
   * Vérifie si une touche vient d'être pressée
   * @param {string} keyCode
   * @returns {boolean}
   */
  isKeyJustPressed(keyCode) {
    return this.keysJustPressed.has(keyCode);
  }

  /**
   * Vérifie si une touche vient d'être relâchée
   * @param {string} keyCode
   * @returns {boolean}
   */
  isKeyJustReleased(keyCode) {
    return this.keysJustReleased.has(keyCode);
  }

  /**
   * Retourne l'état des inputs directionnels
   * @returns {{left: boolean, right: boolean, up: boolean, down: boolean, jump: boolean}}
   */
  getInputState() {
    return {
      left: this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA'),
      right: this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD'),
      up: this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW'),
      down: this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS'),
      jump: this.isKeyJustPressed('Space')
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // DEBUG
  // ═══════════════════════════════════════════════════════════════

  /**
   * Active/désactive le mode debug
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this._debugMode = enabled;
  }

  /**
   * Toggle le mode debug
   */
  toggleDebug() {
    this._debugMode = !this._debugMode;
  }
}
