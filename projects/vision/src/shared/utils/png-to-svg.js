/**
 * PNG to SVG Converter (Tracing)
 * Convertit des images PNG en vrais SVG vectoriels
 *
 * Utilise potrace (npm) pour la vectorisation
 *
 * Installation :
 *   pnpm add potrace
 *
 * Usage CLI :
 *   node png-to-svg.js <input.png> [output.svg] [options]
 *
 * Usage programmatique :
 *   import { pngToSvg } from './png-to-svg.js'
 *   await pngToSvg('sprite.png', 'sprite.svg')
 */

import fs from 'fs';
import path from 'path';

// Import dynamique de potrace
let potraceModule = null;
async function loadPotrace() {
    if (!potraceModule) {
        try {
            potraceModule = await import('potrace');
        } catch {
            throw new Error(
                '❌ La librairie potrace n\'est pas installée.\n' +
                '   Installation : pnpm add potrace'
            );
        }
    }
    return potraceModule.default || potraceModule;
}

/**
 * Convertit un PNG en SVG vectoriel via tracing
 *
 * @param {string} inputPath - Chemin du fichier PNG
 * @param {string} [outputPath] - Chemin du fichier SVG de sortie (auto-généré si non fourni)
 * @param {Object} [options] - Options de tracing
 * @param {number} [options.threshold] - Seuil de binarisation (0-255, défaut: 128)
 * @param {number} [options.turdSize] - Supprime les taches < n pixels (défaut: 2)
 * @param {number} [options.turnPolicy] - Politique de virage (défaut: TURNPOLICY_MINORITY)
 * @param {number} [options.alphaMax] - Coin angulaire max (défaut: 1)
 * @param {boolean} [options.optCurve] - Optimiser les courbes (défaut: true)
 * @param {number} [options.optTolerance] - Tolérance d'optimisation (défaut: 0.2)
 * @param {string} [options.color] - Couleur de remplissage (défaut: 'auto' = couleur dominante)
 * @param {string} [options.background] - Couleur de fond (défaut: 'transparent')
 * @returns {Promise<{svg: string, path: string}>} - SVG généré et chemin du fichier
 */
