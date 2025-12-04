# Chapitres de l'Histoire

> Structure narrative du jeu - À compléter progressivement

---

## Structure Globale

```
PROLOGUE
    │
    ▼
CHAPITRE 1: L'Éveil
    │
    ▼
CHAPITRE 2: [À définir]
    │
    ▼
... (autres chapitres)
    │
    ▼
ÉPILOGUE
```

---

## Prologue

### Titre
*L'Éveil du Robot*

### Résumé
Le Prince/La Princesse découvre un robot ancien dans les ruines près du château et le réactive accidentellement.

### Scènes
1. **Exploration des ruines** - Le personnage explore seul
2. **Découverte** - Trouve le Robot inactif
3. **Activation** - Le Robot s'éveille
4. **Présentation** - Premier dialogue, le Robot devient compagnon

### Gameplay
- Tutoriel des contrôles de base
- Présentation du système de navigation
- Introduction de l'interface

---

## Chapitre 1: L'Éveil

### Titre
*Les Premiers Pas*

### Zones
- Forêt Enchantée (modes: FORWARD, UP)

### Objectifs
1. Traverser la forêt avec le Robot
2. Apprendre les mécaniques de base
3. Découvrir le premier mécanisme ancien

### Événements Narratifs
- Le Robot partage des fragments de mémoire
- Premier indice sur le passé du royaume
- Rencontre avec un habitant du village

### Dialogues Clés
```
[À écrire]
```

---

## Chapitres Suivants

> À définir selon le développement du jeu

### Idées de Thèmes
- [ ] Chapitre 2: Le Village - Rencontre avec les habitants
- [ ] Chapitre 3: Les Cavernes - Exploration souterraine
- [ ] Chapitre 4: Le Château - Retour au foyer avec de nouvelles connaissances
- [ ] Chapitre 5: La Tour Céleste - Climax de l'histoire

---

## Système de Progression Narrative

### Déclencheurs de Dialogue
Les dialogues sont déclenchés par:
- Position dans le niveau (zones trigger)
- Objets collectés
- Actions spécifiques
- Premier passage dans une zone

### Format des Dialogues
```json
{
  "id": "dialog_001",
  "chapter": 1,
  "trigger": {
    "type": "zone",
    "zoneId": "zone_001",
    "position": { "x": 500, "y": 600 }
  },
  "speakers": ["robot"],
  "lines": [
    { "speaker": "robot", "text": "Bip boop ! Cette forêt me semble familière..." },
    { "speaker": "robot", "text": "Mes mémoires sont floues, mais je sens que nous sommes sur la bonne voie." }
  ],
  "once": true
}
```

---

## Notes de Développement

### Ton de l'Histoire
- Aventure légère, adaptée aux enfants
- Mystère sans être effrayant
- Moments d'humour (souvent via le Robot)
- Messages positifs (amitié, courage, curiosité)

### Thèmes Récurrents
- L'amitié entre le personnage et le Robot
- La redécouverte du passé
- L'importance de la curiosité
- Travailler ensemble pour résoudre les problèmes

### Points à Décider
- [ ] Y a-t-il un antagoniste ?
- [ ] Quel est l'objectif final du joueur ?
- [ ] Comment se termine l'histoire ?
- [ ] Le Robot retrouve-t-il ses mémoires complètes ?
