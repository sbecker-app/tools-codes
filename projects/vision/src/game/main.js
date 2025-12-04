/**
 * Point d'entrée du jeu - Game 2.5D
 */

import { GameEngine } from './engine/game-engine.js';
import { TitleScene } from './scenes/title-scene.js';
import { SelectScene } from './scenes/select-scene.js';
import { PlayScene } from './scenes/play-scene.js';

// État global du jeu
const gameState = {
  selectedCharacter: null,
  currentLevel: null,
  savedProgress: null
};

// Éléments DOM
const elements = {
  loading: document.getElementById('loading'),
  gameContainer: document.getElementById('game-container'),
  canvas: document.getElementById('game-canvas'),
  titleScreen: document.getElementById('title-screen'),
  characterSelect: document.getElementById('character-select'),
  pauseMenu: document.getElementById('pause-menu')
};

// Gestionnaire de menus
const menuManager = {
  current: null,

  show(menuId) {
    // Cacher tous les menus
    Object.values(elements).forEach(el => {
      if (el?.classList?.contains('menu-screen')) {
        el.classList.add('hidden');
      }
    });

    // Afficher le menu demandé
    const menu = elements[menuId];
    if (menu) {
      menu.classList.remove('hidden');
      this.current = menuId;
    }
  },

  hide(menuId) {
    const menu = elements[menuId];
    if (menu) {
      menu.classList.add('hidden');
    }
    if (this.current === menuId) {
      this.current = null;
    }
  },

  hideAll() {
    Object.keys(elements).forEach(key => {
      if (elements[key]?.classList?.contains('menu-screen')) {
        elements[key].classList.add('hidden');
      }
    });
    this.current = null;
  }
};

// Initialisation
async function init() {
  console.log('🎮 Game 2.5D - Initialisation...');

  try {
    // Créer le moteur de jeu
    const engine = new GameEngine('game-canvas');

    // Enregistrer les scènes
    engine.addScene('title', new TitleScene(engine, {
      onStart: () => {
        menuManager.show('characterSelect');
      },
      onContinue: () => {
        // TODO: Charger la sauvegarde
        console.log('Continue not implemented yet');
      },
      onOptions: () => {
        // TODO: Menu options
        console.log('Options not implemented yet');
      }
    }));

    engine.addScene('select', new SelectScene(engine, {
      onSelect: (character) => {
        gameState.selectedCharacter = character;
        console.log(`Personnage sélectionné: ${character}`);
        startGame(engine);
      },
      onBack: () => {
        menuManager.show('titleScreen');
      }
    }));

    engine.addScene('play', new PlayScene(engine, {
      onPause: () => {
        engine.pause();
        menuManager.show('pauseMenu');
      }
    }));

    // Bind des boutons de menu
    bindMenuEvents(engine);

    // Cacher le loading, afficher le titre
    elements.loading.classList.add('hidden');
    menuManager.show('titleScreen');

    console.log('✅ Game 2.5D - Prêt!');

  } catch (error) {
    console.error('❌ Erreur d\'initialisation:', error);
    elements.loading.innerHTML = `
      <p style="color: var(--color-danger);">Erreur de chargement</p>
      <p style="font-size: 0.875rem;">${error.message}</p>
    `;
  }
}

// Démarrer le jeu
function startGame(engine) {
  menuManager.hideAll();
  elements.gameContainer.classList.remove('hidden');

  engine.switchScene('play', {
    character: gameState.selectedCharacter,
    level: gameState.currentLevel || 'level_001'
  });

  engine.start();
}

// Bind des événements de menu
function bindMenuEvents(engine) {
  // Title screen
  elements.titleScreen?.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'start':
          menuManager.show('characterSelect');
          break;
        case 'continue':
          // TODO
          break;
        case 'options':
          // TODO
          break;
      }
    });
  });

  // Character select
  elements.characterSelect?.querySelectorAll('.character-card').forEach(card => {
    card.addEventListener('click', () => {
      const character = card.dataset.character;
      gameState.selectedCharacter = character;
      startGame(engine);
    });
  });

  elements.characterSelect?.querySelector('[data-action="back"]')?.addEventListener('click', () => {
    menuManager.show('titleScreen');
  });

  // Pause menu
  elements.pauseMenu?.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'resume':
          menuManager.hide('pauseMenu');
          engine.resume();
          break;
        case 'options':
          // TODO
          break;
        case 'quit':
          engine.stop();
          elements.gameContainer.classList.add('hidden');
          menuManager.show('titleScreen');
          break;
      }
    });
  });

  // Raccourci clavier pour pause
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && engine.isRunning) {
      if (menuManager.current === 'pauseMenu') {
        menuManager.hide('pauseMenu');
        engine.resume();
      } else {
        engine.pause();
        menuManager.show('pauseMenu');
      }
    }
  });
}

// Lancer l'initialisation
document.addEventListener('DOMContentLoaded', init);
