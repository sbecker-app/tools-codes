#!/usr/bin/env node

/**
 * Parser de fichiers CAF/CAFAL
 * Analyse les fichiers CAF reçus de la Caisse d'Allocations Familiales
 */

const fs = require('fs');
const path = require('path');

// Mapping des positions de champs selon les constantes du code
const FIELDS_MAPPING = {
  TYPE: { START: 4, END: 7 },
  DEPARTMENT: { START: 7, END: 9 },
  MONTH: { START: 20, END: 22 },
  YEAR: { START: 22, END: 24 },
  CODE_LESSOR: { START: 10, END: 15 },
  CODE_CAF: { START: 36, END: 51 },
  NAME: { START: 51, END: 71 },
  FIRST_NAME: { START: 71, END: 83 },
  YEAR_TENANT: { START: 83, END: 85 },
  MONTH_TENANT: { START: 85, END: 87 },
  AMOUNT: { START: 91, END: 102 },
  AMOUNT_RETENUE: { START: 102, END: 113 },
  TOTAL_AMOUNT: { START: 91, END: 102 },
  TOTAL_AMOUNT_RETENUE: { START: 102, END: 113 }
};

const PREFIXES = {
  EMITTER: '0302',
  DETAIL: '0602',
  SUB_TOTAL: '0702',
  TOTAL: '0802'
};

const TYPE_CAF = {
  '999': 'AL',
  '900': 'APL'
};

