# Spécifications - BackOffice (Gestion des Assets)

## Vue d'ensemble

Le **BackOffice** est l'outil de gestion des assets (sprites, backgrounds, sons) du projet Game 2.5D. Il permet d'importer, organiser, prévisualiser et exporter les ressources graphiques et sonores utilisées dans le jeu.

---

## 1. Architecture de l'Interface

### 1.1 Layout principal

```
┌─────────────────────────────────────────────────────────────────┐
│                         Header                                   │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│ Sidebar  │              Assets Grid                             │
│ (Filtres)│                                                      │
│          │                                                      │
│          ├──────────────────────────────────────────────────────┤
│          │              Upload Zone                             │
└──────────┴──────────────────────────────────────────────────────┘
```

### 1.2 Dimensions
| Zone | Largeur | Description |
|------|---------|-------------|
| Sidebar | 200px | Filtres et catégories |
| Main Content | Flexible | Grille et upload |

---

## 2. Header

### 2.1 Éléments
- **Titre** : "BackOffice - Assets"
- **Recherche** : Champ de recherche global
- **Actions** : Import multiple, Export all

### 2.2 Recherche

| Paramètre | Description |
|-----------|-------------|
| Placeholder | "Rechercher un asset..." |
| Debounce | 300ms |
| Critères | Nom, catégorie, tags |

---

## 3. Sidebar

### 3.1 Catégories d'assets

| Catégorie | Icône | Extensions acceptées |
|-----------|-------|---------------------|
| Sprites | 🖼 | .png, .gif, .webp |
| Backgrounds | 🏞 | .png, .jpg, .webp |
| Tilesets | 🧱 | .png |
| Characters | 👤 | .png, .gif |
| Audio | 🔊 | .mp3, .wav, .ogg |
| UI | 🎨 | .png, .svg |

### 3.2 Filtres

| Filtre | Type | Options |
|--------|------|---------|
| Catégorie | Checkbox | Toutes les catégories |
| Taille | Range | Petit / Moyen / Grand |
| Date | Select | Récent / Cette semaine / Ce mois |

### 3.3 Statistiques

```
Total: 45 assets
├── Sprites: 20
├── Backgrounds: 10
├── Characters: 8
└── Audio: 7
```

---

## 4. Zone d'Upload

### 4.1 Interface

```html
<div class="drop-zone">
  <span class="drop-zone__icon">📁</span>
  <span class="drop-zone__text">Glissez vos fichiers ici</span>
  <span class="drop-zone__hint">ou cliquez pour sélectionner</span>
</div>
```

### 4.2 Comportement

| État | Style | Message |
|------|-------|---------|
| Normal | Border dashed | "Glissez vos fichiers ici" |
| Hover | Border solid, bg highlight | "Relâchez pour importer" |
| Processing | Loading spinner | "Import en cours..." |
| Success | ✓ vert | "X fichiers importés" |
| Error | ✗ rouge | "Erreur: format non supporté" |

### 4.3 Validation des fichiers

```javascript
const ALLOWED_TYPES = {
  image: ['image/png', 'image/gif', 'image/jpeg', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

### 4.4 Processus d'import

1. Validation du type MIME
2. Validation de la taille
3. Lecture en base64 (FileReader)
4. Extraction des métadonnées (dimensions pour images)
5. Génération de l'ID unique
6. Sauvegarde dans localStorage
7. Mise à jour de la grille

---

## 5. Grille des Assets

### 5.1 Structure d'un asset card

```html
<div class="asset-card" data-asset-id="asset_123">
  <div class="asset-card__preview">
    <img src="..." alt="Nom de l'asset">
  </div>
  <div class="asset-card__info">
    <span class="asset-card__name">hero_sprite.png</span>
    <span class="asset-card__meta">64x64 • Sprite</span>
  </div>
  <div class="asset-card__actions">
    <button data-action="edit">✏️</button>
    <button data-action="delete">🗑</button>
  </div>
</div>
```

### 5.2 Modes d'affichage

| Mode | Description | Taille carte |
|------|-------------|--------------|
| Grid | Grille compacte | 120x120px |
| Large | Grandes previews | 200x200px |
| List | Liste détaillée | 100% width |

### 5.3 Tri

| Option | Ordre |
|--------|-------|
| Nom | A-Z / Z-A |
| Date | Récent d'abord / Ancien d'abord |
| Taille | Grand d'abord / Petit d'abord |
| Catégorie | Groupé par catégorie |

---

## 6. Panneau de Détails

### 6.1 Informations affichées

Quand un asset est sélectionné :

| Champ | Type | Éditable |
|-------|------|----------|
| Aperçu | Image | Non |
| Nom | Text | Oui |
| Catégorie | Select | Oui |
| Dimensions | Text | Non |
| Taille fichier | Text | Non |
| Date d'import | Date | Non |
| Tags | Tags input | Oui |

### 6.2 Actions

| Bouton | Action |
|--------|--------|
| Renommer | Édite le nom |
| Dupliquer | Crée une copie |
| Télécharger | Download le fichier original |
| Supprimer | Supprime avec confirmation |

---

## 7. Structure de Données

### 7.1 Format d'un asset

```javascript
asset = {
  id: 'asset_1234567890',
  name: 'hero_idle',
  originalName: 'hero_idle.png',
  category: 'sprite',        // sprite | background | tileset | character | audio | ui
  type: 'image/png',
  dataUrl: 'data:image/png;base64,...',
  width: 64,                 // Pour images
  height: 64,                // Pour images
  duration: null,            // Pour audio (en secondes)
  size: 2048,                // Taille en bytes
  tags: ['hero', 'idle', 'animation'],
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z'
}
```

### 7.2 Stockage

```javascript
// Clé localStorage
const STORAGE_KEY = 'game25d_assets';

