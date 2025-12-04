/**
 * Scène de jeu principale
 */
import { ParallaxLayer, ParallaxManager } from '../../shared/components/rendering/parallax-layer.js';
import { SpriteRenderer } from '../../shared/components/rendering/sprite-renderer.js';

// Modes de navigation
export const NavigationMode = {
  FORWARD: 'forward',
  BACKWARD: 'backward',
  UP: 'up',
  DOWN: 'down'
};

export class PlayScene {
  constructor(engine, callbacks = {}) {
    this.engine = engine;
    this.onPause = callbacks.onPause || (() => {});

    // État du niveau
    this.currentLevel = null;
    this.currentZone = null;
    this.navigationMode = NavigationMode.FORWARD;

    // Personnage
    this.character = null;
    this.characterSprite = null;
    this.characterX = 100;
    this.characterY = 500;
    this.velocityX = 0;
    this.velocityY = 0;

    // Physique
    this.speed = 5;
    this.jumpForce = 12;
    this.gravity = 0.5;
    this.isGrounded = true;
    this.facingRight = true;

    // Caméra
    this.cameraX = 0;
    this.cameraY = 0;

    // Parallaxe
    this.parallaxManager = new ParallaxManager();

    // Robot compagnon
    this.robotSprite = null;
    this.robotX = 50;
    this.robotY = 500;

    // Debug
    this.showDebug = false;
  }

  async onEnter(data) {
    console.log('🎮 PlayScene entered', data);

    this.character = data.character || 'prince';

    // Créer le sprite du personnage (placeholder)
    this.characterSprite = new SpriteRenderer({
      x: this.characterX,
      y: this.characterY,
      width: 64,
      height: 96,
      anchorX: 0.5,
      anchorY: 1
    });

    // Créer les couches de parallaxe (demo)
    await this._setupDemoParallax();

    // Sol temporaire
    this.groundY = 600;
  }

  onExit() {
    console.log('🎮 PlayScene exited');
    this.parallaxManager.clearLayers();
  }

  async _setupDemoParallax() {
    // Couches de démo (couleurs solides pour l'instant)
    const layers = [
      { depth: 5, speed: 0.1, color: '#1a1a3e' },  // Ciel lointain
      { depth: 4, speed: 0.3, color: '#2a2a4e' },  // Montagnes
      { depth: 3, speed: 0.5, color: '#3a3a5e' },  // Arbres loin
      { depth: 2, speed: 0.7, color: '#4a4a6e' },  // Arbres proches
      { depth: 1, speed: 1.0, color: '#5a5a7e' },  // Sol
    ];

    for (const config of layers) {
      const layer = new ParallaxLayer({
        depth: config.depth,
        speed: config.speed,
        repeatX: true
      });

      // Créer une image de couleur temporaire
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = config.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.src = canvas.toDataURL();
      await new Promise(resolve => {
        img.onload = resolve;
      });

      layer.addLoadedImage(img, 0, this.engine.height - 200 - (config.depth * 50));
      this.parallaxManager.addLayer(layer);
    }
  }

  update(deltaTime, engine) {
    // Pause
    if (engine.isKeyJustPressed('Escape')) {
      this.onPause();
      return;
    }

    // Debug toggle
    if (engine.isKeyJustPressed('F3')) {
      this.showDebug = !this.showDebug;
    }

    // Input
    const input = engine.getInputState();

    // Mouvement selon le mode de navigation
    this._updateMovement(input, deltaTime);

    // Mise à jour du sprite personnage
    this.characterSprite.x = this.characterX;
    this.characterSprite.y = this.characterY;
    this.characterSprite.scaleX = this.facingRight ? 1 : -1;

    // Mise à jour du robot (suit le personnage)
    this._updateRobot(deltaTime);

    // Mise à jour caméra
    this._updateCamera();

    // Mise à jour parallaxe
    this.parallaxManager.update(this.cameraX, this.cameraY);
  }

  _updateMovement(input, deltaTime) {
    switch (this.navigationMode) {
      case NavigationMode.FORWARD:
      case NavigationMode.BACKWARD:
        this._updateHorizontalMovement(input);
        break;
      case NavigationMode.UP:
      case NavigationMode.DOWN:
        this._updateVerticalMovement(input);
        break;
    }
  }

  _updateHorizontalMovement(input) {
    // Mouvement horizontal
    if (input.left) {
      this.velocityX = -this.speed;
      this.facingRight = false;
    } else if (input.right) {
      this.velocityX = this.speed;
      this.facingRight = true;
    } else {
      this.velocityX *= 0.8;
      if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
    }

    // Saut
    if (input.jump && this.isGrounded) {
      this.velocityY = -this.jumpForce;
      this.isGrounded = false;
    }

    // Gravité
    this.velocityY += this.gravity;

    // Appliquer
    this.characterX += this.velocityX;
    this.characterY += this.velocityY;

    // Collision avec le sol
    if (this.characterY >= this.groundY) {
      this.characterY = this.groundY;
      this.velocityY = 0;
      this.isGrounded = true;
    }

    // Limites horizontales (pour la démo)
    this.characterX = Math.max(50, this.characterX);
  }

