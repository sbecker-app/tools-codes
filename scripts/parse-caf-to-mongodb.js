#!/usr/bin/env node

/**
 * Parser de fichiers CAF vers format MongoDB
 * Génère le document FilesCAF prêt pour insertion dans MongoDB
 *
 * Usage:
 *   node parse-caf-to-mongodb.js <fichier-caf.txt> [agency-id]
 *
 * Exemple:
 *   node parse-caf-to-mongodb.js CAFAL841_2025103090710_0601.txt 507f1f77bcf86cd799439011
 */

const fs = require('fs');
const path = require('path');

// Mapping des positions de champs
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

const STATUS_FILE_CAF = {
  TO_HANDLE: 'TO_HANDLE',
  PROCESSED: 'PROCESSED',
  ERROR_AMOUNT: 'ERROR_AMOUNT'
};

const STATUS_VERSEMENT_CAF = {
  TO_ENTER_ACCOUNTING: 'TO_ENTER_ACCOUNTING',
  ACCOUNTING_ENTERED: 'ACCOUNTING_ENTERED',
  ERROR_SUBSIDY_RECIPIENT_UNKNOWN: 'ERROR_SUBSIDY_RECIPIENT_UNKNOWN'
};

/**
 * Parse un fichier CAF en document MongoDB FilesCAF
 */
