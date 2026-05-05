import { useDetectionStore } from '../../store/detectionStore';
import StepItem from './StepItem';

export default function StepList() {
  const steps = useDetectionStore((s) => s.steps);

  return (
    <div className="mt-6">
      {steps.map((step, i) => (
        <StepItem
          key={step.id}
          step={step}
          index={i}
          isLast={i === steps.length - 1}
        />
      ))}
    </div>
  );
}
