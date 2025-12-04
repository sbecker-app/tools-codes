# Personnages

> Définition des personnages principaux et secondaires

---

## Personnages Jouables

### Le Prince
| Attribut | Valeur |
|----------|--------|
| **Nom** | *À définir* |
| **Âge** | ~10 ans |
| **Apparence** | Garçon blond aux yeux bleus |
| **Personnalité** | Courageux, curieux, un peu téméraire |
| **Capacités** | Standard (course, saut, escalade) |

#### Background
Héritier du royaume, le Prince est fasciné par les mystères du passé et les machines anciennes. C'est lui qui a réactivé le Robot Ami en explorant les ruines près du château.

#### Relations
- **Princesse** : Sa sœur (ou amie proche)
- **Robot Ami** : Son compagnon fidèle qu'il a réveillé

---

### La Princesse
| Attribut | Valeur |
|----------|--------|
| **Nom** | *À définir* |
| **Âge** | ~10 ans |
| **Apparence** | *À définir* |
| **Personnalité** | Intelligente, réfléchie, déterminée |
| **Capacités** | Standard (course, saut, escalade) |

#### Background
*À développer*

#### Relations
- **Prince** : Son frère (ou ami proche)
- **Robot Ami** : Compagnon partagé

---

## Compagnon

### Le Robot Ami
| Attribut | Valeur |
|----------|--------|
| **Nom** | *À définir* (ou simplement "Robot") |
| **Origine** | Civilisation ancienne |
| **Apparence** | Petit robot rondouillard, amical |
| **Personnalité** | Loyal, serviable, parfois maladroit |
| **Rôle** | PNJ accompagnateur, aide contextuelle |

#### Capacités
- **Éclairage** : Peut illuminer les zones sombres
- **Scanner** : Détecte les mécanismes cachés
- **Communication** : Interface avec les machines anciennes
- **Aide** : Fournit des indices au joueur

#### Comportements
- Suit toujours le personnage principal
- Réagit à l'environnement (joie, peur, curiosité)
- Intervient lors de moments clés de l'histoire
- Peut être "appelé" pour obtenir de l'aide

#### Background
Créé par la civilisation ancienne comme assistant et gardien. A été mis en veille pendant des siècles avant d'être réactivé par le Prince. Ses mémoires sont fragmentées, ce qui permet de révéler l'histoire progressivement.

---

## Personnages Secondaires

### À définir
- Habitants du village
- Gardiens des zones
- Antagoniste(s) potentiel(s)

---

## États d'Animation par Personnage

### États Communs (Prince & Princesse)
| État | Description | Modes |
|------|-------------|-------|
| `idle` | Repos, attente | Tous |
| `walk` | Marche | forward, backward |
| `run` | Course | forward, backward |
| `jump` | Saut | forward, backward |
| `fall` | Chute | Tous |
| `climb` | Escalade | up, down |
| `interact` | Interaction objet | Tous |
| `hurt` | Touché | Tous |
| `victory` | Célébration | Tous |

### États Robot Ami
| État | Description |
|------|-------------|
| `idle` | Flotte sur place |
| `follow` | Suit le joueur |
| `scan` | Analyse un objet |
| `talk` | Communication |
| `happy` | Joie |
| `worried` | Inquiétude |
| `help` | Fournit une aide |

---

## Notes de Design

### Différences visuelles Prince/Princesse
Les deux personnages doivent être clairement identifiables mais partager une cohérence visuelle (même univers, même style).

### Personnalisation future
- Tenues alternatives ?
- Accessoires débloquables ?
- Capacités uniques par personnage ?

---

## Dialogues et Voix

### Style de dialogue
- Texte simple, adapté aux enfants
- Bulles de dialogue illustrées
- Robot utilise un style légèrement robotique mais attachant

### Exemples de répliques Robot
- "Bip boop ! J'ai trouvé quelque chose d'intéressant !"
- "Mes capteurs détectent un passage secret..."
- "Attention ! Danger détecté !"
- "Ensemble, nous pouvons y arriver !"
