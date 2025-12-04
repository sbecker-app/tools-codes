/**
 * Point d'entrée Stage Maker - Game 2.5D
 */

// État de l'application
const state = {
  currentTool: 'select',
  currentMode: 'forward',
  currentLayer: 1,
  currentView: 'macro',
  gridSize: 32,
  gridSnap: true,
  gridShow: true,
  zoom: 1,

  level: {
    id: null,
    name: 'Niveau sans titre',
    zones: [],
    spawn: null
  },

  selection: null,
  history: [],
  historyIndex: -1,

  // Canvas state
  isPanning: false,
  isDragging: false,
  dragStart: null,
  panOffset: { x: 0, y: 0 }
};

// Éléments DOM
const elements = {
  linearView: document.getElementById('linear-view'),
  linearTimeline: document.getElementById('linear-timeline'),
  addZoneBtn: document.getElementById('add-zone-btn'),
  microCanvas: document.getElementById('micro-canvas'),
  macroView: document.getElementById('macro-view'),
  microView: document.getElementById('micro-view'),
  levelName: document.getElementById('level-name'),
  statusPosition: document.getElementById('status-position'),
  statusSelection: document.getElementById('status-selection'),
  statusZones: document.getElementById('status-zones'),
  exportModal: document.getElementById('export-modal'),
  exportPreview: document.getElementById('export-preview')
};

// Contexte canvas (micro view uniquement)
let microCtx;

// Couleurs et icônes des modes
const MODE_CONFIG = {
  forward: { color: '#4a90d9', icon: '→', label: 'Avancer' },
  backward: { color: '#f39c12', icon: '←', label: 'Reculer' },
  up: { color: '#2ecc71', icon: '↑', label: 'Monter' },
  down: { color: '#e74c3c', icon: '↓', label: 'Descendre' }
};

// Initialisation
function init() {
  console.log('🎨 Stage Maker - Initialisation...');

  microCtx = elements.microCanvas.getContext('2d');

  // Bind événements
  bindEvents();

  // Rendu initial
  renderLinearView();

  // Charger assets depuis BackOffice
  loadAssetsFromBackOffice();

  console.log('✅ Stage Maker - Prêt!');
}

// Charger assets depuis localStorage (partagé avec BackOffice)
function loadAssetsFromBackOffice() {
  const saved = localStorage.getItem('game25d_assets');
  if (saved) {
    try {
      const assets = JSON.parse(saved);
      renderAssetPicker(assets);
    } catch (e) {
      console.error('Erreur chargement assets:', e);
    }
  }
}

// Rendu du sélecteur d'assets
function renderAssetPicker(assets) {
  const grid = document.getElementById('asset-picker-grid');
  if (!grid) return;

  if (assets.length === 0) {
    grid.innerHTML = `
      <p class="text-muted text-sm text-center p-md" style="grid-column: 1/-1">
        Importez des assets depuis le BackOffice
      </p>
    `;
    return;
  }

  grid.innerHTML = assets.map(asset => `
    <div class="asset-picker-item" data-asset-id="${asset.id}">
      <img src="${asset.dataUrl || asset.file}" alt="${asset.name}">
    </div>
  `).join('');
}

