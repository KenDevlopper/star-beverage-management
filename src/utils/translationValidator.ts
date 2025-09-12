/**
 * Validateur complet du système de traductions StarBeverage
 * Ce script vérifie l'intégrité et la complétude des traductions
 */

import frTranslations from '@/locales/fr.json';
import crTranslations from '@/locales/cr.json';
import enTranslations from '@/locales/en.json';

interface ValidationResult {
  isValid: boolean;
  missingKeys: { [language: string]: string[] };
  totalKeys: { [language: string]: number };
  coverage: { [language: string]: number };
  errors: string[];
  warnings: string[];
}

/**
 * Valide l'intégrité complète du système de traductions
 */
export function validateTranslations(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    missingKeys: { fr: [], cr: [], en: [] },
    totalKeys: { fr: 0, cr: 0, en: 0 },
    coverage: { fr: 0, cr: 0, en: 0 },
    errors: [],
    warnings: []
  };

  // Obtenir toutes les clés de chaque langue
  const frKeys = getAllKeys(frTranslations);
  const crKeys = getAllKeys(crTranslations);
  const enKeys = getAllKeys(enTranslations);

  result.totalKeys = {
    fr: frKeys.length,
    cr: crKeys.length,
    en: enKeys.length
  };

  // Trouver toutes les clés uniques
  const allKeys = new Set([...frKeys, ...crKeys, ...enKeys]);

  // Vérifier les clés manquantes pour chaque langue
  for (const key of allKeys) {
    if (!frKeys.includes(key)) {
      result.missingKeys.fr.push(key);
    }
    if (!crKeys.includes(key)) {
      result.missingKeys.cr.push(key);
    }
    if (!enKeys.includes(key)) {
      result.missingKeys.en.push(key);
    }
  }

  // Calculer la couverture
  result.coverage = {
    fr: Math.round(((allKeys.size - result.missingKeys.fr.length) / allKeys.size) * 100),
    cr: Math.round(((allKeys.size - result.missingKeys.cr.length) / allKeys.size) * 100),
    en: Math.round(((allKeys.size - result.missingKeys.en.length) / allKeys.size) * 100)
  };

  // Déterminer si le système est valide
  result.isValid = result.missingKeys.fr.length === 0 && 
                   result.missingKeys.cr.length === 0 && 
                   result.missingKeys.en.length === 0;

  // Générer des erreurs et avertissements
  if (result.missingKeys.fr.length > 0) {
    result.errors.push(`Français: ${result.missingKeys.fr.length} clés manquantes`);
  }
  if (result.missingKeys.cr.length > 0) {
    result.errors.push(`Créole: ${result.missingKeys.cr.length} clés manquantes`);
  }
  if (result.missingKeys.en.length > 0) {
    result.errors.push(`Anglais: ${result.missingKeys.en.length} clés manquantes`);
  }

  // Avertissements pour une couverture faible
  Object.entries(result.coverage).forEach(([lang, coverage]) => {
    if (coverage < 100) {
      result.warnings.push(`${lang}: Couverture de ${coverage}%`);
    }
  });

  return result;
}

/**
 * Teste des clés de traduction spécifiques importantes
 */
export function testCriticalKeys(): { [key: string]: { fr: boolean; cr: boolean; en: boolean } } {
  const criticalKeys = [
    'app.title',
    'navigation.dashboard',
    'navigation.orders',
    'navigation.inventory',
    'navigation.products',
    'navigation.customers',
    'navigation.reports',
    'navigation.settings',
    'common.save',
    'common.cancel',
    'common.delete',
    'common.edit',
    'common.add',
    'common.search',
    'common.loading',
    'common.noData',
    'orders.title',
    'orders.newOrder',
    'products.title',
    'products.newProduct',
    'customers.title',
    'customers.newCustomer',
    'inventory.title',
    'inventory.adjustStock',
    'reports.title',
    'dashboard.title',
    'dashboard.stats.todayOrders',
    'dashboard.stats.monthlyRevenue',
    'dashboard.stats.lowStockProducts',
    'dashboard.stats.scheduledDeliveries',
    'messages.success.saved',
    'messages.success.updated',
    'messages.success.deleted',
    'messages.error.general',
    'messages.error.network',
    'languages.fr',
    'languages.cr',
    'languages.en'
  ];

  const results: { [key: string]: { fr: boolean; cr: boolean; en: boolean } } = {};

  criticalKeys.forEach(key => {
    results[key] = {
      fr: testTranslationKey(key, 'fr'),
      cr: testTranslationKey(key, 'cr'),
      en: testTranslationKey(key, 'en')
    };
  });

  return results;
}

