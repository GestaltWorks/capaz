'use client';

import { useState, useEffect } from 'react';

interface OnboardingModalProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Capaz',
    icon: '👋',
    content: `This is your Capability Evaluation platform. Here you'll rate your proficiency across various skills and capabilities relevant to your role.`,
  },
  {
    title: 'How the Levels Work',
    icon: '📊',
    content: `Rate each capability from 0-5:
• 0 - No Experience
• 1 - Beginner (learning/aware)
• 2 - Basic (can do with guidance)
• 3 - Intermediate (can do independently)
• 4 - Advanced (can mentor others)
• 5 - Expert (subject matter expert)`,
  },
  {
    title: 'Be Honest',
    icon: '✨',
    content: `This evaluation is about identifying growth opportunities, not performance reviews. Be honest about your current level—it helps us identify training needs and match mentors.`,
  },
  {
    title: 'Save Your Progress',
    icon: '💾',
    content: `Click "Save Evaluation" at any time to save your progress. You can return and update your evaluation whenever your skills improve or change.`,
  },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('capaz_onboarding_complete', 'true');
      setVisible(false);
      setTimeout(onComplete, 300);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('capaz_onboarding_complete', 'true');
    setVisible(false);
    setTimeout(onComplete, 300);
  };

  const current = STEPS[step];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={handleSkip} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <span className="text-5xl">{current.icon}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {current.title}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
            {current.content}
          </p>
        </div>

        <div className="px-8 pb-8 flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
          >
            Skip intro
          </button>

          <div className="flex items-center gap-3">
            {/* Dots */}
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

