/**
 * Point d'entrée BackOffice - Game 2.5D
 */

import { SpriteLoader, Assets } from '/shared/components/loaders/SpriteLoader.js';
import { AssetStore } from '/shared/components/storage/AssetStore.js';

// État de l'application
const state = {
  assets: [],
  selectedAsset: null,
  filters: {
    search: '',
    category: '',
    theme: '',
    mode: ''
  },
  viewMode: 'grid',
  pendingImports: []
};

// Éléments DOM
const elements = {
  assetGrid: document.getElementById('asset-grid'),
  detailPanel: document.getElementById('detail-panel'),
  searchInput: document.getElementById('search-input'),
  filterCategory: document.getElementById('filter-category'),
  filterTheme: document.getElementById('filter-theme'),
  filterMode: document.getElementById('filter-mode'),
  importModal: document.getElementById('import-modal'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  importPreview: document.getElementById('import-preview'),
  btnConfirmImport: document.getElementById('btn-confirm-import')
};

// Initialisation
async function init() {
  console.log('📁 BackOffice - Initialisation...');

  // Migration depuis localStorage si nécessaire
  await AssetStore.migrateFromLocalStorage();

  // Charger les assets depuis IndexedDB
  await loadAssets();

  // Précharger les sprites via SpriteLoader
  await preloadSprites();

  // Bind des événements
  bindEvents();

  // Rendu initial
  renderAssetGrid();

  console.log('✅ BackOffice - Prêt!');
  console.log(`📊 ${SpriteLoader.count()} sprites préchargés dans Assets`);
}

// Précharger les sprites existants via SpriteLoader
async function preloadSprites() {
  const imagesToLoad = {};

  // Construire la liste des images à charger depuis state.assets
  state.assets.forEach(asset => {
    if (asset.dataUrl || asset.file) {
      imagesToLoad[asset.id] = asset.dataUrl || `/assets/sprites/${asset.file}`;
    }
  });

  if (Object.keys(imagesToLoad).length > 0) {
    try {
      await SpriteLoader.loadImages(imagesToLoad);
    } catch (error) {
      console.warn('⚠️ Certains sprites n\'ont pas pu être chargés');
    }
  }
}

// Charger un nouveau sprite via SpriteLoader
async function loadSpriteToAssets(asset) {
  const url = asset.dataUrl || `/assets/sprites/${asset.file}`;
  try {
    await SpriteLoader.loadImage(asset.id, url);
    return true;
  } catch (error) {
    console.error(`Erreur chargement sprite ${asset.name}:`, error);
    return false;
  }
}

// Chargement des assets depuis IndexedDB
async function loadAssets() {
  try {
    state.assets = await AssetStore.getAll();
  } catch (e) {
    console.error('Erreur chargement assets:', e);
    state.assets = [];
  }
}

// Sauvegarde d'un asset dans IndexedDB
async function saveAsset(asset) {
  try {
    await AssetStore.put(asset);
  } catch (e) {
    console.error('Erreur sauvegarde asset:', e);
  }
}

// Sauvegarde de plusieurs assets
async function saveAssets(assets) {
  try {
    await AssetStore.putMany(assets);
  } catch (e) {
    console.error('Erreur sauvegarde assets:', e);
  }
}

// Filtrage des assets
function getFilteredAssets() {
  return state.assets.filter(asset => {
    const { search, category, theme, mode } = state.filters;

    if (search && !asset.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (category && asset.category !== category) {
      return false;
    }
    if (theme && asset.theme !== theme) {
      return false;
    }
    if (mode && !asset.modes?.includes(mode)) {
      return false;
    }

    return true;
  });
}

// Rendu de la grille
function renderAssetGrid() {
  const filtered = getFilteredAssets();

  if (filtered.length === 0) {
    elements.assetGrid.innerHTML = `
      <div class="asset-grid__empty">
        <p>Aucun asset</p>
        <p class="text-muted text-sm">
          ${state.assets.length === 0
            ? 'Importez des sprites pour commencer'
            : 'Aucun résultat pour ces filtres'}
        </p>
      </div>
    `;
    return;
  }

  elements.assetGrid.innerHTML = filtered.map(asset => `
    <div class="asset-card ${asset.id === state.selectedAsset?.id ? 'asset-card--selected' : ''}"
         data-asset-id="${asset.id}">
      <div class="asset-card__preview">
        <img src="${asset.dataUrl || asset.file}" alt="${asset.name}">
      </div>
      <div class="asset-card__info">
        <p class="asset-card__name">${asset.name}</p>
        <p class="asset-card__meta">
          <span>${asset.category}</span>
          <span>•</span>
          <span>${asset.theme}</span>
        </p>
      </div>
    </div>
  `).join('');

  // Bind click events
  elements.assetGrid.querySelectorAll('.asset-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.assetId;
      selectAsset(id);
    });
  });
}

// Sélection d'un asset
function selectAsset(id) {
  const asset = state.assets.find(a => a.id === id);
  state.selectedAsset = asset;

  // Update grid
  elements.assetGrid.querySelectorAll('.asset-card').forEach(card => {
    card.classList.toggle('asset-card--selected', card.dataset.assetId === id);
  });

  // Update detail panel
  if (asset) {
    elements.detailPanel.classList.remove('hidden');
    document.getElementById('detail-preview').innerHTML = `
      <img src="${asset.dataUrl || asset.file}" alt="${asset.name}">
    `;
    document.getElementById('detail-name').value = asset.name;
    document.getElementById('detail-category').value = asset.category;
    document.getElementById('detail-theme').value = asset.theme;
    document.getElementById('detail-tags').value = asset.tags?.join(', ') || '';
    document.getElementById('detail-dimensions').textContent =
      `${asset.width} × ${asset.height} px`;

    // Modes checkboxes
    document.querySelectorAll('.checkbox-group input').forEach(cb => {
      cb.checked = asset.modes?.includes(cb.value) || false;
    });
  }
}

