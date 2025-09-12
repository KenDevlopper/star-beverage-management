import { SecurityPolicy } from '@/types/admin';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const validatePassword = (
  password: string, 
  policies: SecurityPolicy[]
): PasswordValidationResult => {
  const errors: string[] = [];
  let strength = 'weak' as const;

  // Trouver les politiques pertinentes
  const minLengthPolicy = policies.find(p => p.name === 'passwordMinLength');
  const requireUppercasePolicy = policies.find(p => p.name === 'passwordRequireUppercase');
  const requireNumbersPolicy = policies.find(p => p.name === 'passwordRequireNumbers');
  const requireSpecialCharsPolicy = policies.find(p => p.name === 'passwordRequireSpecialChars');

  // Validation de la longueur minimale
  if (minLengthPolicy?.enabled && minLengthPolicy.value) {
    const minLength = minLengthPolicy.value as number;
    if (password.length < minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
    }
  }

  // Validation des majuscules
  if (requireUppercasePolicy?.enabled && requireUppercasePolicy.value) {
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
    }
  }

  // Validation des chiffres
  if (requireNumbersPolicy?.enabled && requireNumbersPolicy.value) {
    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
  }

  // Validation des caractères spéciaux
  if (requireSpecialCharsPolicy?.enabled && requireSpecialCharsPolicy.value) {
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');
    }
  }

  // Calcul de la force du mot de passe
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

export const getPasswordStrengthColor = (strength: string): string => {
  switch (strength) {
    case 'weak': return 'text-red-500';
    case 'medium': return 'text-yellow-500';
    case 'strong': return 'text-green-500';
    default: return 'text-gray-500';
  }
};

export const getPasswordStrengthText = (strength: string): string => {
  switch (strength) {
    case 'weak': return 'Faible';
    case 'medium': return 'Moyen';
    case 'strong': return 'Fort';
    default: return 'Inconnu';
  }
};



