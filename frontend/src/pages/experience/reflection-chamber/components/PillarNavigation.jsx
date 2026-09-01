export default function PillarNavigation({ canGoBack, onBack, stageNumber, totalStages }) {
  return (
    <div className="pooi-nav">
      <button
        type="button"
        className="pooi-nav-back"
        onClick={onBack}
        disabled={!canGoBack}
      >
        ← Back
      </button>
      <span className="pooi-nav-count">
        {stageNumber} / {totalStages}
      </span>
    </div>
  );
}
