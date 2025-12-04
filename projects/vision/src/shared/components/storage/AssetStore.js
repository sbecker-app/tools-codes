/**
 * AssetStore - Stockage IndexedDB pour les assets
 * Remplace localStorage pour supporter les images volumineuses
 */

const DB_NAME = 'game25d_db';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

class AssetStoreClass {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  /**
   * Initialise la connexion IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB: Erreur ouverture');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB: Connecté');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Créer le store si inexistant
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('theme', 'theme', { unique: false });
          store.createIndex('name', 'name', { unique: false });
          console.log('✅ IndexedDB: Store créé');
        }
      };
    });
  }

  /**
   * Attend que la DB soit prête
   */
  async waitReady() {
    await this.ready;
  }

  /**
   * Récupère tous les assets
   * @returns {Promise<Array>}
   */
  async getAll() {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Récupère un asset par ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async get(id) {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ajoute ou met à jour un asset
   * @param {Object} asset
   * @returns {Promise<void>}
   */
  async put(asset) {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(asset);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ajoute plusieurs assets
   * @param {Array} assets
   * @returns {Promise<void>}
   */
  async putMany(assets) {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      assets.forEach(asset => store.put(asset));
    });
  }

  /**
   * Supprime un asset
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Vide tous les assets
   * @returns {Promise<void>}
   */
  async clear() {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Compte les assets
   * @returns {Promise<number>}
   */
  async count() {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Recherche par index
   * @param {string} indexName - 'category', 'theme', ou 'name'
   * @param {string} value
   * @returns {Promise<Array>}
   */
  async findByIndex(indexName, value) {
    await this.waitReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Migration depuis localStorage (si données existantes)
   * @returns {Promise<number>} Nombre d'assets migrés
   */
  async migrateFromLocalStorage() {
    const saved = localStorage.getItem('game25d_assets');
    if (!saved) return 0;

    try {
      const assets = JSON.parse(saved);
      if (assets.length > 0) {
        await this.putMany(assets);
        localStorage.removeItem('game25d_assets');
        console.log(`✅ Migration: ${assets.length} assets migrés vers IndexedDB`);
        return assets.length;
      }
    } catch (e) {
      console.error('❌ Erreur migration:', e);
    }
    return 0;
  }
}

// Singleton
export const AssetStore = new AssetStoreClass();
export default AssetStore;
