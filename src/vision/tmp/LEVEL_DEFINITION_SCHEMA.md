# 📐 LEVEL DEFINITION SCHEMA
## Shadow Drift — Format de définition des niveaux

> Version: 1.0.0  
> Format: JSON  
> Extension: `.level.json`

---

# TABLE DES MATIÈRES

1. [Structure globale](#1-structure-globale)
2. [Metadata](#2-metadata)
3. [Zones](#3-zones)
4. [Tiles](#4-tiles)
5. [Ennemis](#5-ennemis)
6. [Collectibles](#6-collectibles)
7. [Objets Boost](#7-objets-boost)
8. [Hazards](#8-hazards)
9. [Éléments interactifs](#9-éléments-interactifs)
10. [Ambiance](#10-ambiance)
11. [Exemple complet](#11-exemple-complet)

---

# 1. STRUCTURE GLOBALE

```json
{
  "metadata": { },
  "zones": [ ],
  "tiles": { },
  "enemies": [ ],
  "collectibles": [ ],
  "boostObjects": [ ],
  "hazards": [ ],
  "interactives": [ ],
  "ambiance": { }
}
```

---

# 2. METADATA

Informations générales du niveau.

```json
"metadata": {
  "id": "level_001",
  "name": "The Forgotten Cavern",
  "description": "Une caverne abandonnée, premier pas dans les ténèbres.",
  "author": "Seb",
  "version": "1.0.0",
  "difficulty": "easy",
  "estimatedTime": 180,
  
  "dimensions": {
    "width": 3200,
    "height": 900
  },
  
  "spawn": {
    "x": 150,
    "y": 600,
    "direction": "right"
  },
  
  "exit": {
    "x": 3050,
    "y": 650,
    "width": 60,
    "height": 100,
    "targetLevel": "level_002",
    "targetSpawn": "from_cavern"
  },
  
  "checkpoints": [
    { "id": "cp_01", "x": 1000, "y": 700 },
    { "id": "cp_02", "x": 2200, "y": 650 }
  ],
  
  "requirements": {
    "items": [],
    "abilities": [],
    "previousLevel": null
  },
  
  "tags": ["cave", "tutorial", "dark"]
}
```

## Champs Metadata

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique du niveau |
| `name` | string | Nom affiché |
| `description` | string | Description pour le menu |
| `difficulty` | enum | `easy` \| `medium` \| `hard` \| `nightmare` |
| `estimatedTime` | number | Temps estimé en secondes |
| `dimensions` | object | Taille totale du niveau en pixels |
| `spawn` | object | Point d'apparition initial |
| `exit` | object | Porte de sortie vers niveau suivant |
| `checkpoints` | array | Points de sauvegarde |
| `requirements` | object | Prérequis pour accéder au niveau |

---

# 3. ZONES

Régions du niveau avec propriétés spécifiques.

```json
"zones": [
  {
    "id": "zone_entrance",
    "name": "Entrée de la caverne",
    "bounds": {
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 900
    },
    "navigation": {
      "canEnterFrom": ["left"],
      "canExitTo": ["right"]
    },
    "camera": {
      "lockX": false,
      "lockY": true,
      "bounds": { "minY": 200, "maxY": 700 }
    },
    "ambiance": {
      "lightLevel": 0.6,
      "fogDensity": 0.2,
      "musicTrack": "ambient_cave_01"
    }
  },
  {
    "id": "zone_chasm",
    "name": "Le gouffre",
    "bounds": {
      "x": 800,
      "y": 0,
      "width": 600,
      "height": 900
    },
    "navigation": {
      "canEnterFrom": ["left", "right", "top"],
      "canExitTo": ["left", "right", "bottom"]
    },
    "camera": {
      "lockX": false,
      "lockY": false
    },
    "special": {
      "type": "verticalScroll",
      "deathPlane": 950
    }
  }
]
```

## Champs Zone

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique de la zone |
| `bounds` | object | Rectangle de la zone |
| `navigation` | object | Directions d'entrée/sortie possibles |
| `camera` | object | Comportement de la caméra |
| `ambiance` | object | Override d'ambiance locale |
| `special` | object | Comportements spéciaux |

---

# 4. TILES

## 4.1 Tile Registry

Définition des types de tiles disponibles.

```json
"tiles": {
  "registry": {
    
    "ground_rock_01": {
      "id": "ground_rock_01",
      "name": "Roche - Sol",
      "category": "ground",
      "size": { "width": 64, "height": 64 },
      "collision": {
        "enabled": true,
        "type": "solid",
        "shape": "box"
      },
      "visual": {
        "sprite": "tiles/ground_rock_01.svg",
        "variants": ["ground_rock_01a", "ground_rock_01b"],
        "autoTile": true
      },
      "properties": {
        "friction": 1.0,
        "material": "rock"
      }
    },
    
    "platform_wood_01": {
      "id": "platform_wood_01",
      "name": "Plateforme bois",
      "category": "platform",
      "size": { "width": 64, "height": 16 },
      "collision": {
        "enabled": true,
        "type": "one-way",
        "shape": "box"
      },
      "visual": {
        "sprite": "tiles/platform_wood_01.svg"
      },
      "properties": {
        "friction": 0.9,
        "material": "wood"
      }
    },
    
    "wall_brick_01": {
      "id": "wall_brick_01",
      "name": "Mur briques",
      "category": "wall",
      "size": { "width": 64, "height": 64 },
      "collision": {
        "enabled": true,
        "type": "solid",
        "shape": "box"
      },
      "visual": {
        "sprite": "tiles/wall_brick_01.svg",
        "autoTile": true
      }
    },
    
    "deco_stalactite_01": {
      "id": "deco_stalactite_01",
      "name": "Stalactite",
      "category": "decoration",
      "size": { "width": 32, "height": 64 },
      "collision": {
        "enabled": false
      },
      "visual": {
        "sprite": "tiles/deco_stalactite_01.svg",
        "layer": "background"
      }
    }
  }
}
```

## 4.2 Tile Placement

Placement des tiles dans le niveau.

```json
"tiles": {
  "placements": [
    {
      "tileId": "ground_rock_01",
      "gridX": 0,
      "gridY": 11,
      "repeat": { "x": 10, "y": 3 }
    },
    {
      "tileId": "platform_wood_01",
      "gridX": 5,
      "gridY": 8,
      "repeat": { "x": 3, "y": 1 },
      "transform": {
        "flipX": false,
        "rotation": 0
      }
    },
    {
      "tileId": "deco_stalactite_01",
      "gridX": 8,
      "gridY": 0,
      "layer": "background",
      "transform": {
        "scaleY": 1.5
      }
    }
  ]
}
```

## 4.3 Catégories de Tiles

| Catégorie | Collision | Usage |
|-----------|-----------|-------|
| `ground` | solid | Sol principal |
| `platform` | one-way | Plateformes traversables |
| `wall` | solid | Murs verticaux |
| `ceiling` | solid | Plafonds |
| `slope` | slope | Pentes |
| `decoration` | none | Éléments visuels |
| `background` | none | Arrière-plan |
| `foreground` | none | Premier plan |

---

# 5. ENNEMIS

## 5.1 Enemy Registry

```json
"enemies": {
  "registry": {
    
    "shadow_crawler": {
      "id": "shadow_crawler",
      "name": "Rampeur des ombres",
      "category": "ground",
      "size": { "width": 40, "height": 30 },
      "stats": {
        "health": 2,
        "damage": 1,
        "speed": 2
      },
      "behavior": {
        "type": "patrol",
        "patrolDistance": 200,
        "detectionRange": 150,
        "attackType": "contact"
      },
      "visual": {
        "sprite": "enemies/shadow_crawler.svg",
        "animations": {
          "idle": { "frames": 4, "speed": 0.1 },
          "walk": { "frames": 6, "speed": 0.15 },
          "attack": { "frames": 3, "speed": 0.2 },
          "death": { "frames": 5, "speed": 0.1 }
        }
      },
      "drops": {
        "essence": { "min": 1, "max": 3 },
        "health": { "chance": 0.2 }
      }
    },
    
    "flying_wisp": {
      "id": "flying_wisp",
      "name": "Feu follet",
      "category": "flying",
      "size": { "width": 24, "height": 24 },
      "stats": {
        "health": 1,
        "damage": 1,
        "speed": 3
      },
      "behavior": {
        "type": "chase",
        "detectionRange": 200,
        "chaseSpeed": 4,
        "attackType": "projectile",
        "projectile": {
          "type": "wisp_bolt",
          "speed": 5,
          "cooldown": 2000
        }
      },
      "visual": {
        "sprite": "enemies/flying_wisp.svg",
        "glow": {
          "color": "#ff6644",
          "radius": 30,
          "pulse": true
        }
      }
    },
    
    "stone_guardian": {
      "id": "stone_guardian",
      "name": "Gardien de pierre",
      "category": "boss",
      "size": { "width": 80, "height": 120 },
      "stats": {
        "health": 20,
        "damage": 3,
        "speed": 1
      },
      "behavior": {
        "type": "boss",
        "phases": [
          { "healthThreshold": 1.0, "pattern": "slow_chase" },
          { "healthThreshold": 0.5, "pattern": "rage_slam" },
          { "healthThreshold": 0.25, "pattern": "summon_minions" }
        ]
      },
      "attacks": [
        {
          "name": "ground_slam",
          "damage": 2,
          "range": 150,
          "cooldown": 3000,
          "effect": "screen_shake"
        },
        {
          "name": "rock_throw",
          "damage": 2,
          "projectileSpeed": 6,
          "cooldown": 2000
        }
      ]
    }
  }
}
```

## 5.2 Enemy Placement

```json
"enemies": {
  "spawns": [
    {
      "enemyId": "shadow_crawler",
      "x": 500,
      "y": 720,
      "facing": "left",
      "patrol": {
        "minX": 400,
        "maxX": 700
      }
    },
    {
      "enemyId": "flying_wisp",
      "x": 1200,
      "y": 400,
      "behavior": {
        "type": "orbit",
        "centerX": 1200,
        "centerY": 400,
        "radius": 80
      }
    },
    {
      "enemyId": "stone_guardian",
      "x": 2800,
      "y": 550,
      "triggerZone": {
        "x": 2600,
        "y": 400,
        "width": 200,
        "height": 300
      },
      "bossArena": {
        "lockCamera": true,
        "bounds": { "x": 2500, "y": 300, "width": 600, "height": 500 }
      }
    }
  ]
}
```

## 5.3 Types de comportement

| Type | Description |
|------|-------------|
| `static` | Ne bouge pas, attaque si à portée |
| `patrol` | Va-et-vient entre deux points |
| `chase` | Poursuit le joueur si détecté |
| `orbit` | Tourne autour d'un point |
| `ambush` | Caché, attaque par surprise |
| `boss` | Patterns de boss avec phases |

---

# 6. COLLECTIBLES

## 6.1 Collectible Registry

```json
"collectibles": {
  "registry": {
    
    "essence_small": {
      "id": "essence_small",
      "name": "Petite essence",
      "category": "currency",
      "value": 1,
      "visual": {
        "sprite": "collectibles/essence_small.svg",
        "glow": { "color": "#4a9eff", "radius": 15 },
        "float": { "amplitude": 5, "speed": 2 }
      },
      "sound": "collect_essence"
    },
    
    "essence_large": {
      "id": "essence_large",
      "name": "Grande essence",
      "category": "currency",
      "value": 10,
      "visual": {
        "sprite": "collectibles/essence_large.svg",
        "glow": { "color": "#9a4aff", "radius": 25 },
        "float": { "amplitude": 8, "speed": 1.5 }
      }
    },
    
    "health_orb": {
      "id": "health_orb",
      "name": "Orbe de vie",
      "category": "consumable",
      "effect": {
        "type": "heal",
        "value": 1
      },
      "visual": {
        "sprite": "collectibles/health_orb.svg",
        "glow": { "color": "#44ff66", "radius": 20 }
      }
    },
    
    "map_fragment": {
      "id": "map_fragment",
      "name": "Fragment de carte",
      "category": "key_item",
      "unique": true,
      "persistent": true,
      "visual": {
        "sprite": "collectibles/map_fragment.svg",
        "glow": { "color": "#ffdd44", "radius": 30, "pulse": true }
      },
      "unlocks": {
        "type": "map_reveal",
        "zone": "zone_secret_01"
      }
    },
    
    "ability_glide": {
      "id": "ability_glide",
      "name": "Cape du vent",
      "category": "ability",
      "unique": true,
      "persistent": true,
      "visual": {
        "sprite": "collectibles/ability_glide.svg",
        "glow": { "color": "#00ddff", "radius": 40, "pulse": true }
      },
      "unlocks": {
        "type": "ability",
        "ability": "glide"
      },
      "cutscene": "ability_glide_acquired"
    },
    
    "lore_note_01": {
      "id": "lore_note_01",
      "name": "Note ancienne #1",
      "category": "lore",
      "unique": true,
      "persistent": true,
      "visual": {
        "sprite": "collectibles/lore_note.svg"
      },
      "content": {
        "title": "Journal du gardien",
        "text": "Jour 47. Les ombres se rapprochent..."
      }
    }
  }
}
```

## 6.2 Collectible Placement

```json
"collectibles": {
  "placements": [
    {
      "collectibleId": "essence_small",
      "x": 300,
      "y": 550,
      "respawn": true,
      "respawnTime": 30000
    },
    {
      "collectibleId": "essence_small",
      "positions": [
        { "x": 400, "y": 520 },
        { "x": 450, "y": 500 },
        { "x": 500, "y": 480 },
        { "x": 550, "y": 500 },
        { "x": 600, "y": 520 }
      ],
      "pattern": "arc"
    },
    {
      "collectibleId": "health_orb",
      "x": 1500,
      "y": 300,
      "respawn": false,
      "requireAbility": "double_jump"
    },
    {
      "collectibleId": "ability_glide",
      "x": 2000,
      "y": 200,
      "respawn": false,
      "hidden": false,
      "triggersEvent": "unlock_glide"
    },
    {
      "collectibleId": "map_fragment",
      "x": 800,
      "y": 150,
      "hidden": true,
      "revealCondition": {
        "type": "ability",
        "ability": "reveal"
      }
    }
  ]
}
```

## 6.3 Catégories de Collectibles

| Catégorie | Persistant | Description |
|-----------|------------|-------------|
| `currency` | Non | Monnaie (essence, pièces) |
| `consumable` | Non | Usage immédiat (vie, énergie) |
| `key_item` | Oui | Objets clés (fragments, clés) |
| `ability` | Oui | Débloque une capacité |
| `upgrade` | Oui | Amélioration permanente |
| `lore` | Oui | Notes, journaux |
| `achievement` | Oui | Secrets, trophées |

---

# 7. OBJETS BOOST

## 7.1 Boost Registry

```json
"boostObjects": {
  "registry": {
    
    "portal_horizontal": {
      "id": "portal_horizontal",
      "name": "Portail de téléportation",
      "category": "teleport",
      "size": { "width": 60, "height": 100 },
      "behavior": {
        "type": "teleport",
        "targetType": "linked",
        "preserveVelocity": true,
        "cooldown": 500
      },
      "visual": {
        "sprite": "boost/portal.svg",
        "animation": {
          "type": "loop",
          "frames": 8,
          "speed": 0.1
        },
        "glow": { "color": "#8844ff", "radius": 50 },
        "particles": {
          "type": "sparkle",
          "color": "#aa66ff",
          "rate": 10
        }
      },
      "sound": {
        "ambient": "portal_hum",
        "activate": "portal_woosh"
      }
    },
    
    "fan_vertical": {
      "id": "fan_vertical",
      "name": "Ventilateur propulseur",
      "category": "propulsion",
      "size": { "width": 80, "height": 40 },
      "behavior": {
        "type": "force_field",
        "direction": "up",
        "force": 15,
        "range": 300,
        "falloff": "linear"
      },
      "visual": {
        "sprite": "boost/fan_vertical.svg",
        "animation": {
          "type": "spin",
          "speed": 0.5
        },
        "windLines": {
          "enabled": true,
          "count": 5,
          "length": 200
        }
      },
      "sound": {
        "ambient": "fan_whoosh"
      }
    },
    
    "spring_pad": {
      "id": "spring_pad",
      "name": "Trampoline",
      "category": "bounce",
      "size": { "width": 64, "height": 20 },
      "behavior": {
        "type": "bounce",
        "bounceForce": 20,
        "direction": "up",
        "overrideVelocity": true
      },
      "visual": {
        "sprite": "boost/spring_pad.svg",
        "animation": {
          "type": "trigger",
          "frames": 4,
          "speed": 0.15
        }
      },
      "sound": {
        "activate": "spring_boing"
      }
    },
    
    "speed_booster": {
      "id": "speed_booster",
      "name": "Accélérateur",
      "category": "speed",
      "size": { "width": 100, "height": 30 },
      "behavior": {
        "type": "speed_boost",
        "direction": "horizontal",
        "speedMultiplier": 2.5,
        "duration": 1500,
        "maintainOnGround": true
      },
      "visual": {
        "sprite": "boost/speed_booster.svg",
        "animation": {
          "type": "flow",
          "direction": "right"
        },
        "trail": {
          "enabled": true,
          "color": "#ffaa00",
          "length": 100
        }
      }
    },
    
    "grapple_point": {
      "id": "grapple_point",
      "name": "Point d'accroche",
      "category": "grapple",
      "size": { "width": 30, "height": 30 },
      "behavior": {
        "type": "grapple",
        "range": 250,
        "pullSpeed": 12,
        "swingEnabled": true,
        "requireAbility": "grapple"
      },
      "visual": {
        "sprite": "boost/grapple_point.svg",
        "indicator": {
          "showWhenInRange": true,
          "color": "#44ff88"
        }
      }
    },
    
    "gravity_inverter": {
      "id": "gravity_inverter",
      "name": "Inverseur de gravité",
      "category": "gravity",
      "size": { "width": 80, "height": 80 },
      "behavior": {
        "type": "gravity_zone",
        "gravityMultiplier": -1,
        "transitionTime": 200,
        "bounds": {
          "width": 400,
          "height": 300
        }
      },
      "visual": {
        "sprite": "boost/gravity_inverter.svg",
        "zone": {
          "showBounds": true,
          "color": "#ff44aa",
          "opacity": 0.2
        },
        "particles": {
          "type": "float_up",
          "color": "#ff66bb"
        }
      }
    },
    
    "cannon": {
      "id": "cannon",
      "name": "Canon propulseur",
      "category": "launch",
      "size": { "width": 60, "height": 60 },
      "behavior": {
        "type": "cannon",
        "angle": -45,
        "power": 25,
        "autoFire": false,
        "controlEnabled": true,
        "angleRange": { "min": -80, "max": 80 }
      },
      "visual": {
        "sprite": "boost/cannon.svg",
        "aimIndicator": {
          "type": "trajectory",
          "dotCount": 10
        }
      },
      "sound": {
        "enter": "cannon_load",
        "fire": "cannon_boom"
      }
    },
    
    "zipline_anchor": {
      "id": "zipline_anchor",
      "name": "Tyrolienne",
      "category": "transport",
      "size": { "width": 40, "height": 40 },
      "behavior": {
        "type": "zipline",
        "targetType": "linked",
        "speed": 10,
        "canJumpOff": true
      },
      "visual": {
        "sprite": "boost/zipline_anchor.svg",
        "cable": {
          "color": "#333333",
          "thickness": 3
        }
      }
    },
    
    "updraft_zone": {
      "id": "updraft_zone",
      "name": "Courant ascendant",
      "category": "wind",
      "size": { "width": 150, "height": 400 },
      "behavior": {
        "type": "wind_zone",
        "direction": { "x": 0, "y": -1 },
        "force": 8,
        "turbulence": 0.2
      },
      "visual": {
        "sprite": null,
        "particles": {
          "type": "wind_streak",
          "density": 15,
          "color": "#ffffff",
          "opacity": 0.3
        }
      }
    },
    
    "bounce_mushroom": {
      "id": "bounce_mushroom",
      "name": "Champignon rebondissant",
      "category": "bounce",
      "size": { "width": 50, "height": 40 },
      "behavior": {
        "type": "bounce",
        "bounceForce": 18,
        "direction": "up",
        "chargeEnabled": true,
        "maxCharge": 2.0,
        "chargeTime": 500
      },
      "visual": {
        "sprite": "boost/bounce_mushroom.svg",
        "animation": {
          "type": "squash",
          "onBounce": true
        },
        "glow": { "color": "#66ffaa", "radius": 20 }
      }
    }
  }
}
```

## 7.2 Boost Placement

```json
"boostObjects": {
  "placements": [
    {
      "boostId": "fan_vertical",
      "x": 600,
      "y": 750,
      "active": true,
      "toggleable": false
    },
    {
      "boostId": "spring_pad",
      "x": 900,
      "y": 780,
      "active": true
    },
    {
      "boostId": "portal_horizontal",
      "x": 1200,
      "y": 400,
      "linkedTo": "portal_002",
      "portalId": "portal_001"
    },
    {
      "boostId": "portal_horizontal",
      "x": 2500,
      "y": 300,
      "linkedTo": "portal_001",
      "portalId": "portal_002"
    },
    {
      "boostId": "cannon",
      "x": 1800,
      "y": 700,
      "config": {
        "angle": -60,
        "power": 22
      }
    },
    {
      "boostId": "grapple_point",
      "x": 2100,
      "y": 250
    },
    {
      "boostId": "zipline_anchor",
      "x": 1500,
      "y": 200,
      "linkedTo": "zip_002",
      "ziplineId": "zip_001"
    },
    {
      "boostId": "zipline_anchor",
      "x": 2200,
      "y": 350,
      "linkedTo": "zip_001",
      "ziplineId": "zip_002"
    },
    {
      "boostId": "updraft_zone",
      "x": 1000,
      "y": 300,
      "bounds": {
        "width": 150,
        "height": 500
      }
    },
    {
      "boostId": "gravity_inverter",
      "x": 2600,
      "y": 400,
      "zoneBounds": {
        "x": 2550,
        "y": 200,
        "width": 400,
        "height": 300
      }
    }
  ]
}
```

## 7.3 Catégories de Boost

| Catégorie | Type | Description |
|-----------|------|-------------|
| `teleport` | Instantané | Téléportation vers un point |
| `propulsion` | Zone | Force continue dans une direction |
| `bounce` | Contact | Rebond avec force |
| `speed` | Contact | Boost de vitesse temporaire |
| `grapple` | Action | Point d'accroche pour grappin |
| `gravity` | Zone | Modification de la gravité |
| `launch` | Action | Propulsion contrôlée |
| `transport` | Rail | Déplacement guidé |
| `wind` | Zone | Courant d'air |

---

# 8. HAZARDS

## 8.1 Hazard Registry

```json
"hazards": {
  "registry": {
    
    "spikes_floor": {
      "id": "spikes_floor",
      "name": "Pics au sol",
      "category": "instant_death",
      "size": { "width": 64, "height": 32 },
      "damage": {
        "type": "instant_death",
        "respawnAtCheckpoint": true
      },
      "collision": {
        "shape": "polygon",
        "points": [
          { "x": 0, "y": 32 },
          { "x": 16, "y": 0 },
          { "x": 32, "y": 32 },
          { "x": 48, "y": 0 },
          { "x": 64, "y": 32 }
        ]
      },
      "visual": {
        "sprite": "hazards/spikes_floor.svg"
      }
    },
    
    "acid_pool": {
      "id": "acid_pool",
      "name": "Mare d'acide",
      "category": "damage_zone",
      "size": { "width": 128, "height": 32 },
      "damage": {
        "type": "continuous",
        "damagePerSecond": 2,
        "effect": "poison"
      },
      "visual": {
        "sprite": "hazards/acid_pool.svg",
        "animation": {
          "type": "bubble",
          "rate": 0.5
        },
        "glow": { "color": "#44ff00", "radius": 30 }
      }
    },
    
    "saw_blade": {
      "id": "saw_blade",
      "name": "Lame circulaire",
      "category": "moving",
      "size": { "width": 48, "height": 48 },
      "damage": {
        "type": "hit",
        "damage": 2,
        "knockback": 10
      },
      "behavior": {
        "type": "patrol",
        "speed": 3,
        "path": "linear"
      },
      "visual": {
        "sprite": "hazards/saw_blade.svg",
        "animation": {
          "type": "rotate",
          "speed": 2
        }
      },
      "sound": {
        "ambient": "saw_spin"
      }
    },
    
    "falling_stalactite": {
      "id": "falling_stalactite",
      "name": "Stalactite instable",
      "category": "triggered",
      "size": { "width": 32, "height": 64 },
      "damage": {
        "type": "hit",
        "damage": 2
      },
      "behavior": {
        "type": "fall_on_proximity",
        "triggerRange": 100,
        "fallSpeed": 12,
        "respawn": true,
        "respawnTime": 5000
      },
      "visual": {
        "sprite": "hazards/stalactite.svg",
        "shake": {
          "beforeFall": true,
          "duration": 500
        }
      }
    },
    
    "laser_beam": {
      "id": "laser_beam",
      "name": "Rayon laser",
      "category": "timed",
      "size": { "width": 10, "height": 200 },
      "damage": {
        "type": "instant_death"
      },
      "behavior": {
        "type": "toggle",
        "onDuration": 2000,
        "offDuration": 3000,
        "warning": 500
      },
      "visual": {
        "sprite": null,
        "beam": {
          "color": "#ff0000",
          "width": 8,
          "glow": true
        },
        "emitter": {
          "sprite": "hazards/laser_emitter.svg"
        }
      }
    },
    
    "crusher": {
      "id": "crusher",
      "name": "Presse",
      "category": "moving",
      "size": { "width": 80, "height": 60 },
      "damage": {
        "type": "instant_death"
      },
      "behavior": {
        "type": "crush",
        "restPosition": "up",
        "crushSpeed": 15,
        "returnSpeed": 2,
        "waitTime": 1500,
        "triggerType": "timed"
      },
      "visual": {
        "sprite": "hazards/crusher.svg"
      },
      "sound": {
        "crush": "crusher_slam",
        "warning": "crusher_creak"
      }
    },
    
    "fire_pit": {
      "id": "fire_pit",
      "name": "Brasier",
      "category": "damage_zone",
      "size": { "width": 96, "height": 48 },
      "damage": {
        "type": "continuous",
        "damagePerSecond": 3,
        "effect": "burn"
      },
      "visual": {
        "sprite": "hazards/fire_pit.svg",
        "particles": {
          "type": "fire",
          "density": 20
        },
        "light": {
          "color": "#ff6622",
          "radius": 100,
          "flicker": true
        }
      }
    },
    
    "electric_field": {
      "id": "electric_field",
      "name": "Champ électrique",
      "category": "timed",
      "size": { "width": 64, "height": 128 },
      "damage": {
        "type": "hit",
        "damage": 1,
        "stun": 500
      },
      "behavior": {
        "type": "pulse",
        "activeTime": 500,
        "cooldownTime": 2000
      },
      "visual": {
        "sprite": "hazards/electric_field.svg",
        "electricity": {
          "enabled": true,
          "color": "#44aaff"
        }
      }
    }
  }
}
```

## 8.2 Hazard Placement

```json
"hazards": {
  "placements": [
    {
      "hazardId": "spikes_floor",
      "x": 650,
      "y": 768,
      "repeat": { "x": 3 }
    },
    {
      "hazardId": "saw_blade",
      "x": 1100,
      "y": 600,
      "path": [
        { "x": 1100, "y": 600 },
        { "x": 1100, "y": 400 },
        { "x": 1300, "y": 400 },
        { "x": 1300, "y": 600 }
      ],
      "pathType": "loop"
    },
    {
      "hazardId": "laser_beam",
      "x": 1600,
      "y": 300,
      "rotation": 0,
      "length": 300,
      "config": {
        "onDuration": 1500,
        "offDuration": 2500,
        "startOffset": 0
      }
    },
    {
      "hazardId": "laser_beam",
      "x": 1700,
      "y": 300,
      "length": 300,
      "config": {
        "onDuration": 1500,
        "offDuration": 2500,
        "startOffset": 1250
      }
    },
    {
      "hazardId": "falling_stalactite",
      "positions": [
        { "x": 1850, "y": 0 },
        { "x": 1920, "y": 0 },
        { "x": 2000, "y": 0 }
      ]
    },
    {
      "hazardId": "crusher",
      "x": 2300,
      "y": 200,
      "crushDistance": 250
    },
    {
      "hazardId": "acid_pool",
      "x": 2100,
      "y": 770,
      "width": 200
    }
  ]
}
```

## 8.3 Types de Hazards

| Catégorie | Comportement | Exemples |
|-----------|--------------|----------|
| `instant_death` | Tue immédiatement | Pics, gouffre, laser |
| `damage_zone` | Dégâts continus dans zone | Acide, lave, feu |
| `moving` | Se déplace sur un chemin | Scie, plateforme mortelle |
| `triggered` | Activé par proximité | Stalactite, piège |
| `timed` | Cycle on/off | Laser, électricité |

---

# 9. ÉLÉMENTS INTERACTIFS

## 9.1 Interactive Registry

```json
"interactives": {
  "registry": {
    
    "lever": {
      "id": "lever",
      "name": "Levier",
      "category": "switch",
      "size": { "width": 32, "height": 48 },
      "interaction": {
        "type": "toggle",
        "key": "interact",
        "cooldown": 500
      },
      "states": {
        "off": { "sprite": "interactive/lever_off.svg" },
        "on": { "sprite": "interactive/lever_on.svg" }
      },
      "sound": {
        "activate": "lever_clunk"
      }
    },
    
    "pressure_plate": {
      "id": "pressure_plate",
      "name": "Plaque de pression",
      "category": "switch",
      "size": { "width": 64, "height": 16 },
      "interaction": {
        "type": "weight",
        "minWeight": 1,
        "stayPressed": false
      },
      "states": {
        "off": { "sprite": "interactive/plate_up.svg" },
        "on": { "sprite": "interactive/plate_down.svg" }
      }
    },
    
    "door_metal": {
      "id": "door_metal",
      "name": "Porte métallique",
      "category": "door",
      "size": { "width": 64, "height": 128 },
      "behavior": {
        "openSpeed": 2,
        "closeSpeed": 3,
        "stayOpen": false,
        "stayOpenTime": 3000
      },
      "collision": {
        "whenClosed": true,
        "whenOpen": false
      },
      "states": {
        "closed": { "sprite": "interactive/door_closed.svg" },
        "opening": { "animation": "door_open", "frames": 6 },
        "open": { "sprite": "interactive/door_open.svg" },
        "closing": { "animation": "door_close", "frames": 6 }
      }
    },
    
    "moving_platform": {
      "id": "moving_platform",
      "name": "Plateforme mobile",
      "category": "platform",
      "size": { "width": 128, "height": 24 },
      "behavior": {
        "type": "path",
        "speed": 2,
        "waitTime": 1000,
        "playerActivated": false
      },
      "collision": {
        "type": "one-way",
        "carryPlayer": true
      },
      "visual": {
        "sprite": "interactive/platform_moving.svg"
      }
    },
    
    "breakable_wall": {
      "id": "breakable_wall",
      "name": "Mur fragile",
      "category": "destructible",
      "size": { "width": 64, "height": 128 },
      "health": 3,
      "requireAbility": "dash",
      "drops": [
        { "collectibleId": "essence_small", "count": 3 }
      ],
      "visual": {
        "sprite": "interactive/wall_breakable.svg",
        "crackStages": 3
      },
      "sound": {
        "hit": "wall_crack",
        "break": "wall_crumble"
      }
    },
    
    "npc_hint": {
      "id": "npc_hint",
      "name": "Esprit guide",
      "category": "npc",
      "size": { "width": 40, "height": 60 },
      "interaction": {
        "type": "dialog",
        "key": "interact",
        "range": 80
      },
      "dialog": {
        "type": "sequential",
        "lines": []
      },
      "visual": {
        "sprite": "npc/spirit_guide.svg",
        "float": true,
        "glow": { "color": "#aaddff", "radius": 40 }
      }
    },
    
    "save_point": {
      "id": "save_point",
      "name": "Point de sauvegarde",
      "category": "checkpoint",
      "size": { "width": 48, "height": 80 },
      "interaction": {
        "type": "proximity",
        "range": 60,
        "autoActivate": true
      },
      "effects": {
        "heal": true,
        "refillResources": true,
        "setSpawn": true
      },
      "visual": {
        "sprite": "interactive/save_point.svg",
        "states": {
          "inactive": { "glow": null },
          "active": { 
            "glow": { "color": "#44ffaa", "radius": 60 },
            "particles": { "type": "sparkle" }
          }
        }
      }
    },
    
    "pushable_block": {
      "id": "pushable_block",
      "name": "Bloc poussable",
      "category": "physics",
      "size": { "width": 64, "height": 64 },
      "physics": {
        "mass": 2,
        "friction": 0.8,
        "pushSpeed": 1.5
      },
      "collision": {
        "type": "solid",
        "affectsPlates": true
      },
      "visual": {
        "sprite": "interactive/block_push.svg"
      }
    }
  }
}
```

## 9.2 Interactive Placement

```json
"interactives": {
  "placements": [
    {
      "interactiveId": "lever",
      "x": 500,
      "y": 720,
      "id": "lever_001",
      "targets": ["door_001"],
      "startState": "off"
    },
    {
      "interactiveId": "door_metal",
      "x": 800,
      "y": 622,
      "id": "door_001",
      "triggeredBy": ["lever_001"],
      "startState": "closed"
    },
    {
      "interactiveId": "pressure_plate",
      "x": 1200,
      "y": 784,
      "id": "plate_001",
      "targets": ["platform_001"]
    },
    {
      "interactiveId": "moving_platform",
      "x": 1300,
      "y": 700,
      "id": "platform_001",
      "triggeredBy": ["plate_001"],
      "path": [
        { "x": 1300, "y": 700 },
        { "x": 1300, "y": 400 }
      ],
      "startState": "waiting"
    },
    {
      "interactiveId": "breakable_wall",
      "x": 1800,
      "y": 622,
      "revealsSecret": true
    },
    {
      "interactiveId": "pushable_block",
      "x": 2000,
      "y": 686
    },
    {
      "interactiveId": "save_point",
      "x": 2200,
      "y": 670,
      "checkpointId": "cp_02"
    },
    {
      "interactiveId": "npc_hint",
      "x": 300,
      "y": 690,
      "dialog": {
        "lines": [
          "Bienvenue, voyageur...",
          "Cette caverne cache bien des secrets.",
          "Cherche les cristaux pour éclairer ton chemin."
        ]
      }
    }
  ],
  
  "connections": [
    {
      "trigger": "lever_001",
      "target": "door_001",
      "action": "toggle"
    },
    {
      "trigger": "plate_001",
      "target": "platform_001",
      "action": "activate",
      "condition": "while_pressed"
    }
  ]
}
```

---

# 10. AMBIANCE

```json
"ambiance": {
  "global": {
    "backgroundColor": "#08080c",
    "fogColor": "#0a0a14",
    "fogDensity": 0.3,
    "lightLevel": 0.4,
    "colorGrading": {
      "saturation": 0.8,
      "contrast": 1.1,
      "tint": "#1a1a2e"
    }
  },
  
  "parallax": [
    {
      "layer": "bg_far",
      "depth": 0.1,
      "elements": [
        { "type": "stars", "density": 50 },
        { "type": "nebula", "color": "#1a1a3a", "opacity": 0.2 }
      ]
    },
    {
      "layer": "bg_mid",
      "depth": 0.3,
      "elements": [
        { "type": "mountains", "color": "#0d0d15" }
      ]
    },
    {
      "layer": "bg_near",
      "depth": 0.5,
      "elements": [
        { "type": "dead_forest", "color": "#0a0a12" }
      ]
    },
    {
      "layer": "fg_near",
      "depth": 1.2,
      "elements": [
        { "type": "cave_pillars", "color": "#141420", "opacity": 0.6 }
      ]
    }
  ],
  
  "particles": {
    "dust": {
      "enabled": true,
      "count": 30,
      "size": { "min": 1, "max": 3 },
      "speed": { "min": 0.1, "max": 0.5 },
      "opacity": { "min": 0.1, "max": 0.3 },
      "color": "#ffffff"
    },
    "fireflies": {
      "enabled": true,
      "count": 15,
      "size": { "min": 2, "max": 4 },
      "glowRadius": { "min": 10, "max": 20 },
      "color": "#aaffaa",
      "pulseSpeed": 2
    }
  },
  
  "lighting": {
    "ambient": {
      "color": "#1a1a2e",
      "intensity": 0.3
    },
    "sources": [
      {
        "type": "point",
        "x": 200,
        "y": 650,
        "color": "#ffaa44",
        "radius": 150,
        "intensity": 0.8,
        "flicker": true
      }
    ]
  },
  
  "audio": {
    "music": {
      "track": "music/cavern_ambient.ogg",
      "volume": 0.6,
      "loop": true,
      "fadeIn": 2000
    },
    "ambientSounds": [
      {
        "sound": "sfx/water_drip.ogg",
        "volume": 0.3,
        "interval": { "min": 2000, "max": 8000 },
        "spatial": true,
        "position": { "x": 1500, "y": 100 }
      },
      {
        "sound": "sfx/wind_cave.ogg",
        "volume": 0.2,
        "loop": true
      }
    ]
  },
  
  "weather": {
    "type": "none",
    "intensity": 0
  },
  
  "effects": {
    "vignette": {
      "enabled": true,
      "intensity": 0.7,
      "color": "#000000"
    },
    "chromaticAberration": {
      "enabled": false
    },
    "scanlines": {
      "enabled": false
    }
  }
}
```

---

# 11. EXEMPLE COMPLET

Fichier: `level_001_cavern.level.json`

```json
{
  "metadata": {
    "id": "level_001",
    "name": "The Forgotten Cavern",
    "description": "Une caverne abandonnée depuis des siècles, premier pas vers les profondeurs.",
    "author": "Seb",
    "version": "1.0.0",
    "difficulty": "easy",
    "estimatedTime": 180,
    "dimensions": { "width": 3200, "height": 900 },
    "spawn": { "x": 150, "y": 600, "direction": "right" },
    "exit": {
      "x": 3050, "y": 650,
      "targetLevel": "level_002",
      "targetSpawn": "from_cavern"
    },
    "checkpoints": [
      { "id": "cp_01", "x": 1000, "y": 700 },
      { "id": "cp_02", "x": 2200, "y": 650 }
    ],
    "tags": ["cave", "tutorial", "dark"]
  },
  
  "zones": [
    {
      "id": "zone_entrance",
      "name": "Entrée",
      "bounds": { "x": 0, "y": 0, "width": 800, "height": 900 }
    },
    {
      "id": "zone_main",
      "name": "Caverne principale",
      "bounds": { "x": 800, "y": 0, "width": 1600, "height": 900 }
    },
    {
      "id": "zone_exit",
      "name": "Sortie",
      "bounds": { "x": 2400, "y": 0, "width": 800, "height": 900 }
    }
  ],
  
  "tiles": {
    "placements": [
      { "tileId": "ground_rock_01", "gridX": 0, "gridY": 11, "repeat": { "x": 9, "y": 3 } },
      { "tileId": "ground_rock_01", "gridX": 11, "gridY": 12, "repeat": { "x": 5, "y": 2 } },
      { "tileId": "platform_wood_01", "gridX": 5, "gridY": 9, "repeat": { "x": 2, "y": 1 } },
      { "tileId": "platform_wood_01", "gridX": 9, "gridY": 7, "repeat": { "x": 2, "y": 1 } }
    ]
  },
  
  "enemies": {
    "spawns": [
      { "enemyId": "shadow_crawler", "x": 500, "y": 720, "patrol": { "minX": 400, "maxX": 700 } },
      { "enemyId": "shadow_crawler", "x": 1200, "y": 720, "patrol": { "minX": 1100, "maxX": 1400 } },
      { "enemyId": "flying_wisp", "x": 1600, "y": 400 },
      { "enemyId": "flying_wisp", "x": 2000, "y": 350 }
    ]
  },
  
  "collectibles": {
    "placements": [
      { "collectibleId": "essence_small", "x": 300, "y": 550 },
      { "collectibleId": "essence_small", "x": 350, "y": 530 },
      { "collectibleId": "essence_small", "x": 400, "y": 510 },
      { "collectibleId": "essence_large", "x": 1000, "y": 250 },
      { "collectibleId": "health_orb", "x": 1800, "y": 300 },
      { "collectibleId": "map_fragment", "x": 2600, "y": 400, "hidden": true }
    ]
  },
  
  "boostObjects": {
    "placements": [
      { "boostId": "fan_vertical", "x": 600, "y": 750 },
      { "boostId": "spring_pad", "x": 900, "y": 780 },
      { "boostId": "portal_horizontal", "x": 1200, "y": 400, "portalId": "p1", "linkedTo": "p2" },
      { "boostId": "portal_horizontal", "x": 2500, "y": 300, "portalId": "p2", "linkedTo": "p1" },
      { "boostId": "grapple_point", "x": 2100, "y": 250 }
    ]
  },
  
  "hazards": {
    "placements": [
      { "hazardId": "spikes_floor", "x": 650, "y": 768, "repeat": { "x": 2 } },
      { "hazardId": "saw_blade", "x": 1400, "y": 500, "path": [
        { "x": 1400, "y": 500 }, { "x": 1400, "y": 300 }
      ]},
      { "hazardId": "acid_pool", "x": 1900, "y": 770, "width": 150 }
    ]
  },
  
  "interactives": {
    "placements": [
      { "interactiveId": "lever", "x": 800, "y": 720, "id": "lev1", "targets": ["door1"] },
      { "interactiveId": "door_metal", "x": 1100, "y": 622, "id": "door1" },
      { "interactiveId": "save_point", "x": 1000, "y": 670, "checkpointId": "cp_01" },
      { "interactiveId": "save_point", "x": 2200, "y": 620, "checkpointId": "cp_02" },
      { "interactiveId": "npc_hint", "x": 200, "y": 690, "dialog": {
        "lines": ["Bienvenue, voyageur...", "Cette caverne cache bien des secrets."]
      }}
    ]
  },
  
  "ambiance": {
    "global": {
      "backgroundColor": "#08080c",
      "fogDensity": 0.3,
      "lightLevel": 0.4
    },
    "parallax": [
      { "layer": "bg_far", "depth": 0.1, "elements": [{ "type": "stars" }] },
      { "layer": "bg_mid", "depth": 0.3, "elements": [{ "type": "mountains" }] },
      { "layer": "bg_near", "depth": 0.5, "elements": [{ "type": "dead_forest" }] }
    ],
    "particles": {
      "dust": { "enabled": true, "count": 30 },
      "fireflies": { "enabled": true, "count": 15 }
    },
    "audio": {
      "music": { "track": "music/cavern_ambient.ogg", "volume": 0.6 }
    }
  }
}
```

---

# QUICK REFERENCE

## IDs des éléments par catégorie

### Tiles
- `ground_rock_01`, `ground_rock_02`
- `platform_wood_01`, `platform_stone_01`
- `wall_brick_01`, `wall_cave_01`
- `deco_stalactite_01`, `deco_moss_01`

### Ennemis
- `shadow_crawler` (sol, patrol)
- `flying_wisp` (vol, chase)
- `stone_guardian` (boss)

### Collectibles
- `essence_small`, `essence_large` (monnaie)
- `health_orb` (soin)
- `ability_*` (capacités)
- `map_fragment` (exploration)

### Boost Objects
- `portal_horizontal`, `portal_vertical` (téléport)
- `fan_vertical`, `fan_horizontal` (propulsion)
- `spring_pad`, `bounce_mushroom` (rebond)
- `speed_booster` (vitesse)
- `grapple_point` (grappin)
- `cannon` (lancement)
- `zipline_anchor` (tyrolienne)
- `gravity_inverter` (gravité)
- `updraft_zone` (courant d'air)

### Hazards
- `spikes_floor`, `spikes_wall`, `spikes_ceiling`
- `acid_pool`, `lava_pool`
- `saw_blade`, `crusher`
- `laser_beam`, `electric_field`
- `falling_stalactite`
- `fire_pit`

### Interactives
- `lever`, `pressure_plate`, `button` (switches)
- `door_metal`, `door_stone` (portes)
- `moving_platform` (plateformes)
- `breakable_wall` (destructibles)
- `pushable_block` (puzzles)
- `save_point` (checkpoints)
- `npc_hint` (PNJ)

---

*Document généré pour Shadow Drift — v1.0.0*
