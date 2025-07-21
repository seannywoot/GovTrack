// Accessibility utilities and hooks
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export type TextSize = 'small' | 'normal' | 'large' | 'extra-large';
export type ContrastMode = 'normal' | 'high';

interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceEnabled: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setTextSize: (size: TextSize) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleVoice: () => void;
  toggleKeyboardNavigation: () => void;
  speak: (text: string) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('govtrack-accessibility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse accessibility settings');
      }
    }
    
    return {
      textSize: 'normal',
      highContrast: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      voiceEnabled: false,
      keyboardNavigation: true,
    };
  });

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('govtrack-accessibility', JSON.stringify(settings));
  }, [settings]);

  // Apply text size classes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    
    switch (settings.textSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'normal':
        root.classList.add('text-base');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      case 'extra-large':
        root.classList.add('text-xl');
        break;
    }
  }, [settings.textSize]);

  // Apply high contrast
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
  }, [settings.highContrast]);

  // Apply reduced motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
  }, [settings.reducedMotion]);

  // Voice synthesis
  const speak = useCallback((text: string) => {
    if (!settings.voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    speechSynthesis.speak(utterance);
  }, [settings.voiceEnabled]);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  const setTextSize = (size: TextSize) => {
    setSettings(prev => ({ ...prev, textSize: size }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const toggleVoice = () => {
    setSettings(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  };

  const toggleKeyboardNavigation = () => {
    setSettings(prev => ({ ...prev, keyboardNavigation: !prev.keyboardNavigation }));
  };

  return (
    <AccessibilityContext.Provider value={{
      ...settings,
      setTextSize,
      toggleHighContrast,
      toggleReducedMotion,
      toggleVoice,
      toggleKeyboardNavigation,
      speak,
      announceToScreenReader,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Keyboard navigation hook
export const useKeyboardNavigation = () => {
  const { keyboardNavigation } = useAccessibility();
  
  const handleKeyDown = useCallback((event: KeyboardEvent, actions: Record<string, () => void>) => {
    if (!keyboardNavigation) return;
    
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }, [keyboardNavigation]);

  return { handleKeyDown };
};

// Focus management
export const useFocusManagement = () => {
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  const trapFocus = useCallback((containerSelector: string) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { focusElement, trapFocus };
};

// Skip link component
export const SkipLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
  >
    {children}
  </a>
);

// Screen reader only text
export const ScreenReaderOnly = ({ children }: { children: ReactNode }) => (
  <span className="sr-only">{children}</span>
);

// Accessible button with proper focus and keyboard handling
export const AccessibleButton = ({ 
  children, 
  onClick, 
  ariaLabel, 
  className = '',
  disabled = false,
  ...props 
}: {
  children: ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => {
  const { keyboardNavigation } = useAccessibility();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!keyboardNavigation) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};