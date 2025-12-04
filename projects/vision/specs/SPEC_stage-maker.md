# Spécifications - Stage Maker (Éditeur de Niveaux)

## Vue d'ensemble

Le **Stage Maker** est l'outil d'édition de niveaux du projet Game 2.5D. Il permet de créer la structure des niveaux en définissant une séquence de zones de navigation, puis de les décorer avec des sprites et des couches de parallaxe.

---

## 1. Architecture de l'Interface

### 1.1 Layout principal

```
┌─────────────────────────────────────────────────────────────────┐
│                         Header Bar                               │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │                                    │                 │
│ Toolbar  │         Canvas Area                │  Panel          │
│ Left     │    (Macro ou Micro view)           │  Right          │
│          │                                    │                 │
├──────────┴────────────────────────────────────┴─────────────────┤
│                         Status Bar                               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Dimensions
| Zone | Largeur | Description |
|------|---------|-------------|
| Toolbar Left | 200px | Outils et blocs |
| Canvas Area | Flexible | Zone d'édition |
| Panel Right | 280px | Propriétés |
| Status Bar | 100% | 28px hauteur |

---

## 2. Toolbar Gauche

### 2.1 Outils

| Outil | Icône | Raccourci | Description |
|-------|-------|-----------|-------------|
| Select | ⬚ | `V` | Sélectionner et déplacer les zones |
| Zone | ▢ | `Z` | Dessiner une nouvelle zone |
| Transition | ↗ | `T` | Créer un lien entre zones |
| Sprite | 🖼 | `S` | Placer un élément de décor |
| Erase | 🗑 | `E` | Supprimer un élément |

### 2.2 Blocs de Zone (Drag & Drop)

| Mode | Icône | Couleur | Description |
|------|-------|---------|-------------|
| Forward | → | Bleu `#4a90d9` | Zone où le personnage avance |
| Backward | ← | Orange `#f39c12` | Zone où le personnage recule |
| Up | ↑ | Vert `#2ecc71` | Zone d'escalade vers le haut |
| Down | ↓ | Rouge `#e74c3c` | Zone de descente |

#### Comportement Drag & Drop
1. Cliquer-glisser un bloc de la sidebar
2. Le bloc suit le curseur avec opacité réduite
3. Relâcher sur la timeline ou le bouton `+`
4. Une zone est créée avec le mode correspondant

### 2.3 Mode Actif

Boutons pour sélectionner le mode par défaut lors de la création de zones.

### 2.4 Sélecteur de Couche

| Valeur | Nom | Description |
|--------|-----|-------------|
| 0 | Premier plan | Éléments devant le personnage |
| 1 | Sol | Niveau du personnage (par défaut) |
| 2 | Décor proche | Arbres, rochers proches |
| 3 | Décor milieu | Éléments à mi-distance |
| 4 | Arrière-plan proche | Montagnes proches |
| 5 | Arrière-plan lointain | Ciel, nuages |

### 2.5 Options de Grille

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| Magnétisme | Checkbox | ✓ | Snap à la grille |
| Afficher | Checkbox | ✓ | Montrer la grille |
| Taille | Number | 32px | Taille des cellules |

### 2.6 Actions

| Bouton | Raccourci | Description |
|--------|-----------|-------------|
| Annuler | `Ctrl+Z` | Undo dernière action |
| Refaire | `Ctrl+Shift+Z` | Redo action annulée |

---

## 3. Vue Macro (Timeline Linéaire)

### 3.1 Concept

La vue Macro représente le niveau comme une **séquence linéaire de zones**. Chaque zone définit un segment du niveau avec un mode de navigation spécifique.

```
[Zone 1] ──› [Zone 2] ──› [Zone 3] ──› [+]
 FORWARD     BACKWARD      UP
```

### 3.2 Éléments de la Timeline

#### Zone
```html
<div class="linear-zone linear-zone--forward">
  <span class="linear-zone__icon">→</span>
  <span class="linear-zone__label">Avancer</span>
  <span class="linear-zone__id">#123456</span>
  <div class="linear-zone__resize-handle"></div>
</div>
```

