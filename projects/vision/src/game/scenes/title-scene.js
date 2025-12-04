/**
 * Scène du menu titre
 */
export class TitleScene {
  constructor(engine, callbacks = {}) {
    this.engine = engine;
    this.onStart = callbacks.onStart || (() => {});
    this.onContinue = callbacks.onContinue || (() => {});
    this.onOptions = callbacks.onOptions || (() => {});
  }

  onEnter(data) {
    console.log('📺 TitleScene entered');
  }

  onExit() {
    console.log('📺 TitleScene exited');
  }

  update(deltaTime, engine) {
    // Appuyer sur Enter pour démarrer
    if (engine.isKeyJustPressed('Enter') || engine.isKeyJustPressed('Space')) {
      this.onStart();
    }
  }

  render(ctx, engine) {
    // Fond
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, engine.width, engine.height);

    // Cette scène est gérée par le HTML/CSS
    // Le canvas n'affiche rien pendant le menu titre
  }
}