// Sauvegarde
function saveAssets(assets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

// Chargement
function loadAssets() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
```

---

## 8. CRUD des Assets

### 8.1 Create (Import)

```javascript
async function importAsset(file) {
  // Validation
  if (!isValidFile(file)) throw new Error('Invalid file');

  // Lecture
  const dataUrl = await readAsDataURL(file);

  // Métadonnées
  const dimensions = await getImageDimensions(dataUrl);

  // Création
  const asset = {
    id: `asset_${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, ''),
    originalName: file.name,
    category: detectCategory(file),
    type: file.type,
    dataUrl,
    width: dimensions?.width,
    height: dimensions?.height,
    size: file.size,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Sauvegarde
  const assets = loadAssets();
  assets.push(asset);
  saveAssets(assets);

  return asset;
}
```

### 8.2 Read

```javascript
function getAsset(id) {
  const assets = loadAssets();
  return assets.find(a => a.id === id);
}

function getAssetsByCategory(category) {
  const assets = loadAssets();
  return assets.filter(a => a.category === category);
}

function searchAssets(query) {
  const assets = loadAssets();
  const q = query.toLowerCase();
  return assets.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q))
  );
}
```

### 8.3 Update

```javascript
function updateAsset(id, updates) {
  const assets = loadAssets();
  const index = assets.findIndex(a => a.id === id);

  if (index === -1) throw new Error('Asset not found');

  assets[index] = {
    ...assets[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveAssets(assets);
  return assets[index];
}
```

### 8.4 Delete

```javascript
function deleteAsset(id) {
  const assets = loadAssets();
  const filtered = assets.filter(a => a.id !== id);
  saveAssets(filtered);
}

function deleteMultiple(ids) {
  const assets = loadAssets();
  const filtered = assets.filter(a => !ids.includes(a.id));
  saveAssets(filtered);
}
```

---

## 9. Intégration avec Stage Maker

### 9.1 Partage des données

Le Stage Maker lit les assets depuis le même localStorage :

```javascript
// Dans Stage Maker
function loadAssetsFromBackOffice() {
  const saved = localStorage.getItem('game25d_assets');
  if (saved) {
    const assets = JSON.parse(saved);
    renderAssetPicker(assets);
  }
}
```

### 9.2 Synchronisation

- Pas de sync temps réel (localStorage)
- Le Stage Maker recharge au démarrage
- Bouton "Rafraîchir" dans le picker d'assets

---

## 10. Export

### 10.1 Export individuel

Télécharge l'asset original (depuis dataUrl).

### 10.2 Export multiple

```javascript
function exportAssets(ids) {
  const assets = loadAssets().filter(a => ids.includes(a.id));

  // Créer un ZIP avec les fichiers
  // (nécessite une lib comme JSZip)
}
```

### 10.3 Export JSON (métadonnées)

```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:00:00.000Z",
  "assets": [
    {
      "id": "asset_123",
      "name": "hero_sprite",
      "category": "sprite",
      "width": 64,
      "height": 64,
      "file": "hero_sprite.png"
    }
  ]
}
```

---

## 11. Interface Utilisateur

### 11.1 États de l'interface

| État | Affichage |
|------|-----------|
| Chargement | Skeleton loaders |
| Vide | Message + illustration |
| Normal | Grille d'assets |
| Recherche vide | "Aucun résultat" |
| Erreur | Message d'erreur |

### 11.2 Notifications

| Type | Style | Durée |
|------|-------|-------|
| Success | Vert | 3s |
| Warning | Orange | 5s |
| Error | Rouge | Permanent (clic pour fermer) |
| Info | Bleu | 3s |

---

## 12. Performances

### 12.1 Optimisations

| Technique | Description |
|-----------|-------------|
| Lazy loading | Images chargées au scroll |
| Thumbnails | Previews compressées |
| Pagination | 50 assets par page max |
| Debounce | Recherche avec délai |

### 12.2 Limites

| Paramètre | Limite |
|-----------|--------|
| Taille max fichier | 5MB |
| Nombre max assets | ~500 (limite localStorage ~5MB) |
| Dimensions max image | 4096x4096 |

---

## 13. Accessibilité

### 13.1 Navigation clavier

| Touche | Action |
|--------|--------|
| `Tab` | Navigation entre éléments |
| `Enter` | Sélectionner/Ouvrir |
| `Delete` | Supprimer sélection |
| `Ctrl+A` | Tout sélectionner |
| `Escape` | Désélectionner |

### 13.2 ARIA

- Rôles appropriés sur les éléments
- Labels sur les boutons icônes
- Alt text sur les images
- Annonces pour les actions

---

## 14. Sécurité

### 14.1 Validation

```javascript
function validateFile(file) {
  // Type MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Type de fichier non autorisé');
  }

  // Taille
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Fichier trop volumineux (max 5MB)');
  }

  // Vérification du contenu (magic bytes)
  const header = await readFileHeader(file);
  if (!isValidImageHeader(header)) {
    throw new Error('Fichier corrompu ou invalide');
  }
}
```

### 14.2 Sanitization

- Noms de fichiers nettoyés
- Pas d'exécution de scripts
- Stockage local uniquement