// Bind des événements
function bindEvents() {
  // Outils
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentTool = btn.dataset.tool;
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('tool-btn--active'));
      btn.classList.add('tool-btn--active');
    });
  });

  // Modes
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentMode = btn.dataset.mode;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('mode-btn--active'));
      btn.classList.add('mode-btn--active');
    });
  });

  // Zone blocks drag & drop
  bindZoneBlocksDragDrop();

  // Vues (Macro/Micro)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentView = btn.dataset.view;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
      btn.classList.add('tab-btn--active');

      elements.macroView.classList.toggle('hidden', state.currentView !== 'macro');
      elements.microView.classList.toggle('hidden', state.currentView !== 'micro');

      // Afficher/cacher le picker d'assets
      document.getElementById('asset-picker')?.classList.toggle('hidden', state.currentView !== 'micro');

      if (state.currentView === 'macro') {
        renderLinearView();
      } else {
        renderMicro();
      }
    });
  });

  // Layer select
  document.getElementById('layer-select')?.addEventListener('change', (e) => {
    state.currentLayer = parseInt(e.target.value);
  });

  // Grid options
  document.getElementById('grid-snap')?.addEventListener('change', (e) => {
    state.gridSnap = e.target.checked;
  });

  document.getElementById('grid-show')?.addEventListener('change', (e) => {
    state.gridShow = e.target.checked;
  });

  document.getElementById('grid-size')?.addEventListener('change', (e) => {
    state.gridSize = parseInt(e.target.value);
  });

  // Level name
  elements.levelName?.addEventListener('input', (e) => {
    state.level.name = e.target.value;
  });

  // Undo/Redo
  document.getElementById('btn-undo')?.addEventListener('click', undo);
  document.getElementById('btn-redo')?.addEventListener('click', redo);

  // Export
  document.getElementById('btn-export')?.addEventListener('click', openExportModal);
  document.getElementById('btn-download-json')?.addEventListener('click', downloadJSON);
  document.getElementById('btn-copy-json')?.addEventListener('click', copyJSON);

  // Modal close
  document.querySelectorAll('.modal__close, .modal__overlay').forEach(el => {
    el.addEventListener('click', closeModals);
  });

  // Add zone button click
  elements.addZoneBtn?.addEventListener('click', () => {
    createZone({ mode: state.currentMode });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);
}


function handleKeyDown(e) {
  // Shortcuts
  if (e.key === 'v') selectTool('select');
  if (e.key === 'z' && !e.ctrlKey && !e.metaKey) selectTool('zone');
  if (e.key === 't') selectTool('transition');
  if (e.key === 's' && !e.ctrlKey && !e.metaKey) selectTool('sprite');
  if (e.key === 'e') selectTool('erase');

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.selection) {
      deleteZone(state.selection.id);
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  }
}

function selectTool(tool) {
  state.currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => {
    b.classList.toggle('tool-btn--active', b.dataset.tool === tool);
  });
}

// Drag & Drop des blocs de zone (depuis la sidebar vers la timeline)
function bindZoneBlocksDragDrop() {
  const zoneBlocks = document.querySelectorAll('.zone-block');
  const timeline = elements.linearTimeline;
  const addZoneBtn = elements.addZoneBtn;

  // Drag start sur les blocs de la sidebar
  zoneBlocks.forEach(block => {
    block.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('zone-mode', block.dataset.mode);
      e.dataTransfer.setData('drag-type', 'new-zone');
      e.dataTransfer.effectAllowed = 'copy';
      block.classList.add('zone-block--dragging');
    });

    block.addEventListener('dragend', () => {
      block.classList.remove('zone-block--dragging');
    });
  });

  // Drop zone (le bouton + à la fin)
  addZoneBtn?.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    addZoneBtn.classList.add('linear-drop-zone--active');
  });

  addZoneBtn?.addEventListener('dragleave', () => {
    addZoneBtn.classList.remove('linear-drop-zone--active');
  });

  addZoneBtn?.addEventListener('drop', (e) => {
    e.preventDefault();
    addZoneBtn.classList.remove('linear-drop-zone--active');

    const mode = e.dataTransfer.getData('zone-mode');
    const dragType = e.dataTransfer.getData('drag-type');

    if (dragType === 'new-zone' && mode) {
      createZone({ mode });
      console.log(`🎯 Zone ${mode} créée par drag & drop`);
    }
  });

  // Permettre le drop sur la timeline pour insérer
  timeline?.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragType = e.dataTransfer.types.includes('zone-id') ? 'reorder' : 'copy';
    e.dataTransfer.dropEffect = dragType === 'reorder' ? 'move' : 'copy';
  });

  timeline?.addEventListener('drop', (e) => {
    e.preventDefault();
    const zoneId = e.dataTransfer.getData('zone-id');
    const mode = e.dataTransfer.getData('zone-mode');
    const dragType = e.dataTransfer.getData('drag-type');

    // Si on déplace une zone existante
    if (dragType === 'reorder' && zoneId) {
      const dropTarget = e.target.closest('.linear-zone');
      if (dropTarget) {
        const targetId = dropTarget.dataset.zoneId;
        reorderZone(zoneId, targetId);
      }
    }
  });
}

