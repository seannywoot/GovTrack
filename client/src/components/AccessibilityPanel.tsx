import React, { useState } from 'react';
import { useAccessibility, TextSize } from '../lib/accessibility';
import { useLanguage, Language } from '../lib/i18n';
import { useAnalytics } from '../lib/analytics';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onClose }) => {
  const {
    textSize,
    highContrast,
    reducedMotion,
    voiceEnabled,
    keyboardNavigation,
    setTextSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleVoice,
    toggleKeyboardNavigation,
    speak,
  } = useAccessibility();

  const { language, setLanguage, t, isRTL } = useLanguage();
  const { preferences, updatePreferences } = useAnalytics();
  const [showAnalyticsSettings, setShowAnalyticsSettings] = useState(false);

  if (!isOpen) return null;

  const handleTextSizeChange = (size: TextSize) => {
    setTextSize(size);
    speak(t('a11y.text.size') + ': ' + size);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    speak('Language changed to ' + lang);
  };

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white w-full max-w-2xl rounded-lg shadow-xl border border-gray-200 flex flex-col max-h-[90vh] ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Accessibility & Language Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto flex-1 space-y-8">
          {/* Language Settings */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              🌐 {t('nav.language')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-3 rounded-lg border text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    language === lang.code
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-sm text-gray-600">{lang.name}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Text Size */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              📝 {t('a11y.text.size')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {(['small', 'normal', 'large', 'extra-large'] as TextSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => handleTextSizeChange(size)}
                  className={`p-3 rounded-lg border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    textSize === size
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium ${
                    size === 'small' ? 'text-sm' :
                    size === 'normal' ? 'text-base' :
                    size === 'large' ? 'text-lg' : 'text-xl'
                  }`}>
                    Aa
                  </div>
                  <div className="text-xs text-gray-600 mt-1 capitalize">
                    {size.replace('-', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Visual Settings */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              👁️ Visual Settings
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">{t('a11y.high.contrast')}</div>
                  <div className="text-sm text-gray-600">
                    Increases contrast for better visibility
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={toggleReducedMotion}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">Reduce Motion</div>
                  <div className="text-sm text-gray-600">
                    Minimizes animations and transitions
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Audio Settings */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              🔊 Audio Settings
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={toggleVoice}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">{t('a11y.voice.toggle')}</div>
                  <div className="text-sm text-gray-600">
                    Enable text-to-speech for key interactions
                  </div>
                </div>
              </label>

              {voiceEnabled && (
                <div className="ml-8 p-3 bg-blue-50 rounded-lg">
                  <button
                    onClick={() => speak('This is a test of the voice output feature')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Test Voice Output
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Navigation Settings */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              ⌨️ Navigation Settings
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keyboardNavigation}
                  onChange={toggleKeyboardNavigation}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">Enhanced Keyboard Navigation</div>
                  <div className="text-sm text-gray-600">
                    Enable additional keyboard shortcuts and focus indicators
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Privacy & Analytics */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              🔒 Privacy Settings
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analyticsEnabled}
                  onChange={(e) => updatePreferences({ analyticsEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">Usage Analytics</div>
                  <div className="text-sm text-gray-600">
                    Help improve the platform by sharing anonymous usage data
                  </div>
                </div>
              </label>

              {preferences.analyticsEnabled && (
                <div className="ml-8 space-y-2">
                  <button
                    onClick={() => setShowAnalyticsSettings(!showAnalyticsSettings)}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                  >
                    {showAnalyticsSettings ? 'Hide' : 'Show'} Analytics Settings
                  </button>

                  {showAnalyticsSettings && (
                    <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data Retention (days)
                        </label>
                        <select
                          value={preferences.dataRetentionDays}
                          onChange={(e) => updatePreferences({ dataRetentionDays: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={7}>7 days</option>
                          <option value={30}>30 days</option>
                          <option value={90}>90 days</option>
                        </select>
                      </div>
                      <div className="text-xs text-gray-600">
                        All data is stored locally and never shared with third parties.
                        No personally identifiable information is collected.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Settings are saved automatically
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;