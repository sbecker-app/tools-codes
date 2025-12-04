# Phases de Développement

> Roadmap technique du projet Game 2.5D

---

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 0: Setup                                                  │
│  Infrastructure, tooling, structure                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Core Engine                                            │
│  Composants de base, rendu, navigation                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: BackOffice                                             │
│  Gestion des assets, import, organisation                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: Stage Maker                                            │
│  Éditeur de niveaux, macro et micro                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: Game Integration                                       │
│  Assemblage, gameplay complet                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: Content & Polish                                       │
│  Création de contenu, effets, sons                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Setup

### Objectifs
- Mettre en place l'infrastructure du projet
- Configurer les outils de développement
- Créer la structure de base

### Tâches

#### 0.1 Structure Projet
- [x] Créer l'arborescence des dossiers
- [x] Rédiger les spécifications
- [ ] Créer le `package.json`
- [ ] Configurer le serveur de dev local

#### 0.2 Base de Données Contexte
- [x] Créer les fichiers story/*.md
- [ ] Intégrer avec markdownDB
- [ ] Script d'indexation

#### 0.3 Configuration Dev
- [ ] ESLint + config
- [ ] Prettier + config
- [ ] Structure des tests Playwright

### Livrables
- Projet initialisé et fonctionnel
- Serveur de dev accessible
- Documentation de base

---

## Phase 1: Core Engine

### Objectifs
- Implémenter les composants fondamentaux
- Avoir un prototype de rendu fonctionnel
- Système de navigation basique

### Tâches

#### 1.1 Composants Core
- [ ] `Component` - Classe de base
- [ ] `EventEmitter` - Système d'événements
- [ ] `StateManager` - Gestion d'état

#### 1.2 Rendu
- [ ] `SpriteRenderer` - Affichage sprites
- [ ] `ParallaxLayer` - Couches parallaxe
- [ ] `Camera` - Gestion caméra
- [ ] `AnimationPlayer` - Animations

#### 1.3 Navigation
- [ ] `NavigationSystem` - 4 modes
- [ ] Transitions entre modes
- [ ] Détection des zones

#### 1.4 Input
- [ ] `InputHandler` - Clavier
- [ ] Support gamepad (optionnel)

### Livrables
- Démo technique avec:
  - Sprite qui se déplace
  - Parallaxe fonctionnelle
  - Changement de mode de navigation

---

## Phase 2: BackOffice

### Objectifs
- Interface de gestion des assets
- Import et organisation des sprites
- Preview et métadonnées

### Tâches

#### 2.1 Interface Base
- [ ] Layout principal (sidebar + content)
- [ ] Navigation par catégories
- [ ] Barre de recherche

#### 2.2 Gestion Assets
- [ ] `AssetManager` - CRUD assets
- [ ] Import fichiers (drag & drop)
- [ ] Génération thumbnails
- [ ] Édition métadonnées

#### 2.3 Preview
- [ ] Preview sprite statique
- [ ] Preview animation
- [ ] Éditeur de hitbox

#### 2.4 Export
- [ ] Export pack d'assets
- [ ] Format JSON standardisé

### Livrables
- Application BO fonctionnelle
- Import/export d'assets
- Organisation par thème/mode/catégorie

---

## Phase 3: Stage Maker

### Objectifs
- Éditeur de niveaux complet
- Vue macro (flow du niveau)
- Vue micro (placement sprites)

### Tâches

#### 3.1 Vue Macroscopique
- [ ] Canvas de dessin des zones
- [ ] Outils: sélection, peinture, gomme
- [ ] Définition des modes par zone
- [ ] Connexions entre zones

#### 3.2 Vue Microscopique
- [ ] Placement sprites (drag & drop)
- [ ] Gestion des couches
- [ ] Configuration parallaxe
- [ ] Grille magnétique

#### 3.3 Outils d'Édition
- [ ] Undo/Redo
- [ ] Copier/Coller
- [ ] Alignement
- [ ] Groupement

#### 3.4 Export Niveau
- [ ] Format JSON complet
- [ ] Validation avant export
- [ ] Preview en temps réel

### Livrables
- Éditeur de niveaux fonctionnel
- Création niveau de A à Z
- Export compatible avec le Game

---

## Phase 4: Game Integration

### Objectifs
- Assembler tous les systèmes
- Gameplay jouable de bout en bout
- Intégration histoire

### Tâches

#### 4.1 Scènes
- [ ] `TitleScene` - Écran titre
- [ ] `SelectScene` - Sélection personnage
- [ ] `PlayScene` - Jeu principal
- [ ] `PauseScene` - Menu pause

#### 4.2 Personnages
- [ ] Chargement des sprites
- [ ] Contrôleur Prince
- [ ] Contrôleur Princesse
- [ ] Comportement Robot Ami

#### 4.3 Niveaux
- [ ] `LevelLoader` - Chargement JSON
- [ ] Instanciation des zones
- [ ] Transitions entre zones
- [ ] Gestion de la progression

#### 4.4 UI In-Game
- [ ] HUD (vie, collectibles, etc.)
- [ ] Boîtes de dialogue
- [ ] Indicateurs de zone

### Livrables
- Jeu jouable du début à la fin
- Au moins 1 niveau complet
- Système de dialogue fonctionnel

---

## Phase 5: Content & Polish

### Objectifs
- Créer le contenu final
- Améliorer les visuels
- Ajouter sons et musique

### Tâches

#### 5.1 Assets Graphiques
- [ ] Sprites Prince complets
- [ ] Sprites Princesse complets
- [ ] Sprites Robot Ami
- [ ] Décors par thème
- [ ] Effets visuels

#### 5.2 Audio
- [ ] Musiques par zone
- [ ] Effets sonores (pas, sauts, etc.)
- [ ] Sons d'interface
- [ ] Voix Robot (optionnel)

#### 5.3 Niveaux
- [ ] Niveau tutoriel
- [ ] Niveaux de l'histoire
- [ ] Équilibrage difficulté

#### 5.4 Polish
- [ ] Transitions fluides
- [ ] Feedback visuel
- [ ] Optimisation performance
- [ ] Tests sur différents écrans

### Livrables
- Jeu complet avec contenu
- Expérience fluide et polie
- Prêt pour distribution

---

## Tests par Phase

### Phase 1
```
tests/
└── e2e/
    ├── rendering.spec.js       # Sprites, parallaxe
    └── navigation.spec.js      # Modes, transitions
```

### Phase 2
```
tests/
└── e2e/
    └── backoffice/
        ├── import.spec.js      # Import assets
        ├── filter.spec.js      # Filtres
        └── export.spec.js      # Export pack
```

### Phase 3
```
tests/
└── e2e/
    └── stage-maker/
        ├── macro.spec.js       # Dessin zones
        ├── micro.spec.js       # Placement sprites
        └── export.spec.js      # Export niveau
```

### Phase 4-5
```
tests/
└── e2e/
    └── game/
        ├── flow.spec.js        # Navigation menus
        ├── gameplay.spec.js    # Contrôles, collisions
        └── story.spec.js       # Dialogues, progression
```

---

## Critères de Validation par Phase

### Phase 0: Setup ✓
- [ ] `npm run dev` lance le serveur
- [ ] Structure conforme à la spec
- [ ] Linter passe sans erreur

### Phase 1: Core Engine ✓
- [ ] Sprite affiché et animé
- [ ] Parallaxe 5 couches
- [ ] 4 modes de navigation fonctionnels
- [ ] Tests Playwright passent

### Phase 2: BackOffice ✓
- [ ] Import de 10+ sprites
- [ ] Filtres fonctionnels
- [ ] Export JSON valide
- [ ] Preview animations

### Phase 3: Stage Maker ✓
- [ ] Création niveau avec 3+ zones
- [ ] Modes différents par zone
- [ ] Export chargeable par le Game
- [ ] Undo/Redo fonctionnel

### Phase 4: Game Integration ✓
- [ ] Parcours complet d'un niveau
- [ ] Sélection Prince/Princesse
- [ ] Robot suit le joueur
- [ ] Dialogues affichés

### Phase 5: Content & Polish ✓
- [ ] 3+ niveaux jouables
- [ ] Musique et sons
- [ ] Pas de bugs bloquants
- [ ] Performance stable (60 FPS)
