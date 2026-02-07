import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '../components/common';
import { StepBusinessInfo } from '../components/Onboarding/StepBusinessInfo';
import { StepTrainingData } from '../components/Onboarding/StepTrainingData';
import { StepGoLive } from '../components/Onboarding/StepGoLive';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    { id: 1, title: 'Business Info', description: 'Basic profile' },
    { id: 2, title: 'Training Data', description: 'Products, Slots & FAQs' },
    { id: 3, title: 'Go Live', description: 'Train & Launch' },
  ];

  const handleNext = () => {
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Finished
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <img src="/logo.png" alt="Smax AI" className="h-12 w-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-gray-900">Setup Wizard</h1>
          <p className="text-gray-500">Configure your AI assistant in 3 simple steps.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-3">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = completedSteps.includes(step.id - 1) || step.id === 1;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isAccessible) {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={!isAccessible}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border',
                    isCurrent
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-transparent hover:bg-gray-50',
                    !isAccessible && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors flex-shrink-0',
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div>
                    <p
                      className={cn(
                        'font-medium text-sm',
                        isCurrent ? 'text-blue-900' : 'text-gray-900'
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3">
            <Card className="p-6 min-h-[500px]">
              {currentStep === 1 && <StepBusinessInfo onNext={handleNext} />}
              {currentStep === 2 && (
                <StepTrainingData onNext={handleNext} onBack={handleBack} />
              )}
              {currentStep === 3 && <StepGoLive onBack={handleBack} />}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
