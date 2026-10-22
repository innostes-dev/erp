'use client';

import { useState } from 'react';
import { Button, Stepper } from '@innostes/ui';

const steps = [
  { title: 'Organization', description: 'Basic details' },
  { title: 'Database', description: 'Connect & verify' },
  { title: 'Administrator', description: 'Create your account' },
  { title: 'Review', description: 'Confirm settings' },
  { title: 'Complete', description: 'Finish setup' },
];

export default function StepperDemo() {
  const [step, setStep] = useState(1);

  return (
    <div className="flex w-full flex-col gap-8">
      <Stepper steps={steps} currentStep={step} onStepClick={setStep} />
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={step === steps.length - 1}
          onClick={() => setStep(step + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
