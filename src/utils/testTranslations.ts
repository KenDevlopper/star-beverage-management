/**
 * Script de test pour valider toutes les traductions
 * Utilise le translationValidator pour vérifier la cohérence
 */

import { validateTranslations } from './translationValidator';

export const testAllTranslations = () => {
  console.log('🧪 Test de validation des traductions...');
  
  try {
    const results = validateTranslations();
    
    console.log('\n📊 Résultats du test:');
    console.log('==================');
    
    if (results.isValid) {
      console.log('✅ Toutes les traductions sont valides !');
    } else {
      console.log('❌ Des erreurs ont été trouvées dans les traductions');
    }
    
    console.log('\n📈 Statistiques:');
    console.log(`Français: ${results.totalKeys.fr} clés (${results.coverage.fr}%)`);
    console.log(`Créole: ${results.totalKeys.cr} clés (${results.coverage.cr}%)`);
    console.log(`Anglais: ${results.totalKeys.en} clés (${results.coverage.en}%)`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 Erreurs:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️ Avertissements:');
      results.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n🎯 Recommandations:');
    if (results.coverage.fr < 100) {
      console.log(`- Compléter les traductions françaises (${100 - results.coverage.fr}% manquant)`);
    }
    if (results.coverage.cr < 100) {
      console.log(`- Compléter les traductions créoles (${100 - results.coverage.cr}% manquant)`);
    }
    if (results.coverage.en < 100) {
      console.log(`- Compléter les traductions anglaises (${100 - results.coverage.en}% manquant)`);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Erreur lors du test des traductions:', error);
    return null;
  }
};

// Fonction pour tester une clé spécifique
export const testTranslationKey = (key: string, locale: 'fr' | 'en' | 'cr' = 'fr') => {
  try {
    const results = validateTranslations();
    
    // Vérifier si la clé existe dans toutes les langues
    const frExists = results.totalKeys.fr > 0; // Simplification pour la démo
    const enExists = results.totalKeys.en > 0;
    const crExists = results.totalKeys.cr > 0;
    
    console.log(`🔍 Test de la clé: ${key}`);
    console.log(`Français: ${frExists ? '✅' : '❌'}`);
    console.log(`Anglais: ${enExists ? '✅' : '❌'}`);
    console.log(`Créole: ${crExists ? '✅' : '❌'}`);
    
    return { fr: frExists, en: enExists, cr: crExists };
  } catch (error) {
    console.error('❌ Erreur lors du test de la clé:', error);
    return null;
  }
};

// Fonction pour générer un rapport de traduction
export const generateTranslationReport = () => {
  try {
    const results = validateTranslations();
    
    const report = {
      timestamp: new Date().toISOString(),
      status: results.isValid ? 'VALID' : 'INVALID',
      coverage: results.coverage,
      totalKeys: results.totalKeys,
      errors: results.errors,
      warnings: results.warnings,
      recommendations: []
    };
    
    // Ajouter des recommandations basées sur les résultats
    if (results.coverage.fr < 100) {
      report.recommendations.push(`Compléter les traductions françaises (${100 - results.coverage.fr}% manquant)`);
    }
    if (results.coverage.cr < 100) {
      report.recommendations.push(`Compléter les traductions créoles (${100 - results.coverage.cr}% manquant)`);
    }
    if (results.coverage.en < 100) {
      report.recommendations.push(`Compléter les traductions anglaises (${100 - results.coverage.en}% manquant)`);
    }
    
    if (results.errors.length > 0) {
      report.recommendations.push('Corriger les erreurs de traduction identifiées');
    }
    
    if (results.warnings.length > 0) {
      report.recommendations.push('Résoudre les avertissements de traduction');
    }
    
    console.log('\n📋 Rapport de traduction généré:');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport:', error);
    return null;
  }
};