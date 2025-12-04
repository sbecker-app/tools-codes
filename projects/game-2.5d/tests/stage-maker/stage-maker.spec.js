/**
 * Tests E2E - Stage Maker
 * Tests de l'éditeur de niveaux
 */
import { test, expect } from '@playwright/test';

const STAGE_MAKER_URL = 'http://localhost:5175';

test.describe('Stage Maker - Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
  });

  test('affiche le titre Stage Maker', async ({ page }) => {
    await expect(page.locator('.toolbar-left__title')).toContainText('Stage Maker');
  });

  test('affiche la toolbar gauche avec les outils', async ({ page }) => {
    await expect(page.locator('.toolbar-left')).toBeVisible();
    await expect(page.locator('.tool-buttons')).toBeVisible();
  });

  test('affiche les blocs de zone', async ({ page }) => {
    await expect(page.locator('.zone-blocks')).toBeVisible();
    await expect(page.locator('.zone-block--forward')).toBeVisible();
    await expect(page.locator('.zone-block--backward')).toBeVisible();
    await expect(page.locator('.zone-block--up')).toBeVisible();
    await expect(page.locator('.zone-block--down')).toBeVisible();
  });

  test('affiche la timeline linéaire', async ({ page }) => {
    await expect(page.locator('.linear-timeline')).toBeVisible();
  });

  test('affiche le bouton d\'ajout de zone', async ({ page }) => {
    await expect(page.locator('#add-zone-btn')).toBeVisible();
  });

  test('affiche les onglets Macro/Micro', async ({ page }) => {
    await expect(page.locator('.tab-btn[data-view="macro"]')).toBeVisible();
    await expect(page.locator('.tab-btn[data-view="micro"]')).toBeVisible();
  });
});

test.describe('Stage Maker - Outils', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
  });

  test('l\'outil sélection est actif par défaut', async ({ page }) => {
    const selectTool = page.locator('.tool-btn[data-tool="select"]');
    await expect(selectTool).toHaveClass(/tool-btn--active/);
  });

  test('permet de changer d\'outil', async ({ page }) => {
    const zoneTool = page.locator('.tool-btn[data-tool="zone"]');
    await zoneTool.click();
    await expect(zoneTool).toHaveClass(/tool-btn--active/);
  });

  test('les raccourcis clavier fonctionnent', async ({ page }) => {
    // Appuyer sur 'z' pour l'outil zone
    await page.keyboard.press('z');
    const zoneTool = page.locator('.tool-btn[data-tool="zone"]');
    await expect(zoneTool).toHaveClass(/tool-btn--active/);

    // Appuyer sur 'v' pour l'outil sélection
    await page.keyboard.press('v');
    const selectTool = page.locator('.tool-btn[data-tool="select"]');
    await expect(selectTool).toHaveClass(/tool-btn--active/);
  });

  test('les tooltips sont présents sur les outils', async ({ page }) => {
    const selectTool = page.locator('.tool-btn[data-tool="select"]');
    const tooltip = await selectTool.getAttribute('data-tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip).toContain('Sélection');
  });
});

test.describe('Stage Maker - Création de zones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
  });

  test('clic sur + crée une nouvelle zone', async ({ page }) => {
    // Vérifier qu'il n'y a pas de zones initialement
    const initialZones = await page.locator('.linear-zone').count();
    expect(initialZones).toBe(0);

    // Cliquer sur le bouton d'ajout
    await page.click('#add-zone-btn');

    // Une zone devrait être créée
    await expect(page.locator('.linear-zone')).toHaveCount(1);
  });

  test('la zone créée a le bon mode', async ({ page }) => {
    // Sélectionner le mode "backward"
    await page.click('.mode-btn[data-mode="backward"]');

    // Créer une zone
    await page.click('#add-zone-btn');

    // Vérifier que la zone a le mode backward
    await expect(page.locator('.linear-zone--backward')).toBeVisible();
  });

  test('créer plusieurs zones les affiche en séquence', async ({ page }) => {
    // Créer 3 zones
    await page.click('#add-zone-btn');
    await page.click('#add-zone-btn');
    await page.click('#add-zone-btn');

    // Vérifier qu'il y a 3 zones
    await expect(page.locator('.linear-zone')).toHaveCount(3);

    // Vérifier les connecteurs
    await expect(page.locator('.linear-connector')).toHaveCount(3); // 2 entre zones + 1 avant le +
  });

  test('le compteur de zones se met à jour', async ({ page }) => {
    await page.click('#add-zone-btn');
    await expect(page.locator('#status-zones')).toContainText('Zones: 1');

    await page.click('#add-zone-btn');
    await expect(page.locator('#status-zones')).toContainText('Zones: 2');
  });
});

