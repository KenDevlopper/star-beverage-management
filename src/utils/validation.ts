// Système de validation centralisé pour StarBeverage

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Règles de validation pour différents types de champs
export const validationRules = {
  // Noms (produits, clients, utilisateurs)
  name: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/,
    message: 'Le nom doit contenir entre 3 et 50 caractères, uniquement des lettres, espaces, tirets et apostrophes'
  },

  // Noms d'utilisateur
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères alphanumériques et underscores uniquement'
  },

  // Emails
  email: {
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Veuillez entrer une adresse email valide'
  },

  // Téléphones (format international)
  phone: {
    required: false,
    pattern: /^(\+?[1-9]\d{1,14}|[0-9\s\-\(\)]{8,15})$/,
    message: 'Format de téléphone invalide. Exemples: +509 1234-5678, 1234-5678, (509) 1234-5678'
  },

  // Prix
  price: {
    required: true,
    pattern: /^\d+(\.\d{1,2})?$/,
    custom: (value: string) => {
      const num = parseFloat(value);
      if (num < 0) return 'Le prix ne peut pas être négatif';
      if (num > 999999.99) return 'Le prix ne peut pas dépasser 999,999.99';
      return null;
    },
    message: 'Le prix doit être un nombre positif avec maximum 2 décimales'
  },

  // Quantités
  quantity: {
    required: true,
    pattern: /^\d+$/,
    custom: (value: string) => {
      const num = parseInt(value);
      if (num < 0) return 'La quantité ne peut pas être négative';
      if (num > 999999) return 'La quantité ne peut pas dépasser 999,999';
      return null;
    },
    message: 'La quantité doit être un nombre entier positif'
  },

  // Adresses
  address: {
    required: false,
    minLength: 5,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9À-ÿ\s\-.,#]+$/,
    message: 'L\'adresse doit contenir entre 5 et 100 caractères valides'
  },

  // Descriptions
  description: {
    required: false,
    maxLength: 500,
    message: 'La description ne peut pas dépasser 500 caractères'
  },

  // Codes produits
  productCode: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9\-_]+$/,
    message: 'Le code produit doit contenir entre 3 et 20 caractères en majuscules, chiffres, tirets et underscores'
  },

  // Mots de passe
  password: {
    required: true,
    minLength: 6,
    maxLength: 50,
    pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
    message: 'Le mot de passe doit contenir au moins 6 caractères avec au moins une lettre et un chiffre'
  }
};

// Fonction de validation principale
export const validateField = (value: any, rule: ValidationRule, fieldName: string = 'Champ'): ValidationResult => {
  const errors: string[] = [];

  // Vérification du champ requis
  if (rule.required && (!value || value.toString().trim() === '')) {
    errors.push(`Le champ ${fieldName} est requis`);
    return { isValid: false, errors };
  }

  // Si le champ n'est pas requis et est vide, on passe
  if (!rule.required && (!value || value.toString().trim() === '')) {
    return { isValid: true, errors: [] };
  }

  const stringValue = value.toString().trim();

  // Vérification de la longueur minimale
  if (rule.minLength && stringValue.length < rule.minLength) {
    errors.push(`Le ${fieldName} doit contenir au moins ${rule.minLength} caractères`);
  }

  // Vérification de la longueur maximale
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    errors.push(`Le ${fieldName} ne peut pas dépasser ${rule.maxLength} caractères`);
  }

  // Vérification du pattern
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    errors.push(rule.message || `Le ${fieldName} a un format invalide`);
  }

  // Validation personnalisée
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonction pour valider un objet complet
export const validateForm = (data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult => {
  const allErrors: string[] = [];
  let isValid = true;

  // Mapping des noms de champs pour des messages plus clairs
  const fieldNameMapping: Record<string, string> = {
    name: 'nom',
    price: 'prix',
    inventory: 'quantité',
    description: 'description',
    email: 'email',
    phone: 'téléphone',
    address: 'adresse',
    username: 'nom d\'utilisateur',
    password: 'mot de passe',
    contact_person: 'personne de contact',
    notes: 'notes'
  };

  for (const [fieldName, value] of Object.entries(data)) {
    const rule = rules[fieldName];
    if (rule) {
      const displayName = fieldNameMapping[fieldName] || fieldName;
      const result = validateField(value, rule, displayName);
      if (!result.isValid) {
        isValid = false;
        // Ajouter le nom du champ au début de chaque erreur pour faciliter le mapping
        const fieldErrors = result.errors.map(error => `${fieldName}:${error}`);
        allErrors.push(...fieldErrors);
      }
    }
  }

  return {
    isValid,
    errors: allErrors
  };
};

// Fonctions de validation spécifiques
export const validateProduct = (productData: any): ValidationResult => {
  const rules = {
    name: validationRules.name,
    price: validationRules.price,
    inventory: validationRules.quantity,
    description: validationRules.description
  };

  return validateForm(productData, rules);
};

export const validateCustomer = (customerData: any): ValidationResult => {
  const rules = {
    name: validationRules.name,
    email: validationRules.email,
    phone: validationRules.phone,
    address: validationRules.address
  };

  return validateForm(customerData, rules);
};

export const validateUser = (userData: any): ValidationResult => {
  const rules = {
    name: validationRules.name,
    username: validationRules.username,
    email: validationRules.email,
    password: validationRules.password
  };

  return validateForm(userData, rules);
};

// Fonction pour nettoyer et formater les données
export const sanitizeInput = (value: string): string => {
  return value.trim().replace(/\s+/g, ' '); // Supprime les espaces multiples
};

// Fonction pour formater le téléphone
export const formatPhone = (phone: string): string => {
  // Supprime tous les caractères non numériques sauf +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si commence par +, garde tel quel
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Sinon, formate selon la longueur
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  
  return cleaned;
};

// Fonction pour formater le prix
export const formatPrice = (price: string | number): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toFixed(2);
};
