# Spécifications - Personnages & Sprites

## 1. Direction Artistique & Style

### 1.1 Style visuel
- **Technique** : "Hand-painted" (peint à la main)
- **Rendu** : Style aquarelle ou crayons de couleur
- **Contours** : Doux, sans bords durs
- **Ambiance** : Poétique, enfantin, onirique

### 1.2 Angle de vue
- **Standard** : Profil strict ou 3/4 face
- **Cohérence** : Tous les personnages suivent le même angle
- **Perspective** : Adaptée à la 2.5D

### 1.3 Palette de couleurs
| Couleur | Hex | Usage |
|---------|-----|-------|
| Or | `#FFD700` | Accents, cheveux, éléments magiques |
| Bleu Roi | `#4169E1` | Yeux, tenues, ciel |
| Blanc | `#FFFDF5` | Lumières, éléments purs |
| Gris métallique | `#8E9AAF` | Robot, éléments mécaniques |
| Vert tendre | `#98D8AA` | Nature, tenue garçon |
| Rose pâle | `#FFB6C1` | Tenue fille |
| Lavande | `#E6E6FA` | Alternative tenue fille |

---

## 2. Le Petit Garçon ("Le Petit Prince")

### 2.1 Fiche personnage

| Attribut | Description |
|----------|-------------|
| **Âge** | 5-7 ans |
| **Cheveux** | Blonds en bataille (épis de blé) |
| **Yeux** | Grands, bleus, curieux |
| **Expression** | Émerveillement, détermination douce |

### 2.2 Tenue

```
┌─────────────────────────────────┐
│ ☆ Écharpe jaune flottante      │ ← Élément signature
│   (toujours animée, suit le    │   Réagit au vent/mouvement
│    vent et le mouvement)       │
├─────────────────────────────────┤
│ Tunique verte ou bleue         │ ← Couleur principale
│ (style médiéval simplifié)     │
├─────────────────────────────────┤
│ Pantalon blanc                 │
├─────────────────────────────────┤
│ Petites bottes marron          │ ← Pratiques pour l'aventure
└─────────────────────────────────┘
```

### 2.3 Sprites requis

| Sprite | Frames | Comportement écharpe |
|--------|--------|---------------------|
| idle | 4-6 | Flotte doucement |
| walk | 8-12 | Ondule légèrement |
| run | 8-12 | Horizontale (vitesse) |
| jump | 6-8 | S'envole vers le haut |
| fall | 4-6 | Bat au vent |

---

## 3. La Petite Fille ("La Petite Princesse")

### 3.1 Fiche personnage

| Attribut | Description |
|----------|-------------|
| **Âge** | 5-7 ans |
| **Cheveux** | Longs, blonds, ondulés |
| **Yeux** | Bleus pétillants |
| **Expression** | Espiègle, courageuse |

### 3.2 Tenue

```
┌─────────────────────────────────┐
│ ❀ Couronne de fleurs           │ ← Accessoire optionnel
│   (pâquerettes, petites roses) │   Ajoute du charme
├─────────────────────────────────┤
│ Robe légère rose pâle/lavande  │ ← Ne gêne pas le mouvement
│ (fluide, réagit à la physique) │
├─────────────────────────────────┤
│ Leggings rayés                 │ ← Côté moderne/actif
│ (rose et blanc)                │
├─────────────────────────────────┤
│ Baskets colorées               │ ← Pratiques et fun
│ (lacets arc-en-ciel)           │
└─────────────────────────────────┘
```

### 3.3 Physique des cheveux

Les cheveux réagissent au mouvement :

| Action | Comportement cheveux |
|--------|---------------------|
| idle | Ondulent doucement |
| walk | Balancement léger |
| run | Volent loin derrière |
| jump | Montent avec l'élan |
| fall | Remontent vers le haut |

### 3.4 Sprites requis

| Sprite | Frames | Notes |
|--------|--------|-------|
| idle | 4-6 | Remet une mèche de cheveux |
| walk | 8-12 | Sautillements joyeux |
| run | 8-12 | Cheveux au vent |
| jump | 6-8 | Bras levés, robe qui suit |
| fall | 4-6 | Agitation mignonne |

---

## 4. Le Robot-Ami ("Robo-Poto")

### 4.1 Fiche personnage

