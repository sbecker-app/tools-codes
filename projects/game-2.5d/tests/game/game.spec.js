/**
 * Tests E2E - Game 2.5D
 * Tests du jeu principal
 */
import { test, expect } from '@playwright/test';

test.describe('Game - Écran titre', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('affiche le titre du jeu', async ({ page }) => {
    await expect(page.locator('.title-screen h1')).toContainText('Game 2.5D');
  });

  test('affiche le bouton Jouer', async ({ page }) => {
    const playButton = page.locator('#btn-play');
    await expect(playButton).toBeVisible();
    await expect(playButton).toContainText('Jouer');
  });

  test('affiche le bouton Options', async ({ page }) => {
    const optionsButton = page.locator('#btn-options');
    await expect(optionsButton).toBeVisible();
  });

  test('navigue vers la sélection de personnage au clic sur Jouer', async ({ page }) => {
    await page.click('#btn-play');

    // Attendre que l'écran de sélection soit visible
    await expect(page.locator('.select-screen')).toBeVisible();
  });
});

test.describe('Game - Sélection de personnage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-play');
    await page.waitForSelector('.select-screen');
  });

  test('affiche les deux personnages', async ({ page }) => {
    await expect(page.locator('[data-character="prince"]')).toBeVisible();
    await expect(page.locator('[data-character="princess"]')).toBeVisible();
  });

  test('permet de sélectionner le prince', async ({ page }) => {
    await page.click('[data-character="prince"]');
    await expect(page.locator('[data-character="prince"]')).toHaveClass(/selected|active/);
  });

  test('permet de sélectionner la princesse', async ({ page }) => {
    await page.click('[data-character="princess"]');
    await expect(page.locator('[data-character="princess"]')).toHaveClass(/selected|active/);
  });

  test('affiche le bouton retour', async ({ page }) => {
    const backButton = page.locator('#btn-back');
    await expect(backButton).toBeVisible();
  });

  test('retourne à l\'écran titre au clic sur retour', async ({ page }) => {
    await page.click('#btn-back');
    await expect(page.locator('.title-screen')).toBeVisible();
  });
});

test.describe('Game - Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-play');
    await page.waitForSelector('.select-screen');
    await page.click('[data-character="prince"]');
    await page.click('#btn-start');
    // Attendre que le jeu démarre
    await page.waitForTimeout(500);
  });

  test('le canvas de jeu est visible', async ({ page }) => {
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('le jeu répond aux touches du clavier', async ({ page }) => {
    // Simuler une pression de touche
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Le jeu devrait continuer à fonctionner (pas de crash)
    await expect(page.locator('#game-canvas')).toBeVisible();
  });

  test('pause avec la touche Escape', async ({ page }) => {
    await page.keyboard.press('Escape');

    // Le menu pause devrait apparaître
    await expect(page.locator('.pause-menu, .game-paused')).toBeVisible();
  });
});

test.describe('Game - Accessibilité', () => {
  test('la page a un titre', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/Game 2.5D/);
  });

  test('les boutons sont focusables au clavier', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Tab vers le premier bouton
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
