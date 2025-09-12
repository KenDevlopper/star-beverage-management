#!/usr/bin/env node

/**
 * Script de mise à jour des traductions
 * Utilise le translationValidator pour vérifier et mettre à jour les traductions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const LANGUAGES = ['fr', 'en', 'cr'];
const REFERENCE_LANGUAGE = 'fr';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadTranslations(locale) {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Erreur lors du chargement de ${locale}.json: ${error.message}`, 'red');
    return null;
  }
}

function saveTranslations(locale, translations) {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  try {
    const content = JSON.stringify(translations, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✅ ${locale}.json sauvegardé avec succès`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur lors de la sauvegarde de ${locale}.json: ${error.message}`, 'red');
    return false;
  }
}

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  return keys;
}

function getValueByKey(obj, key) {
  const keys = key.split('.');
  let value = obj;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  return value;
}

function setValueByKey(obj, key, value) {
  const keys = key.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k];
  }
  current[keys[keys.length - 1]] = value;
}

function validateTranslations() {
  log('🔍 Validation des traductions...', 'cyan');
  
  const translations = {};
  const allKeys = new Set();
  
  // Charger toutes les traductions
  for (const locale of LANGUAGES) {
    translations[locale] = loadTranslations(locale);
    if (translations[locale]) {
      const keys = getAllKeys(translations[locale]);
      keys.forEach(key => allKeys.add(key));
    }
  }
  
  const results = {
    isValid: true,
    totalKeys: {},
    coverage: {},
    errors: [],
    warnings: [],
    missingKeys: {}
  };
  
  // Vérifier chaque langue
  for (const locale of LANGUAGES) {
    if (!translations[locale]) {
      results.errors.push(`Impossible de charger ${locale}.json`);
      results.isValid = false;
      continue;
    }
    
    const localeKeys = getAllKeys(translations[locale]);
    results.totalKeys[locale] = localeKeys.length;
    results.coverage[locale] = Math.round((localeKeys.length / allKeys.size) * 100);
    results.missingKeys[locale] = [];
    
    // Vérifier les clés manquantes
    for (const key of allKeys) {
      if (!localeKeys.includes(key)) {
        results.missingKeys[locale].push(key);
        results.warnings.push(`Clé manquante dans ${locale}: ${key}`);
      }
    }
    
    // Vérifier les clés orphelines
    for (const key of localeKeys) {
      if (!allKeys.has(key)) {
        results.warnings.push(`Clé orpheline dans ${locale}: ${key}`);
      }
    }
  }
  
  return results;
}

function updateTranslations() {
  log('🔄 Mise à jour des traductions...', 'cyan');
  
  const referenceTranslations = loadTranslations(REFERENCE_LANGUAGE);
  if (!referenceTranslations) {
    log('❌ Impossible de charger les traductions de référence', 'red');
    return false;
  }
  
  const referenceKeys = getAllKeys(referenceTranslations);
  let updated = false;
  
  for (const locale of LANGUAGES) {
    if (locale === REFERENCE_LANGUAGE) continue;
    
    const translations = loadTranslations(locale);
    if (!translations) {
      log(`⚠️ Création de ${locale}.json...`, 'yellow');
      translations = {};
    }
    
    let localeUpdated = false;
    
    // Ajouter les clés manquantes
    for (const key of referenceKeys) {
      const value = getValueByKey(translations, key);
      if (value === undefined) {
        const referenceValue = getValueByKey(referenceTranslations, key);
        setValueByKey(translations, key, `[${locale.toUpperCase()}] ${referenceValue}`);
        localeUpdated = true;
        log(`➕ Ajout de la clé ${key} dans ${locale}`, 'yellow');
      }
    }
    
    if (localeUpdated) {
      if (saveTranslations(locale, translations)) {
        updated = true;
      }
    }
  }
  
  return updated;
}

function generateReport() {
  log('📊 Génération du rapport...', 'cyan');
  
  const results = validateTranslations();
  
  log('\n📈 Statistiques:', 'bright');
  log('================', 'bright');
  
  for (const locale of LANGUAGES) {
    const coverage = results.coverage[locale] || 0;
    const total = results.totalKeys[locale] || 0;
    const color = coverage === 100 ? 'green' : coverage >= 80 ? 'yellow' : 'red';
    log(`${locale.toUpperCase()}: ${total} clés (${coverage}%)`, color);
  }
  
  if (results.errors.length > 0) {
    log('\n🚨 Erreurs:', 'red');
    results.errors.forEach(error => log(`  • ${error}`, 'red'));
  }
  
  if (results.warnings.length > 0) {
    log('\n⚠️ Avertissements:', 'yellow');
    results.warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
  }
  
  if (results.missingKeys) {
    log('\n🔍 Clés manquantes:', 'cyan');
    for (const locale of LANGUAGES) {
      if (locale === REFERENCE_LANGUAGE) continue;
      const missing = results.missingKeys[locale] || [];
      if (missing.length > 0) {
        log(`  ${locale.toUpperCase()}:`, 'cyan');
        missing.forEach(key => log(`    • ${key}`, 'cyan'));
      }
    }
  }
  
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'validate';
  
  log('🌍 Script de gestion des traductions StarBeverage Flow', 'bright');
  log('====================================================', 'bright');
  
  switch (command) {
    case 'validate':
      generateReport();
      break;
      
    case 'update':
      if (updateTranslations()) {
        log('\n✅ Traductions mises à jour avec succès!', 'green');
        generateReport();
      } else {
        log('\n❌ Aucune mise à jour nécessaire ou erreur', 'red');
      }
      break;
      
    case 'report':
      generateReport();
      break;
      
    default:
      log('Usage: node update-translations.js [validate|update|report]', 'yellow');
      log('  validate - Valider les traductions (défaut)', 'cyan');
      log('  update   - Mettre à jour les traductions manquantes', 'cyan');
      log('  report   - Générer un rapport détaillé', 'cyan');
      break;
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('update-translations.js')) {
  main();
}

export {
  validateTranslations,
  updateTranslations,
  generateReport
};