test.describe('Stage Maker - Sélection de zones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
    // Créer une zone
    await page.click('#add-zone-btn');
  });

  test('clic sur une zone la sélectionne', async ({ page }) => {
    await page.click('.linear-zone');
    await expect(page.locator('.linear-zone')).toHaveClass(/linear-zone--selected/);
  });

  test('la sélection met à jour le panneau de propriétés', async ({ page }) => {
    await page.click('.linear-zone');

    // Vérifier que l'ID est affiché
    const zoneId = await page.locator('#zone-id').inputValue();
    expect(zoneId).toContain('zone_');
  });

  test('le statut de sélection se met à jour', async ({ page }) => {
    await page.click('.linear-zone');
    await expect(page.locator('#status-selection')).toContainText('Sélection:');
  });
});

test.describe('Stage Maker - Suppression de zones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
    await page.click('#add-zone-btn');
  });

  test('supprimer avec la touche Delete', async ({ page }) => {
    await page.click('.linear-zone');
    await page.keyboard.press('Delete');

    await expect(page.locator('.linear-zone')).toHaveCount(0);
    await expect(page.locator('#status-zones')).toContainText('Zones: 0');
  });

  test('supprimer avec le bouton du panneau', async ({ page }) => {
    await page.click('.linear-zone');
    await page.click('#btn-delete-zone');

    await expect(page.locator('.linear-zone')).toHaveCount(0);
  });
});

test.describe('Stage Maker - Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
  });

  test('les boutons undo/redo sont désactivés initialement', async ({ page }) => {
    await expect(page.locator('#btn-undo')).toBeDisabled();
    await expect(page.locator('#btn-redo')).toBeDisabled();
  });

  test('undo après création de zone', async ({ page }) => {
    await page.click('#add-zone-btn');
    await expect(page.locator('.linear-zone')).toHaveCount(1);

    // Undo devrait être activé
    await expect(page.locator('#btn-undo')).not.toBeDisabled();

    await page.click('#btn-undo');
    await expect(page.locator('.linear-zone')).toHaveCount(0);
  });

  test('redo après undo', async ({ page }) => {
    await page.click('#add-zone-btn');
    await page.click('#btn-undo');

    await expect(page.locator('#btn-redo')).not.toBeDisabled();

    await page.click('#btn-redo');
    await expect(page.locator('.linear-zone')).toHaveCount(1);
  });

  test('raccourci clavier Ctrl+Z pour undo', async ({ page }) => {
    await page.click('#add-zone-btn');
    await page.keyboard.press('Control+z');

    await expect(page.locator('.linear-zone')).toHaveCount(0);
  });
});

test.describe('Stage Maker - Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
    await page.click('#add-zone-btn');
  });

  test('ouvre la modal d\'export', async ({ page }) => {
    await page.click('#btn-export');
    await expect(page.locator('#export-modal')).toBeVisible();
  });

  test('affiche le JSON dans la prévisualisation', async ({ page }) => {
    await page.click('#btn-export');

    const jsonPreview = await page.locator('#export-preview').textContent();
    expect(jsonPreview).toContain('"version"');
    expect(jsonPreview).toContain('"sequence"');
  });

  test('ferme la modal avec le bouton annuler', async ({ page }) => {
    await page.click('#btn-export');
    await page.click('.modal__close');

    await expect(page.locator('#export-modal')).toHaveClass(/hidden/);
  });

  test('le bouton copier fonctionne', async ({ page }) => {
    await page.click('#btn-export');

    // Note: clipboard API peut ne pas fonctionner en headless sans permissions
    // On vérifie juste que le bouton est cliquable
    await expect(page.locator('#btn-copy-json')).toBeVisible();
  });
});

test.describe('Stage Maker - Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
  });

  test('les blocs de zone sont draggables', async ({ page }) => {
    const forwardBlock = page.locator('.zone-block--forward');
    const draggable = await forwardBlock.getAttribute('draggable');
    expect(draggable).toBe('true');
  });

  test('drag & drop crée une zone', async ({ page }) => {
    const forwardBlock = page.locator('.zone-block--forward');
    const dropZone = page.locator('#add-zone-btn');

    // Simuler le drag & drop
    await forwardBlock.dragTo(dropZone);

    // Une zone devrait être créée
    await expect(page.locator('.linear-zone')).toHaveCount(1);
  });
});

test.describe('Stage Maker - Resize de zones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STAGE_MAKER_URL);
    await page.click('#add-zone-btn');
  });

  test('la poignée de resize est présente', async ({ page }) => {
    await expect(page.locator('.linear-zone__resize-handle')).toBeVisible();
  });

  test('la zone a une largeur minimale', async ({ page }) => {
    const zone = page.locator('.linear-zone');
    const box = await zone.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(60);
  });
});
