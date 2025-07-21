
import React from 'react';
import { LanguageProvider } from './lib/i18n';
import { AccessibilityProvider } from './lib/accessibility';
import GovTrackPage from './pages_index';

export default function App() {
  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <GovTrackPage />
      </AccessibilityProvider>
    </LanguageProvider>
  );
}
