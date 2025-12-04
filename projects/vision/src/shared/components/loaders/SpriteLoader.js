/**
 * SpriteLoader - Chargeur d'images pour Game 2.5D
 * Permet de charger des images et de les stocker dans un objet global Assets
 */

// Stockage global des assets chargés
export const Assets = {};

export class SpriteLoader {
  /**
   * Charge une liste d'images
   * @param {Object} imageList - { nom: url, ... }
   * @returns {Promise<void>}
   */
  static loadImages(imageList) {
    const promises = [];

    for (const [name, url] of Object.entries(imageList)) {
      promises.push(new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;

        img.onload = () => {
          Assets[name] = img;
          console.log(`✅ Chargé : ${name}`);
          resolve({ name, img, success: true });
        };

        img.onerror = () => {
          console.error(`❌ Impossible de charger : ${url}`);
          reject({ name, url, success: false });
        };
      }));
    }

    return Promise.all(promises);
  }

  /**
   * Charge une seule image
   * @param {string} name - Nom de l'asset
   * @param {string} url - URL de l'image
   * @returns {Promise<HTMLImageElement>}
   */
  static loadImage(name, url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;

      img.onload = () => {
        Assets[name] = img;
        console.log(`✅ Chargé : ${name}`);
        resolve(img);
      };

      img.onerror = () => {
        console.error(`❌ Impossible de charger : ${url}`);
        reject(new Error(`Failed to load: ${url}`));
      };
    });
  }

  /**
   * Charge les images depuis un dossier (via une liste de fichiers)
   * @param {string} basePath - Chemin de base
   * @param {string[]} fileNames - Liste des noms de fichiers
   * @returns {Promise<void>}
   */
  static loadFromFolder(basePath, fileNames) {
    const imageList = {};

    fileNames.forEach(fileName => {
      // Nom sans extension comme clé
      const name = fileName.replace(/\.[^.]+$/, '');
      imageList[name] = `${basePath}/${fileName}`;
    });

    return this.loadImages(imageList);
  }

  /**
   * Charge les images depuis un manifeste JSON
   * @param {string} manifestUrl - URL du fichier manifeste
   * @returns {Promise<void>}
   */
  static async loadFromManifest(manifestUrl) {
    try {
      const response = await fetch(manifestUrl);
      const manifest = await response.json();

      const imageList = {};

      for (const asset of manifest.assets || manifest) {
        const name = asset.name || asset.id;
        const url = asset.url || asset.file || asset.path;
        if (name && url) {
          imageList[name] = url;
        }
      }

      return this.loadImages(imageList);
    } catch (error) {
      console.error('❌ Erreur chargement manifeste:', error);
      throw error;
    }
  }

  /**
   * Récupère un asset chargé
   * @param {string} name - Nom de l'asset
   * @returns {HTMLImageElement|undefined}
   */
  static get(name) {
    return Assets[name];
  }

  /**
   * Vérifie si un asset est chargé
   * @param {string} name - Nom de l'asset
   * @returns {boolean}
   */
  static has(name) {
    return name in Assets;
  }

  /**
   * Retourne tous les assets chargés
   * @returns {Object}
   */
  static getAll() {
    return { ...Assets };
  }

  /**
   * Supprime un asset
   * @param {string} name - Nom de l'asset
   */
  static remove(name) {
    delete Assets[name];
  }

  /**
   * Vide tous les assets
   */
  static clear() {
    for (const key in Assets) {
      delete Assets[key];
    }
  }

  /**
   * Retourne le nombre d'assets chargés
   * @returns {number}
   */
  static count() {
    return Object.keys(Assets).length;
  }
}

export default SpriteLoader;
