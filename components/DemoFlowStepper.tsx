'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type DemoFlowStepperProps = {
  currentStep: 'audit' | 'pseo' | 'deck';
  assetId: string;
};

export function DemoFlowStepper({ currentStep, assetId }: DemoFlowStepperProps) {
  const steps = [
    { id: 'audit', label: 'Audit', icon: '📋' },
    { id: 'pseo', label: 'pSEO', icon: '🎯' },
    { id: 'deck', label: 'Deck', icon: '📊' },
  ];

  const isStepComplete = (stepId: string) => {
    const stepOrder = ['audit', 'pseo', 'deck'];
    return stepOrder.indexOf(stepId) < stepOrder.indexOf(currentStep);
  };

  const isStepCurrent = (stepId: string) => stepId === currentStep;

  return (
    <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 p-4 mb-4">
      <div className="flex items-center justify-between gap-2">
        {/* Steps */}
        <div className="flex items-center gap-2 flex-1">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              {/* Step Circle */}
              <Link
                href={
                  step.id === 'pseo'
                    ? `/pseo?asset=${assetId}&demo=1`
                    : step.id === 'deck'
                      ? `/deck-outline?asset=${assetId}&demo=1`
                      : '#'
                }
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                  isStepComplete(step.id)
                    ? 'bg-green-500/30 border border-green-500/50 text-green-300 cursor-pointer hover:bg-green-500/40'
                    : isStepCurrent(step.id)
                      ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300'
                      : 'bg-gray-700/30 border border-gray-600/50 text-gray-400'
                }`}
              >
                {isStepComplete(step.id) ? '✓' : step.icon}
              </Link>

              {/* Step Label */}
              <span
                className={`text-xs font-medium ${
                  isStepCurrent(step.id)
                    ? 'text-blue-300'
                    : isStepComplete(step.id)
                      ? 'text-green-300'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>

              {/* Connector */}
              {idx < steps.length - 1 && (
                <div
                  className={`w-6 h-0.5 mx-1 ${
                    isStepComplete(step.id)
                      ? 'bg-green-500/50'
                      : 'bg-gray-600/30'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Next Button */}
        {currentStep === 'pseo' && (
          <Link href={`/deck-outline?asset=${assetId}&demo=1`}>
            <Button className="text-xs px-3 py-1 ml-2">
              Next: Deck →
            </Button>
          </Link>
        )}

        {currentStep === 'deck' && (
          <div className="text-xs text-green-300 font-semibold ml-2">
            ✓ Demo Complete!
          </div>
        )}
      </div>
    </Card>
  );
}