#### Connecteur
Ligne horizontale de 40px entre chaque zone.

#### Bouton d'ajout (+)
Zone de drop pour créer de nouvelles zones à la fin.

### 3.3 Interactions

| Action | Comportement |
|--------|--------------|
| Clic sur zone | Sélectionne la zone |
| Double-clic | Édite les propriétés inline |
| Drag zone | Réorganise l'ordre |
| Drag resize handle | Modifie la longueur (60-400px) |
| Suppr/Delete | Supprime la zone sélectionnée |

### 3.4 Structure de données

```javascript
zone = {
  id: 'zone_1234567890',
  mode: 'forward',       // forward | backward | up | down
  length: 100,           // Longueur visuelle (60-400)
  parallax: {
    layers: []
  },
  sprites: [],
  transitions: []
}
```

---

## 4. Vue Micro (Édition de Zone)

### 4.1 Concept

La vue Micro permet d'éditer le contenu d'une zone sélectionnée : placer des sprites, configurer les couches de parallaxe.

### 4.2 Canvas

- Affiche la zone en pleine résolution
- Grille optionnelle
- Zoom et pan

### 4.3 Fonctionnalités (à implémenter)

| Fonctionnalité | Description |
|----------------|-------------|
| Placement sprites | Glisser des assets depuis le picker |
| Multi-sélection | Sélectionner plusieurs sprites |
| Alignement | Outils d'alignement et distribution |
| Couches | Organiser les sprites par profondeur |

---

## 5. Panel Droit

### 5.1 Propriétés de Zone

Affiché quand une zone est sélectionnée.

| Champ | Type | Description |
|-------|------|-------------|
| ID | Text (readonly) | Identifiant unique |
| Mode | Select | forward, backward, up, down |
| Longueur | Number | Taille de la zone |
| Position X | Number | (désactivé en vue linéaire) |
| Position Y | Number | (désactivé en vue linéaire) |

### 5.2 Configuration Parallaxe

Liste des couches de parallaxe avec contrôles de vitesse.

```javascript
layer = {
  depth: 0-5,
  speed: 0.0-1.0,
  images: [],
  offsetY: 0
}
```

### 5.3 Asset Picker (Vue Micro)

- Grille d'assets importés depuis le BackOffice
- Recherche par nom
- Filtrage par catégorie
- Drag & drop vers le canvas

---

## 6. Header Bar

### 6.1 Gauche
- Sélecteur de niveau
- Nom du niveau (éditable)

### 6.2 Centre
- Onglets Vue Macro / Vue Micro

### 6.3 Droite
| Bouton | Action |
|--------|--------|
| ▶ Tester | Lance le niveau dans le jeu |
| 💾 Exporter | Ouvre la modal d'export |

---

## 7. Status Bar

| Info | Format | Description |
|------|--------|-------------|
| Position | `X: 0, Y: 0` | Coordonnées du curseur |
| Sélection | `Sélection: zone_xxx` | Zone sélectionnée |
| Zones | `Zones: 5` | Nombre de zones |

---

## 8. Système d'Export

### 8.1 Modal d'export

| Élément | Description |
|---------|-------------|
| Nom du fichier | Input avec valeur par défaut |
| Aperçu JSON | Preview formatée |
| Copier | Copie dans le presse-papier |
| Télécharger | Télécharge le fichier .json |

### 8.2 Format JSON exporté

```json
{
  "version": "1.0",
  "id": "level_1234567890",
  "meta": {
    "name": "Nom du niveau",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "sequence": [
    {
      "id": "zone_001",
      "order": 0,
      "mode": "FORWARD",
      "length": 100,
      "parallax": {
        "layers": []
      },
      "sprites": [],
      "transitions": []
    }
  ],
  "spawn": {
    "zoneId": "zone_001",
    "position": { "x": 100, "y": 100 }
  }
}
```

---