| Attribut | Description |
|----------|-------------|
| **Forme** | Rondouillard, bienveillant |
| **Tête** | Vieux téléviseur ou ampoule |
| **Yeux** | LEDs expressifs |
| **Membres** | Flexibles (tuyaux d'aspirateur) |
| **Accessoire** | Hélice ou réacteurs dorsaux |
| **Matière** | Métal brossé usé + touches cuivre |

### 4.2 Design

```
        ╭──────────╮
       (  ◉    ◉  )   ← Yeux LED (changent de forme)
        │  ╰──╯   │   ← "Écran" de visage
        ╰────┬────╯
      ╭──────┴──────╮
     ╱       ★       ╲  ← Hélice sur le dessus
    │    ╭─────╮     │
    │ ╱╲ │     │ ╱╲  │  ← Bras flexibles
    │    │     │     │
    │    ╰─────╯     │  ← Corps arrondi
    ╰────────────────╯
       ◯          ◯     ← Roues ou pieds
```

### 4.3 Émotions via les yeux

| Émotion | Forme des yeux |
|---------|----------------|
| Neutre | ◉ ◉ (ronds) |
| Content | ◠ ◠ (arcs souriants) |
| Surpris | ⊙ ⊙ (grands) |
| Triste | ◡ ◡ (arcs inversés) |
| Inquiet | ◉ ◉ (clignotent vite) |
| Endormi | — — (fermés) |

### 4.4 Sprites requis

| Sprite | Frames | Animation spéciale |
|--------|--------|-------------------|
| idle | 4-6 | Boulon se dévisse, le remet |
| move | 8-12 | Roule ou ressort |
| fly | 6-8 | Réacteurs/hélice actifs |
| transform | 8-10 | Devient gyroroue |

---

## 5. Actions & Animations de Base

### 5.1 Mouvements fondamentaux

#### Idle (Attente)
- **Frames** : 4-6
- **Durée** : 2-3 secondes en boucle
- **Respiration** : Légère montée/descente du corps

| Personnage | Animation spécifique |
|------------|---------------------|
| Garçon | Écharpe flotte, regarde autour |
| Fille | Remet une mèche, balance un pied |
| Robot | Clignote, répare un boulon |

#### Marcher (Walk)
- **Frames** : 8-12 (cycle complet)
- **Style** : Pas joyeux et légers

| Personnage | Animation spécifique |
|------------|---------------------|
| Garçon | Sautille un peu, écharpe ondule |
| Fille | Sautille, cheveux balancent |
| Robot | Roule ou fait "boing" de ressort |

#### Courir (Run)
- **Frames** : 8-12
- **Posture** : Corps penché vers l'avant

| Personnage | Animation spécifique |
|------------|---------------------|
| Garçon | Écharpe horizontale (vitesse) |
| Fille | Cheveux volent loin derrière |
| Robot | Roue rapide ou réacteurs actifs |

#### Sauter (Jump)
- **3 phases** :
  1. **Impulsion** : Corps plié, préparation (2 frames)
  2. **En l'air** : Extension maximale (3-4 frames)
  3. **Réception** : Amorti (2 frames)

| Personnage | Animation spécifique |
|------------|---------------------|
| Garçon | Bras levés au ciel |
| Fille | Bras levés, robe qui suit |
| Robot | Boost de gaz sous les pieds |

#### Tomber (Fall)
- **Frames** : 4-6
- **État** : En l'air, pas de sol

| Personnage | Animation spécifique |
|------------|---------------------|
| Garçon | Bras/jambes s'agitent (panique mignonne) |
| Fille | Même chose, cheveux remontent |
| Robot | Yeux surpris, membres s'agitent |

---

## 6. Véhicules & Actions Spéciales

### 6.1 Parachute

**Design du parachute** (choix possibles) :
- ❌ Pas de parachute militaire
- ✓ Grand drap rapiécé coloré
- ✓ Pissenlit géant magique
- ✓ Gros ballon rouge style Petit Prince

**Animation** :
- Oscillation douce gauche/droite (pendule)
- Le personnage tient les suspentes
- 8-12 frames pour le cycle

**Sprites requis** :
```
parachute_idle      ← Descente stable
parachute_left      ← Oscillation gauche
parachute_right     ← Oscillation droite
```

### 6.2 Avion (Biplan)

**Design** :
- Petit biplan rouge rétro
- Style avion en bois jouet
- Hélice qui tourne (flou de mouvement)
- Cockpit ouvert

**Ce qu'on voit** :
- Tête du personnage dépassant
- Écharpe/cheveux au vent

**Animation** :
- Avion vibre légèrement
- Hélice tourne (blur)
- Traînée de fumée blanche à l'arrière

**Sprites requis** :
```
plane_fly           ← Vol normal
plane_up            ← Montée
plane_down          ← Descente
plane_enter         ← Montée dans l'avion
plane_exit          ← Sortie de l'avion
```

### 6.3 Skateboard

**Design** :
- Planche en bois brut naturel
- Roues colorées (rouge, bleu, jaune)
- Usure visible (authenticité)

**Pose** :
- Vue de profil
- Genoux pliés
- Bras écartés (équilibre)

**Animation** :
- Une jambe pousse le sol régulièrement
- Corps balance pour l'équilibre

**Sprites requis** :
```
skate_idle          ← Debout sur planche
skate_push          ← Pousse du pied
skate_roll          ← Glisse
skate_jump          ← Ollie / Saut
skate_fall          ← Chute (humour)
```

### 6.4 Gyroroue (Electric Unicycle)

**Design** :
- Roue futuriste simple
- Cercle lumineux (LED)
- Style minimaliste

**Pose** :
- Personnage très droit
- Légère inclinaison avant (propulsion)
- Mains :
  - Dans les poches (style cool)
  - OU écartées (débutant)

**Cas spécial Robot** :
Le robot SE TRANSFORME en gyroroue :
- Rentre tête et bras
- Ne laisse sortir que sa roue centrale

**Sprites requis** :
```
gyro_idle           ← Équilibre
gyro_forward        ← Incliné avant
gyro_backward       ← Incliné arrière
robot_transform     ← Robot → Gyroroue
```

### 6.5 Vélo Brompton

**Design reconnaissable** :
- Petites roues 16 pouces
- Guidon haut courbé
- Cadre pliable
- Couleurs vives : Rouge ou Vert Anglais

**Pose** :
- Assis droit (posture typique Brompton)
- Mains sur guidon haut

**Animation** :
- Jambes pédalent vite (petites roues = pédalage rapide)
- Écharpe/cheveux flottent
- Roues tournent visiblement

**Animation bonus : Pliage** :
Le vélo se transforme en valise !
- Parfait pour transition "descente du vélo"
- 8-12 frames de transformation

**Sprites requis** :
```
brompton_ride       ← Pédalage normal
brompton_coast      ← Roue libre
brompton_uphill     ← Montée (effort)
brompton_downhill   ← Descente (vitesse)
brompton_fold       ← Animation pliage
brompton_folded     ← Vélo plié (valise)
brompton_mount      ← Monte sur vélo
brompton_dismount   ← Descend du vélo
```

---

## 7. Spécifications Techniques des Sprites

### 7.1 Dimensions

| Type | Taille (px) | Notes |
|------|-------------|-------|
| Personnage | 64x96 | Standard debout |
| Personnage + véhicule | 128x96 | Vélo, skate |
| Avion complet | 192x128 | Grand sprite |
| Robot | 64x64 | Carré |

### 7.2 Format

```javascript
sprite = {
  name: 'prince_walk',
  frames: 8,
  frameWidth: 64,
  frameHeight: 96,
  fps: 12,
  loop: true,
  anchor: { x: 0.5, y: 1 }  // Centre bas
}
```

### 7.3 Organisation des fichiers

```
assets/sprites/
├── prince/
│   ├── idle.png      (spritesheet 64x96, 6 frames)
│   ├── walk.png      (spritesheet 512x96, 8 frames)
│   ├── run.png       (spritesheet 768x96, 12 frames)
│   ├── jump.png      (spritesheet 384x96, 6 frames)
│   └── vehicles/
│       ├── parachute.png
│       ├── plane.png
│       ├── skate.png
│       ├── gyro.png
│       └── brompton.png
├── princess/
│   └── ... (même structure)
└── robot/
    ├── idle.png
    ├── move.png
    └── transform_gyro.png
```

---

## 8. Animation Guidelines

### 8.1 Principes d'animation

| Principe | Application |
|----------|-------------|
| **Squash & Stretch** | Léger sur sauts et réceptions |
| **Anticipation** | Préparation avant action |
| **Follow-through** | Cheveux/écharpe continuent |
| **Ease in/out** | Accélération progressive |
| **Secondary action** | Accessoires réagissent |

### 8.2 Timing (FPS)

| Animation | FPS recommandé |
|-----------|----------------|
| Idle | 8 FPS |
| Walk | 12 FPS |
| Run | 12-15 FPS |
| Jump | 15 FPS |
| Véhicules | 12 FPS |

### 8.3 Transitions

Prévoir des frames de transition entre :
- Marche → Course
- Sol → Saut
- Saut → Chute
- Véhicule → À pied
