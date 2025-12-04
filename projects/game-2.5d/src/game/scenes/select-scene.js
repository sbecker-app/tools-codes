/**
 * Scène de sélection du personnage
 */
export class SelectScene {
  constructor(engine, callbacks = {}) {
    this.engine = engine;
    this.onSelect = callbacks.onSelect || (() => {});
    this.onBack = callbacks.onBack || (() => {});

    this.selectedIndex = 0;
    this.characters = ['prince', 'princess'];
  }

  onEnter(data) {
    console.log('👤 SelectScene entered');
    this.selectedIndex = 0;
  }

  onExit() {
    console.log('👤 SelectScene exited');
  }

  update(deltaTime, engine) {
    // Navigation
    if (engine.isKeyJustPressed('ArrowLeft') || engine.isKeyJustPressed('KeyA')) {
      this.selectedIndex = (this.selectedIndex - 1 + this.characters.length) % this.characters.length;
    }
    if (engine.isKeyJustPressed('ArrowRight') || engine.isKeyJustPressed('KeyD')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.characters.length;
    }

    // Sélection
    if (engine.isKeyJustPressed('Enter') || engine.isKeyJustPressed('Space')) {
      this.onSelect(this.characters[this.selectedIndex]);
    }

    // Retour
    if (engine.isKeyJustPressed('Escape')) {
      this.onBack();
    }
  }

  render(ctx, engine) {
    // Fond
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, engine.width, engine.height);

    // Cette scène est gérée par le HTML/CSS
  }
}
