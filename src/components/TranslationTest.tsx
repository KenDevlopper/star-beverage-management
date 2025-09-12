import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/context/LanguageContext';
import { generateValidationReport, validateTranslations, testCriticalKeys } from '@/utils/translationValidator';
import { testAllTranslations, generateTranslationReport } from '@/utils/testTranslations';

const TranslationTest: React.FC = () => {
  const { t, translate, translateWithFallback, hasTranslation } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [testResults, setTestResults] = useState<any>(null);

  const runTranslationTest = () => {
    const results = validateTranslations();
    setTestResults(results);
  };

  const testKeys = [
    'app.title',
    'navigation.dashboard',
    'navigation.orders',
    'navigation.inventory',
    'navigation.products',
    'navigation.customers',
    'common.save',
    'common.cancel',
    'common.delete',
    'orders.title',
    'orders.newOrder',
    'dashboard.title',
    'dashboard.stats.todayOrders',
    'dashboard.stats.monthlyRevenue',
    'dashboard.stats.lowStockProducts',
    'dashboard.stats.scheduledDeliveries',
    'products.title',
    'products.newProduct',
    'customers.title',
    'customers.newCustomer',
    'inventory.title',
    'inventory.adjustStock',
    'reports.title',
    'settings.title',
    'profile.title',
    'auth.login',
    'auth.logout',
    'messages.success.saved',
    'messages.error.general',
    'languages.fr',
    'languages.cr',
    'languages.en'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🌍 Test du Système Multilingue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span>Langue actuelle:</span>
            <Badge variant="outline">{language}</Badge>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={language === 'fr' ? 'default' : 'outline'}
                onClick={() => setLanguage('fr')}
              >
                Français
              </Button>
              <Button 
                size="sm" 
                variant={language === 'cr' ? 'default' : 'outline'}
                onClick={() => setLanguage('cr')}
              >
                Créole
              </Button>
              <Button 
                size="sm" 
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runTranslationTest} className="flex-1">
              Lancer le test de traduction
            </Button>
            <Button 
              onClick={() => {
                const report = generateTranslationReport();
                if (report) {
                  console.log('📋 Rapport de traduction généré dans la console');
                  alert('Rapport généré ! Vérifiez la console pour plus de détails.');
                }
              }}
              variant="outline"
              className="flex-1"
            >
              Générer rapport
            </Button>
          </div>
          
          {testResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span>Statut:</span>
                <Badge variant={testResults.isValid ? 'default' : 'destructive'}>
                  {testResults.isValid ? '✅ Valide' : '❌ Invalide'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Français:</strong> {testResults.totalKeys.fr} clés ({testResults.coverage.fr}%)
                </div>
                <div>
                  <strong>Créole:</strong> {testResults.totalKeys.cr} clés ({testResults.coverage.cr}%)
                </div>
                <div>
                  <strong>Anglais:</strong> {testResults.totalKeys.en} clés ({testResults.coverage.en}%)
                </div>
              </div>
              
              {testResults.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">Erreurs:</h4>
                  {testResults.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600">• {error}</div>
                  ))}
                </div>
              )}
              
              {testResults.warnings.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-yellow-600 mb-2">Avertissements:</h4>
                  {testResults.warnings.map((warning: string, index: number) => (
                    <div key={index} className="text-sm text-yellow-600">• {warning}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔍 Test des Clés de Traduction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testKeys.map((key) => {
              const translation = t(key);
              const exists = hasTranslation(key);
              
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-mono text-sm text-muted-foreground">{key}</div>
                    <div className="font-medium">{translation}</div>
                  </div>
                  <Badge variant={exists ? 'default' : 'destructive'}>
                    {exists ? '✅' : '❌'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Test des Fonctions de Traduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Test de traduction simple:</h4>
            <div className="p-3 bg-muted rounded-lg">
              <code>t('app.title')</code> → <strong>{t('app.title')}</strong>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Test de traduction avec fallback:</h4>
            <div className="p-3 bg-muted rounded-lg">
              <code>translateWithFallback('nonexistent.key', 'Fallback text')</code> → <strong>{translateWithFallback('nonexistent.key', 'Fallback text')}</strong>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Test de traduction avec paramètres:</h4>
            <div className="p-3 bg-muted rounded-lg">
              <code>translate('orders.messages.addedToCart', {`{product: 'Coca-Cola'}`})</code> → <strong>{translate('orders.messages.addedToCart', { product: 'Coca-Cola' })}</strong>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationTest;

