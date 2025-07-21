// Privacy-respecting analytics utilities
import { useState, useEffect, useCallback } from 'react';

interface AnalyticsEvent {
  type: 'page_view' | 'interaction' | 'search' | 'export' | 'filter' | 'error';
  data: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

interface UserPreferences {
  analyticsEnabled: boolean;
  dataRetentionDays: number;
}

class PrivacyAnalytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private preferences: UserPreferences;
  private maxEvents = 1000; // Limit stored events

  constructor() {
    this.sessionId = this.generateSessionId();
    this.preferences = this.loadPreferences();
    this.cleanupOldEvents();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private loadPreferences(): UserPreferences {
    const saved = localStorage.getItem('govtrack-analytics-preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse analytics preferences');
      }
    }
    
    return {
      analyticsEnabled: true, // Default to enabled, but user can opt out
      dataRetentionDays: 30,
    };
  }

  private savePreferences(): void {
    localStorage.setItem('govtrack-analytics-preferences', JSON.stringify(this.preferences));
  }

  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - (this.preferences.dataRetentionDays * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp > cutoffTime);
    
    // Also limit total number of events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  public setPreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
    
    if (!this.preferences.analyticsEnabled) {
      this.clearAllData();
    }
  }

  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  public track(type: AnalyticsEvent['type'], data: Record<string, any> = {}): void {
    if (!this.preferences.analyticsEnabled) return;

    // Remove any PII and sanitize data
    const sanitizedData = this.sanitizeData(data);
    
    const event: AnalyticsEvent = {
      type,
      data: sanitizedData,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.events.push(event);
    this.cleanupOldEvents();
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip potentially sensitive fields
      if (this.isSensitiveField(key)) continue;
      
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      }
    }
    
    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'email', 'phone', 'address', 'name', 'ssn', 'id',
      'password', 'token', 'key', 'secret', 'auth'
    ];
    
    return sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field)
    );
  }

  private sanitizeString(str: string): string {
    // Remove potential PII patterns
    return str
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[email]') // Email addresses
      .replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[phone]') // Phone numbers
      .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[ssn]') // SSN patterns
      .substring(0, 100); // Limit length
  }

  public getInsights(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    topPages: Array<{ page: string; views: number }>;
    topSearches: Array<{ query: string; count: number }>;
    errorRate: number;
    sessionDuration: number;
  } {
    if (!this.preferences.analyticsEnabled) {
      return {
        totalEvents: 0,
        eventsByType: {},
        topPages: [],
        topSearches: [],
        errorRate: 0,
        sessionDuration: 0,
      };
    }

    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pageViews = this.events
      .filter(e => e.type === 'page_view')
      .reduce((acc, event) => {
        const page = event.data.page || 'unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const searches = this.events
      .filter(e => e.type === 'search')
      .reduce((acc, event) => {
        const query = event.data.query || '';
        if (query.length > 0) {
          acc[query] = (acc[query] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    const topSearches = Object.entries(searches)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorEvents = this.events.filter(e => e.type === 'error').length;
    const errorRate = this.events.length > 0 ? (errorEvents / this.events.length) * 100 : 0;

    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    const sessionStart = Math.min(...sessionEvents.map(e => e.timestamp));
    const sessionEnd = Math.max(...sessionEvents.map(e => e.timestamp));
    const sessionDuration = sessionEvents.length > 1 ? sessionEnd - sessionStart : 0;

    return {
      totalEvents: this.events.length,
      eventsByType,
      topPages,
      topSearches,
      errorRate,
      sessionDuration,
    };
  }

  public exportData(): string {
    if (!this.preferences.analyticsEnabled) return '[]';
    
    // Export anonymized data
    const exportData = this.events.map(event => ({
      type: event.type,
      data: event.data,
      timestamp: new Date(event.timestamp).toISOString(),
      sessionId: event.sessionId.replace(/\d+/g, 'X'), // Anonymize session ID
    }));

    return JSON.stringify(exportData, null, 2);
  }

  public clearAllData(): void {
    this.events = [];
    localStorage.removeItem('govtrack-analytics-data');
  }
}

// Global analytics instance
const analytics = new PrivacyAnalytics();

// React hooks for analytics
export const useAnalytics = () => {
  const [preferences, setPreferences] = useState(analytics.getPreferences());

  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    analytics.setPreferences(newPreferences);
    setPreferences(analytics.getPreferences());
  }, []);

  const track = useCallback((type: AnalyticsEvent['type'], data?: Record<string, any>) => {
    analytics.track(type, data);
  }, []);

  const getInsights = useCallback(() => {
    return analytics.getInsights();
  }, []);

  const exportData = useCallback(() => {
    return analytics.exportData();
  }, []);

  const clearData = useCallback(() => {
    analytics.clearAllData();
  }, []);

  return {
    preferences,
    updatePreferences,
    track,
    getInsights,
    exportData,
    clearData,
  };
};

// Page view tracking hook
export const usePageTracking = (pageName: string) => {
  const { track } = useAnalytics();

  useEffect(() => {
    track('page_view', { page: pageName });
  }, [pageName, track]);
};

// Interaction tracking hook
export const useInteractionTracking = () => {
  const { track } = useAnalytics();

  const trackClick = useCallback((element: string, context?: Record<string, any>) => {
    track('interaction', { action: 'click', element, ...context });
  }, [track]);

  const trackSearch = useCallback((query: string, results?: number) => {
    track('search', { query, results });
  }, [track]);

  const trackExport = useCallback((type: string, format: string) => {
    track('export', { type, format });
  }, [track]);

  const trackFilter = useCallback((filters: Record<string, any>) => {
    track('filter', { filters });
  }, [track]);

  const trackError = useCallback((error: string, context?: Record<string, any>) => {
    track('error', { error, ...context });
  }, [track]);

  return {
    trackClick,
    trackSearch,
    trackExport,
    trackFilter,
    trackError,
  };
};

export default analytics;