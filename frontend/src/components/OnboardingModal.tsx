'use client';

import { useState, useEffect } from 'react';

interface OnboardingModalProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Capaz',
    icon: '👋',
    content: `This is your Capability Vector — a rich picture of your skills, interests, and growth goals. It's designed to be quick, honest, and actually useful.`,
  },
  {
    title: 'How It Works',
    icon: '🎚️',
    content: `For each skill, just toggle "I have experience" if you've worked with it. Then use the sliders to show your proficiency level and how much you enjoy it. No numbers to memorize — just slide from Novice to Expert.`,
  },
  {
    title: 'Tell Us More',
    icon: '📋',
    content: `We'll ask about certifications, training background, and whether you want more training. If you're interested in conferences or specific learning, you can note that too. It all helps match you with the right opportunities.`,
  },
  {
    title: 'Mentoring & Leadership',
    icon: '🌟',
    content: `Can you mentor others? Lead projects? These checkboxes help us find the right people when teams need guidance or project leads. It's about connecting skills with needs.`,
  },
  {
    title: "It's About Growth",
    icon: '🌱',
    content: `This isn't a performance review. It's about understanding where you are, where you want to go, and how we can help. Be honest — that's how we build the best teams and find the right training.`,
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

