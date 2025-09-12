import { SecurityPolicy } from '@/types/admin';

export interface SessionInfo {
  userId: string;
  loginTime: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

class SessionManager {
  private sessions: Map<string, SessionInfo> = new Map();
  private policies: SecurityPolicy[] = [];

  // Charger les politiques de sécurité
  setPolicies(policies: SecurityPolicy[]) {
    this.policies = policies;
  }

  // Obtenir la durée de timeout de session
  getSessionTimeout(): number {
    const timeoutPolicy = this.policies.find(p => p.name === 'sessionTimeoutMinutes');
    if (timeoutPolicy?.enabled && timeoutPolicy.value) {
      return (timeoutPolicy.value as number) * 60 * 1000; // Convertir en millisecondes
    }
    return 30 * 60 * 1000; // 30 minutes par défaut
  }

  // Obtenir le nombre maximum de tentatives de connexion
  getMaxLoginAttempts(): number {
    const lockoutPolicy = this.policies.find(p => p.name === 'accountLockoutAttempts');
    if (lockoutPolicy?.enabled && lockoutPolicy.value) {
      return lockoutPolicy.value as number;
    }
    return 5; // 5 tentatives par défaut
  }

  // Vérifier si une session est valide
  isSessionValid(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const now = Date.now();
    const timeout = this.getSessionTimeout();
    
    // Vérifier si la session a expiré
    if (now - session.lastActivity > timeout) {
      this.sessions.delete(sessionId);
      return false;
    }

    // Mettre à jour la dernière activité
    session.lastActivity = now;
    return true;
  }

  // Créer une nouvelle session
  createSession(userId: string, ipAddress?: string, userAgent?: string): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    this.sessions.set(sessionId, {
      userId,
      loginTime: now,
      lastActivity: now,
      ipAddress,
      userAgent
    });

    return sessionId;
  }

  // Détruire une session
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Obtenir les informations d'une session
  getSession(sessionId: string): SessionInfo | null {
    return this.sessions.get(sessionId) || null;
  }

  // Nettoyer les sessions expirées
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const timeout = this.getSessionTimeout();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Vérifier la restriction IP
  isIpAllowed(ipAddress: string): boolean {
    const ipRestrictionPolicy = this.policies.find(p => p.name === 'ipRestriction');
    if (!ipRestrictionPolicy?.enabled) return true;

    // Pour l'instant, on autorise toutes les IPs
    // Dans une vraie implémentation, on vérifierait une liste d'IPs autorisées
    return true;
  }

  // Générer un ID de session unique
  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Obtenir toutes les sessions actives
  getActiveSessions(): SessionInfo[] {
    this.cleanupExpiredSessions();
    return Array.from(this.sessions.values());
  }
}

// Instance singleton
export const sessionManager = new SessionManager();

// Nettoyer les sessions expirées toutes les 5 minutes
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);