/**
 * Teste une clé de traduction spécifique
 */
function testTranslationKey(key: string, language: 'fr' | 'cr' | 'en'): boolean {
  const translations = {
    fr: frTranslations,
    cr: crTranslations,
    en: enTranslations,
  };

  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return false;
    }
  }
  
  return typeof value === 'string' && value.length > 0;
}

/**
 * Obtient toutes les clés d'un objet de traduction
 */
function getAllKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Génère un rapport complet de validation
 */
export function generateValidationReport(): string {
  const validation = validateTranslations();
  const criticalKeys = testCriticalKeys();
  
  let report = '🌍 RAPPORT DE VALIDATION DES TRADUCTIONS STARBEVERAGE\n';
  report += '='.repeat(60) + '\n\n';
  
  // Statut général
  report += `📊 STATUT GÉNÉRAL: ${validation.isValid ? '✅ VALIDE' : '❌ INVALIDE'}\n\n`;
  
  // Statistiques
  report += '📈 STATISTIQUES:\n';
  report += `  Français: ${validation.totalKeys.fr} clés (${validation.coverage.fr}% couverture)\n`;
  report += `  Créole: ${validation.totalKeys.cr} clés (${validation.coverage.cr}% couverture)\n`;
  report += `  Anglais: ${validation.totalKeys.en} clés (${validation.coverage.en}% couverture)\n\n`;
  
  // Erreurs
  if (validation.errors.length > 0) {
    report += '❌ ERREURS:\n';
    validation.errors.forEach(error => {
      report += `  - ${error}\n`;
    });
    report += '\n';
  }
  
  // Avertissements
  if (validation.warnings.length > 0) {
    report += '⚠️ AVERTISSEMENTS:\n';
    validation.warnings.forEach(warning => {
      report += `  - ${warning}\n`;
    });
    report += '\n';
  }
  
  // Test des clés critiques
  report += '🔍 TEST DES CLÉS CRITIQUES:\n';
  const criticalResults = Object.entries(criticalKeys);
  const passed = criticalResults.filter(([_, results]) => 
    results.fr && results.cr && results.en
  ).length;
  
  report += `  ${passed}/${criticalResults.length} clés critiques passent le test\n\n`;
  
  // Clés critiques manquantes
  const failed = criticalResults.filter(([_, results]) => 
    !results.fr || !results.cr || !results.en
  );
  
  if (failed.length > 0) {
    report += '❌ CLÉS CRITIQUES MANQUANTES:\n';
    failed.forEach(([key, results]) => {
      const missing = [];
      if (!results.fr) missing.push('fr');
      if (!results.cr) missing.push('cr');
      if (!results.en) missing.push('en');
      report += `  - ${key}: manquante en ${missing.join(', ')}\n`;
    });
    report += '\n';
  }
  
  // Recommandations
  report += '💡 RECOMMANDATIONS:\n';
  if (validation.isValid) {
    report += '  ✅ Le système de traductions est complet et prêt pour la production\n';
  } else {
    report += '  🔧 Ajoutez les clés manquantes dans les fichiers de traduction\n';
    report += '  🔧 Vérifiez la cohérence des traductions entre les langues\n';
  }
  
  report += '  🔧 Testez le changement de langue dans l\'interface utilisateur\n';
  report += '  🔧 Validez les traductions avec des utilisateurs natifs\n\n';
  
  report += '='.repeat(60) + '\n';
  report += `Rapport généré le ${new Date().toLocaleString('fr-FR')}\n`;
  
  return report;
}

export default {
  validateTranslations,
  testCriticalKeys,
  generateValidationReport
};
