#!/usr/bin/env node

/**
 * Parser de fichiers CAF/CAFAL vers JSON
 * Convertit les fichiers CAF en format JSON structuré
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
  console.log(`📄 Parsing: ${fileName}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  const emitterLines = lines.filter(l => l.startsWith(PREFIXES.EMITTER));
  const detailLines = lines.filter(l => l.startsWith(PREFIXES.DETAIL));
  const totalLines = lines.filter(l => l.startsWith(PREFIXES.TOTAL));

  // Parse headers
  const headers = emitterLines.map(line => {
    const typeCode = line.substring(FIELDS_MAPPING.TYPE.START, FIELDS_MAPPING.TYPE.END);
    const description = line.substring(113).trim(); // Description après les champs fixes

    return {
      prefix: line.substring(0, 4),
      type: TYPE_CAF[typeCode] || typeCode,
      typeCode: typeCode,
      department: line.substring(FIELDS_MAPPING.DEPARTMENT.START, FIELDS_MAPPING.DEPARTMENT.END),
      codeLessor: line.substring(FIELDS_MAPPING.CODE_LESSOR.START, FIELDS_MAPPING.CODE_LESSOR.END),
      month: parseInt(line.substring(FIELDS_MAPPING.MONTH.START, FIELDS_MAPPING.MONTH.END)),
      year: parseInt('20' + line.substring(FIELDS_MAPPING.YEAR.START, FIELDS_MAPPING.YEAR.END)),
      description: description,
      rawLine: line
    };
  });

  // Parse details
  const details = detailLines.map(line => {
    const amountRaw = parseFloat(line.substring(FIELDS_MAPPING.AMOUNT.START, FIELDS_MAPPING.AMOUNT.END).trim());
    const retenueRaw = parseFloat(line.substring(FIELDS_MAPPING.AMOUNT_RETENUE.START, FIELDS_MAPPING.AMOUNT_RETENUE.END).trim());

    return {
      prefix: line.substring(0, 4),
      typeCode: line.substring(FIELDS_MAPPING.TYPE.START, FIELDS_MAPPING.TYPE.END),
      department: line.substring(FIELDS_MAPPING.DEPARTMENT.START, FIELDS_MAPPING.DEPARTMENT.END),
      codeLessor: line.substring(FIELDS_MAPPING.CODE_LESSOR.START, FIELDS_MAPPING.CODE_LESSOR.END),
      codeCAF: line.substring(FIELDS_MAPPING.CODE_CAF.START, FIELDS_MAPPING.CODE_CAF.END).trim(),
      name: line.substring(FIELDS_MAPPING.NAME.START, FIELDS_MAPPING.NAME.END).trim(),
      firstName: line.substring(FIELDS_MAPPING.FIRST_NAME.START, FIELDS_MAPPING.FIRST_NAME.END).trim(),
      year: parseInt('20' + line.substring(FIELDS_MAPPING.YEAR_TENANT.START, FIELDS_MAPPING.YEAR_TENANT.END)),
      month: parseInt(line.substring(FIELDS_MAPPING.MONTH_TENANT.START, FIELDS_MAPPING.MONTH_TENANT.END)),
      amount: {
        value: amountRaw,
        valueEur: parseFloat((amountRaw / 100).toFixed(2)),
        currency: 'EUR'
      },
      retenue: {
        value: retenueRaw,
        valueEur: parseFloat((retenueRaw / 100).toFixed(2)),
        currency: 'EUR'
      },
      rawLine: line
    };
  });

  // Parse totals
  const totals = totalLines.map(line => {
    const totalAmount = parseFloat(line.substring(FIELDS_MAPPING.TOTAL_AMOUNT.START, FIELDS_MAPPING.TOTAL_AMOUNT.END).trim());
    const totalRetenue = parseFloat(line.substring(FIELDS_MAPPING.TOTAL_AMOUNT_RETENUE.START, FIELDS_MAPPING.TOTAL_AMOUNT_RETENUE.END).trim());

    return {
      prefix: line.substring(0, 4),
      totalAmount: {
        value: totalAmount,
        valueEur: parseFloat((totalAmount / 100).toFixed(2)),
        currency: 'EUR'
      },
      totalRetenue: {
        value: totalRetenue,
        valueEur: parseFloat((totalRetenue / 100).toFixed(2)),
        currency: 'EUR'
      },
      rawLine: line
    };
  });

  // Compute aggregated totals
  const aggregatedTotals = {
    totalAmountSum: totals.reduce((sum, t) => sum + t.totalAmount.value, 0),
    totalAmountSumEur: parseFloat((totals.reduce((sum, t) => sum + t.totalAmount.value, 0) / 100).toFixed(2)),
    totalRetenueSum: totals.reduce((sum, t) => sum + t.totalRetenue.value, 0),
    totalRetenueSumEur: parseFloat((totals.reduce((sum, t) => sum + t.totalRetenue.value, 0) / 100).toFixed(2)),
    currency: 'EUR'
  };

  aggregatedTotals.netAmount = aggregatedTotals.totalAmountSum - aggregatedTotals.totalRetenueSum;
  aggregatedTotals.netAmountEur = parseFloat((aggregatedTotals.netAmount / 100).toFixed(2));

  // Group details by type (monthly vs regularization)
  const groupedDetails = {
    paiementsMensuels: [],
    regularisations: []
  };

  let currentType = null;
  headers.forEach((header, index) => {
    if (header.description.includes('PAIEMENTS MENSUELS')) {
      currentType = 'paiementsMensuels';
    } else if (header.description.includes('REGULARISATION')) {
      currentType = 'regularisations';
    }

    // Find details between this header and next
    const nextHeaderIndex = index + 1 < headers.length ?
      lines.findIndex((l, i) => i > lines.indexOf(header.rawLine) && l.startsWith(PREFIXES.EMITTER)) :
      lines.length;

    const headerLineIndex = lines.indexOf(header.rawLine);
    const relatedDetails = details.filter(d => {
      const detailIndex = lines.indexOf(d.rawLine);
      return detailIndex > headerLineIndex && detailIndex < nextHeaderIndex;
    });

    if (currentType) {
      groupedDetails[currentType].push(...relatedDetails);
    }
  });

  return {
    metadata: {
      fileName: fileName,
      filePath: filePath,
      parsedAt: new Date().toISOString(),
      type: headers.length > 0 ? headers[0].type : null,
      department: headers.length > 0 ? headers[0].department : null,
      codeLessor: headers.length > 0 ? headers[0].codeLessor : null,
      period: headers.length > 0 ? {
        month: headers[0].month,
        year: headers[0].year
      } : null
    },
    statistics: {
      totalLines: lines.length,
      emitterLines: emitterLines.length,
      detailLines: detailLines.length,
      totalLines: totalLines.length,
      uniqueBeneficiaries: new Set(details.map(d => d.codeCAF)).size
    },
    headers: headers,
    cafTransfers: details,
    cafTransfersGrouped: groupedDetails,
    totals: totals,
    aggregatedTotals: aggregatedTotals
  };
}

function main() {
  const files = [
    '/Users/frx33355/Downloads/CAF841_2025110790626_0601.txt',
    '/Users/frx33355/Downloads/CAFAL301_2025103090703_0601.txt',
    '/Users/frx33355/Downloads/CAFAL841_2025103090710_0601.txt'
  ];

  const outputDir = '/Users/frx33355/Documents/dev/mcp/data';

  // Create output directory if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const allResults = [];

  files.forEach(file => {
    try {
      const parsed = parseFileCAF(file);
      allResults.push(parsed);

      // Write individual file
      const baseName = path.basename(file, '.txt');
      const outputPath = path.join(outputDir, `${baseName}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf-8');
      console.log(`✅ Created: ${outputPath}`);

    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error.message);
    }
  });

  // Write combined file
  const combinedOutput = {
    metadata: {
      parsedAt: new Date().toISOString(),
      totalFiles: allResults.length,
      description: 'Fichiers CAF parsés et combinés'
    },
    summary: {
      totalBeneficiaries: allResults.reduce((sum, r) => sum + r.statistics.uniqueBeneficiaries, 0),
      totalAmount: allResults.reduce((sum, r) => sum + r.aggregatedTotals.totalAmountSum, 0) / 100,
      totalRetenue: allResults.reduce((sum, r) => sum + r.aggregatedTotals.totalRetenueSum, 0) / 100,
      netAmount: allResults.reduce((sum, r) => sum + r.aggregatedTotals.netAmount, 0) / 100,
      currency: 'EUR'
    },
    files: allResults
  };

  const combinedPath = path.join(outputDir, 'caf-combined.json');
  fs.writeFileSync(combinedPath, JSON.stringify(combinedOutput, null, 2), 'utf-8');
  console.log(`✅ Created: ${combinedPath}`);

  console.log('\n📊 Summary:');
  console.log(`   Total files parsed: ${allResults.length}`);
  console.log(`   Total beneficiaries: ${combinedOutput.summary.totalBeneficiaries}`);
  console.log(`   Total amount: ${combinedOutput.summary.totalAmount.toFixed(2)} €`);
  console.log(`   Total retenue: ${combinedOutput.summary.totalRetenue.toFixed(2)} €`);
  console.log(`   Net amount: ${combinedOutput.summary.netAmount.toFixed(2)} €`);
}

main();