## 9. Système d'Historique (Undo/Redo)

### 9.1 Actions enregistrées
- Création de zone
- Suppression de zone
- Modification de propriétés
- Réorganisation de zones
- Redimensionnement

### 9.2 Limites
- Maximum 50 états dans l'historique
- FIFO (First In, First Out)

### 9.3 Comportement
```javascript
// Après modification
saveToHistory() → Sauvegarde l'état actuel

// Undo
historyIndex-- → Restaure l'état précédent

// Redo
historyIndex++ → Restaure l'état suivant
```

---

## 10. Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `V` | Outil Sélection |
| `Z` | Outil Zone |
| `T` | Outil Transition |
| `S` | Outil Sprite |
| `E` | Outil Effacer |
| `Delete` | Supprimer sélection |
| `Ctrl+Z` | Annuler |
| `Ctrl+Shift+Z` | Refaire |

---

## 11. Intégration avec BackOffice

### 11.1 Partage des assets

Les assets sont stockés dans `localStorage` sous la clé `game25d_assets`.

```javascript
// Structure
[
  {
    id: 'asset_123',
    name: 'Tree Sprite',
    category: 'sprite',
    dataUrl: 'data:image/png;base64,...',
    width: 64,
    height: 128
  }
]
```

### 11.2 Chargement

```javascript
function loadAssetsFromBackOffice() {
  const saved = localStorage.getItem('game25d_assets');
  if (saved) {
    const assets = JSON.parse(saved);
    renderAssetPicker(assets);
  }
}
```

---

## 12. Styles et Thème

### 12.1 Couleurs des modes

| Mode | Background | Border |
|------|------------|--------|
| Forward | `rgba(74, 144, 217, 0.2)` | `#4a90d9` |
| Backward | `rgba(243, 156, 18, 0.2)` | `#f39c12` |
| Up | `rgba(46, 204, 113, 0.2)` | `#2ecc71` |
| Down | `rgba(231, 76, 60, 0.2)` | `#e74c3c` |

### 12.2 États visuels

| État | Style |
|------|-------|
| Hover | `transform: scale(1.05)` |
| Selected | `border-color: white` + glow |
| Dragging | `opacity: 0.5` |
| Drop target | `outline: 2px dashed white` |

---

## 13. Contraintes et Validation

### 13.1 Zone
- Longueur minimum : 60px
- Longueur maximum : 400px
- Au moins une zone requise pour exporter

### 13.2 Niveau
- Nom obligatoire
- ID généré automatiquement si absent
- Spawn point défini sur la première zone par défaut

---

## 14. Système de Parcours (Camera & Character Path)

### 14.1 Concept

Le système de parcours permet de visualiser et éditer deux trajectoires distinctes :
- **Ligne Caméra** : Le chemin suivi par le viewport
- **Ligne Personnage** : Le chemin de déplacement du joueur avec sa zone de liberté

### 14.2 Vue Path Preview

Affichée sous la timeline en Vue Macro, cette vue montre une représentation 2D du niveau.

```
┌────────────────────────────────────────────────────────────────┐
│  Timeline                                                       │
│  [Zone 1] ───────► [Zone 2] ───────► [Zone 3]                  │
├────────────────────────────────────────────────────────────────┤
│  Path Preview                                                   │
│                                                                 │
│     ════ Ligne Caméra (blanche)                                │
│     ──── Ligne Personnage (jaune)                              │
│     ░░░░ Zone de déplacement (semi-transparent)                │
│                                                                 │
│         ┌─────────┐                                            │
│    ●════╪═════════╪════●════╗                                  │
│    ○────┤ Zone 1  ├────○────╫──┐  ┌─────────┐                  │
│         └─────────┘         ╚══╪══╪═════════╪════●             │
│                                └──┤ Zone 2  ├────○             │
│                                   └─────────┘                  │
└────────────────────────────────────────────────────────────────┘

● = Point de contrôle caméra
○ = Point de contrôle personnage
```

### 14.3 Éléments visuels