  _updateVerticalMovement(input) {
    // Mouvement vertical (escalade)
    if (input.up) {
      this.velocityY = -this.speed;
    } else if (input.down) {
      this.velocityY = this.speed;
    } else {
      this.velocityY *= 0.8;
      if (Math.abs(this.velocityY) < 0.1) this.velocityY = 0;
    }

    // Mouvement horizontal limité
    if (input.left) {
      this.velocityX = -this.speed * 0.5;
      this.facingRight = false;
    } else if (input.right) {
      this.velocityX = this.speed * 0.5;
      this.facingRight = true;
    } else {
      this.velocityX *= 0.8;
    }

    this.characterX += this.velocityX;
    this.characterY += this.velocityY;
  }

  _updateRobot(deltaTime) {
    // Le robot suit le personnage avec un délai
    const targetX = this.characterX - (this.facingRight ? 80 : -80);
    const targetY = this.characterY;

    this.robotX += (targetX - this.robotX) * 0.05;
    this.robotY += (targetY - this.robotY) * 0.05;
  }

  _updateCamera() {
    // Caméra suit le personnage
    const targetX = this.characterX - this.engine.width / 2;
    const targetY = this.characterY - this.engine.height / 2;

    // Smooth follow
    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraY += (targetY - this.cameraY) * 0.1;

    // Limites
    this.cameraX = Math.max(0, this.cameraX);
    this.cameraY = Math.max(0, Math.min(this.cameraY, 200));
  }

  render(ctx, engine) {
    // Fond
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, engine.width, engine.height);

    // Sauvegarder le contexte pour la caméra
    ctx.save();

    // Parallaxe (gère son propre offset)
    this.parallaxManager.render(ctx, engine.width, engine.height);

    // Appliquer le transform de la caméra pour les éléments du monde
    ctx.translate(-this.cameraX, -this.cameraY);

    // Sol (placeholder)
    ctx.fillStyle = '#3a5a3a';
    ctx.fillRect(0, this.groundY, 5000, 200);

    // Robot (placeholder)
    ctx.fillStyle = '#6a9ad9';
    ctx.beginPath();
    ctx.arc(this.robotX, this.robotY - 30, 25, 0, Math.PI * 2);
    ctx.fill();

    // Personnage (placeholder)
    const charColor = this.character === 'prince' ? '#4a90d9' : '#d94a90';
    ctx.fillStyle = charColor;
    ctx.fillRect(
      this.characterX - 32,
      this.characterY - 96,
      64,
      96
    );

    // Yeux du personnage
    ctx.fillStyle = '#ffffff';
    const eyeOffset = this.facingRight ? 8 : -8;
    ctx.beginPath();
    ctx.arc(this.characterX + eyeOffset - 8, this.characterY - 70, 6, 0, Math.PI * 2);
    ctx.arc(this.characterX + eyeOffset + 8, this.characterY - 70, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HUD (par-dessus tout, pas affecté par la caméra)
    this._renderHUD(ctx, engine);

    // Debug
    if (this.showDebug) {
      this._renderDebug(ctx, engine);
    }
  }

  _renderHUD(ctx, engine) {
    // Indicateur de mode
    const modeColors = {
      forward: '#4a90d9',
      backward: '#f39c12',
      up: '#2ecc71',
      down: '#e74c3c'
    };

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, 100, 30);

    ctx.fillStyle = modeColors[this.navigationMode];
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(this.navigationMode.toUpperCase(), 20, 30);
  }

  _renderDebug(ctx, engine) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(engine.width - 200, 10, 190, 120);

    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';

    const debugInfo = [
      `FPS: ${engine.fps}`,
      `Pos: ${Math.round(this.characterX)}, ${Math.round(this.characterY)}`,
      `Vel: ${this.velocityX.toFixed(1)}, ${this.velocityY.toFixed(1)}`,
      `Cam: ${Math.round(this.cameraX)}, ${Math.round(this.cameraY)}`,
      `Mode: ${this.navigationMode}`,
      `Grounded: ${this.isGrounded}`
    ];

    debugInfo.forEach((text, i) => {
      ctx.fillText(text, engine.width - 190, 28 + i * 16);
    });
  }

  // Méthodes publiques pour changer le mode
  setNavigationMode(mode) {
    if (Object.values(NavigationMode).includes(mode)) {
      this.navigationMode = mode;
      console.log(`🧭 Navigation mode: ${mode}`);
    }
  }
}