// Gestion des zones
function createZone({ mode, length = 100, insertAt = -1 }) {
  const zone = {
    id: `zone_${Date.now()}`,
    mode,
    length, // Longueur visuelle de la zone (pour l'étirement)
    parallax: { layers: [] },
    sprites: [],
    transitions: []
  };

  saveToHistory();

  if (insertAt >= 0 && insertAt < state.level.zones.length) {
    state.level.zones.splice(insertAt, 0, zone);
  } else {
    state.level.zones.push(zone);
  }

  selectZone(zone);
  updateStatus();
  renderLinearView();

  console.log('✅ Zone créée:', zone.id);
}

// Réorganiser les zones (drag & drop)
function reorderZone(draggedId, targetId) {
  const zones = state.level.zones;
  const draggedIndex = zones.findIndex(z => z.id === draggedId);
  const targetIndex = zones.findIndex(z => z.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

  saveToHistory();

  const [draggedZone] = zones.splice(draggedIndex, 1);
  zones.splice(targetIndex, 0, draggedZone);

  renderLinearView();
  console.log(`🔄 Zone ${draggedId} déplacée vers position ${targetIndex}`);
}

// Redimensionner une zone
function resizeZone(zoneId, newLength) {
  const zone = state.level.zones.find(z => z.id === zoneId);
  if (!zone) return;

  saveToHistory();
  zone.length = Math.max(60, Math.min(400, newLength)); // Min 60px, max 400px
  renderLinearView();
}

function findZoneById(id) {
  return state.level.zones.find(z => z.id === id);
}

function selectZone(zone) {
  state.selection = zone;

  if (zone) {
    document.getElementById('zone-id').value = zone.id;
    document.getElementById('zone-mode').value = zone.mode;
    // Masquer les champs position (non pertinents en vue linéaire)
    document.getElementById('zone-x').value = '-';
    document.getElementById('zone-y').value = '-';
    document.getElementById('zone-width').value = zone.length || 100;
    document.getElementById('zone-height').value = '-';
    elements.statusSelection.textContent = `Sélection: ${zone.id}`;
  } else {
    elements.statusSelection.textContent = 'Aucune sélection';
  }

  renderLinearView();
}

function deleteZone(id) {
  saveToHistory();
  state.level.zones = state.level.zones.filter(z => z.id !== id);
  state.selection = null;
  updateStatus();
  renderLinearView();
}

// History (Undo/Redo)
function saveToHistory() {
  // Supprimer les états après l'index actuel
  state.history = state.history.slice(0, state.historyIndex + 1);

  // Ajouter l'état actuel
  state.history.push(JSON.stringify(state.level));
  state.historyIndex = state.history.length - 1;

  // Limiter la taille
  if (state.history.length > 50) {
    state.history.shift();
    state.historyIndex--;
  }

  updateHistoryButtons();
}

function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.level = JSON.parse(state.history[state.historyIndex]);
    state.selection = null;
    updateHistoryButtons();
    updateStatus();
    renderLinearView();
  }
}

function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    state.level = JSON.parse(state.history[state.historyIndex]);
    state.selection = null;
    updateHistoryButtons();
    updateStatus();
    renderLinearView();
  }
}

function updateHistoryButtons() {
  document.getElementById('btn-undo').disabled = state.historyIndex <= 0;
  document.getElementById('btn-redo').disabled = state.historyIndex >= state.history.length - 1;
}

// UI Updates
function updateStatus() {
  elements.statusZones.textContent = `Zones: ${state.level.zones.length}`;
}

// Rendu de la vue linéaire (timeline)
function renderLinearView() {
  const timeline = elements.linearTimeline;
  if (!timeline) return;

  // Nettoyer (garder le bouton +)
  const addBtn = elements.addZoneBtn;
  timeline.innerHTML = '';

  if (state.level.zones.length === 0) {
    // État vide
    const emptyState = document.createElement('div');
    emptyState.className = 'linear-empty';
    emptyState.innerHTML = `
      <span class="linear-empty__icon">📦</span>
      <span class="linear-empty__text">Glissez un bloc de zone ici pour commencer</span>
    `;
    timeline.appendChild(emptyState);
  } else {
    // Rendu des zones
    state.level.zones.forEach((zone, index) => {
      // Ajouter connecteur avant (sauf pour la première)
      if (index > 0) {
        const connector = document.createElement('div');
        connector.className = 'linear-connector';
        timeline.appendChild(connector);
      }

      // Créer l'élément zone
      const zoneEl = createLinearZoneElement(zone);
      timeline.appendChild(zoneEl);
    });
  }

  // Remettre le bouton + à la fin
  if (addBtn) {
    if (state.level.zones.length > 0) {
      const connector = document.createElement('div');
      connector.className = 'linear-connector';
      timeline.appendChild(connector);
    }
    timeline.appendChild(addBtn);
  }

  updateStatus();
}

