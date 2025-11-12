const https = require('https');
const fs = require('fs');

// Fonction pour faire une requête à l'API Dosuku
function fetchSudoku(difficulty) {
  return new Promise((resolve, reject) => {
    const url = `https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{value,solution,difficulty}}}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Convertir une grille 2D en array 1D
function flatten2DGrid(grid) {
  const result = [];
  for (let row of grid) {
    for (let cell of row) {
      result.push(cell === 0 ? null : cell);
    }
  }
  return result;
}

// Mapper les difficultés de l'API aux niveaux demandés
function mapDifficulty(apiDifficulty) {
  const mapping = {
    'Easy': 'facile',
    'Medium': 'moyen',
    'Hard': 'dur'
  };
  return mapping[apiDifficulty] || apiDifficulty.toLowerCase();
}

// Attendre un délai
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Générer les grilles pour un niveau
async function generateGridsForLevel(targetLevel, count) {
  const grids = [];
  const apiDifficultyMap = {
    'facile': 'Easy',
    'moyen': 'Medium',
    'dur': 'Hard',
    'inhumain': 'Hard' // On utilisera Hard pour inhumain aussi
  };

  console.log(`Récupération de ${count} grilles niveau ${targetLevel}...`);

  for (let i = 0; i < count; i++) {
    try {
      const data = await fetchSudoku(apiDifficultyMap[targetLevel]);

      if (data.newboard && data.newboard.grids && data.newboard.grids.length > 0) {
        const grid = data.newboard.grids[0];

        grids.push({
          level: targetLevel,
          inline: flatten2DGrid(grid.value),
          resolved: flatten2DGrid(grid.solution)
        });

        if ((i + 1) % 10 === 0) {
          console.log(`  ${i + 1}/${count} grilles récupérées pour ${targetLevel}`);
        }

        // Pause pour ne pas surcharger l'API
        await delay(100);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération: ${error.message}`);
      i--; // Réessayer
      await delay(500);
    }
  }

  return grids;
}

// Générer toutes les grilles
async function generateAllGrids() {
  const allGrids = [];
  const levels = ['facile', 'moyen', 'dur', 'inhumain'];

  console.log('Début de la récupération des grilles de sudoku...\n');

  for (const level of levels) {
    const grids = await generateGridsForLevel(level, 100);
    allGrids.push(...grids);
  }

  return allGrids;
}

// Exécuter
(async () => {
  const startTime = Date.now();

  try {
    const allGrids = await generateAllGrids();

    const outputPath = '/Users/frx33355/Documents/dev/mcp/sudoku-grids.json';
    fs.writeFileSync(outputPath, JSON.stringify(allGrids, null, 2));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✓ ${allGrids.length} grilles récupérées en ${duration}s`);
    console.log(`✓ Fichier sauvegardé: ${outputPath}`);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();