export async function pngToSvg(inputPath, outputPath = null, options = {}) {
    const potrace = await loadPotrace();

    // Vérifier que le fichier existe
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Fichier non trouvé : ${inputPath}`);
    }

    // Options par défaut
    const traceOptions = {
        threshold: options.threshold ?? 128,
        turdSize: options.turdSize ?? 2,
        turnPolicy: options.turnPolicy ?? potrace.Potrace.TURNPOLICY_MINORITY,
        alphaMax: options.alphaMax ?? 1,
        optCurve: options.optCurve ?? true,
        optTolerance: options.optTolerance ?? 0.2,
        color: options.color ?? 'auto',
        background: options.background ?? 'transparent'
    };

    // Générer le chemin de sortie si non fourni
    const finalOutputPath = outputPath || inputPath.replace(/\.png$/i, '.svg');

    return new Promise((resolve, reject) => {
        potrace.trace(inputPath, traceOptions, (err, svg) => {
            if (err) {
                reject(new Error(`Erreur de tracing : ${err.message}`));
                return;
            }

            // Sauvegarder le SVG
            fs.writeFileSync(finalOutputPath, svg, 'utf-8');

            const stats = fs.statSync(finalOutputPath);
            console.log(`✅ SVG créé : ${finalOutputPath}`);
            console.log(`   Taille : ${(stats.size / 1024).toFixed(2)} KB`);

            resolve({ svg, path: finalOutputPath });
        });
    });
}

/**
 * Convertit un PNG en SVG avec plusieurs couleurs (posterization)
 * Génère des calques séparés pour chaque couleur
 *
 * @param {string} inputPath - Chemin du fichier PNG
 * @param {string} [outputPath] - Chemin du fichier SVG de sortie
 * @param {Object} [options] - Options
 * @param {number} [options.steps] - Nombre de niveaux de couleur (défaut: 4)
 * @param {string} [options.background] - Couleur de fond (défaut: 'transparent')
 * @param {boolean} [options.fillStrategy] - Stratégie de remplissage
 * @returns {Promise<{svg: string, path: string}>}
 */
export async function pngToSvgPosterize(inputPath, outputPath = null, options = {}) {
    const potrace = await loadPotrace();

    if (!fs.existsSync(inputPath)) {
        throw new Error(`Fichier non trouvé : ${inputPath}`);
    }

    const posterizeOptions = {
        steps: options.steps ?? 4,
        background: options.background ?? 'transparent',
        fillStrategy: options.fillStrategy ?? potrace.Potrace.FILL_DOMINANT
    };

    const finalOutputPath = outputPath || inputPath.replace(/\.png$/i, '.svg');

    return new Promise((resolve, reject) => {
        potrace.posterize(inputPath, posterizeOptions, (err, svg) => {
            if (err) {
                reject(new Error(`Erreur de posterization : ${err.message}`));
                return;
            }

            fs.writeFileSync(finalOutputPath, svg, 'utf-8');

            const stats = fs.statSync(finalOutputPath);
            console.log(`✅ SVG multi-couleurs créé : ${finalOutputPath}`);
            console.log(`   Taille : ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   Niveaux : ${posterizeOptions.steps}`);

            resolve({ svg, path: finalOutputPath });
        });
    });
}

/**
 * Convertit plusieurs PNG en SVG
 *
 * @param {string[]} inputPaths - Liste des chemins PNG
 * @param {string} outputDir - Dossier de sortie
 * @param {Object} [options] - Options de conversion
 * @returns {Promise<string[]>} - Liste des chemins SVG créés
 */
export async function batchPngToSvg(inputPaths, outputDir, options = {}) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = [];
    const usePosterize = options.posterize ?? false;
    const convertFn = usePosterize ? pngToSvgPosterize : pngToSvg;

    for (const inputPath of inputPaths) {
        const baseName = path.basename(inputPath, '.png');
        const outputPath = path.join(outputDir, `${baseName}.svg`);

        try {
            await convertFn(inputPath, outputPath, options);
            results.push(outputPath);
        } catch (error) {
            console.error(`❌ Erreur pour ${inputPath}: ${error.message}`);
        }
    }

    console.log(`\n📊 Résumé : ${results.length}/${inputPaths.length} fichiers convertis`);
    return results;
}

// ============================================
// CLI
// ============================================

function printUsage() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              PNG to SVG Converter (Tracing)                ║
╚════════════════════════════════════════════════════════════╝

Usage:
  node png-to-svg.js <input.png> [output.svg] [options]

Options:
  --threshold=128     Seuil de binarisation (0-255)
  --color=#000000     Couleur de remplissage
  --background=none   Couleur de fond (none = transparent)
  --turdSize=2        Supprimer les petites taches
  --posterize         Mode multi-couleurs
  --steps=4           Nombre de niveaux (avec --posterize)

Exemples:
  node png-to-svg.js sprite.png
  node png-to-svg.js sprite.png sprite.svg --threshold=100
  node png-to-svg.js character.png --posterize --steps=6
  node png-to-svg.js logo.png logo.svg --color="#FF0000"
`);
}

function parseArgs(args) {
    const files = [];
    const options = {};

    for (const arg of args) {
        if (arg === '-h' || arg === '--help') {
            printUsage();
            process.exit(0);
        } else if (arg === '--posterize') {
            options.posterize = true;
        } else if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            if (value === undefined) {
                options[key] = true;
            } else if (!isNaN(value)) {
                options[key] = parseFloat(value);
            } else {
                options[key] = value;
            }
        } else {
            files.push(arg);
        }
    }

    return { files, options };
}

// Exécution CLI
const isMainModule = process.argv[1]?.includes('png-to-svg');

if (isMainModule && process.argv.length > 2) {
    const { files, options } = parseArgs(process.argv.slice(2));

    if (files.length === 0) {
        printUsage();
        process.exit(1);
    }

    const inputPath = files[0];
    const outputPath = files[1] || null;

    const convertFn = options.posterize ? pngToSvgPosterize : pngToSvg;

    convertFn(inputPath, outputPath, options)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(`❌ ${error.message}`);
            process.exit(1);
        });
} else if (isMainModule) {
    printUsage();
}

export default pngToSvg;
