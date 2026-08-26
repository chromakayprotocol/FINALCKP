const SIZE = 120;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProgressRing({ value = 0, label, sublabel }) {
  const clamped = Math.max(0, Math.min(100, value));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="un-progress-ring" role="img" aria-label={`${sublabel ?? 'Progress'}: ${clamped}%`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          className="un-progress-ring__track"
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          className="un-progress-ring__value"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className="un-progress-ring__text" aria-hidden="true">
        <span className="un-progress-ring__value-label">{clamped}%</span>
        {label && <span className="un-progress-ring__caption">{label}</span>}
      </div>
    </div>
  );
}
