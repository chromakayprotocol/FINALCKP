import { useCountdown } from '../hooks/useCountdown';

export default function PracticeExercise({ onComplete }) {
  const { secondsLeft, isRunning, isComplete, start } = useCountdown(60);
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="pooi-practice">
      <span className="pooi-code-panel-kicker">Observe</span>
      <p className="pooi-practice-copy">Bring one unresolved situation to mind.</p>
      <p className="pooi-practice-copy">Don't explain it.</p>
      <p className="pooi-practice-copy">Don't defend it.</p>
      <p className="pooi-practice-copy">Don't predict what happens next.</p>
      <p className="pooi-practice-copy pooi-practice-copy--strong">Just notice.</p>

      <div className="pooi-timer" role="timer" aria-live="polite">
        {minutes}:{seconds}
      </div>

      {!isRunning && !isComplete && (
        <button type="button" className="pooi-btn pooi-btn--primary" onClick={start}>
          Begin
        </button>
      )}
      {isComplete && (
        <button type="button" className="pooi-btn pooi-btn--primary" onClick={onComplete}>
          Continue
        </button>
      )}
    </div>
  );
}