// Créer un élément DOM pour une zone dans la timeline
function createLinearZoneElement(zone) {
  const config = MODE_CONFIG[zone.mode];
  const isSelected = state.selection?.id === zone.id;

  const el = document.createElement('div');
  el.className = `linear-zone linear-zone--${zone.mode}${isSelected ? ' linear-zone--selected' : ''}`;
  el.dataset.zoneId = zone.id;
  el.draggable = true;
  el.style.minWidth = `${zone.length || 100}px`;

  el.innerHTML = `
    <span class="linear-zone__icon">${config.icon}</span>
    <span class="linear-zone__label">${config.label}</span>
    <span class="linear-zone__id">${zone.id.replace('zone_', '#')}</span>
    <div class="linear-zone__resize-handle" data-zone-id="${zone.id}"></div>
  `;

  // Click pour sélectionner
  el.addEventListener('click', (e) => {
    if (!e.target.classList.contains('linear-zone__resize-handle')) {
      selectZone(zone);
    }
  });

  // Drag pour réorganiser
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('zone-id', zone.id);
    e.dataTransfer.setData('drag-type', 'reorder');
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('linear-zone--dragging');
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('linear-zone--dragging');
  });

  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.classList.add('linear-zone--drop-target');
  });

  el.addEventListener('dragleave', () => {
    el.classList.remove('linear-zone--drop-target');
  });

  el.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('linear-zone--drop-target');

    const draggedId = e.dataTransfer.getData('zone-id');
    const dragType = e.dataTransfer.getData('drag-type');

    if (dragType === 'reorder' && draggedId && draggedId !== zone.id) {
      reorderZone(draggedId, zone.id);
    }
  });

  // Resize avec la poignée
  const resizeHandle = el.querySelector('.linear-zone__resize-handle');
  if (resizeHandle) {
    let startX, startWidth;

    resizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startX = e.clientX;
      startWidth = zone.length || 100;

      const onMouseMove = (e) => {
        const delta = e.clientX - startX;
        const newWidth = startWidth + delta;
        el.style.minWidth = `${Math.max(60, Math.min(400, newWidth))}px`;
      };

      const onMouseUp = (e) => {
        const delta = e.clientX - startX;
        resizeZone(zone.id, startWidth + delta);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  return el;
}

function renderMicro() {
  const canvas = elements.microCanvas;
  const ctx = microCtx;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // TODO: Implémenter le rendu micro (sprites, parallaxe)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Vue Micro - Sélectionnez une zone', canvas.width / 2, canvas.height / 2);
}

// Export
function openExportModal() {
  const levelData = generateLevelJSON();
  elements.exportPreview.textContent = JSON.stringify(levelData, null, 2);
  elements.exportModal.classList.remove('hidden');
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function generateLevelJSON() {
  return {
    version: '1.0',
    id: state.level.id || `level_${Date.now()}`,
    meta: {
      name: state.level.name,
      createdAt: new Date().toISOString()
    },
    // Séquence linéaire des zones
    sequence: state.level.zones.map((zone, index) => ({
      id: zone.id,
      order: index,
      mode: zone.mode.toUpperCase(),
      length: zone.length || 100,
      parallax: zone.parallax,
      sprites: zone.sprites,
      transitions: zone.transitions
    })),
    spawn: state.level.spawn || {
      zoneId: state.level.zones[0]?.id || null,
      position: { x: 100, y: 100 }
    }
  };
}

function downloadJSON() {
  const data = generateLevelJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = document.getElementById('export-filename').value || 'level.json';
  a.click();

  URL.revokeObjectURL(url);
  closeModals();
}

function copyJSON() {
  const data = generateLevelJSON();
  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  alert('JSON copié !');
}

// Init au chargement
document.addEventListener('DOMContentLoaded', init);