function parseFileCAF(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Analyse du fichier: ${fileName}`);
  console.log('='.repeat(80));

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  const emitterLines = lines.filter(l => l.startsWith(PREFIXES.EMITTER));
  const detailLines = lines.filter(l => l.startsWith(PREFIXES.DETAIL));
  const totalLines = lines.filter(l => l.startsWith(PREFIXES.TOTAL));

  // Parse header
  const headers = emitterLines.map(line => ({
    type: TYPE_CAF[line.substring(FIELDS_MAPPING.TYPE.START, FIELDS_MAPPING.TYPE.END)] || 'UNKNOWN',
    department: line.substring(FIELDS_MAPPING.DEPARTMENT.START, FIELDS_MAPPING.DEPARTMENT.END),
    month: line.substring(FIELDS_MAPPING.MONTH.START, FIELDS_MAPPING.MONTH.END),
    year: '20' + line.substring(FIELDS_MAPPING.YEAR.START, FIELDS_MAPPING.YEAR.END),
    codeLessor: line.substring(FIELDS_MAPPING.CODE_LESSOR.START, FIELDS_MAPPING.CODE_LESSOR.END),
    rawLine: line
  }));

  // Parse details
  const details = detailLines.map(line => {
    const amountRaw = parseFloat(line.substring(FIELDS_MAPPING.AMOUNT.START, FIELDS_MAPPING.AMOUNT.END).trim());
    const retenueRaw = parseFloat(line.substring(FIELDS_MAPPING.AMOUNT_RETENUE.START, FIELDS_MAPPING.AMOUNT_RETENUE.END).trim());

    return {
      codeCAF: line.substring(FIELDS_MAPPING.CODE_CAF.START, FIELDS_MAPPING.CODE_CAF.END).trim(),
      name: line.substring(FIELDS_MAPPING.NAME.START, FIELDS_MAPPING.NAME.END).trim(),
      firstName: line.substring(FIELDS_MAPPING.FIRST_NAME.START, FIELDS_MAPPING.FIRST_NAME.END).trim(),
      month: line.substring(FIELDS_MAPPING.MONTH_TENANT.START, FIELDS_MAPPING.MONTH_TENANT.END),
      year: '20' + line.substring(FIELDS_MAPPING.YEAR_TENANT.START, FIELDS_MAPPING.YEAR_TENANT.END),
      amount: amountRaw / 100, // Les montants sont en centimes
      retenue: retenueRaw / 100
    };
  });

  // Parse totals
  const totals = totalLines.map(line => {
    const totalAmount = parseFloat(line.substring(FIELDS_MAPPING.TOTAL_AMOUNT.START, FIELDS_MAPPING.TOTAL_AMOUNT.END).trim());
    const totalRetenue = parseFloat(line.substring(FIELDS_MAPPING.TOTAL_AMOUNT_RETENUE.START, FIELDS_MAPPING.TOTAL_AMOUNT_RETENUE.END).trim());

    return {
      totalAmount: totalAmount / 100,
      totalRetenue: totalRetenue / 100
    };
  });

  return {
    fileName,
    headers,
    details,
    totals,
    stats: {
      emitterLines: emitterLines.length,
      detailLines: detailLines.length,
      totalLines: totalLines.length
    }
  };
}

function displayResults(parsedFiles) {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    RÉSUMÉ DES FICHIERS CAF À INTÉGRER                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  let grandTotalAmount = 0;
  let grandTotalRetenue = 0;
  let grandTotalRecipients = 0;

  parsedFiles.forEach((parsed, index) => {
    console.log(`\n${index + 1}. ${parsed.fileName}`);
    console.log('─'.repeat(80));

    // Headers info
    if (parsed.headers.length > 0) {
      const header = parsed.headers[0];
      console.log(`   Type: ${header.type} | Département: ${header.department} | Période: ${header.month}/${header.year}`);
      console.log(`   Code bailleur: ${header.codeLessor}`);
    }

    // Stats
    console.log(`   Nombre d'enregistrements: ${parsed.stats.detailLines}`);

    // Totals
    const fileTotal = parsed.totals.reduce((sum, t) => sum + t.totalAmount, 0);
    const fileRetenue = parsed.totals.reduce((sum, t) => sum + t.totalRetenue, 0);

    console.log(`   Montant total (versements): ${fileTotal.toFixed(2)} €`);
    console.log(`   Montant total (retenues):   ${fileRetenue.toFixed(2)} €`);
    console.log(`   Montant net:                ${(fileTotal - fileRetenue).toFixed(2)} €`);

    // Breakdown by type
    const paymentsMonthly = parsed.headers.filter(h => h.rawLine.includes('PAIEMENTS MENSUELS'));
    const paymentsRegul = parsed.headers.filter(h => h.rawLine.includes('REGULARISATION'));

    if (paymentsMonthly.length > 0) {
      const monthlyDetails = parsed.details.filter((_, i) => i < parsed.details.length / 2);
      const monthlyAmount = monthlyDetails.reduce((sum, d) => sum + d.amount, 0);
      console.log(`     • Paiements mensuels: ${monthlyAmount.toFixed(2)} € (${monthlyDetails.length} bénéficiaires)`);
    }

    if (paymentsRegul.length > 0) {
      const regulDetails = parsed.details.filter((_, i) => i >= parsed.details.length / 2);
      const regulAmount = regulDetails.reduce((sum, d) => sum + d.amount, 0);
      console.log(`     • Régularisations: ${regulAmount.toFixed(2)} € (${regulDetails.length} bénéficiaires)`);
    }

    grandTotalAmount += fileTotal;
    grandTotalRetenue += fileRetenue;
    grandTotalRecipients += parsed.stats.detailLines;
  });

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              TOTAUX GÉNÉRAUX                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`   Nombre total de bénéficiaires: ${grandTotalRecipients}`);
  console.log(`   Montant total des versements:  ${grandTotalAmount.toFixed(2)} €`);
  console.log(`   Montant total des retenues:    ${grandTotalRetenue.toFixed(2)} €`);
  console.log(`   ─────────────────────────────────────────────────────────────────────────`);
  console.log(`   MONTANT NET À INTÉGRER:        ${(grandTotalAmount - grandTotalRetenue).toFixed(2)} €`);
  console.log('');

  return {
    totalAmount: grandTotalAmount,
    totalRetenue: grandTotalRetenue,
    netAmount: grandTotalAmount - grandTotalRetenue,
    totalRecipients: grandTotalRecipients
  };
}

// Main
const files = [
  '/Users/frx33355/Downloads/CAF841_2025110790626_0601.txt',
  '/Users/frx33355/Downloads/CAFAL301_2025103090703_0601.txt',
  '/Users/frx33355/Downloads/CAFAL841_2025103090710_0601.txt'
];

const parsedFiles = files.map(file => {
  try {
    return parseFileCAF(file);
  } catch (error) {
    console.error(`❌ Erreur lors du parsing de ${file}:`, error.message);
    return null;
  }
}).filter(Boolean);

displayResults(parsedFiles);
