# Mise à jour des spécifications

Met à jour les specs pour l'application spécifiée : $ARGUMENTS

## Instructions

1. Lire le fichier de spec correspondant :
   - `game` → `specs/SPEC_game.md`
   - `stage-maker` → `specs/SPEC_stage-maker.md`
   - `backoffice` → `specs/SPEC_backoffice.md`
   - `characters` → `specs/SPEC_characters.md`

2. Identifier les sections qui doivent être mises à jour basé sur la conversation en cours

3. Proposer les modifications sous forme de diff :
   ```diff
   - Ancienne version
   + Nouvelle version
   ```

4. Demander validation AVANT de sauvegarder :
   ```
   📋 Mise à jour proposée pour SPEC_xxx.md

   Section(s) modifiée(s) :
   - [nom section 1]
   - [nom section 2]

   ✅ Valider cette mise à jour ? (oui/non)
   ```

5. Si validé, mettre à jour le fichier et confirmer :
   ```
   ✅ Specs mises à jour : specs/SPEC_xxx.md
   ```