// Bind des événements
function bindEvents() {
  // Navigation sidebar
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;

      document.querySelectorAll('.sidebar__link').forEach(l =>
        l.classList.remove('sidebar__link--active'));
      link.classList.add('sidebar__link--active');

      if (view === 'import') {
        openImportModal();
      }
    });
  });

  // Filtres
  elements.searchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderAssetGrid();
  });

  elements.filterCategory.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    renderAssetGrid();
  });

  elements.filterTheme.addEventListener('change', (e) => {
    state.filters.theme = e.target.value;
    renderAssetGrid();
  });

  elements.filterMode.addEventListener('change', (e) => {
    state.filters.mode = e.target.value;
    renderAssetGrid();
  });

  // View mode
  document.querySelectorAll('[data-view-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.viewMode = btn.dataset.viewMode;
      document.querySelectorAll('[data-view-mode]').forEach(b =>
        b.classList.remove('btn-icon--active'));
      btn.classList.add('btn-icon--active');
      elements.assetGrid.classList.toggle('asset-grid--list', state.viewMode === 'list');
    });
  });

  // Detail panel
  document.getElementById('close-detail')?.addEventListener('click', () => {
    elements.detailPanel.classList.add('hidden');
    state.selectedAsset = null;
    renderAssetGrid();
  });

  document.getElementById('btn-save-detail')?.addEventListener('click', saveAssetDetails);
  document.getElementById('btn-delete-detail')?.addEventListener('click', deleteSelectedAsset);

  // Import modal
  elements.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('drop-zone--active');
  });

  elements.dropZone.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('drop-zone--active');
  });

  elements.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('drop-zone--active');
    handleFiles(e.dataTransfer.files);
  });

  document.getElementById('btn-browse')?.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  elements.btnConfirmImport.addEventListener('click', confirmImport);

  // Modal close
  document.querySelectorAll('.modal__close, .modal__overlay').forEach(el => {
    el.addEventListener('click', closeModals);
  });

  // Theme toggle
  document.getElementById('btn-theme')?.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.dataset.theme;
    html.dataset.theme = current === 'dark' ? 'light' : 'dark';
  });
}

// Ouvrir modal import
function openImportModal() {
  elements.importModal.classList.remove('hidden');
  state.pendingImports = [];
  elements.importPreview.innerHTML = '';
  elements.btnConfirmImport.disabled = true;
}

// Fermer modals
function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// Gestion des fichiers
async function handleFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;

      // Obtenir les dimensions
      const img = new Image();
      img.onload = () => {
        const asset = {
          id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          file: file.name,
          dataUrl: dataUrl,
          width: img.width,
          height: img.height,
          category: 'decor',
          theme: 'forest',
          modes: ['forward'],
          tags: []
        };

        state.pendingImports.push(asset);
        renderImportPreview();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }
}

// Rendu preview import
function renderImportPreview() {
  elements.importPreview.innerHTML = state.pendingImports.map((asset, index) => `
    <div class="import-preview__item">
      <img src="${asset.dataUrl}" alt="${asset.name}">
      <button class="import-preview__item-remove" data-index="${index}">✕</button>
    </div>
  `).join('');

  // Bind remove buttons
  elements.importPreview.querySelectorAll('.import-preview__item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      state.pendingImports.splice(index, 1);
      renderImportPreview();
    });
  });

  elements.btnConfirmImport.disabled = state.pendingImports.length === 0;
}

// Confirmer import
async function confirmImport() {
  // Charger chaque sprite dans le SpriteLoader
  for (const asset of state.pendingImports) {
    await loadSpriteToAssets(asset);
  }

  // Sauvegarder dans IndexedDB
  await saveAssets(state.pendingImports);

  // Mettre à jour l'état local
  state.assets.push(...state.pendingImports);
  renderAssetGrid();
  closeModals();

  console.log(`✅ ${state.pendingImports.length} assets importés et chargés dans Assets`);
}

// Sauvegarder détails asset
async function saveAssetDetails() {
  if (!state.selectedAsset) return;

  const asset = state.assets.find(a => a.id === state.selectedAsset.id);
  if (!asset) return;

  asset.name = document.getElementById('detail-name').value;
  asset.category = document.getElementById('detail-category').value;
  asset.theme = document.getElementById('detail-theme').value;
  asset.tags = document.getElementById('detail-tags').value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  asset.modes = [];
  document.querySelectorAll('.checkbox-group input:checked').forEach(cb => {
    asset.modes.push(cb.value);
  });

  await saveAsset(asset);
  renderAssetGrid();

  console.log('✅ Asset sauvegardé');
}

// Supprimer asset
async function deleteSelectedAsset() {
  if (!state.selectedAsset) return;

  if (!confirm(`Supprimer "${state.selectedAsset.name}" ?`)) return;

  // Supprimer du SpriteLoader
  SpriteLoader.remove(state.selectedAsset.id);

  // Supprimer de IndexedDB
  await AssetStore.delete(state.selectedAsset.id);

  // Mettre à jour l'état local
  state.assets = state.assets.filter(a => a.id !== state.selectedAsset.id);
  state.selectedAsset = null;
  elements.detailPanel.classList.add('hidden');

  renderAssetGrid();

  console.log('🗑️ Asset supprimé');
}

// Exporter globalement pour le debug
window.Assets = Assets;
window.SpriteLoader = SpriteLoader;
window.AssetStore = AssetStore;

// Lancer l'initialisation
document.addEventListener('DOMContentLoaded', init);
