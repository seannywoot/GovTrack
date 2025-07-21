import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/i18n';
import { useAccessibility } from '../lib/accessibility';
import { useInteractionTracking } from '../lib/analytics';

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpSystem: React.FC<HelpSystemProps> = ({ isOpen, onClose }) => {
  const { t, isRTL } = useLanguage();
  const { speak } = useAccessibility();
  const { trackClick } = useInteractionTracking();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const helpSteps: HelpStep[] = [
    {
      id: 'welcome',
      title: t('help.guide.welcome'),
      content: 'This dashboard provides transparent access to government budget and project information. You can explore budgets, track project progress, and report concerns.',
      target: '.govtrack-logo',
      position: 'bottom',
    },
    {
      id: 'navigation',
      title: t('help.guide.navigation'),
      content: 'Use these tabs to switch between different views: Overview for key metrics, Budgets for department allocations, Projects for ongoing initiatives, Spending for detailed transactions, and Reports for transparency issues.',
      target: '.main-navigation',
      position: 'bottom',
    },
    {
      id: 'filters',
      title: t('help.guide.filters'),
      content: 'Apply filters to narrow down data by department, region, status, or category. Use the search box to find specific items quickly.',
      target: '.filters-section',
      position: 'bottom',
    },
    {
      id: 'accessibility',
      title: 'Accessibility Features',
      content: 'Click the accessibility button to adjust text size, enable high contrast, turn on voice output, and change language settings.',
      target: '.accessibility-button',
      position: 'left',
    },
    {
      id: 'reporting',
      title: 'Report Issues',
      content: 'Found something concerning? Use the "Report Issue" button to submit transparency concerns or irregularities for review.',
      target: '.report-button',
      position: 'left',
    },
  ];

  const startTour = () => {
    setCurrentStep(0);
    setShowTour(true);
    trackClick('help_tour_start');
    speak('Starting guided tour');
  };

  const nextStep = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      speak(helpSteps[currentStep + 1].title);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      speak(helpSteps[currentStep - 1].title);
    }
  };

  const endTour = () => {
    setShowTour(false);
    setCurrentStep(0);
    trackClick('help_tour_complete');
    speak('Tour completed');
  };

  const skipTour = () => {
    setShowTour(false);
    setCurrentStep(0);
    trackClick('help_tour_skip');
  };

  // Keyboard navigation for tour
  useEffect(() => {
    if (!showTour) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStep();
          break;
        case 'Escape':
          e.preventDefault();
          endTour();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showTour, currentStep]);

  if (!isOpen) return null;

  return (
    <>
      {/* Help Panel */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50">
        <div className={`bg-white w-full max-w-4xl rounded-lg shadow-xl border border-gray-200 flex flex-col max-h-[90vh] ${isRTL ? 'text-right' : 'text-left'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              ❓ Help & Support
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
          <div className="p-6 overflow-auto flex-1">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Quick Start */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🚀 Quick Start
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={startTour}
                    className="w-full p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="font-medium text-blue-600">Take a Guided Tour</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Learn how to navigate and use all features (5 minutes)
                    </div>
                  </button>
                  
                  <div className="p-4 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900 mb-2">First Time Here?</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Start with the Overview tab to see key metrics</li>
                      <li>• Use filters to focus on specific departments or regions</li>
                      <li>• Click on any budget or project for detailed information</li>
                      <li>• Report concerns using the "Report Issue" button</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Features Guide */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📋 Features Guide
                </h3>
                <div className="space-y-3">
                  <details className="group">
                    <summary className="cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="font-medium">Budget Tracking</span>
                    </summary>
                    <div className="mt-2 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
                      View allocated vs spent amounts, utilization rates, and department breakdowns. 
                      {t('help.tooltip.budget')}
                    </div>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="font-medium">Project Monitoring</span>
                    </summary>
                    <div className="mt-2 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
                      Track project progress, status updates, and spending patterns. 
                      {t('help.tooltip.progress')}
                    </div>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="font-medium">Transparency Index</span>
                    </summary>
                    <div className="mt-2 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
                      {t('help.tooltip.transparency')}
                    </div>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="font-medium">Data Export</span>
                    </summary>
                    <div className="mt-2 p-3 text-sm text-gray-600 bg-gray-50 rounded-lg">
                      Export filtered data in JSON format for further analysis or record-keeping.
                    </div>
                  </details>
                </div>
              </section>

              {/* Keyboard Shortcuts */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  ⌨️ Keyboard Shortcuts
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                    <span>Search</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + K</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                    <span>Help</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">F1</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                    <span>Accessibility Settings</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Alt + A</kbd>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                    <span>Navigate Tabs</span>
                    <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">1-5</kbd>
                  </div>
                </div>
              </section>

              {/* Contact & Support */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📞 Contact & Support
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900">Technical Issues</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Report bugs or technical problems through the feedback system
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900">Data Concerns</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Use the "Report Issue" feature for transparency or data accuracy concerns
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-900">Accessibility Support</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Access settings via the accessibility panel or contact support for additional assistance
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Need more help? Use the guided tour or contact support.
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

      {/* Tour Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-50 bg-black/70">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {helpSteps[currentStep].title}
                </h3>
                <span className="text-sm text-gray-500">
                  {currentStep + 1} / {helpSteps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / helpSteps.length) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              {helpSteps[currentStep].content}
            </p>

            <div className="flex justify-between items-center">
              <button
                onClick={skipTour}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
              >
                Skip Tour
              </button>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentStep === helpSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpSystem;