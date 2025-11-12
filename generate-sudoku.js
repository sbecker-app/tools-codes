const fs = require('fs');

// Fonction pour vérifier si un nombre peut être placé à une position
function isValid(board, row, col, num) {
  // Vérifier la ligne
  for (let x = 0; x < 9; x++) {
    if (board[row * 9 + x] === num) return false;
  }

  // Vérifier la colonne
  for (let x = 0; x < 9; x++) {
    if (board[x * 9 + col] === num) return false;
  }

  // Vérifier le carré 3x3
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[(startRow + i) * 9 + (startCol + j)] === num) return false;
    }
  }

  return true;
}

// Fonction pour résoudre le sudoku (backtracking)
function solveSudoku(board) {
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) {
      const row = Math.floor(i / 9);
      const col = i % 9;

      // Essayer les nombres de 1 à 9 dans un ordre aléatoire
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

      for (let num of numbers) {
        if (isValid(board, row, col, num)) {
          board[i] = num;

          if (solveSudoku(board)) {
            return true;
          }

          board[i] = 0;
        }
      }

      return false;
    }
  }
  return true;
}

// Générer une grille complète de sudoku
function generateCompleteGrid() {
  const board = new Array(81).fill(0);
  solveSudoku(board);
  return board;
}

// Créer une grille de jeu en retirant des cases
function createPuzzle(solved, difficulty) {
  const puzzle = [...solved];
  let cellsToRemove;

  // Définir le nombre de cases à remplir selon la difficulté
  switch(difficulty) {
    case 'facile':
      cellsToRemove = 81 - (40 + Math.floor(Math.random() * 6)); // 40-45 remplies
      break;
    case 'moyen':
      cellsToRemove = 81 - (30 + Math.floor(Math.random() * 6)); // 30-35 remplies
      break;
    case 'dur':
      cellsToRemove = 81 - (25 + Math.floor(Math.random() * 5)); // 25-29 remplies
      break;
    case 'inhumain':
      cellsToRemove = 81 - (20 + Math.floor(Math.random() * 5)); // 20-24 remplies
      break;
    default:
      cellsToRemove = 40;
  }

  // Retirer des cases aléatoirement
  const positions = Array.from({length: 81}, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < cellsToRemove; i++) {
    puzzle[positions[i]] = null;
  }

  return puzzle;
}

// Générer toutes les grilles
function generateAllGrids() {
  const grids = [];
  const levels = ['facile', 'moyen', 'dur', 'inhumain'];

  console.log('Génération des grilles de sudoku...');

  for (const level of levels) {
    console.log(`Génération de 100 grilles niveau ${level}...`);

    for (let i = 0; i < 100; i++) {
      const resolved = generateCompleteGrid();
      const inline = createPuzzle(resolved, level);

      grids.push({
        level: level,
        inline: inline,
        resolved: resolved
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  ${i + 1}/100 grilles générées pour ${level}`);
      }
    }
  }

  return grids;
}

// Générer et sauvegarder
console.log('Début de la génération...\n');
const startTime = Date.now();

const allGrids = generateAllGrids();

const outputPath = '/Users/frx33355/Documents/dev/mcp/sudoku-grids.json';
fs.writeFileSync(outputPath, JSON.stringify(allGrids, null, 2));

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n✓ ${allGrids.length} grilles générées en ${duration}s`);
console.log(`✓ Fichier sauvegardé: ${outputPath}`);