| Élément | Couleur | Style | Description |
|---------|---------|-------|-------------|
| Ligne Caméra | `#ffffff` | Trait épais 3px | Trajet du viewport |
| Ligne Personnage | `#f1c40f` | Trait 2px pointillé | Trajet du joueur |
| Zone de déplacement | `rgba(241, 196, 15, 0.1)` | Remplissage | Limites verticales du personnage |
| Point caméra | `#ffffff` | Cercle plein 8px | Ancrage caméra |
| Point personnage | `#f1c40f` | Cercle vide 8px | Ancrage personnage |

### 14.4 Interactions

| Action | Comportement |
|--------|--------------|
| Clic sur point | Sélectionne le point de contrôle |
| Drag point caméra | Déplace l'ancrage caméra |
| Drag point personnage | Déplace l'ancrage personnage |
| Drag zone de déplacement | Ajuste les limites Y du personnage |
| Double-clic sur ligne | Ajoute un point de contrôle intermédiaire |

### 14.5 Structure de données

```javascript
zone = {
  id: 'zone_1234567890',
  mode: 'forward',
  length: 100,

  // Parcours caméra
  cameraPath: {
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    controlPoints: []  // Points intermédiaires optionnels
  },

  // Parcours personnage
  characterPath: {
    start: { x: 0, y: 50 },
    end: { x: 100, y: 50 },
    controlPoints: [],
    bounds: {
      minY: 20,   // Limite haute de déplacement
      maxY: 80    // Limite basse de déplacement
    }
  },

  parallax: { layers: [] },
  sprites: [],
  transitions: []
}
```

### 14.6 Synchronisation Caméra/Personnage

| Mode Zone | Comportement Caméra | Comportement Personnage |
|-----------|---------------------|-------------------------|
| Forward | Avance horizontalement → | Suit la caméra, libre en Y |
| Backward | Recule horizontalement ← | Suit la caméra, libre en Y |
| Up | Monte verticalement ↑ | Suit la caméra, libre en X |
| Down | Descend verticalement ↓ | Suit la caméra, libre en X |

### 14.7 Contraintes

- Les points de contrôle doivent rester dans les limites de la zone
- La zone de déplacement personnage ne peut pas dépasser la vue caméra
- Minimum 2 points par chemin (start et end)
- Maximum 10 points de contrôle intermédiaires par zone

### 14.8 Toolbar - Nouveaux outils

| Outil | Icône | Raccourci | Description |
|-------|-------|-----------|-------------|
| Camera Path | 📷 | `C` | Éditer le chemin caméra |
| Character Path | 🏃 | `P` | Éditer le chemin personnage |

### 14.9 Panel Droit - Section Parcours

Affichée quand une zone est sélectionnée.

| Champ | Type | Description |
|-------|------|-------------|
| **Caméra** | | |
| Start X/Y | Number | Position de départ |
| End X/Y | Number | Position d'arrivée |
| **Personnage** | | |
| Start X/Y | Number | Position de départ |
| End X/Y | Number | Position d'arrivée |
| Bounds Min Y | Number | Limite haute |
| Bounds Max Y | Number | Limite basse |

### 14.10 Export JSON mis à jour

```json
{
  "version": "1.1",
  "id": "level_1234567890",
  "meta": {
    "name": "Nom du niveau",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "sequence": [
    {
      "id": "zone_001",
      "order": 0,
      "mode": "FORWARD",
      "length": 100,
      "cameraPath": {
        "start": { "x": 0, "y": 0 },
        "end": { "x": 100, "y": 0 },
        "controlPoints": []
      },
      "characterPath": {
        "start": { "x": 0, "y": 50 },
        "end": { "x": 100, "y": 50 },
        "controlPoints": [],
        "bounds": { "minY": 20, "maxY": 80 }
      },
      "parallax": { "layers": [] },
      "sprites": [],
      "transitions": []
    }
  ],
  "spawn": {
    "zoneId": "zone_001",
    "position": { "x": 100, "y": 50 }
  }
}