function parseCAFToMongoDB(filePath, agencyId = null) {
  const fileName = path.basename(filePath);
  console.log(`📄 Parsing: ${fileName}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  const emitterLines = lines.filter(l => l.startsWith(PREFIXES.EMITTER));
  const detailLines = lines.filter(l => l.startsWith(PREFIXES.DETAIL));
  const totalLines = lines.filter(l => l.startsWith(PREFIXES.TOTAL));

  console.log(`   Emitters: ${emitterLines.length}, Details: ${detailLines.length}, Totals: ${totalLines.length}`);

  // Parse header (first emitter)
  if (emitterLines.length === 0) {
    throw new Error('No emitter line found (0302)');
  }

  const firstEmitter = emitterLines[0];
  const typeCode = firstEmitter.substring(FIELDS_MAPPING.TYPE.START, FIELDS_MAPPING.TYPE.END);
  const department = firstEmitter.substring(FIELDS_MAPPING.DEPARTMENT.START, FIELDS_MAPPING.DEPARTMENT.END);
  const codeLessor = firstEmitter.substring(FIELDS_MAPPING.CODE_LESSOR.START, FIELDS_MAPPING.CODE_LESSOR.END).trim();
  const month = parseInt(firstEmitter.substring(FIELDS_MAPPING.MONTH.START, FIELDS_MAPPING.MONTH.END));
  const year = parseInt('20' + firstEmitter.substring(FIELDS_MAPPING.YEAR.START, FIELDS_MAPPING.YEAR.END));
  const type = TYPE_CAF[typeCode];

  if (!type) {
    throw new Error(`Unknown type code: ${typeCode}`);
  }

  console.log(`   Type: ${type}, Dept: ${department}, Period: ${month}/${year}, Code: ${codeLessor}`);

  // Parse details => cafTransfers
  const cafTransfers = [];

  detailLines.forEach(line => {
    const codeCAF = line.substring(FIELDS_MAPPING.CODE_CAF.START, FIELDS_MAPPING.CODE_CAF.END).trim();
    const name = line.substring(FIELDS_MAPPING.NAME.START, FIELDS_MAPPING.NAME.END).trim();
    const firstName = line.substring(FIELDS_MAPPING.FIRST_NAME.START, FIELDS_MAPPING.FIRST_NAME.END).trim();
    const yearTenant = parseInt('20' + line.substring(FIELDS_MAPPING.YEAR_TENANT.START, FIELDS_MAPPING.YEAR_TENANT.END));
    const monthTenant = parseInt(line.substring(FIELDS_MAPPING.MONTH_TENANT.START, FIELDS_MAPPING.MONTH_TENANT.END));

    const amountRaw = parseFloat(line.substring(FIELDS_MAPPING.AMOUNT.START, FIELDS_MAPPING.AMOUNT.END).trim());
    const retenueRaw = parseFloat(line.substring(FIELDS_MAPPING.AMOUNT_RETENUE.START, FIELDS_MAPPING.AMOUNT_RETENUE.END).trim());

    // Montant positif
    if (amountRaw > 0) {
      cafTransfers.push({
        codeCAF,
        name,
        firstName,
        month: monthTenant,
        year: yearTenant,
        amount: {
          value: amountRaw,
          currency: 'EUR'
        },
        status: STATUS_VERSEMENT_CAF.TO_ENTER_ACCOUNTING
      });
    }

    // Retenue (montant négatif)
    if (retenueRaw > 0) {
      cafTransfers.push({
        codeCAF,
        name,
        firstName,
        month: monthTenant,
        year: yearTenant,
        amount: {
          value: -retenueRaw,
          currency: 'EUR'
        },
        status: STATUS_VERSEMENT_CAF.TO_ENTER_ACCOUNTING
      });
    }
  });

  console.log(`   Transfers: ${cafTransfers.length}`);

  // Parse totals
  const totalAmountSum = totalLines.reduce((sum, line) => {
    const amount = parseFloat(line.substring(FIELDS_MAPPING.TOTAL_AMOUNT.START, FIELDS_MAPPING.TOTAL_AMOUNT.END).trim());
    return sum + amount;
  }, 0);

  console.log(`   Total amount: ${totalAmountSum} centimes (${(totalAmountSum / 100).toFixed(2)} €)`);

  // Check data coherence
  const amountVersementsCAF = cafTransfers.reduce((acc, cur) => {
    return acc + Math.max(cur.amount.value, 0);
  }, 0);

  const dataCoherent = totalAmountSum === amountVersementsCAF;
  console.log(`   Coherence: ${dataCoherent ? '✅' : '❌'} (total: ${totalAmountSum}, sum: ${amountVersementsCAF})`);

  // Determine status
  let status;
  if (!dataCoherent) {
    status = STATUS_FILE_CAF.ERROR_AMOUNT;
    console.log(`   ⚠️  Status: ERROR_AMOUNT (incohérence montants)`);
  } else if (!agencyId) {
    status = STATUS_FILE_CAF.ERROR_AMOUNT;
    console.log(`   ⚠️  Status: ERROR_AMOUNT (agence non fournie)`);
  } else {
    status = STATUS_FILE_CAF.TO_HANDLE;
    console.log(`   ✅ Status: TO_HANDLE`);
  }

  const now = new Date();

  // Build MongoDB document
  const mongoDocument = {
    agency: agencyId, // ObjectId ou null
    department,
    amount: {
      value: totalAmountSum,
      currency: 'EUR'
    },
    year,
    month,
    type,
    status,
    statusHistory: [
      {
        startDate: now,
        endDate: now,
        status
      }
    ],
    cafTransfers,
    createdAt: now,
    updatedAt: now,
    __v: 0
  };

  return {
    document: mongoDocument,
    metadata: {
      fileName,
      codeLessor,
      coherent: dataCoherent,
      totalTransfers: cafTransfers.length,
      totalAmountCents: totalAmountSum,
      totalAmountEur: totalAmountSum / 100
    }
  };
}

/**
 * Formate pour MongoDB shell
 */
function formatForMongoShell(doc) {
  return JSON.stringify(doc, (key, value) => {
    // Convert agency to ObjectId if present
    if (key === 'agency' && value && typeof value === 'string') {
      return `ObjectId("${value}")`;
    }
    return value;
  }, 2)
    .replace(/"ObjectId\(\\\"([^"]+)\\\"\)"/g, 'ObjectId("$1")');
}

/**
 * Génère le script d'insertion MongoDB
 */
function generateMongoScript(result) {
  const { document, metadata } = result;

  let script = `// Insertion document FilesCAF
// Fichier source: ${metadata.fileName}
// Code bailleur: ${metadata.codeLessor}
// Montant total: ${metadata.totalAmountEur.toFixed(2)} €
// Nombre de transfers: ${metadata.totalTransfers}
// Cohérence: ${metadata.coherent ? 'OK' : 'KO'}

`;

  if (document.agency) {
    script += `// ⚠️  IMPORTANT: Vérifier que l'ObjectId de l'agence est correct !
// Mapping codeLessor "${metadata.codeLessor}" → Agency ObjectId
// Utiliser: db.agencies.findOne({ codeLessor: { $in: ["${metadata.codeLessor}"] } })

`;
  } else {
    script += `// ⚠️  ATTENTION: Agency non définie !
// Récupérer l'ObjectId de l'agence avec:
// db.agencies.findOne({ codeLessor: { $in: ["${metadata.codeLessor}"] } })
// Puis remplacer null par ObjectId("...")

`;
  }

  script += `db.filesCAF.insertOne(${JSON.stringify(document, null, 2)});

// Vérification après insertion
db.filesCAF.findOne({
  department: "${document.department}",
  type: "${document.type}",
  year: ${document.year},
  month: ${document.month}
}).pretty();
`;

  return script;
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`
Usage: node parse-caf-to-mongodb.js <fichier-caf.txt> [agency-id]

Arguments:
  fichier-caf.txt    Chemin vers le fichier CAF à parser
  agency-id          (Optionnel) ObjectId de l'agence MongoDB

Exemples:
  # Sans agence (status = ERROR_AMOUNT)
  node parse-caf-to-mongodb.js CAFAL841_2025103090710_0601.txt

  # Avec agence (status = TO_HANDLE si cohérent)
  node parse-caf-to-mongodb.js CAFAL841_2025103090710_0601.txt 507f1f77bcf86cd799439011

Outputs:
  • <fichier>-mongodb.json     Document MongoDB formaté
  • <fichier>-insert.js         Script d'insertion MongoDB
`);
    process.exit(1);
  }

  const filePath = args[0];
  const agencyId = args.length > 1 ? args[1] : null;

  try {
    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              PARSING FICHIER CAF → FORMAT MONGODB                         ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    const result = parseCAFToMongoDB(filePath, agencyId);
    const { document, metadata } = result;

    const baseName = path.basename(filePath, '.txt');
    const outputDir = path.dirname(filePath);

    // Write JSON document
    const jsonPath = path.join(outputDir, `${baseName}-mongodb.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2), 'utf-8');
    console.log(`\n✅ Document MongoDB: ${jsonPath}`);

    // Write MongoDB insert script
    const scriptPath = path.join(outputDir, `${baseName}-insert.js`);
    const script = generateMongoScript(result);
    fs.writeFileSync(scriptPath, script, 'utf-8');
    console.log(`✅ Script d'insertion: ${scriptPath}`);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              RÉSUMÉ                                        ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');
    console.log(`   Fichier source:      ${metadata.fileName}`);
    console.log(`   Code bailleur:       ${metadata.codeLessor}`);
    console.log(`   Type:                ${document.type}`);
    console.log(`   Département:         ${document.department}`);
    console.log(`   Période:             ${document.month}/${document.year}`);
    console.log(`   Nombre de transfers: ${metadata.totalTransfers}`);
    console.log(`   Montant total:       ${metadata.totalAmountEur.toFixed(2)} € (${metadata.totalAmountCents} centimes)`);
    console.log(`   Cohérence montants:  ${metadata.coherent ? '✅ OK' : '❌ KO'}`);
    console.log(`   Agency ID:           ${agencyId || '⚠️  Non définie'}`);
    console.log(`   Status:              ${document.status}`);

    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         PROCHAINES ÉTAPES                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝');

    if (!agencyId) {
      console.log('\n⚠️  Agence non définie - Actions requises:');
      console.log('\n1️⃣  Rechercher l\'agence dans MongoDB:');
      console.log(`   db.agencies.findOne({ codeLessor: { $in: ["${metadata.codeLessor}"] } })`);
      console.log('\n2️⃣  Récupérer l\'ObjectId de l\'agence');
      console.log('\n3️⃣  Re-parser avec l\'agencyId:');
      console.log(`   node parse-caf-to-mongodb.js ${filePath} <agency-id>`);
    } else {
      console.log('\n✅ Document prêt pour insertion');
      console.log('\n1️⃣  Vérifier le document:');
      console.log(`   cat ${jsonPath}`);
      console.log('\n2️⃣  Insérer dans MongoDB:');
      console.log(`   mongosh < ${scriptPath}`);
      console.log('\n   Ou via mongosh interactif:');
      console.log(`   mongosh
   use millenium
   load("${scriptPath}")`);
    }

    console.log('\n');

  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
